// Prevents additional console window on Windows in release, DO NOT REMOVE OR IT WILL CAUSE A LOT OF ISSUES(DO NOT ASK HOW THAT WAS FOUND OUT)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use std::process::{Command, Stdio};
use std::time::Duration;
use tokio::time::sleep;
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use warp::Filter;
use futures_util::{SinkExt, StreamExt, TryStreamExt};
use tokio::sync::broadcast;

static TABLET_CONNECTED: AtomicBool = AtomicBool::new(false);
static mut APP_HANDLE: Option<AppHandle> = None;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Clone, Debug)]
pub enum WsMessage {
    TabletConnected(bool),
    DatabaseUploaded(String),
    StatusUpdate(String),
}

#[tauri::command]
fn is_tablet_connected() -> bool {
    TABLET_CONNECTED.load(Ordering::Relaxed)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![is_tablet_connected])
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            unsafe {
                APP_HANDLE = Some(app_handle.clone());
            }
            
            // Start background services with app handle
            thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(start_background_services(app_handle));
            });
            
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn start_background_services(app_handle: AppHandle) {
    println!("Starting background services...");
    
    let (ws_tx, _) = broadcast::channel::<WsMessage>(100);
    let ws_tx = Arc::new(ws_tx);
    
    tokio::spawn(adb_forwarding_loop(app_handle.clone(), ws_tx.clone()));
    start_upload_server().await;
}

async fn adb_forwarding_loop(app_handle: AppHandle, ws_tx: Arc<broadcast::Sender<WsMessage>>) {
    let mut last_connected_state = false;
    
    loop {
        let mut cmd = Command::new("adb");
            cmd.arg("devices")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = cmd.output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let devices: Vec<&str> = stdout
                .lines()
                .skip(1)
                .filter(|line| line.contains("device") && !line.contains("unauthorized"))
                .collect();

            let is_connected = !devices.is_empty();
            
            if is_connected != last_connected_state {
                TABLET_CONNECTED.store(is_connected, Ordering::Relaxed);
                let _ = app_handle.emit("tablet-connection-changed", is_connected);
                let _ = ws_tx.send(WsMessage::TabletConnected(is_connected));
                last_connected_state = is_connected;
                
                if is_connected {
                    println!("Tablet connected: {} device(s)", devices.len());
                } else {
                    println!("Tablet disconnected");
                }
            }

            if is_connected {
                let _ = Command::new("adb")
                    .args(&["reverse", "tcp:5000", "tcp:5000"])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped());

                    #[cfg(target_os = "windows")]
                    cmd.creation_flags(CREATE_NO_WINDOW);
                    
                    let _ = cmd.status();
            }
        } else {
            if last_connected_state {
                TABLET_CONNECTED.store(false, Ordering::Relaxed);
                let _ = app_handle.emit("tablet-connection-changed", false);
                let _ = ws_tx.send(WsMessage::TabletConnected(false));
                last_connected_state = false;
                println!("ADB command failed - check if ADB is installed");
            }
        }

        sleep(Duration::from_millis(100)).await;
    }
}

async fn start_upload_server() {
    println!("Starting Warp server with WebSocket support...");
    
    let (tx, _rx) = broadcast::channel::<WsMessage>(100);
    let tx = Arc::new(tx);
    
    let health = warp::path("sendable")
        .and(warp::get())
        .map(|| {
            println!("Health check: Ready For Data");
            warp::reply::with_header("Ready For Data", "Access-Control-Allow-Origin", "*")
        });
    
    let upload_tx = tx.clone();
    let upload = warp::path("upload-db")
        .and(warp::post())
        .and(warp::multipart::form().max_length(50_000_000))
        .and_then(move |form| {
            let tx = upload_tx.clone();
            handle_database_upload(form, tx)
        });
    
    let ws_tx = tx.clone();
    let websocket = warp::path("ws")
        .and(warp::ws())
        .map(move |ws: warp::ws::Ws| {
            let tx = ws_tx.clone();
            ws.on_upgrade(move |websocket| handle_websocket(websocket, tx))
        });
    
    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type"])
        .allow_methods(vec!["GET", "POST", "OPTIONS"]);
    
    let routes = health.or(upload).or(websocket).with(cors);

    println!("Upload server with WebSockets running at http://127.0.0.1:5000");
    println!("WebSocket endpoint available at ws://127.0.0.1:5000/ws");

    warp::serve(routes).run(([127, 0, 0, 1], 5000)).await;
}

async fn handle_database_upload(
    mut form: warp::multipart::FormData,
    tx: Arc<broadcast::Sender<WsMessage>>,
) -> Result<impl warp::Reply, warp::Rejection> {
    println!("Processing database upload...");
    
    let uploads_dir = std::env::temp_dir().join("roost_hub_uploads");
    if let Err(e) = std::fs::create_dir_all(&uploads_dir) {
        println!("Failed to create uploads directory: {}", e);
        return Ok(warp::reply::with_status(
            format!("Failed to create uploads directory: {}", e),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }
    
    while let Some(part) = form.next().await {
        let part = match part {
            Ok(p) => p,
            Err(e) => {
                println!("Error reading multipart data: {}", e);
                continue;
            }
        };
        
        let name = part.name();
        if name == "database" {
            let filename = part.filename().unwrap_or("uploaded.db").to_string();
            let _content_type = part.content_type().unwrap_or("application/octet-stream").to_string();
            
            let data: Result<Vec<u8>, warp::Error> = {
                let stream = part.stream();
                stream.try_fold(Vec::new(), |mut vec, data| {
                    use bytes::Buf;
                    vec.extend_from_slice(data.chunk());
                    async move { Ok(vec) }
                })
                .await
            };
                
            match data {
                Ok(file_data) => {
                    let timestamp = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs();
                   

                    let save_path_old = uploads_dir.join(format!("tablet_db_{}_{}", timestamp, filename));
                    let save_path = save_path_old.to_string_lossy().to_string();

                    // Save the database file
                    match std::fs::write(&save_path, &file_data) {
                        Ok(_) => {
                            println!("Database saved: {} ({} bytes)", save_path, file_data.len());
                            
                            // Notify WebSocket clients
                            let _ = tx.send(WsMessage::DatabaseUploaded(save_path.clone()));
                            
                            // Emit event to Tauri frontend with the file path
                            unsafe {
                                if let Some(app_handle) = &APP_HANDLE {
                                    let _ = app_handle.emit("database-uploaded", &save_path);
                                }
                            }
                            
                            let success_msg = format!("Database uploaded successfully and saved at: {}", save_path);
                            return Ok(warp::reply::with_status(
                                success_msg,
                                warp::http::StatusCode::OK,
                            ));
                        }
                        Err(e) => {
                            let error_msg = format!("Error saving file: {}", e);
                            let _ = tx.send(WsMessage::StatusUpdate(error_msg.clone()));
                            return Ok(warp::reply::with_status(
                                error_msg,
                                warp::http::StatusCode::INTERNAL_SERVER_ERROR,
                            ));
                        }
                    }
                }
                Err(e) => {
                    let error_msg = format!("Error reading file data: {}", e);
                    let _ = tx.send(WsMessage::StatusUpdate(error_msg.clone()));
                    return Ok(warp::reply::with_status(
                        error_msg,
                        warp::http::StatusCode::BAD_REQUEST,
                    ));
                }
            }
        }
    }
    
    Ok(warp::reply::with_status(
        "No database file found".to_string(),
        warp::http::StatusCode::BAD_REQUEST,
    ))
}

async fn handle_websocket(
    websocket: warp::ws::WebSocket, 
    tx: Arc<broadcast::Sender<WsMessage>>
) {
    println!("New WebSocket connection established");
    
    let (mut ws_tx, mut ws_rx) = websocket.split();
    let mut rx = tx.subscribe();
    
    let initial_msg = if TABLET_CONNECTED.load(Ordering::Relaxed) {
        r#"{"type":"tablet_connected","connected":true}"#
    } else {
        r#"{"type":"tablet_connected","connected":false}"#
    };
    
    if ws_tx.send(warp::ws::Message::text(initial_msg)).await.is_err() {
        return;
    }
    
    let ws_tx_clone = Arc::new(tokio::sync::Mutex::new(ws_tx));
    let ws_tx_clone2 = ws_tx_clone.clone();
    
    tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json_msg = match msg {
                WsMessage::TabletConnected(connected) => {
                    format!(r#"{{"type":"tablet_connected","connected":{}}}"#, connected)
                }
                WsMessage::DatabaseUploaded(path) => {
                    format!(r#"{{"type":"database_uploaded","path":"{}"}}"#, path)
                }
                WsMessage::StatusUpdate(status) => {
                    format!(r#"{{"type":"status_update","message":"{}"}}"#, status)
                }
            };
            
            let mut ws = ws_tx_clone2.lock().await;
            if ws.send(warp::ws::Message::text(json_msg)).await.is_err() {
                break;
            }
        }
    });
    
    while let Some(result) = ws_rx.next().await {
        if let Ok(msg) = result {
            if msg.is_text() {
                println!("WebSocket message: {}", msg.to_str().unwrap_or(""));
            }
        } else {
            break;
        }
    }
    
    println!("WebSocket connection closed");
}

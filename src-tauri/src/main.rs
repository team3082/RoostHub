// Prevents additional console window on Windows in release, DO NOT REMOVE OR IT WILL CAUSE A LOT OF ISSUES(DO NOT ASK HOW THAT WAS FOUND OUT)
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::time::Duration;
use tokio::time::sleep;
use std::thread;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};

static TABLET_CONNECTED: AtomicBool = AtomicBool::new(false);
static mut APP_HANDLE: Option<AppHandle> = None;

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
    
    // Start ADB forwarding in background
    tokio::spawn(adb_forwarding_loop(app_handle.clone()));
    
    // Start local server for tablet uploads
    start_upload_server().await;
}

async fn adb_forwarding_loop(app_handle: AppHandle) {
    let mut last_connected_state = false;
    
    loop {
        // Check for connected Android devices
        if let Ok(output) = Command::new("adb")
            .arg("devices")
            .output()
        {
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
                
                last_connected_state = is_connected;
                
                if is_connected {
                    println!("📱 Tablet connected! {} device(s)", devices.len());
                } else {
                    println!("📱 Tablet disconnected");
                }
            }

            if is_connected {
                let _ = Command::new("adb")
                    .args(&["reverse", "tcp:5000", "tcp:5000"])
                    .status();
            }
        } else {
            if last_connected_state {
                TABLET_CONNECTED.store(false, Ordering::Relaxed);
                let _ = app_handle.emit("tablet-connection-changed", false);
                last_connected_state = false;
                println!("❌ ADB command failed - check if ADB is installed");
            }
        }
        
        sleep(Duration::from_secs(1)).await;
    }
}

async fn start_upload_server() {
    use std::net::SocketAddr;
    use tokio::net::TcpListener;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 5000));
    
    println!("Attempting to bind to {}", addr);
    
    match TcpListener::bind(&addr).await {
        Ok(listener) => {
            println!("✅ Upload server running at http://{}", addr);
            
            while let Ok((mut stream, client_addr)) = listener.accept().await {
                println!("📱 Connection from: {}", client_addr);
                
                tokio::spawn(async move {
                    let mut buffer = vec![0; 4096];
                    let _ = stream.read(&mut buffer).await;
                    if let Ok(n) = stream.read(&mut buffer).await {
                        let request = String::from_utf8_lossy(&buffer[..n]);
                        println!("📨 Request: {}", request.lines().next().unwrap_or(""));
                        
                        if request.contains("GET /sendable") {
                            let response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 14\r\n\r\nReady For Data";
                            if let Err(e) = stream.write_all(response.as_bytes()).await {
                                println!("❌ Write error: {}", e);
                            } else {
                                println!("✅ Sent: Ready For Data");
                            }
                        } else if request.contains("POST /upload-db") {
                            println!("📦 Processing database upload...");
                            
                            let response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: 26\r\n\r\nDatabase upload received";
                            if let Err(e) = stream.write_all(response.as_bytes()).await {
                                println!("❌ Write error: {}", e);
                            } else {
                                println!("✅ Database upload received from tablet");
                                
                                // TODO: Parse multipart/form-data and extract the database file
                                // For now, just indicate we received it
                                println!("⚠️  Note: Database parsing not yet implemented");
                            }
                        } else {
                            let response = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 9\r\n\r\nNot Found";
                            let _ = stream.write_all(response.as_bytes()).await;
                            println!("❓ Unknown request");
                        }
                        
                        let _ = stream.shutdown().await;
                    }
                });
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to bind upload server to {}: {}", addr, e);
            eprintln!("💡 This could be because:");
            eprintln!("   - Port 5000 is already in use");
            eprintln!("   - Another instance is running");
            eprintln!("   - Firewall is blocking the port");
        }
    }
}

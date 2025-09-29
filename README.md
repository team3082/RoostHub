# 🐔 RoostHub — Central Command Center

**Part of the Chicken Suite — Offline-First FRC Scouting Ecosystem**

RoostHub is the data hub and dashboard for FRC scouting, designed to work seamlessly with CluckScout on Android tablets for uploading match data over USB. Built for the unpredictability of competition networks, it operates completely offline while offering cloud sync capabilities when needed.

## 🚧 Development Status

RoostHub is currently in active development. The end product will include:
- ✅ USB data upload from tablets
- 🚧 Cloud data sync to CoopCloud  
- 🚧 Built-in data visualization
- 🚧 Scout assignment management
- 🚧 Advanced tablet management
- 🚧 ADB bundling (currently requires separate ADB installation)

**Note**: CluckScout (the Android scouting app) is also currently in development.

## 🐔 About Chicken Suite

Chicken Suite is a comprehensive scouting platform built for flexibility, offline compatibility, and ease of use. Designed with the unpredictability of competition networks in mind, it allows teams to scout and manage match data completely offline—or sync data across devices when Wi-Fi is available.

### 📱 CluckScout — Scouting Made Simple

CluckScout is the Android-friendly scouting app in the Chicken Suite ecosystem.

**Key Features:**
- **Device Assignment**: Assign tablets to specific match positions, scouters, and teams
- **Offline-first Data Storage**: Every match is saved to a local SQLite database
- **Flexible Upload Options**:
  - **QR Code Sync**: Generate QR codes per match for quick manual uploads
  - **USB Sync to RoostHub**: Plug in the tablet and let RoostHub automatically detect and upload data

### 🖥️ RoostHub — The Central Command Center

RoostHub serves as the data hub of the suite, optimized for both live events and post-match analysis.

**Current Features:**
- **Automatic USB Sync**: Seamlessly uploads data from connected CluckScout tablets
- **Match Data Management**: Store and organize scouting data locally

**Planned Features:**
- **Match Analytics**: View data visualizations, team rankings, and performance metrics
- **Picklist Tool**: Build, sort, and update your picklist dynamically with integrated data
- **Export Options**: Export all scouting data to .csv or Excel format for external analysis

### ☁️ CoopCloud — Optional Cloud Sync

For teams that want cross-device syncing or cloud backups, CoopCloud will provide:
- **Multi-device Sync**: Connect multiple RoostHub instances
- **Data Privacy First**: Opt-in cloud sync with complete data privacy
- **Offline Compatibility**: Manual sync options without internet access

*Note: CoopCloud is still in development*

## 🚀 Getting Started

### Prerequisites

**ADB Installation Required**: RoostHub requires Android Debug Bridge (ADB) to communicate with tablets over USB. 

- **Windows**: Download [Android SDK Platform Tools](https://developer.android.com/studio/releases/platform-tools) and add to PATH
- **macOS**: Install via Homebrew: `brew install android-platform-tools`  
- **Linux**: Install via package manager: `sudo apt install adb` (Ubuntu/Debian)

*Future versions will bundle ADB automatically to eliminate this requirement.*

### Development Setup

First, install dependencies and run the development server:

```bash
npm install
npm run tauri dev
```

This will start both the Next.js frontend and the Tauri backend.

### Building for Production

```bash
npm run tauri build
```

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Rust (Tauri)
- **Database**: SQLite
- **Platform**: Cross-platform desktop app

## 📊 FRC Integration

RoostHub is designed specifically for FRC (FIRST Robotics Competition) scouting workflows, with features tailored to:
- Match-based data collection
- Team performance tracking  
- Alliance selection support
- Competition event management

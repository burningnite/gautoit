# Windows-Native Tauri AutoIt Executable Factory (`gautoit`)

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-blue.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange.svg)](https://www.rust-lang.org)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078d6.svg)](https://microsoft.com/windows)

An **Executable Factory & Batch Compilation System** built using **Tauri v2 (Rust Backend + React 18 / TypeScript Web Frontend)** natively for **Windows**.

---

## 📑 Master Specifications & Documentation

1. 📘 [tauri_autoit_factory_plan.md](file:///c:/Users/juanc/Desktop/gautoit/tauri_autoit_factory_plan.md) — Master Architecture & Implementation Plan
2. 📘 [windows_environment_setup_guide.md](file:///c:/Users/juanc/Desktop/gautoit/windows_environment_setup_guide.md) — Windows Workstation Toolchain & Environment Setup Guide
3. 📕 [aut2exe_batch_compiler_spec.md](file:///c:/Users/juanc/Desktop/gautoit/aut2exe_batch_compiler_spec.md) — Rust Backend Batch Compiler Engine Specification
4. 📗 [ag_grid_template_integration_guide.md](file:///c:/Users/juanc/Desktop/gautoit/ag_grid_template_integration_guide.md) — React AG-Grid Spreadsheet & CodeMirror Integration Guide

---

## 🚀 Key Features

* **Spreadsheet Parameter Grid (AG-Grid):** Dynamic column key mapping, inline cell editing, row add/delete, row enable/disable toggles.
* **Master Script Template (CodeMirror):** AutoIt3 template editor with Mustache-style placeholder injection (`{{ PC_NAME }}`, `{{ EXE_PATH }}`).
* **Windows Aut2exe Engine:** Async parallel execution of AutoIt's `Aut2exe.exe` compiler with `CREATE_NO_WINDOW`, architecture selection (`/x64` or `/x86`), compression settings (`/comp 0..4`), and icon customization.
* **Real-time Logging Console:** Live event streaming of compilation statuses and metrics.
* **Project File Persistence (`.aiproj`):** Save and load JSON batch configurations.

---

## 🛠️ Quick Start & Setup

### Prerequisites

Ensure the following tools are installed on your Windows system:
* **Node.js:** v20 LTS / v22 LTS (`npm` / `npx` / `pnpm`)
* **Rust Toolchain:** `x86_64-pc-windows-msvc` (via [rustup.rs](https://rustup.rs/))
* **Visual Studio C++ Build Tools:** Desktop development with C++ workload
* **AutoIt3 Compiler:** Installed at `C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe`

### Installation & Execution

```powershell
# 1. Install frontend dependencies
npm install

# 2. Run in dev mode (React + Rust backend)
npm run tauri dev

# 3. Build standalone Windows binary / installer
npm run tauri build
```

---

## 📁 Repository Structure

```
gautoit/
├── package.json               # Node package configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler settings
├── tailwind.config.js         # Tailwind CSS styling tokens
├── index.html                 # HTML entry point
├── src/                       # React Frontend (TypeScript)
│   ├── main.tsx               # App entry
│   ├── App.tsx                # Layout & workspace
│   ├── components/            # Header, AG-Grid, CodeMirror, Console, Modals
│   ├── store/                 # Zustand state management (Project & Build stores)
│   ├── types/                 # Interface definitions
│   └── utils/                 # Tauri IPC command wrappers
└── src-tauri/                 # Rust Backend (Tauri v2)
    ├── Cargo.toml             # Cargo manifest
    ├── tauri.conf.json        # Tauri configuration
    ├── build.rs               # Build script
    └── src/                   # Rust source (main, lib, models, compiler, template_engine, commands)
```

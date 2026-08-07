# Windows Environment & Toolchain Setup Guide

> **Document Purpose:** Complete, step-by-step setup guide for configuring a Windows workstation to develop, test, and build the **Tauri v2 AutoIt Executable Factory**.

---

## 1. Prerequisites Overview

To build and package Tauri v2 applications on Windows natively, the following tools are required:

| Tool | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **C++ Build Tools** | Visual Studio 2022 (MSVC v143) | Compiles Rust native Windows bindings & binaries |
| **Rust Toolchain** | `1.75+` (x86_64-pc-windows-msvc) | Backend language & Tauri core |
| **Node.js** | `v20 LTS` or `v22 LTS` | Frontend JavaScript runtime |
| **Package Manager** | `pnpm` (v9+) | Fast frontend dependency manager |
| **AutoIt3 Toolchain** | `v3.3.16.1+` | Provides `Aut2exe.exe`, `AutoIt3.exe`, & standard library includes |
| **Tauri CLI** | `v2.x` | Development dev-server and release packager |

---

## 2. Step-by-Step Installation

### Step 1: Install Visual Studio C++ Build Tools
Rust on Windows requires the C++ linker provided by Visual Studio MSVC:

1. Download **Visual Studio Installer** or **Build Tools for Visual Studio 2022** from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/).
2. Run the installer and select the workload:
   * **Desktop development with C++**
3. Ensure the following individual components are checked in the right sidebar:
   * `MSVC v143 - VS 2022 C++ x64/x86 build tools`
   * `Windows 11 SDK` (or `Windows 10 SDK`)
   * `C++ CMake tools for Windows`
4. Click **Install** and reboot if prompted.

---

### Step 2: Install Rust Toolchain

1. Open PowerShell or Command Prompt.
2. Download and run `rustup-init.exe` from [rustup.rs](https://rustup.rs/).
3. Choose option `1` (**Default installation** using `x86_64-pc-windows-msvc`).
4. Restart your terminal and verify installation:
   ```powershell
   rustc --version
   cargo --version
   ```

---

### Step 3: Install Node.js & `pnpm`

1. Download **Node.js LTS (64-bit MSI installer)** from [nodejs.org](https://nodejs.org/).
2. Install with default settings (ensure "Add to PATH" is enabled).
3. Open PowerShell as Administrator and enable `pnpm`:
   ```powershell
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
4. Verify installations:
   ```powershell
   node --version
   pnpm --version
   ```

---

### Step 4: Install & Setup AutoIt v3 Compiler Engine

1. Download **AutoIt v3 Full Installation** or **Full Zip Package** from [autoitscript.com](https://www.autoitscript.com/site/autoit/downloads/).
2. Extract or install AutoIt to a standard Windows path, for example:
   `C:\Program Files (x86)\AutoIt3\`
3. Verify the existence of the critical binaries:
   * Compiler: `C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe` (or `Aut2exe_x64.exe`)
   * Standard Includes: `C:\Program Files (x86)\AutoIt3\Include\`
4. (Optional) Add `Aut2Exe` to Windows System PATH environment variable:
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files (x86)\AutoIt3\Aut2Exe", "User")
   ```

---

### Step 5: Initialize Tauri v2 Project

Run the standard Tauri initialization script in PowerShell:

```powershell
pnpm create tauri-app@latest
```

When prompted by the wizard, choose:
* **Project name:** `tauri-autoit-factory`
* **Identifier:** `com.autoitfactory.app`
* **Choose frontend language:** `TypeScript`
* **Choose package manager:** `pnpm`
* **Choose UI template:** `React`

Navigate into the folder and install frontend dependencies:
```powershell
cd tauri-autoit-factory
pnpm install
```

Install additional UI packages:
```powershell
pnpm add @ag-grid-community/react @ag-grid-community/core lucide-react zustand @uiw/react-codemirror @codemirror/lang-cpp clsx tailwindmerge
pnpm add -D tailwindcss postcss autoprefixer
```

Initialize Tailwind CSS:
```powershell
npx tailwindcss init -p
```

---

## 3. Running Development Server

To launch the application in development mode with hot-reload (both frontend and Rust backend):

```powershell
pnpm tauri dev
```

Tauri will:
1. Start the Vite dev server for React at `http://localhost:1420`.
2. Compile the Rust backend using `cargo`.
3. Launch the native Windows desktop window hosting your application.

---

## 4. Packaging the Final Windows Executable / Installer

To produce a production-ready Windows standalone binary (`.exe`) or Windows Installer (`.msi` / `.exe` setup via NSIS or WiX):

```powershell
pnpm tauri build
```

The output installers and standalone executables will be generated in:
`src-tauri\target\release\bundle\msi\`
`src-tauri\target\release\bundle\nsis\`

---

## 5. Troubleshooting Windows Environment Issues

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `link.exe not found` during `cargo build` | Missing MSVC C++ Build Tools | Open VS Installer and reinstall `Desktop development with C++` workload. |
| WebView2 error on app startup | Microsoft Edge WebView2 runtime missing | Download and install Evergreen WebView2 Bootstrapper from Microsoft. (Pre-installed on Win 10/11). |
| `Aut2exe` fails with exit code `1` | Invalid path or missing include file | Ensure Windows path separators (`\`) are properly escaped or normalized in Rust (`std::path::PathBuf`). |
| Windows Defender false positive on compiled binaries | Unsigned generated executable | Add output build folder to Windows Defender Exclusions during local testing. |

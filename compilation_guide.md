# Compiling `gautoit` (Tauri & Rust Workspace) to a Standalone Executable

This guide details the exact steps and requirements to compile the `gautoit` project into its standalone binary format. It is designed to ensure other AI assistants or developers can reproduce the build on the first attempt.

---

## 🏗️ Project Structure overview

The application is structured as a standard Rust/Tauri hybrid workspace:
* **Frontend:** React + TypeScript (configured in the project root directory).
* **Backend & Compiler:** Rust + Tauri (configured under `src-tauri/`).

---

## 🛠️ Prerequisites

To compile the project successfully, the host environment must have the following tools installed and configured:

1. **Rust & Cargo:**
   * Install via [rustup](https://rustup.rs/).
   * Target architecture: `stable-x86_64-pc-windows-msvc`.

2. **Node.js & npm:**
   * Node.js v16+ is required for frontend building and package management.

3. **C++ Build Tools:**
   * Install Visual Studio Community (or Build Tools) with the "Desktop development with C++" workload selected. This is required by Tauri and Cargo for linking.

---

## 🚀 Compilation Procedure

The project includes a pre-configured compilation script `build_release.bat` in the root folder that automates frontend packaging and Tauri compilation.

### Step 1: Install Dependencies
Before running the build script, clean build artifacts and fetch dependencies.
```powershell
# Install frontend Node dependencies
npm install

# Run a cargo check to verify Rust dependencies are correct
cd src-tauri
cargo check
cd ..
```

### Step 2: Build the Release Binary
Run the compilation batch script from the repository root:
```powershell
.\build_release.bat
```

*Alternatively*, if running the build steps manually:
```powershell
# 1. Build the React/TypeScript frontend distribution
npm run build

# 2. Build the Tauri desktop bundle via Cargo
cd src-tauri
cargo build --release
```

---

## 📦 Output Location

Once compilation finishes successfully, the standalone executable binary is generated at:
* 📁 `src-tauri\target\release\tauri-autoit-factory.exe`

---

## 🔍 Critical Compilation Troubleshooting

* **Missing Frontend Assets Error:** If Cargo complains about missing directory assets (e.g., `dist/`), ensure you have executed `npm run build` prior to compiling the Rust backend.
* **Rust compiler target issues:** Ensure the Visual Studio Build Tools are fully installed and configured, as compiling Tauri applications requires the MSVC linker on Windows.
* **Tauri API errors:** If there are schema or command registration issues, verify that commands in `src-tauri/src/commands.rs` are correctly registered in the builder in `src-tauri/src/main.rs`.

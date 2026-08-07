# Portable Compiler Architecture & Zero-Config Specification

> **Document Purpose:** Standalone technical specification describing how `gautoit` operates as a **100% zero-configuration, standalone portable Windows executable** (`tauri-autoit-factory.exe`).

---

## 1. Executive Summary & Design Goals

`gautoit` is designed to run anywhere on Windows without installation, administrator privileges, pre-installed toolchains, or manual path configuration.

```
┌─────────────────────────────────────────────────────────────────────────┐
│              STANDALONE PORTABLE BINARY (tauri-autoit-factory.exe)       │
│                                                                         │
│  - React 18 / TypeScript GUI (Embedded inside PE binary)                │
│  - AutoIt3 Compiler Toolchain (Embedded inside app resources)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ Resolves Paths Relative to App .exe
┌────────────────────────────────────┴────────────────────────────────────┐
│                    RUNTIME DIRECTORY WORKSPACE SYSTEM                   │
│                                                                         │
│  ├── tauri-autoit-factory.exe       (Executable runtime location)      │
│  ├── fuente-cuentas-epic.aiproj     (Auto-imported on app launch)      │
│  ├── outputs/                       (Auto-created; output .exe builds) │
│  └── tmp/                           (Auto-created; session scratch)    │
│      └── aut2exe/                   (Auto-extracted AutoIt toolchain)  │
│          ├── Aut2exe.exe                                                │
│          ├── Aut2exe_x64.exe                                            │
│          ├── upx.exe                                                    │
│          └── Include/               (Standard AutoIt header libraries)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architecture Rules & Implementation

### A. Relative Runtime Path Resolution (`base_dir`)
Instead of hardcoding global system paths like `C:\AutoItBuilds` or `C:\Program Files`, `gautoit` dynamically resolves its execution directory at runtime:

```rust
let base_dir = std::env::current_exe()
    .ok()
    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
    .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());
```

* **Outputs Folder (`./outputs/`):** Batch compiled `.exe` files are automatically written to `base_dir.join("outputs")`.
* **Temporary Folder (`./tmp/`):** Scratch script files and session artifacts are written to `base_dir.join("tmp")`.

---

### B. Self-Contained Toolchain Auto-Extraction (`./tmp/aut2exe/`)
The AutoIt compiler (`Aut2exe.exe`, `Aut2exe_x64.exe`, `upx.exe`, and standard `Include/` header libraries) is bundled inside `gautoit`'s internal resource bundle.

1. On startup or when **Compile Batch** is triggered, `gautoit` checks if `base_dir/tmp/aut2exe/Aut2exe.exe` exists.
2. If absent, `gautoit` extracts its embedded toolchain directly into `./tmp/aut2exe/` in milliseconds.
3. Compilation executes against `./tmp/aut2exe/Aut2exe.exe`, with `./tmp/aut2exe/Include/` automatically available right beside it.
4. **Zero User Configuration:** Users do not need to locate, install, or set paths for AutoIt.

---

### C. Automatic Project Discovery (`.aiproj`)
On application mount, `gautoit` scans its runtime directory (`base_dir`) for any file ending in `.aiproj`.
* If a project file (e.g. `fuente-cuentas-epic.aiproj`) is present in the same folder as `tauri-autoit-factory.exe`, `gautoit` **automatically imports and populates** the spreadsheet grid, column keys, and master script template on launch.

---

### D. Clean State Manual Import
When a user manually imports a project via JSON:
1. `gautoit` invokes `resetProject()`, wiping the current store (clearing leftover rows, columns, and template code).
2. `gautoit` invokes `loadProject(config)`, ensuring the workspace starts 100% clean with only the new project data.

---

### E. Silent Background Compilation (Aut2exe CLI Fix)
To prevent `Aut2exe.exe` from popping open its interactive GUI window during batch builds:
* Command-line switches and parameters are passed as **distinct separate arguments**:
  ```rust
  cmd.arg("/comp").arg(settings.compression_level.to_string()); // ✅ Split switch and value
  ```
* Command execution enforces hidden window flags:
  ```rust
  #[cfg(target_os = "windows")]
  cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
  ```

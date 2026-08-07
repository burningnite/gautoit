# Architecture & Implementation Plan: Windows-Native Tauri AutoIt Executable Factory (Approach D)

> **Document Purpose:** This document serves as a complete, self-contained master blueprint for building an **Executable Factory & Batch Compilation System** using **Tauri v2 (Rust Backend + React/TypeScript Web Frontend)** natively on **Windows**. All compilation, development, testing, and deployment steps are strictly tailored for native Windows execution.

---

## 1. Supplementary Deep-Dive Guides

For detailed, step-by-step instructions on specific subsystems, refer to these dedicated independent guide documents:

1. 📘 [windows_environment_setup_guide.md](file:///home/jack/.gemini/antigravity-cli/brain/1a6fc2c6-8347-4b7d-8250-b41a9347827f/windows_environment_setup_guide.md)  
   *Installing Visual Studio C++ Build Tools (MSVC), Rust MSVC toolchain, Node.js/pnpm, AutoIt3 compiler, and initializing Tauri v2 on Windows.*
2. 📕 [aut2exe_batch_compiler_spec.md](file:///home/jack/.gemini/antigravity-cli/brain/1a6fc2c6-8347-4b7d-8250-b41a9347827f/aut2exe_batch_compiler_spec.md)  
   *Rust backend process engine, `Aut2exe.exe` Windows CLI flags, `CreateProcessW` window hiding, `tokio::sync::Semaphore` parallel queue, and real-time IPC log streaming.*
3. 📗 [ag_grid_template_integration_guide.md](file:///home/jack/.gemini/antigravity-cli/brain/1a6fc2c6-8347-4b7d-8250-b41a9347827f/ag_grid_template_integration_guide.md)  
   *React AG-Grid spreadsheet component, dynamic column key mapping, CodeMirror script editor, Zustand store state management, and `.aiproj` JSON file schema.*

---

## 2. Executive Summary & Goal Description

### Goal
Build a high-performance, native Windows desktop application that enables developers and system administrators to:
1. Manage a grid dataset of **PC & Executable configurations** ($X$ rows $\times$ $Y$ columns).
2. Configure **Execution Parameters** for each row in a spreadsheet-like GUI editor.
3. Maintain a **Master AutoIt (`.au3`) Script Template** containing placeholders (e.g., `{{PC_NAME}}`, `{{EXE_PATH}}`, `{{PARAM_1}}`).
4. Perform **Batch Compilation**: Interpolate the template for each row into temporary `.au3` scripts and compile them into standalone Windows `.exe` binaries natively using `Aut2exe.exe`.
5. Monitor real-time compilation logs, track per-row build statuses (Pending, Building, Success, Failed), and export deployment results.

---

## 3. Tech Stack & Architectural Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│              WINDOWS FRONTEND (React 18 + TypeScript + Vite)            │
│  - AG-Grid (Spreadsheet Data Entry, Copy-Paste, Inline Editing)         │
│  - CodeMirror (AutoIt Template Editor & Placeholder Autocomplete)       │
│  - Tailwind CSS + Lucide Icons (Modern Dark Glassmorphic UI)            │
│  - Zustand (State Management for Grid Rows, Dynamic Columns & Logs)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Tauri IPC (Commands & Events)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    WINDOWS BACKEND CORE (Rust - Tauri v2)               │
│  - Project Persistence (JSON / SQLite Project File Saving & Loading)    │
│  - CSV / Excel Import & Export Engine                                   │
│  - Template Engine (Handlebars-rust with `no_escape`)                   │
│  - Async Worker Pool (Tokio async tasks + `tokio::sync::Semaphore`)     │
│  - Windows Process Spawner (`tokio::process::Command` -> Aut2exe.exe)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Spawns Native Process per Row
┌────────────────────────────────────▼────────────────────────────────────┐
│                TARGET COMPILER TOOLCHAIN (Aut2exe Engine)               │
│  - Windows Native Path: C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe│
│  - Flags: /in temp.au3 /out build.exe /x64 /comp 2                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **GUI Frontend** | React 18, TypeScript, Tailwind CSS | High-performance grid editor, template manager, compilation dashboard. |
| **Grid Engine** | `@ag-grid-community/react` | Inline cell editing, row copy/paste, column adding, keyboard navigation. |
| **Tauri Core** | Rust 1.75+ (MSVC Toolchain), Tauri v2 | Windows file dialogs, background process management, OS execution. |
| **Template Engine** | `handlebars` (Rust crate) | Interpolates template placeholders with row column values safely. |
| **Compiler Invoker** | `tokio::process::Command` | Runs `Aut2exe.exe` concurrently on Windows with `CREATE_NO_WINDOW` flag. |
| **Target Compiler** | `Aut2exe.exe` (AutoIt v3) | Produces standalone Windows `.exe` binaries. |

---

## 4. Project Directory Structure

```
tauri-autoit-factory/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── src/                          # React Frontend Code
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── HeaderNav.tsx         # Top bar (File, Save, Export, Settings, Compile buttons)
│   │   ├── GridEditor.tsx        # AG-Grid spreadsheet component
│   │   ├── TemplateEditor.tsx    # CodeMirror template code editor
│   │   ├── CompilerConsole.tsx   # Real-time build log drawer & status indicators
│   │   ├── SettingsModal.tsx     # Toolchain path config (Aut2exe.exe path, output dir)
│   │   └── ImportExportModal.tsx # CSV/JSON import & export wizard
│   ├── store/
│   │   ├── useProjectStore.ts    # Store for rows, columns, template code, app settings
│   │   └── useBuildStore.ts      # Store for compilation state & streaming logs
│   ├── types/
│   │   └── index.ts              # TypeScript interface definitions
│   └── utils/
│       └── tauriCommands.ts      # Type-safe wrappers around invoke()
│
└── src-tauri/                    # Rust Backend Code
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    └── src/
        ├── main.rs               # Entry point & Tauri setup
        ├── lib.rs                # Core module definitions
        ├── models.rs             # Rust structs for Project, Row, Config, BuildResult
        ├── template_engine.rs    # Handlebars template interpolation logic
        ├── compiler.rs           # Aut2exe process spawner for Windows
        ├── file_manager.rs       # Project load/save & CSV import/export
        └── commands.rs           # Tauri IPC commands exported to frontend
```

---

## 5. Data Models & Contracts

### A. TypeScript Interface Contracts (`src/types/index.ts`)

```typescript
export interface ColumnDef {
  id: string;          // e.g. "col_pc_name", "col_exe_path"
  headerName: string;  // e.g. "Target PC", "Executable Path"
  key: string;         // Placeholder key used in template: e.g. "PC_NAME"
  type: 'text' | 'number' | 'boolean' | 'filepath';
  defaultValue?: string;
}

export interface RowData {
  id: string;                         // Unique UUID for the row
  enabled: boolean;                   // Toggle to include/exclude row from batch compile
  values: Record<string, string>;     // Key-value map: { "PC_NAME": "SERVER-01", "EXE_PATH": "C:\\app.exe" }
}

export interface ProjectConfig {
  version: string;
  projectName: string;
  templateCode: string;               // AutoIt script with {{PLACEHOLDERS}}
  columns: ColumnDef[];
  rows: RowData[];
  outputDir: string;
  namingPattern: string;              // e.g. "Build_{{PC_NAME}}_{{EXE_NAME}}.exe"
}

export interface CompilerSettings {
  aut2exePath: string;               // Path to Aut2exe.exe on Windows
  architecture: 'x64' | 'x86';       // Target architecture flag for Aut2exe (/x64 or /x86)
  compressionLevel: number;           // Compression switch /comp 0..4
  isConsoleApp: boolean;              // /console flag
  customIconPath?: string;            // Default .ico path
  maxParallelBuilds: number;          // Worker pool count (e.g. 4 parallel builds)
}

export type BuildStatus = 'idle' | 'queued' | 'building' | 'success' | 'failed';

export interface RowBuildState {
  rowId: string;
  status: BuildStatus;
  outputExePath?: string;
  errorMessage?: string;
  buildDurationMs?: number;
}
```

---

## 6. Windows-Native Implementation Details

### A. Template Engine (`src-tauri/src/template_engine.rs`)

```rust
use handlebars::Handlebars;
use std::collections::HashMap;

pub struct TemplateEngine {
    hb: Handlebars<'static>,
}

impl TemplateEngine {
    pub fn new() -> Self {
        let mut hb = Handlebars::new();
        // Prevent HTML escaping so Windows path backslashes aren't mangled
        hb.register_escape_fn(handlebars::no_escape);
        Self { hb }
    }

    pub fn render_script(&self, template: &str, row_values: &HashMap<String, String>) -> Result<String, String> {
        self.hb.render_template(template, row_values)
            .map_err(|e| format!("Template render error: {}", e))
    }

    pub fn generate_output_filename(&self, pattern: &str, row_values: &HashMap<String, String>, default_id: &str) -> String {
        match self.hb.render_template(pattern, row_values) {
            Ok(name) => {
                let sanitized = name.replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-' && c != '.', "_");
                if sanitized.ends_with(".exe") { sanitized } else { format!("{}.exe", sanitized) }
            },
            Err(_) => format!("output_{}.exe", default_id),
        }
    }
}
```

### B. Windows Process Spawner (`src-tauri/src/compiler.rs`)

Refer to 📕 [aut2exe_batch_compiler_spec.md](file:///home/jack/.gemini/antigravity-cli/brain/1a6fc2c6-8347-4b7d-8250-b41a9347827f/aut2exe_batch_compiler_spec.md) for the complete implementation. Below is the primary execution block for Windows:

```rust
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// Constructs command targeting Aut2exe.exe on Windows
let mut cmd = Command::new(&settings.aut2exe_path);

cmd.arg("/in").arg(&temp_au3_file)
   .arg("/out").arg(&task.output_exe_path)
   .arg(if settings.architecture == "x86" { "/x86" } else { "/x64" })
   .arg(format!("/comp {}", settings.compression_level));

// Hide console popup window during build execution
#[cfg(target_os = "windows")]
cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
```

---

## 7. Sample AutoIt Master Template

```autoit
#cs ----------------------------------------------------------------------------
 AutoIt Version: 3.3.16.1
 Script Function: Parameterized Automated Deployment & Launcher
 Target PC: {{ PC_NAME }}
 Executable: {{ EXE_PATH }}
#ce ----------------------------------------------------------------------------

#include <MsgBoxConstants.au3>
#include <File.au3>

; Dynamic Injected Parameters from GUI Table Row
Local Const $TARGET_PC     = "{{ PC_NAME }}"
Local Const $EXE_PATH      = "{{ EXE_PATH }}"
Local Const $COMMAND_ARGS  = "{{ EXEC_PARAMS }}"
Local Const $TIMEOUT_SEC   = {{ TIMEOUT }}

Func Main()
    Local $sLogFile = @TempDir & "\deploy_" & $TARGET_PC & ".log"
    _FileWriteLog($sLogFile, "Starting deployment for " & $TARGET_PC)

    ; Validate Target Executable
    If Not FileExists($EXE_PATH) Then
        MsgBox($MB_ICONERROR, "Deployment Error", "Target executable not found: " & $EXE_PATH)
        Exit 1
    EndIf

    ; Execute process with parameters
    Local $iPID = Run($EXE_PATH & " " & $COMMAND_ARGS, "", @SW_SHOW)
    
    If $iPID = 0 Then
        MsgBox($MB_ICONERROR, "Error", "Failed to launch process.")
        Exit 2
    EndIf

    ProcessWaitClose($iPID, $TIMEOUT_SEC)
    _FileWriteLog($sLogFile, "Process finished successfully.")
EndFunc

Main()
```

---

## 8. Verification & Validation Plan

### Automated Tests
1. **Rust Template Engine Unit Test (`cargo test`):**
   * Verifies Windows backslash preservation in paths (`C:\Program Files\App\bin.exe`).
2. **CSV Import/Export Unit Test (`cargo test`):**
   * Verifies round-trip grid serialization without character encoding issues.

### Manual Verification Steps on Windows
1. **Toolchain Auto-Detection:**
   * Click **Settings** -> **Detect Aut2exe Path**. Verify that `C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe` is populated.
2. **Batch Compilation Execution:**
   * Enter 3 sample rows in GUI grid.
   * Click **Compile Batch**.
   * Observe progress bar advancing in real-time.
   * Check output folder for `Build_PC_01.exe`, `Build_PC_02.exe`, etc.
3. **PE Binary Executable Check:**
   * Run generated `.exe` files on Windows and confirm proper parameter execution.

# LLM Completion & Development Guideline: `gautoit`

> **Document Purpose:** This document is an authoritative, step-by-step technical blueprint and execution standard written specifically for **AI Coding Agents (LLMs)** working on the `gautoit` project. Any AI assistant tasked with extending, maintaining, debugging, or completing features in this codebase **MUST** strictly follow the directives, architectural patterns, and validation protocols specified herein.

---

## 1. System Architecture & Component Sitemap

`gautoit` is a native Windows desktop application built with **Tauri v2 (Rust Backend)** and **React 18 + TypeScript (Vite Web Frontend)**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER (React 18 / TypeScript)                      │
│                                                                                  │
│   ┌──────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐   │
│   │   AG-Grid Component  │  │   CodeMirror Editor   │  │   Compiler Console  │   │
│   │  ([GridEditor.tsx])  │  │ ([TemplateEditor.tsx])│  │([CompilerConsole.tsx│   │
│   └──────────┬───────────┘  └───────────┬───────────┘  └──────────┬──────────┘   │
│              │                          │                         │              │
│              └──────────────────────────┼─────────────────────────┘              │
│                                         ▼                                        │
│                           Zustand State Management Store                         │
│                    ([useProjectStore.ts] & [useBuildStore.ts])                   │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          │ Tauri IPC Invokes & Event Listeners
┌─────────────────────────────────────────▼────────────────────────────────────────┐
│                        BACKEND CORE LAYER (Rust / Tauri v2)                      │
│                                                                                  │
│   ┌──────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐   │
│   │  Tauri IPC Commands  │  │   Template Engine     │  │ Aut2exe Compiler    │   │
│   │    ([commands.rs])   │  │ ([template_engine.rs])│  │   ([compiler.rs])   │   │
│   └──────────────────────┘  └───────────────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          │ Spawns Async Native Processes
┌─────────────────────────────────────────▼────────────────────────────────────────┐
│                        TARGET TOOLCHAIN (Windows Native)                         │
│                                                                                  │
│   AutoIt3 Compiler Binary: C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### File Hierarchy & Contract Registry

* **Frontend Codebase (`src/`):**
  * `types/index.ts`: TypeScript interface declarations (`ColumnDef`, `RowData`, `ProjectConfig`, `CompilerSettings`, `BuildResult`, `BatchSummary`).
  * `store/useProjectStore.ts`: Zustand store for row parameter data, dynamic column headers, master template string, and compiler settings.
  * `store/useBuildStore.ts`: Zustand store for compilation states, log entries, and real-time build streaming metrics.
  * `utils/tauriCommands.ts`: Type-safe async wrapper functions around `@tauri-apps/api/core` `invoke`.
  * `components/GridEditor.tsx`: Spreadsheet GUI (AG-Grid Community v31) with dynamic column keys (`{{ KEY }}`), cell value setters, and row status badges.
  * `components/TemplateEditor.tsx`: Master `.au3` code editor (CodeMirror 6) with interactive placeholder chip insertion.
  * `components/CompilerConsole.tsx`: Real-time build console streaming live event logs.
  * `components/HeaderNav.tsx`: Navigation tabs, project naming, modal launchers, and **Compile Batch** action trigger.
  * `components/SettingsModal.tsx`: Aut2exe path auto-detection, target architecture (`x64`/`x86`), compression level (0–4), and concurrency settings.
  * `components/ImportExportModal.tsx`: Project configuration `.aiproj` JSON import/export tool.
  * `App.tsx`: App layout container & global Tauri event listener subscriptions (`row-build-started`, `row-build-completed`, `batch-finished`).

* **Backend Codebase (`src-tauri/src/`):**
  * `main.rs`: Windows subsystem entry point (`#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`).
  * `lib.rs`: Tauri builder initialization, plugin registration, and IPC handler exports.
  * `models.rs`: Rust structs matching frontend contracts with exact Serde field renames (`#[serde(rename = "headerName")]`, etc.).
  * `template_engine.rs`: Handlebars template renderer configured with `handlebars::no_escape` to preserve Windows backslashes in paths.
  * `compiler.rs`: Async process spawner for `Aut2exe.exe` targeting Windows with `cmd.creation_flags(0x08000000)` (`CREATE_NO_WINDOW`).
  * `file_manager.rs`: JSON project file (`.aiproj`) reader and writer.
  * `commands.rs`: Tauri async command endpoints (`detect_aut2exe_path`, `compile_batch`, `save_project_file`, `load_project_file`) emitting IPC events via `app_handle.emit()`.

---

## 2. Mandatory LLM Execution Rules & Technical Directives

When modifying or expanding the codebase, LLMs **MUST** comply with the following 6 core engineering rules:

### Rule 1: Windows Path Backslash Preservation (Handlebars `no_escape`)
* **Context:** Windows paths contain backslashes (e.g. `C:\Program Files\App\main.exe`). Standard Handlebars HTML-escapes `\` to `&#x2F;`, breaking AutoIt scripts.
* **Requirement:** In `src-tauri/src/template_engine.rs`, the `TemplateEngine` **MUST** register `hb.register_escape_fn(handlebars::no_escape)`. Never remove or modify this escape function.

### Rule 2: Window Hiding via `CREATE_NO_WINDOW`
* **Context:** Spawning batch `Aut2exe.exe` processes without flags causes annoying cmd/console windows to pop up repeatedly on the user's screen.
* **Requirement:** In `src-tauri/src/compiler.rs`, the Windows `tokio::process::Command` **MUST** set:
  ```rust
  #[cfg(target_os = "windows")]
  cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
  ```

### Rule 3: Real-time IPC Event Streaming Standard
* **Context:** Batch compilations can process dozens of rows. The GUI must update per-row status badges live as builds progress.
* **Requirement:** `compile_batch` in `commands.rs` **MUST** accept `app_handle: tauri::AppHandle` and emit the following standard Tauri events:
  * `batch-started`: Payload `{ total_rows: usize }`
  * `row-build-started`: Payload `RowStartedPayload { row_id: String }`
  * `row-build-completed`: Payload `BuildResult`
  * `batch-finished`: Payload `BatchSummary`

### Rule 4: AG-Grid CSS Package Dependency
* **Context:** AG-Grid Community v31 requires stylesheet imports in `GridEditor.tsx`.
* **Requirement:** `package.json` **MUST** include `"@ag-grid-community/styles": "^31.3.2"`. Never remove this dependency.

### Rule 5: Non-destructive Model Serde Renaming
* **Context:** Rust uses `snake_case` variable names, while TypeScript uses `camelCase`.
* **Requirement:** All Rust structs in `models.rs` **MUST** retain exact Serde rename attributes (`#[serde(rename = "aut2exePath")]`, `#[serde(rename = "templateCode")]`, etc.) matching `src/types/index.ts`.

### Rule 6: Verification Before Declaring Task Completion
* **Requirement:** Never declare a task complete without running build validation (`npm run build`).

---

## 3. Step-by-Step Task Completion Workflow for LLMs

When assigned a task to implement new features or fix bugs in `gautoit`, follow this deterministic 5-phase workflow:

### Phase 1: Requirement & Data Contract Audit
1. Inspect `src/types/index.ts` and `src-tauri/src/models.rs`.
2. If adding a new field (e.g. `iconPath` or `timeoutSec`), update both TypeScript and Rust structs simultaneously. Ensure Serde field renames match 1-to-1.

### Phase 2: State Store Expansion (Zustand)
1. Add new state properties and actions in `src/store/useProjectStore.ts` or `src/store/useBuildStore.ts`.
2. Ensure default initial values are safe (non-null strings, default booleans).

### Phase 3: Tauri IPC Endpoint Development
1. Implement the command function in `src-tauri/src/commands.rs`.
2. If the command interacts with Tauri runtime, include `app_handle: tauri::AppHandle` or `window: tauri::Window`.
3. Register the new command macro inside `tauri::generate_handler![...]` in `src-tauri/src/lib.rs`.
4. Add the corresponding TypeScript wrapper in `src/utils/tauriCommands.ts`.

### Phase 4: UI Component Integration
1. Update React components in `src/components/`.
2. Follow the project's styling tokens (Tailwind CSS dark glassmorphism, `bg-slate-900`, `border-slate-800`, `text-slate-100`, Lucide icons).
3. Ensure interactive elements include unique `id` attributes or standard aria labels.

### Phase 5: Automated Verification & Sanity Build
1. Run `npm run build` from the workspace root.
2. Confirm TypeScript type-checks pass cleanly and Vite produces production assets in `dist/`.

---

## 4. Verification Protocols & Test Commands

Use these exact terminal commands during development to verify codebase health:

### 1. Frontend TypeScript & Vite Production Build
```powershell
npm run build
```
*Expected Output:* `✓ built in X.XXs` with 0 TypeScript or Rollup bundling errors.

### 2. Rust Backend Compilation Check
```powershell
# Run cargo check inside src-tauri
cd src-tauri
cargo check
```
*Expected Output:* `Finished dev [unoptimized + debuginfo] target(s) in X.XXs` with 0 compilation errors.

### 3. Full Tauri Application Development Launch
```powershell
npm run tauri dev
```
*Expected Result:* Vite dev server starts at `http://localhost:1420` and the native Windows window launches.

---

## 5. Summary Checklist for Task Sign-off

Before completing any task, check off every item:
- [ ] TypeScript interfaces in `src/types/index.ts` match Rust structs in `src-tauri/src/models.rs`.
- [ ] No path backslash escaping issues exist (`handlebars::no_escape` verified).
- [ ] `CREATE_NO_WINDOW` flag is set for child process spawns on Windows.
- [ ] `npm run build` completes successfully.
- [ ] `code_quality_audit_report.md` updated if architectural changes were introduced.

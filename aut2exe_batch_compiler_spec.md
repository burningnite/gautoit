# Technical Specification: Windows Aut2exe Batch Compiler Engine

> **Document Purpose:** Deep-dive technical document specifying the **Rust Backend Batch Compilation Engine** for Windows. Details process invocation, argument construction, Windows path normalization, async concurrency queues, process exit code parsing, and real-time Tauri event streaming.

---

## 1. Overview & Toolchain Integration

The compiler engine is responsible for accepting:
1. A **Rendered AutoIt (`.au3`) Script String** generated from the template engine for a specific row.
2. A **Target Output Executable File Path** (e.g., `C:\Output\Build_Server01.exe`).
3. User-defined **Compiler Settings** (architecture, compression level, icon path, path to `Aut2exe.exe`).

It executes `Aut2exe.exe` asynchronously, captures process execution metrics (duration, exit code, error output), and cleans up all temporary artifact files.

---

## 2. Aut2exe Windows Command-Line Interface Specification

`Aut2exe.exe` is the official compiler binary shipped with AutoIt. On Windows, it supports the following CLI arguments:

```cmd
Aut2exe.exe /in <infile.au3> [/out <outfile.exe>] [/icon <iconfile.ico>] [/comp 0-4] [/nopack] [/x86|/x64] [/gui|/console]
```

### Argument Mapping Table

| Aut2exe Flag | Type | Value Range | Description |
| :--- | :--- | :--- | :--- |
| `/in` | String | Windows File Path | Absolute path to the source `.au3` script (e.g. `C:\Users\Admin\AppData\Local\Temp\temp_row1.au3`). |
| `/out` | String | Windows File Path | Destination `.exe` file path (e.g. `C:\Builds\Output_Server01.exe`). |
| `/icon` | String | Windows `.ico` Path | Custom application icon path (optional). |
| `/comp` | Integer | `0` to `4` | Compression level (`0` = None, `2` = Default, `4` = Max LZMA). |
| `/x64` | Flag | None | Targets 64-bit Windows architecture (Default). |
| `/x86` | Flag | None | Targets 32-bit Windows architecture (Legacy). |
| `/console` | Flag | None | Compiles as Console application instead of GUI app. |

---

## 3. Windows Path Normalization & Escaping

Windows file paths contain backslashes (`\`) and often spaces (e.g., `C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe`). Improper path handling leads to command execution failures.

### Rust Path Normalization Rules
1. **Always use `std::path::PathBuf`** for manipulating file paths.
2. **Convert to Absolute Windows Paths** using `std::fs::canonicalize()` or custom path expansion.
3. **Use Raw String Literals or Forward Slashes** internally in Rust; `tokio::process::Command` automatically formats arguments safely for the Windows API (`CreateProcessW`) without requiring manual quote wrapping.

```rust
use std::path::{Path, PathBuf};

pub fn normalize_win_path<P: AsRef<Path>>(path: P) -> String {
    let p = path.as_ref();
    p.to_string_lossy().to_string()
}
```

---

## 4. Concurrency Management with Tokio Semaphore

Compiling dozens or hundreds of `.exe` files simultaneously can overload the CPU. The compilation manager uses a `tokio::sync::Semaphore` to limit maximum parallel executions (e.g. 4 parallel builds).

```rust
use std::sync::Arc;
use tokio::sync::Semaphore;
use tokio::task;

pub struct BatchRunner {
    semaphore: Arc<Semaphore>,
}

impl BatchRunner {
    pub fn new(max_parallel: usize) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(max_parallel)),
        }
    }

    pub async fn run_task<F, Fut, T>(&self, task_fn: F) -> T
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = T>,
    {
        // Acquire permit from semaphore (blocks if limit reached)
        let _permit = self.semaphore.acquire().await.unwrap();
        task_fn().await
    }
}
```

---

## 5. Complete Rust Async Worker Implementation (`src-tauri/src/compiler.rs`)

```rust
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Instant;
use tokio::fs;
use tokio::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompilerSettings {
    pub aut2exe_path: String,       // e.g. "C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe"
    pub architecture: String,       // "x64" or "x86"
    pub compression_level: u8,       // 0 to 4
    pub custom_icon_path: Option<String>,
    pub is_console_app: bool,
    pub max_parallel_builds: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildTask {
    pub row_id: String,
    pub rendered_au3_code: String,
    pub output_exe_path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildResult {
    pub row_id: String,
    pub success: bool,
    pub output_exe_path: String,
    pub error_message: Option<String>,
    pub duration_ms: u64,
}

pub async fn execute_aut2exe_compilation(
    task: &BuildTask,
    settings: &CompilerSettings,
    session_temp_dir: &Path,
) -> BuildResult {
    let start_time = Instant::now();
    let temp_au3_file = session_temp_dir.join(format!("build_{}.au3", task.row_id));

    // 1. Write the rendered AutoIt script to temporary file
    if let Err(e) = fs::write(&temp_au3_file, &task.rendered_au3_code).await {
        return BuildResult {
            row_id: task.row_id.clone(),
            success: false,
            output_exe_path: task.output_exe_path.clone(),
            error_message: Some(format!("Failed writing temporary .au3 script: {}", e)),
            duration_ms: 0,
        };
    }

    // 2. Ensure parent destination directory exists
    if let Some(parent) = Path::new(&task.output_exe_path).parent() {
        if !parent.exists() {
            let _ = fs::create_dir_all(parent).await;
        }
    }

    // 3. Construct Windows Process Command
    let mut cmd = Command::new(&settings.aut2exe_path);

    // Input / Output args
    cmd.arg("/in").arg(&temp_au3_file)
       .arg("/out").arg(&task.output_exe_path);

    // Architecture switch
    if settings.architecture == "x86" {
        cmd.arg("/x86");
    } else {
        cmd.arg("/x64");
    }

    // Compression switch
    cmd.arg(format!("/comp {}", settings.compression_level));

    // Console switch
    if settings.is_console_app {
        cmd.arg("/console");
    }

    // Custom Icon (if specified and valid)
    if let Some(ref icon) = settings.custom_icon_path {
        if !icon.trim().is_empty() && Path::new(icon).exists() {
            cmd.arg("/icon").arg(icon);
        }
    }

    // Pipe stdout & stderr for log capture
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    // Hide Windows console window popup during execution
    #[cfg(target_os = "windows")]
    {
        // CREATE_NO_WINDOW flag (0x08000000)
        cmd.creation_flags(0x08000000);
    }

    // 4. Run Process
    match cmd.output().await {
        Ok(output) => {
            let duration = start_time.elapsed().as_millis() as u64;

            // Remove temporary .au3 script
            let _ = fs::remove_file(&temp_au3_file).await;

            let exe_created = Path::new(&task.output_exe_path).exists();

            if output.status.success() && exe_created {
                BuildResult {
                    row_id: task.row_id.clone(),
                    success: true,
                    output_exe_path: task.output_exe_path.clone(),
                    error_message: None,
                    duration_ms: duration,
                }
            } else {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                let exit_code = output.status.code().unwrap_or(-1);

                let err_msg = format!(
                    "Aut2exe process exit code {}. Stdout: '{}', Stderr: '{}'",
                    exit_code,
                    stdout.trim(),
                    stderr.trim()
                );

                BuildResult {
                    row_id: task.row_id.clone(),
                    success: false,
                    output_exe_path: task.output_exe_path.clone(),
                    error_message: Some(err_msg),
                    duration_ms: duration,
                }
            }
        }
        Err(err) => {
            let _ = fs::remove_file(&temp_au3_file).await;
            BuildResult {
                row_id: task.row_id.clone(),
                success: false,
                output_exe_path: task.output_exe_path.clone(),
                error_message: Some(format!("System error spawning Aut2exe.exe: {}", err)),
                duration_ms: start_time.elapsed().as_millis() as u64,
            }
        }
    }
}
```

---

## 6. Real-Time Tauri Event Protocol

During batch compilation, the backend streams event payloads to the frontend over Tauri's IPC channel:

### Events Emitted:
1. `batch-started`: Payload `{ total_rows: number }`
2. `row-build-started`: Payload `{ row_id: string }`
3. `row-build-completed`: Payload `BuildResult`
4. `batch-finished`: Payload `{ total_success: number, total_failed: number, total_duration_ms: number }`

#### Example Event Subscription in React (`src/components/CompilerConsole.tsx`):
```typescript
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useBuildStore } from '../store/useBuildStore';
import { BuildResult } from '../types';

export function useBuildEvents() {
  const updateRowStatus = useBuildStore((state) => state.updateRowStatus);

  useEffect(() => {
    const unlistenCompleted = listen<BuildResult>('row-build-completed', (event) => {
      const result = event.payload;
      updateRowStatus(result.row_id, result.success ? 'success' : 'failed', result);
    });

    return () => {
      unlistenCompleted.then((fn) => fn());
    };
  }, [updateRowStatus]);
}
```

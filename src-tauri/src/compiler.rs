use crate::models::{BuildResult, BuildTask, CompilerSettings};
use std::path::Path;
use std::process::Stdio;
use std::time::Instant;
use tokio::fs;
use tokio::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

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
    cmd.arg("/in")
        .arg(&temp_au3_file)
        .arg("/out")
        .arg(&task.output_exe_path);

    // Architecture switch
    if settings.architecture == "x86" {
        cmd.arg("/x86");
    } else {
        cmd.arg("/x64");
    }

    // Compression switch (passed as separate switch and value to prevent Aut2exe GUI popup)
    cmd.arg("/comp").arg(settings.compression_level.to_string());

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

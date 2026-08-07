use crate::compiler::execute_aut2exe_compilation;
use crate::file_manager;
use crate::models::{BatchSummary, BuildResult, BuildTask, CompilerSettings, ProjectConfig};
use crate::template_engine::TemplateEngine;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Semaphore;

use tauri::Manager;

#[tauri::command]
pub fn auto_load_aiproj() -> Result<Option<ProjectConfig>, String> {
    let base_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

    if let Ok(entries) = std::fs::read_dir(&base_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("aiproj") {
                if let Ok(config) = file_manager::load_project_file(&path.to_string_lossy()) {
                    return Ok(Some(config));
                }
            }
        }
    }

    Ok(None)
}

#[tauri::command]
pub fn auto_save_aiproj(config: ProjectConfig) -> Result<String, String> {
    let base_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

    let mut save_path = None;
    if let Ok(entries) = std::fs::read_dir(&base_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("aiproj") {
                save_path = Some(path);
                break;
            }
        }
    }

    let target_file = save_path.unwrap_or_else(|| base_dir.join("project.aiproj"));
    file_manager::save_project_file(&target_file.to_string_lossy(), &config)?;
    Ok(target_file.to_string_lossy().to_string())
}

#[tauri::command]
pub fn detect_aut2exe_path(app_handle: tauri::AppHandle) -> String {
    let base_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

    let target_dir = base_dir.join("tmp").join("aut2exe");
    if let Ok(path) = file_manager::extract_bundled_aut2exe(&app_handle, &target_dir) {
        return path.to_string_lossy().to_string();
    }

    "C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe".to_string()
}

use tauri::Emitter;

#[derive(serde::Serialize, Clone)]
pub struct RowStartedPayload {
    pub row_id: String,
}

#[tauri::command]
pub async fn compile_batch(
    app_handle: tauri::AppHandle,
    project_config: ProjectConfig,
    mut compiler_settings: CompilerSettings,
) -> Result<BatchSummary, String> {
    let start_time = Instant::now();
    let template_engine = TemplateEngine::new();

    // 1. Resolve relative base directory (where tauri-autoit-factory.exe is executing)
    let base_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

    // 2. Ensure ./outputs and ./tmp directories exist relative to the executable
    let outputs_dir = base_dir.join("outputs");
    let tmp_dir = base_dir.join("tmp");

    tokio::fs::create_dir_all(&outputs_dir)
        .await
        .map_err(|e| format!("Failed creating outputs directory: {}", e))?;
    tokio::fs::create_dir_all(&tmp_dir)
        .await
        .map_err(|e| format!("Failed creating tmp directory: {}", e))?;

    // 3. Extract bundled Aut2exe compiler toolchain into ./tmp/aut2exe
    let aut2exe_dir = tmp_dir.join("aut2exe");
    let aut2exe_bin = file_manager::extract_bundled_aut2exe(&app_handle, &aut2exe_dir)?;
    compiler_settings.aut2exe_path = aut2exe_bin.to_string_lossy().to_string();

    let session_temp_dir = tmp_dir.join(format!("session_{}", uuid::Uuid::new_v4()));
    tokio::fs::create_dir_all(&session_temp_dir)
        .await
        .map_err(|e| format!("Failed creating session temp dir: {}", e))?;

    let max_parallel = if compiler_settings.max_parallel_builds == 0 {
        4
    } else {
        compiler_settings.max_parallel_builds
    };

    let semaphore = Arc::new(Semaphore::new(max_parallel));
    let mut tasks = Vec::new();

    let enabled_rows: Vec<_> = project_config.rows.into_iter().filter(|r| r.enabled).collect();
    let _ = app_handle.emit("batch-started", serde_json::json!({ "total_rows": enabled_rows.len() }));

    for row in enabled_rows {
        // 1. Render master template script
        let rendered_script = template_engine.render_script(&project_config.template_code, &row.values)?;

        // 2. Compute destination file path in ./outputs directory
        let filename = template_engine.generate_output_filename(
            &project_config.naming_pattern,
            &row.values,
            &row.id,
        );

        let output_exe_path = outputs_dir.join(filename).to_string_lossy().to_string();

        let build_task = BuildTask {
            row_id: row.id.clone(),
            rendered_au3_code: rendered_script,
            output_exe_path,
        };

        let sem_clone = Arc::clone(&semaphore);
        let settings_clone = compiler_settings.clone();
        let session_temp_clone = session_temp_dir.clone();
        let app_handle_clone = app_handle.clone();

        tasks.push(tokio::spawn(async move {
            let _permit = sem_clone.acquire().await.unwrap();
            let _ = app_handle_clone.emit("row-build-started", RowStartedPayload { row_id: build_task.row_id.clone() });
            let result = execute_aut2exe_compilation(&build_task, &settings_clone, &session_temp_clone).await;
            let _ = app_handle_clone.emit("row-build-completed", result.clone());
            result
        }));
    }

    let mut total_success = 0;
    let mut total_failed = 0;

    for task in tasks {
        match task.await {
            Ok(result) => {
                if result.success {
                    total_success += 1;
                } else {
                    total_failed += 1;
                }
            }
            Err(_) => {
                total_failed += 1;
            }
        }
    }

    // Clean up temporary session directory
    let _ = tokio::fs::remove_dir_all(&session_temp_dir).await;

    let summary = BatchSummary {
        total_success,
        total_failed,
        total_duration_ms: start_time.elapsed().as_millis() as u64,
    };

    let _ = app_handle.emit("batch-finished", summary.clone());

    Ok(summary)
}

#[tauri::command]
pub fn save_project_file(file_path: String, config: ProjectConfig) -> Result<(), String> {
    file_manager::save_project_file(&file_path, &config)
}

#[tauri::command]
pub fn load_project_file(file_path: String) -> Result<ProjectConfig, String> {
    file_manager::load_project_file(&file_path)
}

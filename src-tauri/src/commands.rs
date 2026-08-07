use crate::compiler::execute_aut2exe_compilation;
use crate::file_manager;
use crate::models::{BatchSummary, BuildResult, BuildTask, CompilerSettings, ProjectConfig};
use crate::template_engine::TemplateEngine;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Semaphore;

#[tauri::command]
pub fn detect_aut2exe_path() -> String {
    let standard_paths = [
        "C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe",
        "C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe_x64.exe",
        "C:\\Program Files\\AutoIt3\\Aut2Exe\\Aut2exe.exe",
    ];

    for path in &standard_paths {
        if Path::new(path).exists() {
            return path.to_string();
        }
    }

    "C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe".to_string()
}

#[tauri::command]
pub async fn compile_batch(
    project_config: ProjectConfig,
    compiler_settings: CompilerSettings,
) -> Result<BatchSummary, String> {
    let start_time = Instant::now();
    let template_engine = TemplateEngine::new();

    // Create session temporary directory
    let temp_dir = std::env::temp_dir().join(format!("autoit_factory_{}", uuid::Uuid::new_v4()));
    tokio::fs::create_dir_all(&temp_dir)
        .await
        .map_err(|e| format!("Failed creating temp dir: {}", e))?;

    let max_parallel = if compiler_settings.max_parallel_builds == 0 {
        4
    } else {
        compiler_settings.max_parallel_builds
    };

    let semaphore = Arc::new(Semaphore::new(max_parallel));
    let mut tasks = Vec::new();

    let enabled_rows: Vec<_> = project_config.rows.into_iter().filter(|r| r.enabled).collect();

    for row in enabled_rows {
        // 1. Render master template script
        let rendered_script = template_engine.render_script(&project_config.template_code, &row.values)?;

        // 2. Compute destination file path
        let filename = template_engine.generate_output_filename(
            &project_config.naming_pattern,
            &row.values,
            &row.id,
        );

        let output_exe_path = PathBuf::from(&project_config.output_dir)
            .join(filename)
            .to_string_lossy()
            .to_string();

        let build_task = BuildTask {
            row_id: row.id.clone(),
            rendered_au3_code: rendered_script,
            output_exe_path,
        };

        let sem_clone = Arc::clone(&semaphore);
        let settings_clone = compiler_settings.clone();
        let temp_dir_clone = temp_dir.clone();

        tasks.push(tokio::spawn(async move {
            let _permit = sem_clone.acquire().await.unwrap();
            execute_aut2exe_compilation(&build_task, &settings_clone, &temp_dir_clone).await
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
    let _ = tokio::fs::remove_dir_all(&temp_dir).await;

    Ok(BatchSummary {
        total_success,
        total_failed,
        total_duration_ms: start_time.elapsed().as_millis() as u64,
    })
}

#[tauri::command]
pub fn save_project_file(file_path: String, config: ProjectConfig) -> Result<(), String> {
    file_manager::save_project_file(&file_path, &config)
}

#[tauri::command]
pub fn load_project_file(file_path: String) -> Result<ProjectConfig, String> {
    file_manager::load_project_file(&file_path)
}

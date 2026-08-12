use crate::models::{ProjectConfig, FardoConfig};
use std::fs;

pub fn save_project_file(path: &str, config: &ProjectConfig) -> Result<(), String> {
    let json_data = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(path, json_data)
        .map_err(|e| format!("Failed to write file to disk: {}", e))
}

pub fn load_project_file(path: &str) -> Result<ProjectConfig, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed reading file: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid project file format: {}", e))
}

pub fn save_fardo_file(path: &str, config: &FardoConfig) -> Result<(), String> {
    let json_data = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(path, json_data)
        .map_err(|e| format!("Failed to write file to disk: {}", e))
}

pub fn load_fardo_file(path: &str) -> Result<FardoConfig, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed reading file: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid fardo file format: {}", e))
}

use include_dir::{include_dir, Dir};

const AUT2EXE_BYTES: &[u8] = include_bytes!("../resources/aut2exe/Aut2exe.exe");
const AUT2EXE_X64_BYTES: &[u8] = include_bytes!("../resources/aut2exe/Aut2exe_x64.exe");
const UPX_BYTES: &[u8] = include_bytes!("../resources/aut2exe/upx.exe");

static EMBEDDED_INCLUDE_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/resources/aut2exe/Include");

pub fn extract_bundled_aut2exe(
    app_handle: &tauri::AppHandle,
    target_aut2exe_dir: &std::path::Path,
) -> Result<std::path::PathBuf, String> {
    use tauri::Manager;
    let aut2exe_bin = target_aut2exe_dir.join("Aut2exe.exe");

    let _ = fs::create_dir_all(target_aut2exe_dir);

    // 1. Direct memory extraction (100% guaranteed compile-time embedded bytes)
    let _write_res = fs::write(&aut2exe_bin, AUT2EXE_BYTES);
    let _ = fs::write(target_aut2exe_dir.join("Aut2exe_x64.exe"), AUT2EXE_X64_BYTES);
    let _ = fs::write(target_aut2exe_dir.join("upx.exe"), UPX_BYTES);

    // 2. Resource dir fallback
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let candidate_paths = [
            resource_dir.join("aut2exe"),
            resource_dir.join("resources").join("aut2exe"),
        ];

        for src_resources in &candidate_paths {
            if src_resources.exists() {
                let _ = copy_dir_all(src_resources, target_aut2exe_dir);
            }
        }
    }

    // 3. Ensure AutoIt Include headers are extracted and mirrored to both ./tmp/aut2exe/Include and ./tmp/Include
    ensure_include_dir(target_aut2exe_dir, app_handle);

    if aut2exe_bin.exists() {
        return Ok(aut2exe_bin);
    }

    // 4. System installation fallback
    let system_aut2exe = std::path::Path::new("C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe");
    if system_aut2exe.exists() {
        return Ok(system_aut2exe.to_path_buf());
    }

    Err("Could not extract embedded Aut2exe binaries into ./tmp/aut2exe".to_string())
}

fn ensure_include_dir(target_aut2exe_dir: &std::path::Path, app_handle: &tauri::AppHandle) {
    use tauri::Manager;

    // Aut2exe resolves #include <...> from ..\Include relative to its own binary executable location.
    // Since Aut2exe.exe is at ./tmp/aut2exe/Aut2exe.exe, it looks in ./tmp/Include/
    let primary_inc = target_aut2exe_dir
        .parent()
        .map(|p| p.join("Include"))
        .unwrap_or_else(|| target_aut2exe_dir.join("Include"));
    let secondary_inc = target_aut2exe_dir.join("Include");

    // 1. Direct memory extraction — write each embedded file individually to both locations
    extract_embedded_includes(&primary_inc);
    extract_embedded_includes(&secondary_inc);

    // 2. Copy from Tauri resource dir if primary_inc is still missing GUIConstantsEx.au3
    if !primary_inc.join("GUIConstantsEx.au3").exists() {
        if let Ok(resource_dir) = app_handle.path().resource_dir() {
            let candidate_inc_paths = [
                resource_dir.join("aut2exe").join("Include"),
                resource_dir.join("resources").join("aut2exe").join("Include"),
                resource_dir.join("Include"),
            ];
            for src_inc in &candidate_inc_paths {
                if src_inc.exists() {
                    let _ = copy_dir_all(src_inc, &primary_inc);
                    let _ = copy_dir_all(src_inc, &secondary_inc);
                    break;
                }
            }
        }
    }

    // 3. Fallback: Copy from system AutoIt install if primary_inc is still missing GUIConstantsEx.au3
    if !primary_inc.join("GUIConstantsEx.au3").exists() {
        let system_inc = std::path::Path::new("C:\\Program Files (x86)\\AutoIt3\\Include");
        if system_inc.exists() {
            let _ = copy_dir_all(system_inc, &primary_inc);
            let _ = copy_dir_all(system_inc, &secondary_inc);
        }
    }
}

fn extract_embedded_includes(target_dir: &std::path::Path) {
    let _ = fs::create_dir_all(target_dir);
    for file in EMBEDDED_INCLUDE_DIR.files() {
        if let Some(name) = file.path().file_name() {
            let dest = target_dir.join(name);
            let _ = fs::write(&dest, file.contents());
        }
    }
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;
    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let ty = entry.file_type().map_err(|e| e.to_string())?;
        let dst_path = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst_path)?;
        } else {
            fs::copy(entry.path(), &dst_path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

use crate::models::ProjectConfig;
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

const AUT2EXE_BYTES: &[u8] = include_bytes!("../resources/aut2exe/Aut2exe.exe");
const AUT2EXE_X64_BYTES: &[u8] = include_bytes!("../resources/aut2exe/Aut2exe_x64.exe");
const UPX_BYTES: &[u8] = include_bytes!("../resources/aut2exe/upx.exe");

pub fn extract_bundled_aut2exe(
    app_handle: &tauri::AppHandle,
    target_aut2exe_dir: &std::path::Path,
) -> Result<std::path::PathBuf, String> {
    use tauri::Manager;
    let aut2exe_bin = target_aut2exe_dir.join("Aut2exe.exe");

    if aut2exe_bin.exists() {
        return Ok(aut2exe_bin);
    }

    let _ = fs::create_dir_all(target_aut2exe_dir);

    // 1. Direct memory extraction (100% guaranteed compile-time embedded bytes)
    let write_res = fs::write(&aut2exe_bin, AUT2EXE_BYTES);
    let _ = fs::write(target_aut2exe_dir.join("Aut2exe_x64.exe"), AUT2EXE_X64_BYTES);
    let _ = fs::write(target_aut2exe_dir.join("upx.exe"), UPX_BYTES);

    if write_res.is_ok() && aut2exe_bin.exists() {
        return Ok(aut2exe_bin);
    }

    // 2. Resource dir fallback
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let candidate_paths = [
            resource_dir.join("aut2exe"),
            resource_dir.join("resources").join("aut2exe"),
        ];

        for src_resources in &candidate_paths {
            if src_resources.exists() {
                let _ = copy_dir_all(src_resources, target_aut2exe_dir);
                if aut2exe_bin.exists() {
                    return Ok(aut2exe_bin);
                }
            }
        }
    }

    // 3. System installation fallback
    let system_aut2exe = std::path::Path::new("C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe");
    if system_aut2exe.exists() {
        return Ok(system_aut2exe.to_path_buf());
    }

    Err("Could not extract embedded Aut2exe binaries into ./tmp/aut2exe".to_string())
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

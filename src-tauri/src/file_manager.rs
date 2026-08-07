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

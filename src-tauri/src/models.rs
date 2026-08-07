use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColumnDef {
    pub id: String,
    #[serde(rename = "headerName")]
    pub header_name: String,
    pub key: String,
    #[serde(rename = "type")]
    pub col_type: String,
    #[serde(rename = "defaultValue")]
    pub default_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RowData {
    pub id: String,
    pub enabled: bool,
    pub values: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectConfig {
    pub version: String,
    #[serde(rename = "projectName")]
    pub project_name: String,
    #[serde(rename = "templateCode")]
    pub template_code: String,
    pub columns: Vec<ColumnDef>,
    pub rows: Vec<RowData>,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
    #[serde(rename = "namingPattern")]
    pub naming_pattern: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompilerSettings {
    #[serde(rename = "aut2exePath")]
    pub aut2exe_path: String,
    pub architecture: String,
    #[serde(rename = "compressionLevel")]
    pub compression_level: u8,
    #[serde(rename = "isConsoleApp")]
    pub is_console_app: bool,
    #[serde(rename = "customIconPath")]
    pub custom_icon_path: Option<String>,
    #[serde(rename = "maxParallelBuilds")]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BatchSummary {
    #[serde(rename = "totalSuccess")]
    pub total_success: usize,
    #[serde(rename = "totalFailed")]
    pub total_failed: usize,
    #[serde(rename = "totalDurationMs")]
    pub total_duration_ms: u64,
}

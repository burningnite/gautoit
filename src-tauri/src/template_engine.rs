use handlebars::Handlebars;
use std::collections::HashMap;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TemplateBlock {
    pub filename_pattern: Option<String>,
    pub template_code: String,
}

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

    pub fn parse_blocks(&self, raw_template: &str) -> Vec<TemplateBlock> {
        let mut blocks = Vec::new();
        let lines = raw_template.lines();
        
        let mut current_filename: Option<String> = None;
        let mut current_code = String::new();
        let mut has_delimiters = false;

        for line in lines {
            let trimmed = line.trim();
            if trimmed.starts_with("|||") || trimmed.starts_with("¬¬¬") {
                has_delimiters = true;
                if !current_code.trim().is_empty() {
                    blocks.push(TemplateBlock {
                        filename_pattern: current_filename.take(),
                        template_code: current_code.clone(),
                    });
                    current_code.clear();
                }
                
                let delimiter = if trimmed.starts_with("|||") { "|||" } else { "¬¬¬" };
                let rest = trimmed.trim_start_matches(delimiter).trim();
                if let Some(pos) = rest.find("filename") {
                    let filename_part = &rest[pos..];
                    if let Some(eq_pos) = filename_part.find('=') {
                        let val = filename_part[eq_pos + 1..].trim();
                        if !val.is_empty() {
                            current_filename = Some(val.to_string());
                        }
                    }
                }
            } else {
                if !current_code.is_empty() {
                    current_code.push('\n');
                }
                current_code.push_str(line);
            }
        }

        if !current_code.trim().is_empty() || current_filename.is_some() {
            blocks.push(TemplateBlock {
                filename_pattern: current_filename,
                template_code: current_code,
            });
        }

        if !has_delimiters || blocks.is_empty() {
            vec![TemplateBlock {
                filename_pattern: None,
                template_code: raw_template.to_string(),
            }]
        } else {
            blocks
        }
    }

    pub fn render_script(&self, template: &str, row_values: &HashMap<String, String>) -> Result<String, String> {
        let map = normalize_map(row_values);
        self.hb.render_template(template, &map)
            .map_err(|e| format!("Template render error: {}", e))
    }

    pub fn generate_output_filename(&self, pattern: &str, row_values: &HashMap<String, String>, default_id: &str) -> String {
        let map = normalize_map(row_values);
        match self.hb.render_template(pattern, &map) {
            Ok(name) => {
                let sanitized = name.replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-' && c != '.', "_");
                if sanitized.ends_with(".exe") {
                    sanitized
                } else {
                    format!("{}.exe", sanitized)
                }
            }
            Err(_) => format!("output_{}.exe", default_id),
        }
    }
}

fn normalize_map(row_values: &HashMap<String, String>) -> HashMap<String, String> {
    let mut normalized = row_values.clone();
    for (k, v) in row_values {
        let lower = k.to_lowercase();
        if !normalized.contains_key(&lower) {
            normalized.insert(lower.clone(), v.clone());
        }
        let upper = k.to_uppercase();
        if !normalized.contains_key(&upper) {
            normalized.insert(upper, v.clone());
        }
    }
    normalized
}

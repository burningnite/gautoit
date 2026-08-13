use handlebars::Handlebars;
use std::collections::HashMap;
use std::path::Path;
use crate::models::{FardoConfig, BuildTask};

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
        hb.register_helper("strip_spaces", Box::new(strip_spaces_helper));

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

    pub fn expand_fardo(&self, config: &FardoConfig, outputs_dir: &Path) -> Result<Vec<BuildTask>, String> {
        let mut tasks = Vec::new();

        for pc in &config.pcs {
            if !pc.enabled {
                continue;
            }

            for (platform_name, account) in &pc.accounts {
                if let Some(platform) = config.platforms.get(platform_name) {
                    let blocks = self.parse_blocks(&platform.template_code);
                    
                    for game in &platform.games {
                        if pc.disabled_games.contains(game) {
                            continue;
                        }

                        // Build parameters
                        let mut values = HashMap::new();
                        values.insert("id".to_string(), pc.id.clone());
                        values.insert("shortwait".to_string(), pc.shortwait.to_string());
                        values.insert("prepasswait".to_string(), pc.prepasswait.to_string());
                        values.insert("user".to_string(), account.user.clone());
                        values.insert("password".to_string(), account.password.clone());
                        values.insert("gamename".to_string(), game.clone());
                        
                        let gamepath = format!("{}\\{}{}", platform.game_base_path, game, platform.game_ext);
                        values.insert("gamepath".to_string(), gamepath);
                        
                        values.insert("launcher".to_string(), platform.launcher.clone());
                        
                        let timerpath = format!("{}\\TimerDe{}-{}.exe", config.timer_base_path, platform_name, pc.id);
                        values.insert("timer".to_string(), timerpath);

                        for (block_idx, block) in blocks.iter().enumerate() {
                            let rendered_script = self.render_script(&block.template_code, &values)?;

                            let pattern = block.filename_pattern.as_deref().unwrap_or(&config.naming_pattern);
                            let default_id = format!("{}-{}-{}", pc.id, platform_name, game);
                            let filename = self.generate_output_filename(pattern, &values, &default_id);
                            
                            let platform_dir = outputs_dir.join(platform_name);
                            let output_exe_path = platform_dir.join(&filename).to_string_lossy().to_string();

                            let task_row_id = if blocks.len() > 1 {
                                format!("{}_{}_{}_b{}", pc.id, platform_name, game, block_idx + 1)
                            } else {
                                format!("{}_{}_{}", pc.id, platform_name, game)
                            };

                            let sanitized_task_row_id = task_row_id.replace(" ", "_");

                            tasks.push(BuildTask {
                                row_id: sanitized_task_row_id,
                                rendered_au3_code: rendered_script,
                                output_exe_path,
                            });
                        }
                    }
                }
            }
        }

        Ok(tasks)
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

fn strip_spaces_helper(
    h: &handlebars::Helper,
    _: &Handlebars,
    _: &handlebars::Context,
    _: &mut handlebars::RenderContext,
    out: &mut dyn handlebars::Output
) -> handlebars::HelperResult {
    let param = h.param(0).and_then(|v| v.value().as_str()).unwrap_or("");
    out.write(&param.replace(" ", "_"))?;
    Ok(())
}

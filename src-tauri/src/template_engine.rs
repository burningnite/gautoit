use handlebars::Handlebars;
use std::collections::HashMap;

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

    pub fn render_script(&self, template: &str, row_values: &HashMap<String, String>) -> Result<String, String> {
        self.hb.render_template(template, row_values)
            .map_err(|e| format!("Template render error: {}", e))
    }

    pub fn generate_output_filename(&self, pattern: &str, row_values: &HashMap<String, String>, default_id: &str) -> String {
        match self.hb.render_template(pattern, row_values) {
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

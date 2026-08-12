pub mod commands;
pub mod compiler;
pub mod file_manager;
pub mod models;
pub mod template_engine;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::auto_load_fardo,
            commands::auto_save_fardo,
            commands::detect_aut2exe_path,
            commands::compile_batch,
            commands::save_fardo_file,
            commands::load_fardo_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

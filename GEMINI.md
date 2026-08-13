# Taurito Agent Guidelines

## 1. Versioning
- ALWAYS automatically update the project version number whenever significant features or bug fixes are applied.
- Ensure the version matches across the following configuration files:
  1. `package.json` -> `"version"`
  2. `src-tauri/Cargo.toml` -> `version`
  3. `src-tauri/tauri.conf.json` -> `"version"`

## 2. Naming Conventions
- The output executable should ALWAYS be configured using the `"productName"` attribute in `tauri.conf.json`.
- The product name MUST follow the format `taurito-{version}` (e.g., `"productName": "taurito-1.8.0"`).
- Consequently, this ensures the Tauri release output is named `taurito-{version}.exe`. 

## 3. Post-Game Goals Tracker
- Major versions (e.g., `2.0.0`) are reserved strictly for major milestone completions (such as the successful implementation of post-game goals like the `.aiproj` Migration Tool or the GUI Setup Wizard).
- Use `1.x.x` minor/patch increments for normal iterations and fixes until the post-game goals are completed.

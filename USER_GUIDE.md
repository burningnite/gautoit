# User Guide: Windows-Native Tauri AutoIt Executable Factory (`gautoit`)

Welcome to the **AutoIt Executable Factory (`gautoit`)** user manual. This guide will walk you through setting up, configuring, and operating `gautoit` to generate parameterized, standalone Windows executable (`.exe`) binaries in bulk.

---

## 📑 Table of Contents

1. [Overview & Key Features](#1-overview--key-features)
2. [System Requirements & Toolchain Prerequisites](#2-system-requirements--toolchain-prerequisites)
3. [Step-by-Step User Instructions](#3-step-by-step-user-instructions)
   * [Step 1: Managing the Parameter Grid (AG-Grid)](#step-1-managing-the-parameter-grid-ag-grid)
   * [Step 2: Authoring the Master AutoIt Script Template](#step-2-authoring-the-master-autoit-script-template)
   * [Step 3: Configuring Compiler Settings](#step-3-configuring-compiler-settings)
   * [Step 4: Running Batch Compilation](#step-4-running-batch-compilation)
   * [Step 5: Saving & Loading `.aiproj` Project Files](#step-5-saving--loading-aiproj-project-files)
4. [Sample AutoIt Script Templates](#4-sample-autoit-script-templates)
5. [Troubleshooting & FAQ](#5-troubleshooting--faq)

---

## 1. Overview & Key Features

`gautoit` is a high-performance Windows desktop application designed for system administrators, IT engineers, and software automation teams. It combines a spreadsheet interface with AutoIt's official `Aut2exe` compiler engine to automate parameterized batch builds.

### Key Capabilities:
* **Spreadsheet Parameter Grid:** Manage target PCs, paths, IPs, and custom arguments with inline editing, row add/delete, and selective enable/disable toggles.
* **Mustache Script Interpolation:** Define a master AutoIt script template with placeholders like `{{ PC_NAME }}`, `{{ EXE_PATH }}`, `{{ SERVER_IP }}`.
* **Parallel Async Worker Pool:** Compiles multiple standalone `.exe` binaries concurrently using Tokio background tasks with zero command window popups (`CREATE_NO_WINDOW`).
* **Real-Time Compilation Metrics:** Live event logging console with row-by-row status badges (Ready, Queued, Building, Success, Failed).
* **Project Persistence (`.aiproj`):** Save and load complete batch configurations in human-readable JSON files.

---

## 2. System Requirements & Toolchain Prerequisites

### Operating System:
* Windows 10 or Windows 11 (64-bit)

### Required Software:
1. **AutoIt v3 Toolchain:**
   * Download and install the full AutoIt v3 package from [autoitscript.com](https://www.autoitscript.com/site/autoit/downloads/).
   * Default installation path:
     `C:\Program Files (x86)\AutoIt3\Aut2Exe\Aut2exe.exe`
2. **Microsoft Edge WebView2 Runtime:**
   * Pre-installed on Windows 10 and 11. (If missing, download the Evergreen Bootstrapper from Microsoft).

---

## 3. Step-by-Step User Instructions

Launch `gautoit` by running `npm run tauri dev` or launching the compiled `tauri-autoit-factory.exe` binary.

---

### Step 1: Managing the Parameter Grid (AG-Grid)

The **Data Grid** tab is your central spreadsheet for defining build targets and parameter row values.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Executable & Target Parameter Grid                         [+ Add Column]│
│                                                               [+ Add Row]   │
├────────┬──────────┬──────────────────────┬──────────────────────────────────┤
│ Enable │ Status   │ Target PC ({{PC_NAME}})│ Executable Path ({{EXE_PATH}})   │
├────────┼──────────┼──────────────────────┼──────────────────────────────────┤
│  [✓]   │ Ready    │ DESKTOP-FINANCE-01   │ C:\Apps\FinanceApp.exe           │
│  [✓]   │ Ready    │ DESKTOP-HR-02        │ C:\Apps\HrApp.exe                │
│  [ ]   │ Ready    │ SERVER-STAGING-03    │ C:\Apps\TestApp.exe              │
└────────┴──────────┴──────────────────────┴──────────────────────────────────┘
```

1. **Adding Custom Parameter Columns:**
   * Click the **Add Column** button in the top grid toolbar.
   * Enter a **Header Label** (e.g. `Server IP`) and a **Template Key** (e.g. `SERVER_IP`).
   * Click **Save Column**. A new column will appear in the spreadsheet representing `{{ SERVER_IP }}`.
2. **Adding Target Rows:**
   * Click **Add Row** to create a new row entry.
3. **Editing Cell Values:**
   * Double-click any spreadsheet cell to edit values directly.
4. **Enabling/Disabling Targets:**
   * Toggle the **Enable** checkbox in the leftmost column to include or exclude specific rows from batch compilation without deleting them.

---

### Step 2: Authoring the Master AutoIt Script Template

Click the **Master Template** tab in the top navigation bar to open the CodeMirror script editor.

```autoit
; Master AutoIt Script Template
#include <MsgBoxConstants.au3>

Global Const $PC_NAME     = "{{ PC_NAME }}"
Global Const $EXE_PATH    = "{{ EXE_PATH }}"
Global Const $EXEC_PARAMS = "{{ EXEC_PARAMS }}"

Func Main()
    If Not FileExists($EXE_PATH) Then
        MsgBox($MB_ICONERROR, "Deployment Error", "Executable not found on " & $PC_NAME)
        Exit 1
    EndIf

    Run($EXE_PATH & " " & $EXEC_PARAMS)
EndFunc

Main()
```

1. **Inserting Placeholders:**
   * Placeholders are written in double curly braces: `{{ KEY_NAME }}`.
   * Click any of the **Available Placeholder Chips** at the top right of the editor bar to copy and insert keys defined in your Data Grid.
2. **Path Handling Note:**
   * Windows path backslashes (e.g. `C:\Program Files\App\bin.exe`) are automatically preserved during interpolation. No manual double-escaping (`\\`) is necessary.

---

### Step 3: Configuring Compiler Settings

Click **Settings** in the top navigation bar to configure compiler settings:

* **Aut2exe Compiler Path:**
  * Click **Auto-Detect Path** to locate `Aut2exe.exe` automatically on your Windows system.
* **Output Directory Path:**
  * Set the destination directory where compiled `.exe` files will be saved (e.g. `C:\AutoItBuilds\Output`).
* **Executable Naming Pattern:**
  * Use placeholders to structure output filenames, for example: `Build_{{ PC_NAME }}.exe`.
* **Target Architecture:**
  * Select **Windows 64-bit (/x64)** or **Windows 32-bit (/x86)**.
* **Compression Level:**
  * Select compression: `0 - None (Fastest)`, `2 - Standard (Default)`, or `4 - Maximum LZMA`.
* **Max Concurrent Build Tasks:**
  * Set the worker pool limit (default is 4 parallel builds) to match your system's CPU cores.

---

### Step 4: Running Batch Compilation

1. Click the green **Compile Batch** button in the top right corner.
2. `gautoit` will automatically switch to the **Build Logs** view tab.
3. Observe live event logs streaming in real-time:
   * ⏳ `Compiling row [row-1]...`
   * ✅ `Row [row-1] successfully compiled to: C:\AutoItBuilds\Output\Build_DESKTOP-FINANCE-01.exe (450 ms)`
4. Per-row status badges in the **Data Grid** will update live:
   * **Ready** ➔ **Queued** ➔ **Building** ➔ **Success** / **Failed**.
5. Once complete, a summary badge will report total passed, failed, and execution duration.

---

### Step 5: Saving & Loading `.aiproj` Project Files

Click **Import/Export** in the top header:

* **Exporting Configuration:**
  * Click **Generate JSON Export** to serialize your entire workspace (grid columns, row parameter values, master template, naming pattern, output directory) into a standard `.aiproj` JSON configuration.
  * Click **Copy JSON** to copy to clipboard or save as a `.aiproj` file.
* **Importing Configuration:**
  * Paste an `.aiproj` JSON payload into the text field and click **Import JSON into Project** to restore your workspace state instantly.

---

## 4. Sample AutoIt Script Templates

### Template 1: Automated Silent Installer Wrapper

```autoit
#cs ----------------------------------------------------------------------------
 AutoIt Version: 3.3.16.1
 Script Function: Parameterized Automated Application Deployment
 Target PC: {{ PC_NAME }}
#ce ----------------------------------------------------------------------------

#include <File.au3>

Local Const $TARGET_PC  = "{{ PC_NAME }}"
Local Const $INSTALLER  = "{{ INSTALLER_PATH }}"
Local Const $SILENT_ARG = "{{ SILENT_ARGS }}"

Local $sLogFile = @TempDir & "\deploy_" & $TARGET_PC & ".log"
_FileWriteLog($sLogFile, "Starting installation on " & $TARGET_PC)

If Not FileExists($INSTALLER) Then
    _FileWriteLog($sLogFile, "ERROR: Installer file not found: " & $INSTALLER)
    Exit 1
EndIf

Local $iExitCode = RunWait($INSTALLER & " " & $SILENT_ARG, "", @SW_HIDE)
_FileWriteLog($sLogFile, "Installer finished with exit code: " & $iExitCode)
Exit $iExitCode
```

---

## 5. Troubleshooting & FAQ

| Symptom / Issue | Potential Cause | Recommended Solution |
| :--- | :--- | :--- |
| `Aut2exe process exit code 1` | `Aut2exe.exe` binary path is incorrect or missing | Open **Settings**, click **Auto-Detect Path**, and ensure AutoIt v3 is installed under `C:\Program Files (x86)\AutoIt3\Aut2Exe\`. |
| Generated `.exe` shows file missing error | Hardcoded relative path in AutoIt template | Use absolute Windows paths (e.g. `C:\Apps\App.exe`) or wrap path variables in quotes inside the template (`"{{ EXE_PATH }}"`). |
| Windows Defender blocks compiled binary | Unsigned executable generated by AutoIt | Add your output build directory (e.g. `C:\AutoItBuilds\Output`) to **Windows Defender Exclusion List**. |
| Output folder missing after compile | Target directory was deleted or non-existent | `gautoit` automatically creates destination directories; ensure user permissions allow writing to the target output folder. |

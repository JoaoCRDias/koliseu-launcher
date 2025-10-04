#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;
use sysinfo::{System, Pid};

#[derive(Debug, Serialize, Deserialize)]
struct UpdateInfo {
    available: bool,
    current_version: String,
    latest_version: Option<String>,
    download_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ClientVersionInfo {
    version: String,
    download_url: String,
}

#[derive(Debug, Deserialize)]
struct DownloadClientParams {
    #[serde(alias = "downloadUrl")]
    download_url: String,
    version: String,
}

// Get client installation directory
fn get_client_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path_resolver()
        .app_local_data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())
        .map(|dir| dir.join("client"))
}

// Get current client version
fn get_current_client_version(app_handle: &tauri::AppHandle) -> Result<String, String> {
    let client_dir = get_client_dir(app_handle)?;
    let version_file = client_dir.join("version.txt");
    println!("Application starting...");

    if version_file.exists() {
        fs::read_to_string(&version_file)
            .map(|v| v.trim().to_string())
            .map_err(|e| format!("Failed to read version file: {}", e))
    } else {
        Ok("0.0.0".to_string())
    }
}

// Check for client updates
#[tauri::command]
async fn check_client_update(app_handle: tauri::AppHandle) -> Result<UpdateInfo, String> {
    println!("[DEBUG] Checking for client updates...");
    eprintln!("[DEBUG] Checking for client updates...");
    
    let current_version = get_current_client_version(&app_handle)?;
    println!("[DEBUG] Current version: {}", current_version);
    eprintln!("[DEBUG] Current version: {}", current_version);

    // Fetch latest version info from your server
    println!("[DEBUG] Fetching latest version from server...");
    eprintln!("[DEBUG] Fetching latest version from server...");
    let response = reqwest::get("https://www.koliseuot.com.br/api/client/version")
        .await
        .map_err(|e| {
            let err = format!("Failed to fetch version info: {}", e);
            println!("[ERROR] {}", err);
            eprintln!("[ERROR] {}", err);
            err
        })?;

    let version_info: ClientVersionInfo = response
        .json()
        .await
        .map_err(|e| {
            let err = format!("Failed to parse version info: {}", e);
            println!("[ERROR] {}", err);
            eprintln!("[ERROR] {}", err);
            err
        })?;
    println!("[DEBUG] Server version info: {:?}", version_info);
    eprintln!("[DEBUG] Server version info: {:?}", version_info);

    let available = version_info.version != current_version;
    println!("[DEBUG] Update available: {}", available);
    eprintln!("[DEBUG] Update available: {}", available);

    Ok(UpdateInfo {
        available,
        current_version,
        latest_version: if available {
            Some(version_info.version)
        } else {
            None
        },
        download_url: if available {
            Some(version_info.download_url)
        } else {
            None
        },
    })
}

// Folders that should be completely replaced during update
const REPLACE_FOLDERS: &[&str] = &["assets", "storeimages", "bin"];

// Download and install client update
#[tauri::command(rename_all = "snake_case")]
async fn download_client_update(
    app_handle: tauri::AppHandle,
    download_url: String,
    version: String,
) -> Result<(), String> {
    let client_dir = get_client_dir(&app_handle)?;

    // Create client directory if it doesn't exist
    fs::create_dir_all(&client_dir)
        .map_err(|e| format!("Failed to create client directory: {}", e))?;

    // Clean up any partial downloads from previous failed attempts
    let zip_path = client_dir.join("client.zip");
    if zip_path.exists() {
        println!("Removing old partial download...");
        let _ = fs::remove_file(&zip_path);
    }

    // Emit progress: Starting download
    app_handle.emit_all("download-progress", serde_json::json!({
        "stage": "downloading",
        "message": "Baixando o cliente...",
        "percent": 0
    })).ok();

    // Download the client zip file
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| format!("Failed to download client: {}", e))?;

    let total_size = response.content_length().unwrap_or(0);

    // Download with progress
    use futures_util::StreamExt;
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut buffer = Vec::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Failed to read chunk: {}", e))?;
        buffer.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let percent = (downloaded as f64 / total_size as f64 * 100.0) as u32;
            app_handle.emit_all("download-progress", serde_json::json!({
                "stage": "downloading",
                "message": format!("Baixando o cliente... {:.1} MB / {:.1} MB",
                    downloaded as f64 / 1_048_576.0,
                    total_size as f64 / 1_048_576.0),
                "percent": percent
            })).ok();
        }
    }

    // Emit progress: Saving file
    app_handle.emit_all("download-progress", serde_json::json!({
        "stage": "saving",
        "message": "Salvando arquivos...",
        "percent": 100
    })).ok();

    // Validate download
    if buffer.is_empty() {
        return Err("Downloaded file is empty".to_string());
    }

    // Save zip file
    let zip_path = client_dir.join("client.zip");
    fs::write(&zip_path, &buffer)
        .map_err(|e| format!("Failed to write zip file: {}", e))?;

    // Verify file was written
    let metadata = fs::metadata(&zip_path)
        .map_err(|e| format!("Failed to verify zip file: {}", e))?;

    if metadata.len() == 0 {
        return Err("Saved zip file is empty".to_string());
    }

    println!("ZIP file saved successfully: {} bytes", metadata.len());

    // Emit progress: Extracting
    app_handle.emit_all("download-progress", serde_json::json!({
        "stage": "extracting",
        "message": "Extraindo...",
        "percent": 0
    })).ok();

    // Extract zip file with selective replacement
    let file = fs::File::open(&zip_path)
        .map_err(|e| format!("Failed to open zip file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Failed to read zip archive. The file may be corrupted: {}", e))?;

    let total_files = archive.len();

    // Extract with progress
    for i in 0..total_files {
        let percent = ((i as f64 / total_files as f64) * 100.0) as u32;
        app_handle.emit_all("download-progress", serde_json::json!({
            "stage": "extracting",
            "message": format!("Extraindo... {} / {}", i + 1, total_files),
            "percent": percent
        })).ok();

        let mut file = archive
            .by_index(i)
            .map_err(|e| {
                let err = format!("Failed to read zip entry {}: {}", i, e);
                println!("{}", err);
                err
            })?;

        let outpath = match file.enclosed_name() {
            Some(path) => client_dir.join(path),
            None => {
                println!("Skipping file with invalid name at index {}", i);
                continue;
            }
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory {}: {}", outpath.display(), e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
            }

            let should_extract = if let Some(path) = file.enclosed_name() {
                let first_component = path.components().next();
                if let Some(std::path::Component::Normal(comp)) = first_component {
                    let folder_name = comp.to_string_lossy();
                    REPLACE_FOLDERS.contains(&folder_name.as_ref()) || !outpath.exists()
                } else {
                    !outpath.exists()
                }
            } else {
                !outpath.exists()
            };

            if should_extract {
                println!("Extracting: {}", outpath.display());
                let mut outfile = fs::File::create(&outpath)
                    .map_err(|e| format!("Failed to create file {}: {}", outpath.display(), e))?;

                match std::io::copy(&mut file, &mut outfile) {
                    Ok(bytes) => println!("Extracted {} ({} bytes)", outpath.display(), bytes),
                    Err(e) => {
                        let err = format!("Failed to extract file {}: {}. The ZIP may be corrupted.", outpath.display(), e);
                        println!("{}", err);
                        // Clean up partial file
                        let _ = fs::remove_file(&outpath);
                        return Err(err);
                    }
                }
            }
        }
    }

    // Clean up zip file
    if zip_path.exists() {
        fs::remove_file(&zip_path)
            .map_err(|e| format!("Failed to remove zip file: {}", e))?;
    }

    // Emit progress: Finalizing
    app_handle.emit_all("download-progress", serde_json::json!({
        "stage": "finalizing",
        "message": "Finalizando instalação...",
        "percent": 100
    })).ok();

    // Update version file
    let version_file = client_dir.join("version.txt");
    fs::write(&version_file, version)
        .map_err(|e| format!("Failed to write version file: {}", e))?;

    // Emit progress: Complete
    app_handle.emit_all("download-progress", serde_json::json!({
        "stage": "complete",
        "message": "Atualização completa!",
        "percent": 100
    })).ok();

    Ok(())
}

// Kill process by name
#[tauri::command]
async fn kill_process_by_name(process_name: String) -> Result<u32, String> {
    let mut system = System::new_all();
    system.refresh_processes();

    let mut killed_count = 0;

    for (pid, process) in system.processes() {
        let proc_name = process.name();
        if proc_name.to_lowercase() == process_name.to_lowercase()
            || proc_name.to_lowercase() == format!("{}.exe", process_name.to_lowercase()) {
            println!("Killing process: {} (PID: {:?})", proc_name, pid);
            if process.kill() {
                killed_count += 1;
                println!("Process {:?} killed successfully", pid);
            } else {
                println!("Failed to kill process {:?}", pid);
            }
        }
    }

    if killed_count > 0 {
        Ok(killed_count)
    } else {
        Err(format!("No process found with name: {}", process_name))
    }
}

// Launch the client
#[tauri::command]
async fn launch_client(
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let client_dir = get_client_dir(&app_handle)?;
    let client_exe = client_dir.join("bin").join("client.exe");

    if !client_exe.exists() {
        return Err("Client executable not found. Please update the client first.".to_string());
    }

    // Launch the client
    Command::new(&client_exe)
        .current_dir(&client_dir)
        .spawn()
        .map_err(|e| format!("Failed to launch client: {}", e))?;

    Ok(())
}

fn main() {
    // Initialize logging for development
    #[cfg(debug_assertions)]
    {
        std::env::set_var("RUST_LOG", "debug");
    }

    println!("Application starting...");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_client_update,
            download_client_update,
            launch_client,
            kill_process_by_name
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

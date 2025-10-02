// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

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
    let current_version = get_current_client_version(&app_handle)?;

    // Fetch latest version info from your server
    let response = reqwest::get("https://www.koliseuot.com.br/api/client/version")
        .await
        .map_err(|e| format!("Failed to fetch version info: {}", e))?;

    let version_info: ClientVersionInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse version info: {}", e))?;

    let available = version_info.version != current_version;

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

// Extract zip with selective folder replacement
fn extract_zip_selective(
    archive: &mut zip::ZipArchive<fs::File>,
    client_dir: &Path,
) -> Result<(), String> {
    // First, delete folders that should be replaced
    for folder_name in REPLACE_FOLDERS {
        let folder_path = client_dir.join(folder_name);
        if folder_path.exists() {
            fs::remove_dir_all(&folder_path)
                .map_err(|e| format!("Failed to remove old {} folder: {}", folder_name, e))?;
        }
    }

    // Extract all files from zip
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read zip entry: {}", e))?;

        let outpath = match file.enclosed_name() {
            Some(path) => client_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            // Directory
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            // File
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
            }

            // Check if file is in a folder that should be replaced
            let should_extract = if let Some(path) = file.enclosed_name() {
                let first_component = path.components().next();
                if let Some(std::path::Component::Normal(comp)) = first_component {
                    let folder_name = comp.to_string_lossy();
                    // Always extract files from folders marked for replacement
                    REPLACE_FOLDERS.contains(&folder_name.as_ref()) || !outpath.exists()
                } else {
                    !outpath.exists()
                }
            } else {
                !outpath.exists()
            };

            if should_extract {
                let mut outfile = fs::File::create(&outpath)
                    .map_err(|e| format!("Failed to create file: {}", e))?;
                std::io::copy(&mut file, &mut outfile)
                    .map_err(|e| format!("Failed to write file: {}", e))?;
            }
        }
    }

    Ok(())
}

// Download and install client update
#[tauri::command]
async fn download_client_update(
    app_handle: tauri::AppHandle,
    download_url: String,
    version: String,
) -> Result<(), String> {
    let client_dir = get_client_dir(&app_handle)?;

    // Create client directory if it doesn't exist
    fs::create_dir_all(&client_dir)
        .map_err(|e| format!("Failed to create client directory: {}", e))?;

    // Download the client zip file
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| format!("Failed to download client: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read download bytes: {}", e))?;

    // Save zip file
    let zip_path = client_dir.join("client.zip");
    fs::write(&zip_path, &bytes)
        .map_err(|e| format!("Failed to write zip file: {}", e))?;

    // Extract zip file with selective replacement
    let file = fs::File::open(&zip_path)
        .map_err(|e| format!("Failed to open zip file: {}", e))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Failed to read zip archive: {}", e))?;

    extract_zip_selective(&mut archive, &client_dir)?;

    // Clean up zip file
    fs::remove_file(&zip_path)
        .map_err(|e| format!("Failed to remove zip file: {}", e))?;

    // Update version file
    let version_file = client_dir.join("version.txt");
    fs::write(&version_file, version)
        .map_err(|e| format!("Failed to write version file: {}", e))?;

    Ok(())
}

// Launch the client
#[tauri::command]
async fn launch_client(
    app_handle: tauri::AppHandle,
    server_url: String,
    server_port: u16,
) -> Result<(), String> {
    let client_dir = get_client_dir(&app_handle)?;
    let client_exe = client_dir.join("Tibia.exe");

    if !client_exe.exists() {
        return Err("Client executable not found. Please update the client first.".to_string());
    }

    // Create or update client configuration
    let config_path = client_dir.join("clientoptions.json");
    let config = serde_json::json!({
        "loginServers": [{
            "name": "KoliseuOT",
            "hostname": server_url,
            "port": server_port,
            "previewState": 0
        }]
    });

    fs::write(&config_path, serde_json::to_string_pretty(&config).unwrap())
        .map_err(|e| format!("Failed to write client config: {}", e))?;

    // Launch the client
    Command::new(&client_exe)
        .current_dir(&client_dir)
        .spawn()
        .map_err(|e| format!("Failed to launch client: {}", e))?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_client_update,
            download_client_update,
            launch_client
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

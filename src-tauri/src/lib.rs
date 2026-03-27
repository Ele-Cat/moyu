#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    Manager, WindowEvent,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// 应用状态管理结构体
#[derive(Default)]
pub struct AppState {
    pub is_paused: Mutex<bool>,
}

/// HTTP 请求选项
#[derive(Deserialize)]
pub struct FetchOptions {
    url: String,
    method: String,
    headers: Option<std::collections::HashMap<String, String>>,
    body: Option<serde_json::Value>,
    return_type: Option<String>,
}

/// HTTP 响应结构体
#[derive(Serialize, Deserialize)]
pub struct FetchResponse {
    status: u16,
    body: serde_json::Value,
}

/// 文件信息结构体
#[derive(Serialize, Deserialize)]
pub struct FileInfo {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
}

#[tauri::command]
/// 通用 HTTP 请求接口
async fn fetch_api(options: FetchOptions) -> Result<FetchResponse, String> {
    use reqwest::Client;

    let client = Client::new();

    let mut request = match options.method.to_uppercase().as_str() {
        "GET" => client.get(&options.url),
        "POST" => client.post(&options.url),
        "PUT" => client.put(&options.url),
        "DELETE" => client.delete(&options.url),
        _ => return Err("不支持的请求方法".to_string()),
    };

    for (key, value) in options.headers.iter().flat_map(|h| h.iter()) {
        request = request.header(key, value);
    }

    if let Some(body) = options.body {
        request = request.json(&body);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let status = response.status().as_u16();
    
    let return_type = options.return_type.as_deref().unwrap_or("json");
    let body = if return_type == "text" {
        let text = response
            .text()
            .await
            .map_err(|e| format!("获取响应文本失败: {}", e))?;
        serde_json::Value::String(text)
    } else {
        response
            .json()
            .await
            .map_err(|e| format!("解析响应失败: {}", e))?
    };

    Ok(FetchResponse { status, body })
}

#[tauri::command]
/// 隐藏窗口到系统托盘
fn hide_to_tray(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))
}

#[tauri::command]
/// 显示窗口并获取焦点
fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
    window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))
}

#[tauri::command]
/// 获取桌面路径
fn get_desktop_path() -> Result<String, String> {
    dirs::desktop_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "无法获取桌面路径".to_string())
}

#[tauri::command]
/// 获取存储路径
fn get_storage_path(app: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app.path()
        .app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    
    let config_file = config_dir.join("storage_path.txt");
    
    if config_file.exists() {
        std::fs::read_to_string(&config_file)
            .map(|s| s.trim().to_string())
            .map_err(|e| format!("读取存储路径失败: {}", e))
    } else {
        app.path()
            .app_data_dir()
            .map(|p| p.to_string_lossy().to_string())
            .map_err(|e| format!("获取应用数据目录失败: {}", e))
    }
}

#[tauri::command]
/// 设置存储路径
fn set_storage_path(path: String, app: tauri::AppHandle) -> Result<(), String> {
    let config_dir = app.path()
        .app_config_dir()
        .map_err(|e| format!("获取配置目录失败: {}", e))?;
    
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("创建配置目录失败: {}", e))?;
    
    let config_file = config_dir.join("storage_path.txt");
    std::fs::write(&config_file, &path)
        .map_err(|e| format!("保存存储路径失败: {}", e))
}

#[tauri::command]
/// 选择文件夹
async fn choose_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let (tx, rx) = std::sync::mpsc::channel();
    
    app.dialog()
        .file()
        .set_title("选择存储位置")
        .pick_folder(move |folder| {
            let _ = tx.send(folder.map(|p| p.to_string()));
        });
    
    rx.recv().map_err(|e| e.to_string())
}

#[tauri::command]
/// 扫描文件夹获取文件列表
fn scan_folder(path: String) -> Result<Vec<FileInfo>, String> {
    use std::fs;

    let dir_path = std::path::PathBuf::from(&path);

    if !dir_path.exists() {
        return Err("路径不存在".to_string());
    }

    let mut files = Vec::new();

    let entries = fs::read_dir(&dir_path).map_err(|e| format!("读取目录失败: {}", e))?;

    for entry in entries.filter_map(|e| e.ok()) {
        let metadata = entry.metadata().ok();
        let file_name = entry.file_name().to_string_lossy().to_string();

        files.push(FileInfo {
            name: file_name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false),
            size: metadata.as_ref().map(|m| m.len()).unwrap_or(0),
        });
    }

    files.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(files)
}

#[tauri::command]
/// 读取小说/文本文件内容
fn read_novel_content(path: String) -> Result<String, String> {
    use std::fs;

    let path_buf = std::path::PathBuf::from(&path);

    if !path_buf.exists() {
        return Err("文件不存在".to_string());
    }

    let ext = path_buf
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if ext != "txt" && ext != "md" {
        return Err("不支持预览此类型文件".to_string());
    }

    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

#[tauri::command]
/// 获取新闻内容
async fn fetch_news(url: String) -> Result<String, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let body = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    Ok(body)
}

use wallpaper::set_from_path;

#[tauri::command]
/// 设置桌面壁纸（支持网络图片）
async fn set_wallpaper(url: String, app: tauri::AppHandle) -> Result<String, String> {
    use std::path::PathBuf;
    
    let storage_path = {
        let config_dir = app.path()
            .app_config_dir()
            .map_err(|e| format!("获取配置目录失败: {}", e))?;
        
        let config_file = config_dir.join("storage_path.txt");
        
        if config_file.exists() {
            std::fs::read_to_string(&config_file)
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|_| {
                    app.path()
                        .app_data_dir()
                        .unwrap_or_else(|_| PathBuf::from("."))
                        .to_string_lossy()
                        .to_string()
                })
        } else {
            app.path()
                .app_data_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| {
                    dirs::cache_dir()
                        .unwrap_or_else(|| PathBuf::from("."))
                        .to_string_lossy()
                        .to_string()
                })
        }
    };
    
    let path = if url.starts_with("http://") || url.starts_with("https://") {
        let cache_dir = PathBuf::from(&storage_path).join("wallpaper");
        
        std::fs::create_dir_all(&cache_dir)
            .map_err(|e| format!("创建缓存目录失败: {}", e))?;
        
        let file_name = format!(
            "wallpaper_{}.jpg",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis()
        );
        
        let local_path = cache_dir.join(file_name);
        
        let response = reqwest::get(&url)
            .await
            .map_err(|e| format!("下载图片失败: {}", e))?;
        
        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("读取图片数据失败: {}", e))?;
        
        std::fs::write(&local_path, &bytes)
            .map_err(|e| format!("保存图片失败: {}", e))?;
        
        local_path.to_string_lossy().to_string()
    } else {
        url
    };
    
    set_from_path(&path).map_err(|e| format!("设置壁纸失败: {}", e))?;
    Ok("壁纸设置成功".to_string())
}

#[tauri::command]
/// 保存文件到指定目录
async fn download_file(url: String, dir: String, file_name: String) -> Result<String, String> {
    use std::path::PathBuf;
    
    let dir_path = PathBuf::from(&dir);
    std::fs::create_dir_all(&dir_path)
        .map_err(|e| format!("创建目录失败: {}", e))?;
    
    let file_path = dir_path.join(&file_name);
    
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("下载失败: {}", e))?;
    
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取数据失败: {}", e))?;
    
    std::fs::write(&file_path, &bytes)
        .map_err(|e| format!("保存文件失败: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
/// 刷新桌面壁纸
fn refresh_wallpaper() -> Result<String, String> {
    let current = wallpaper::get().map_err(|e| format!("获取壁纸失败: {}", e))?;
    set_from_path(&current).map_err(|e| format!("刷新壁纸失败: {}", e))?;
    Ok("壁纸已刷新".to_string())
}

/// 创建系统托盘图标
fn create_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};

    // 创建托盘菜单项：显示窗口、退出
    let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().unwrap())
        .menu(&menu)
        .tooltip("摸鱼日常")
        // 阻止左键点击时显示菜单
        .show_menu_on_left_click(false)
        // 左键点击显示主窗口
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        // 处理菜单点击事件
        .on_menu_event(|app, event| {
            if event.id.as_ref() == "quit" {
                app.exit(0);
            } else if event.id.as_ref() == "show" {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// 应用入口函数
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_desktop_underlay::init())
        .manage(AppState::default())
        .setup(|app| {
            // 创建系统托盘
            create_tray(app)?;

            let window = app.get_webview_window("main").unwrap();

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

                // 注册老板键 Ctrl+~
                let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Backquote);

                let window_clone = window.clone();
                app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let _ = window_clone.hide();
                        log::info!("老板键触发，窗口已隐藏");
                    }
                })?;

                log::info!("老板键 Ctrl+~ 已注册");
            }

            // 窗口关闭时隐藏到托盘，而不是退出应用
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window_clone.hide();
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_api,
            hide_to_tray,
            show_window,
            get_desktop_path,
            get_storage_path,
            set_storage_path,
            choose_folder,
            scan_folder,
            read_novel_content,
            fetch_news,
            set_wallpaper,
            download_file,
            refresh_wallpaper,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

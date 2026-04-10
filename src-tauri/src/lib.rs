#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    Manager, WindowEvent,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use wallpaper::set_from_path;

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

    // 判断 Content-Type 处理 body
    let content_type = options.headers
        .as_ref()
        .and_then(|h| h.get("Content-Type").or_else(|| h.get("content-type")))
        .cloned();

    if let Some(body) = options.body {
        if let Some(ct) = &content_type {
            if ct.contains("application/json") {
                request = request.json(&body);
            } else if ct.contains("application/x-www-form-urlencoded") {
                // 支持字符串或 JSON 对象形式的 body
                let body_str = match &body {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Object(map) => {
                        map.iter()
                            .map(|(k, v)| format!("{}={}", k, v.as_str().unwrap_or("")))
                            .collect::<Vec<_>>()
                            .join("&")
                    }
                    _ => body.to_string()
                };
                request = request.body(body_str);
            } else {
                request = request.body(body.to_string());
            }
        } else {
            // 没有 Content-Type，判断 body 类型
            if let serde_json::Value::String(s) = &body {
                // 如果是字符串，直接发送
                request = request.body(s.clone());
            } else {
                request = request.json(&body);
            }
        }
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
/// 打开文件夹
async fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件夹失败: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件夹失败: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件夹失败: {}", e))?;
    }
    
    Ok(())
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

/// HTML 解析选项
#[derive(Deserialize)]
pub struct ParseHtmlOptions {
    html: String,
    selector: String,
    attr: Option<String>,
}

#[tauri::command]
/// 解析 HTML（使用 scraper 库）
fn parse_html(options: ParseHtmlOptions) -> Result<Vec<String>, String> {
    use scraper::{Html, Selector};
    
    let document = Html::parse_document(&options.html);
    let selector = Selector::parse(&options.selector)
        .map_err(|e| format!("选择器解析失败: {}", e))?;
    
    let mut results = Vec::new();
    
    for element in document.select(&selector) {
        let text = if let Some(attr) = &options.attr {
            if attr == "text" || attr == "textContent" {
                element.text().collect::<Vec<_>>().join("").trim().to_string()
            } else if attr == "html" || attr == "innerHTML" {
                element.html()
            } else {
                element.value().attr(attr).unwrap_or("").to_string()
            }
        } else {
            element.text().collect::<Vec<_>>().join("").trim().to_string()
        };
        
        results.push(text);
    }
    
    Ok(results)
}

fn parse_selector_with_index(selector: &str) -> (String, Option<i32>, Option<(i32, i32)>) {
    // 检查是否是范围索引，如 span.0:-1
    if let Some(pos) = selector.rfind(".-") {
        let after_dash = &selector[pos+2..];
        if after_dash.chars().all(|c| c.is_ascii_digit() || c == '-') {
            let before_part = &selector[..pos];
            // 再检查前半部分是否有 .
            if let Some(inner_pos) = before_part.rfind('.') {
                let inner_after_dot = &before_part[inner_pos+1..];
                if inner_after_dot.chars().all(|c| c.is_ascii_digit()) {
                    if let Ok(start_idx) = inner_after_dot.parse::<i32>() {
                        if let Ok(end_idx) = after_dash.parse::<i32>() {
                            let tag_part = &before_part[..inner_pos];
                            return (tag_part.to_string(), None, Some((start_idx, end_idx)));
                        }
                    }
                }
            }
        }
    }
    
    // 普通索引，如 dd.1 或 span.1
    if let Some(pos) = selector.rfind('.') {
        let after_dot = &selector[pos+1..];
        if after_dot.chars().all(|c| c.is_ascii_digit() || c == '-') {
            if let Ok(idx) = after_dot.parse::<i32>() {
                return (selector[..pos].to_string(), Some(idx), None);
            }
        }
    }
    (selector.to_string(), None, None)
}

#[tauri::command]
/// 从元素中提取文本或属性（使用 scraper 库）
fn extract_element(html: String, rule: String) -> Result<String, String> {
    eprintln!("[extract_element] rule: {}", rule);
    use scraper::{Html, Selector};
    
    let document = Html::parse_document(&html);
    
    // 解析 Legado 风格的规则: tag.class@attr
    // 例如: dd@a@text, dt@a@href, img@data-src, dd.0, span.0:-1@text
    
    let parts: Vec<&str> = rule.split('@').collect();
    
    if parts.is_empty() {
        return Err("无效的规则".to_string());
    }
    
    // 构建选择器
    let mut css_selector = parts[0].to_string();
    
    // 处理索引，例如 dd.1 表示第二个 dd，span.0:-1 表示第0个span里的-1索引
    let mut index = 0;
    let mut inner_index = 0;
    let mut has_inner_index = false;
    
    // 先检查是否有 :- 分隔的格式，如 span.0:-1
    if let Some(pos) = css_selector.rfind(":-") {
        if let Ok(idx) = css_selector[pos+2..].parse::<i32>() {
            inner_index = idx;
            has_inner_index = true;
            css_selector = css_selector[..pos].to_string();
        }
    }
    
    // 然后检查数字索引，如 dd.1 或 dd.0
    if let Some(pos) = css_selector.rfind('.') {
        let after_dot = &css_selector[pos+1..];
        // 检查是否是纯数字
        if after_dot.chars().all(|c| c.is_ascii_digit()) {
            if let Ok(idx) = after_dot.parse::<i32>() {
                index = idx;
                css_selector = css_selector[..pos].to_string();
            }
        }
    }
    
    let selector = Selector::parse(&css_selector)
        .map_err(|e| format!("选择器解析失败: {}", e))?;
    
    let elements: Vec<_> = document.select(&selector).collect();
    
    if elements.is_empty() {
        return Ok("".to_string());
    }
    
    // 如果有后续规则（如 dd@a@text），需要特殊处理
    // 需要找到包含目标子元素的父元素
    if parts.len() > 1 && parts[1] != "text" && !parts[1].starts_with("data-") && parts[1] != "href" && parts[1] != "src" && parts[1] != "html" && parts[1] != "all" {
        let target_rule = parts[1];
        
        // 解析目标规则，可能包含索引如 span.1 或范围如 span.0:-1
        let (target_tag, target_idx, target_range) = parse_selector_with_index(target_rule);
        
        // 遍历所有匹配的元素，找到第一个包含目标子元素的
        for el in &elements {
            // 获取所有匹配目标标签的子元素
            if let Ok(target_selector) = Selector::parse(&target_tag) {
                let target_elements: Vec<_> = el.select(&target_selector).collect();
                
                if !target_elements.is_empty() {
                    // 处理范围索引，如 span.0:-1 表示从第0个到倒数第1个的文本拼接
                    if let Some((start_idx, end_idx)) = target_range {
                        let mut results = Vec::new();
                        let len = target_elements.len() as i32;
                        let start = if start_idx < 0 { len + start_idx } else { start_idx };
                        let end = if end_idx < 0 { len + end_idx + 1 } else { end_idx + 1 };
                        
                        for i in start..end {
                            if i >= 0 && i < len {
                                let text = target_elements[i as usize].text().collect::<Vec<_>>().join("").trim().to_string();
                                results.push(text);
                            }
                        }
                        
                        if !results.is_empty() {
                            return Ok(results.join(""));
                        }
                    } else if let Some(idx) = target_idx {
                        // 处理单个索引
                        let idx = if idx < 0 {
                            if target_elements.len() as i32 + idx < 0 {
                                continue;
                            }
                            (target_elements.len() as i32 + idx) as usize
                        } else {
                            idx as usize
                        };
                        
                        if idx >= target_elements.len() {
                            continue;
                        }
                        
                        let target_el = &target_elements[idx];
                        
                        // 如果还有后续规则
                        if parts.len() > 2 {
                            return extract_from_element(target_el, &parts[2..]);
                        } else {
                            return Ok(target_el.text().collect::<Vec<_>>().join("").trim().to_string());
                        }
                    } else {
                        // 无索引，使用第一个
                        let target_el = &target_elements[0];
                        
                        // 如果还有后续规则
                        if parts.len() > 2 {
                            return extract_from_element(target_el, &parts[2..]);
                        } else {
                            return Ok(target_el.text().collect::<Vec<_>>().join("").trim().to_string());
                        }
                    }
                }
            }
        }
        
        // 如果没找到，返回空
        return Ok("".to_string());
    }
    
    // 处理索引
    let idx = if index < 0 {
        if elements.len() as i32 + index < 0 {
            return Ok("".to_string());
        }
        (elements.len() as i32 + index) as usize
    } else {
        index as usize
    };
    
    if idx >= elements.len() {
        return Ok("".to_string());
    }
    
    let mut current = elements[idx];
    
    // 如果有内部索引（如 span.0:-1），需要从 current 中再查找
    if has_inner_index {
        let inner_selector = Selector::parse(&css_selector)
            .map_err(|e| format!("内部选择器解析失败: {}", e))?;
        let inner_elements: Vec<_> = current.select(&inner_selector).collect();
        
        if !inner_elements.is_empty() {
            let inner_idx = if inner_index < 0 {
                if inner_elements.len() as i32 + inner_index < 0 {
                    return Ok("".to_string());
                }
                (inner_elements.len() as i32 + inner_index) as usize
            } else {
                inner_index as usize
            };
            
            if inner_idx < inner_elements.len() {
                current = inner_elements[inner_idx];
            }
        }
    }
    
    // 如果有后续规则
    if parts.len() > 1 {
        return extract_from_element(&current, &parts[1..]);
    }
    
    // 返回当前元素的文本
    Ok(current.text().collect::<Vec<_>>().join("").trim().to_string())
}

fn extract_from_element(element: &scraper::ElementRef, parts: &[&str]) -> Result<String, String> {
    use scraper::Selector;
    
    if parts.is_empty() {
        return Ok(element.text().collect::<Vec<_>>().join("").trim().to_string());
    }
    
    let part = parts[0];
    
    if part == "text" || part == "textNodes" {
        return Ok(element.text().collect::<Vec<_>>().join("").trim().to_string());
    }
    
    if part == "ownText" {
        let text = element.text().collect::<Vec<_>>().join("");
        let inner = element.inner_html();
        return Ok(text.replace(&inner, "").trim().to_string());
    }
    
    if part == "href" || part == "src" {
        return Ok(element.value().attr(part).unwrap_or("").to_string());
    }
    
    if part.starts_with("data-") {
        return Ok(element.value().attr(part).unwrap_or("").to_string());
    }
    
    if part == "html" || part == "all" {
        return Ok(element.inner_html());
    }
    
    // 处理子选择器
    if let Ok(child_selector) = Selector::parse(part) {
        if let Some(child) = element.select(&child_selector).next() {
            return extract_from_element(&child, &parts[1..]);
        }
    }
    
    // 没找到，返回当前元素的文本
    Ok(element.text().collect::<Vec<_>>().join("").trim().to_string())
}

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
        .tooltip("AiO")
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
        .plugin(tauri_plugin_notification::init())
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
                        if window_clone.is_visible().unwrap_or(false) {
                            let _ = window_clone.hide();
                            log::info!("老板键触发，窗口已隐藏");
                        } else {
                            let _ = window_clone.show();
                            let _ = window_clone.set_focus();
                            log::info!("老板键触发，窗口已显示");
                        }
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
            open_folder,
            scan_folder,
            read_novel_content,
            set_wallpaper,
            download_file,
            refresh_wallpaper,
            parse_html,
            extract_element,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

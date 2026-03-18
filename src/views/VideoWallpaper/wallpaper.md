Tauri 本身**不直接提供**将子窗口固定在桌面图标下方的原生 API，但可以通过组合系统级的窗口属性和系统 API 来实现这个效果。这个需求本质是让窗口成为「桌面层级窗口」（Desktop Window），在 Windows 系统中这个效果最典型，macOS/Linux 也有对应的实现方式。

### 实现思路（以 Windows 为例）
核心逻辑是：
1. 将窗口设置为「桌面层级」（低于图标层、高于壁纸层）
2. 禁用窗口的常规交互（如置顶、焦点）
3. 绑定窗口到桌面进程（防止被其他窗口遮挡）

### 完整实现代码
以下是 Tauri + Rust 后端的完整实现示例（适配 Windows）：

#### 1. 前端调用（Vue/React/原生 HTML）
```javascript
// src/main.js 或任意前端组件中
import { invoke } from '@tauri-apps/api/tauri';

// 创建桌面层级子窗口
async function createDesktopSubWindow() {
  try {
    // 调用 Rust 后端创建子窗口
    await invoke('create_desktop_sub_window', {
      width: 400,
      height: 300,
      x: 100,
      y: 100,
      title: "桌面底层子窗口"
    });
  } catch (e) {
    console.error("创建桌面窗口失败:", e);
  }
}

// 页面加载后调用
window.addEventListener('DOMContentLoaded', () => {
  createDesktopSubWindow();
});
```

#### 2. Rust 后端实现（src-tauri/src/main.rs）
```rust
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{
  window::WindowBuilder,
  Manager, Window, PhysicalSize, PhysicalPosition,
  Runtime, WindowUrl
};
use windows::Win32::{
  UI::WindowsAndMessaging::{
    SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
    SetParent, FindWindowW, HWND,
  },
  Foundation::HWND_DESKTOP,
};
use std::ptr::null_mut;

// 核心：设置窗口为桌面层级
#[tauri::command]
fn set_desktop_layer_window(window: Window) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    // 获取窗口的原生 HWND 句柄
    let hwnd = window.hwnd().ok_or("获取窗口句柄失败")? as HWND;
    
    // 1. 设置窗口扩展样式：无激活、工具窗口（不显示在任务栏）
    let ex_style = unsafe {
      SetWindowLongPtrW(
        hwnd,
        GWL_EXSTYLE,
        (WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW) as isize
      )
    };
    if ex_style == -1 {
      return Err("设置窗口样式失败".into());
    }

    // 2. 找到桌面窗口（Program Manager）并将当前窗口设为其子窗口
    let progman = unsafe { FindWindowW("Progman\0".into(), "Program Manager\0".into()) };
    if progman.is_null() {
      // 降级方案：直接绑定到桌面根窗口
      unsafe { SetParent(hwnd, HWND_DESKTOP) };
    } else {
      unsafe { SetParent(hwnd, progman) };
    }

    Ok(())
  }
  
  // 非 Windows 系统提示
  #[cfg(not(target_os = "windows"))]
  {
    Err("仅 Windows 支持桌面层级窗口".into())
  }
}

// 创建子窗口并应用桌面层级
#[tauri::command]
fn create_desktop_sub_window(width: u32, height: u32, x: i32, y: i32, title: &str) -> Result<(), String> {
  let app = tauri::AppHandle::default();
  
  // 1. 创建子窗口
  let sub_window = WindowBuilder::new(
    &app,
    "desktop-sub-window", // 窗口唯一标识
    WindowUrl::Internal("index.html".into()) // 子窗口加载的页面
  )
  .title(title)
  .inner_size(PhysicalSize::new(width, height))
  .position(PhysicalPosition::new(x, y))
  .decorations(false) // 禁用窗口边框
  .always_on_bottom(true) // 始终在底部
  .visible(true)
  .build()
  .map_err(|e| format!("创建窗口失败: {}", e))?;

  // 2. 将窗口设置为桌面层级
  set_desktop_layer_window(sub_window)?;

  Ok(())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      create_desktop_sub_window,
      set_desktop_layer_window
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

#### 3. Cargo.toml 依赖（src-tauri/Cargo.toml）
需要添加 Windows API 相关依赖：
```toml
[dependencies]
tauri = { version = "1.5", features = ["api-all"] }
windows = { version = "0.52", features = [
  "Win32_UI_WindowsAndMessaging",
  "Win32_Foundation"
] }
```

### 关键细节说明
1. **窗口层级核心**：
   - `WS_EX_NOACTIVATE`：窗口不会获得焦点，避免干扰用户操作
   - `WS_EX_TOOLWINDOW`：窗口不显示在任务栏，更符合桌面层级特性
   - `SetParent`：将窗口绑定到桌面进程（Progman），使其成为桌面的子窗口

2. **跨平台说明**：
   - **Windows**：上述代码可直接运行，效果是窗口在桌面图标下方、壁纸上方
   - **macOS**：需使用 `NSWindow` 的 `level` 属性设置为 `NSDesktopWindowLevel - 1`
   - **Linux**：需通过 X11 设置窗口属性 `_NET_WM_WINDOW_TYPE_DESKTOP`

3. **注意事项**：
   - 需以管理员权限运行应用（否则可能无法绑定到桌面进程）
   - 禁用窗口装饰（`decorations(false)`）避免原生窗口边框干扰
   - 窗口无法被置顶，始终在桌面图标下方

### 总结
1. Tauri 本身无原生 API 实现该效果，但可通过**系统级窗口 API**（如 Windows 的 `SetParent`/`SetWindowLongPtrW`）实现；
2. 核心是将窗口绑定到桌面进程（Progman）并设置为「无激活、工具窗口」样式；
3. 该效果主要适配 Windows 系统，macOS/Linux 需调整对应的系统 API 实现。
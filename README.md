# Demo Tauri 应用

基于 Tauri + Vue 3 + TypeScript 的桌面应用程序。

- [创建项目](https://tauri.app/zh-cn/start/create-project/)


## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3.5 + TypeScript 5.6 |
| 构建工具 | Vite 6 |
| 桌面框架 | Tauri 2 |
| 路由 | Vue Router 5 |
| 包管理 | pnpm |

## 项目结构

```
├── src/                      # 前端源码
│   ├── router/               # 路由配置
│   │   └── index.js
│   ├── views/                # 页面组件
│   │   └── Home.vue
│   ├── assets/               # 静态资源
│   ├── App.vue               # 根组件
│   ├── main.js               # 入口文件
│
├── src-tauri/                # Rust 后端
│   ├── src/
│   │   ├── lib.rs            # 托盘/命令逻辑
│   │   └── main.rs           # Rust 入口
│   ├── capabilities/          # 权限配置
│   ├── icons/                # 应用图标
│   ├── Cargo.toml            # Rust 依赖
│   └── tauri.conf.json       # Tauri 配置
│
├── public/                   # 公共资源
├── index.html                # HTML 入口
├── vite.config.js            # Vite 配置
├── tsconfig.json             # TypeScript 配置
└── package.json               # Node 依赖
```

## 环境要求

- **Node.js**: 18.x 或更高版本
- **Rust**: 1.70 或更高版本
- **pnpm**: 8.x 或更高版本

## 安装依赖

```bash
pnpm install
```

## 开发运行

```bash
# 启动开发服务器
pnpm tauri dev
```

## 构建发布

```bash
# 构建生产版本
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/` 目录。

## 功能特性

- 系统托盘（右键菜单：显示窗口、退出）
- 窗口管理（最小化、最大化、关闭）
- 页面路由

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动前端开发服务器 |
| `pnpm tauri dev` | 启动 Tauri 开发模式 |
| `pnpm build` | 构建前端资源 |
| `pnpm tauri build` | 构建桌面应用 |
| `pnpm tauri build --debug` | Debug 模式构建 |

<div align="center">
  <img src="src\assets\logo.svg" alt="DelinBox Logo" width="110" height="110">

  # DelinBox

  **德邻盒子 - 智能文档扫描与OCR识别工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)

  基于OpenCV的智能文档扫描工具，支持OCR文字识别、证件扫描等功能

  [快速开始](#installation) • [使用文档](#usage) • [参与贡献](#contributing)

</div>

## 📑 项目简介

DelinBox(德邻盒子)是一款现代化的桌面应用程序，致力于提供高质量的文档数字化解决方案。主要特点：

- 📷 智能边缘检测与透视校正
- ⚡ 实时预览与快速处理
- 🔒 本地处理，保护隐私
- 🎨 支持暗/亮主题的现代化界面
- 📱 跨平台支持

### 技术栈

- **前端**: Vue 3 + TypeScript + Vuetify 3 + Vite
- **后端**: Tauri 2 + Rust
- **视觉处理**: OpenCV.js + Canvas API
- **其他**: @vueuse/core, vue-router, @zebra-ui/swiper

## Installation

## 🚀 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) 最新稳定版
- [Git](https://git-scm.com/)

### 开发设置

1. 克隆仓库
   ```bash
   git clone https://github.com/xcenweb/delin.git
   cd delin
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm run tauri dev
   ```

开发服务器启动后，应用会自动打开。支持前端和后端的热重载。

### 构建生产版本

```bash
# 构建当前平台的应用
npm run tauri build

# 使用特定功能构建
npm run tauri build -- --features "custom-protocol"
```

构建输出目录:
- Windows: `src-tauri/target/release/bundle/msi/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/deb/` 或 `appimage/`

## 🤝 Contributing

We welcome contributions to DelinBox! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

## 🤝 参与贡献

1. Fork 并克隆项目
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交改动: `git commit -m "feat: add amazing feature"`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码规范

- 前端遵循 Vue 3 Composition API 规范
- 后端遵循 Rust 最佳实践
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/) 规范
- 重要改动需更新文档

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & FAQ

## ❓ 常见问题

<details>
<summary>相机无法使用？</summary>

请确保已授予应用相机权限。Windows用户请检查"设置 > 隐私与安全性 > 相机"。
</details>

<details>
<summary>支持批量处理文档吗？</summary>

支持！使用"连拍模式"可以在一次会话中拍摄多份文档。
</details>

<details>
<summary>处理后的图片保存在哪里？</summary>

默认保存在"文档"目录下的时间戳文件夹中，可在设置中修改。
</details>

### 系统要求

- **Windows**: Windows 10 (1903+), 4GB RAM
- **macOS**: macOS 10.15+, 4GB RAM
- **Linux**: Ubuntu 18.04+, 4GB RAM

---

<div align="center">

  **DelinBox** - 让文档扫描更简单高效 📄✨

  [⭐ Star](https://github.com/xcenweb/delin)

</div>
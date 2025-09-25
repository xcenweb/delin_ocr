<div align="center">
  <img src="src\assets\logo.svg" alt="DelinBox Logo" width="110" height="110">

  # DelinBox

  **德邻盒子 - 智能文档扫描与OCR识别工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)

  An intelligent document scanning tool based on OpenCV, supporting OCR text recognition, document scanning and other functions

</div>

## 📑 Introduction

DelinBox is a modern cross-platform application dedicated to providing high-quality document digitization solutions. Its main features are:

- 📷 Intelligent edge detection and perspective correction
- ⚡ Real-time preview and quick processing
- 🔒 Local processing, protecting privacy
- 🎨 A modern interface supporting dark/light themes
- 📱 Cross-platform support

### Technology

- **Frontend**: `Vue 3` + `TypeScript` + `Vuetify 3` + `Vite`
- **Backend**: `Tauri 2` + `Rust`
- **Visual processing**: `OpenCV.js` + `Canvas API`
- **Other**: `@vueuse/core`, `vue-router`, `@zebra-ui/swiper`

### Environmental

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) nightly channel

### Development

1. Clone the repository
   ```bash
   git clone https://github.com/xcenweb/delin.git
   cd delin
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run tauri dev
   ```

After the development server starts, the application will open automatically. It supports hot reloading for both the frontend and backend.

## 🤝 Contributing

We welcome contributions to DelinBox! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & FAQ

<details>
<summary>The camera is not working?</summary>

Please ensure that camera permissions have been granted to the app. Windows users, please check "Settings > Privacy & Security > Camera".
</details>

<details>
<summary>Does it support batch processing of documents?</summary>

Support! Using the "continuous shooting mode" allows you to take photos of multiple documents in one session.
</details>

<details>
<summary>Where is the processed image saved?</summary>

It is saved by default in the timestamp folder under the "Documents" directory, and can be modified in the settings.
</details>

### System Support

- **Windows**: Windows 10 (1903+), 4GB RAM
- **macOS**: macOS 10.15+, 4GB RAM
- **Linux**: Ubuntu 18.04+, 4GB RAM

---

<div align="center">

  **DelinBox** - Make document scanning simpler and more efficient 📄✨

</div>
<div align="center">
  <img src="src\assets\logo.svg" alt="DelinBox Logo" width="110" height="110">

  # DelinBox

  **德邻盒子 - 智能文档扫描与OCR识别工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/) [![Rust](https://img.shields.io/badge/Rust-Latest-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)

  *A powerful OpenCV-based OCR client for document and ID card scanning*

  [🚀 Quick Start](#installation) • [📖 Documentation](#usage) • [🤝 Contributing](#contributing) • [💬 Support](#support)

</div>

## 🌟 Overview

DelinBox (德邻盒子) is a cutting-edge desktop application that revolutionizes document digitization through advanced OCR technology. Combining the power of OpenCV computer vision with modern web technologies, it delivers professional-grade document scanning capabilities in an intuitive, user-friendly interface.

### ✨ Why Choose DelinBox?

- 🎯 **AI-Powered Precision**: Advanced edge detection and perspective correction
- ⚡ **Lightning Fast**: Real-time processing with instant preview
- 🔒 **Privacy First**: All processing happens locally on your device
- 🎨 **Beautiful Interface**: Modern Material Design with dark/light themes
- 📱 **Cross-Platform**: Built with Tauri for native performance on all platforms

## Features

### 📷 Smart Camera Capture
- **Single & Multiple Photo Modes**: Capture one or multiple documents in a single session
- **AI-Powered Edge Detection**: Automatic document boundary detection using OpenCV
- **Real-time Preview**: Live camera feed with instant document detection

### ✂️ Advanced Image Processing
- **Perspective Correction**: Automatically straighten skewed documents
- **Manual Corner Adjustment**: Fine-tune document boundaries with drag-and-drop corners
- **Filter System**: Apply various filters to enhance document readability
- **Crop & Rotate**: Precise image editing tools

### 💾 File Management
- **Batch Export**: Save all processed images at once
- **Organized Storage**: Automatic folder creation with timestamp naming
- **Multiple Formats**: Support for various image formats
- **Local Storage**: Secure local file management

### 🎨 Modern UI/UX
- **Material Design**: Clean and intuitive Vuetify-based interface
- **Responsive Layout**: Optimized for different screen sizes
- **Touch-Friendly**: Support for touch interactions
- **Dark/Light Themes**: Customizable appearance

## Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vuetify 3** - Material Design component library
- **Vite** - Fast build tool and development server

### Backend & Desktop
- **Tauri 2** - Rust-based desktop application framework
- **Rust** - System-level programming for performance

### Computer Vision
- **OpenCV.js** - JavaScript port of OpenCV for image processing
- **Canvas API** - Real-time image manipulation

### Additional Libraries
- **@vueuse/core** - Vue composition utilities
- **vue-router** - Client-side routing
- **@zebra-ui/swiper** - Touch slider component

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|----------|
| [Node.js](https://nodejs.org/) | v18+ | JavaScript runtime for frontend development |
| [Rust](https://rustup.rs/) | Latest stable | Backend development and Tauri compilation |
| [Git](https://git-scm.com/) | Latest | Version control |

> **💡 Tip**: Use `node --version` and `rustc --version` to check your current versions.

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/delin.git
   cd delin
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   # or using yarn
   yarn install
   # or using pnpm
   pnpm install
   ```

3. **Install Tauri CLI (if not already installed)**
   ```bash
   npm install -g @tauri-apps/cli
   # or using cargo
   cargo install tauri-cli
   ```

4. **Start development server**
   ```bash
   npm run tauri dev
   # This will start both the frontend dev server and Tauri app
   ```

   The application will automatically open, and hot-reload is enabled for both frontend and backend changes.

### Building for Production

```bash
# Build the application for your current platform
npm run tauri build

# Build with specific features
npm run tauri build -- --features "custom-protocol"

# Build for specific target (cross-compilation)
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**Build Outputs:**
- **Windows**: `src-tauri/target/release/bundle/msi/` (MSI installer)
- **macOS**: `src-tauri/target/release/bundle/dmg/` (DMG package)
- **Linux**: `src-tauri/target/release/bundle/deb/` (DEB package) or `src-tauri/target/release/bundle/appimage/` (AppImage)

> **📦 Distribution**: The built executables are ready for distribution and don't require additional dependencies.

## Usage

### Basic Workflow

1. **Launch the Application**
   - Open DelinBox from your desktop
   - Grant camera permissions when prompted

2. **Capture Documents**
   - Choose between single or multiple photo modes
   - Position your document within the camera frame
   - The app will automatically detect document edges
   - Tap the capture button to take a photo

3. **Edit and Process**
   - Review captured images in the editor
   - Adjust corners for perfect perspective correction
   - Apply filters to enhance readability
   - Use crop and rotate tools as needed

4. **Save Results**
   - Click "Save All" to export processed images
   - Files are automatically organized in timestamped folders
   - Access saved files from the file management section

### Advanced Features

- **Manual Corner Adjustment**: Drag corner points to fine-tune document boundaries
- **Filter Presets**: Choose from various filters optimized for different document types
- **Batch Processing**: Process multiple documents efficiently
- **Quality Enhancement**: Automatic image optimization for better OCR results

## 📁 Project Structure

```
delin/
├── 📁 src/                     # Vue.js Frontend
│   ├── 📁 components/          # Reusable Vue components
│   │   ├── fileList.vue        # File management component
│   │   └── leavePopup.vue      # Exit confirmation dialog
│   ├── 📁 views/              # Page components
│   │   ├── 📁 ocr/            # OCR-related views
│   │   │   ├── camera.vue      # Camera capture interface
│   │   │   ├── editor.vue      # Image editing interface
│   │   │   └── 📁 ts/          # TypeScript utilities
│   │   ├── main.vue           # Main application view
│   │   ├── about.vue          # About page
│   │   └── setting.vue        # Settings page
│   ├── 📁 utils/              # Utility functions
│   │   ├── fileSystem.ts      # File operations
│   │   └── thumbnail.ts       # Image thumbnail generation
│   ├── 📁 assets/             # Static assets
│   │   └── 📁 css/            # Stylesheets
│   ├── 📁 plugins/            # Vue plugins
│   │   └── vuetify.ts         # Vuetify configuration
│   ├── 📁 router/             # Vue Router configuration
│   └── main.ts                # Application entry point
├── 📁 src-tauri/              # Tauri Backend (Rust)
│   ├── 📁 src/                # Rust source code
│   │   ├── main.rs            # Main application logic
│   │   └── lib.rs             # Library functions
│   ├── 📁 icons/              # Application icons
│   ├── 📁 capabilities/       # Tauri capabilities
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── 📁 public/                 # Public assets
│   ├── 📁 images/             # Static images
│   └── logo.svg               # Application logo
├── 📁 .github/                # GitHub workflows
│   └── 📁 workflows/          # CI/CD pipelines
├── package.json               # Node.js dependencies
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🤝 Contributing

We welcome contributions to DelinBox! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/delin.git
   cd delin
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or for bug fixes
   git checkout -b fix/bug-description
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm run test
   npm run tauri dev  # Test in development
   npm run tauri build  # Test production build
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of your changes
   - Link any related issues
   - Ensure all checks pass

### Code Style Guidelines

- **Frontend**: Follow Vue 3 Composition API patterns
- **Backend**: Follow Rust best practices and use `cargo fmt`
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org/) format
- **Documentation**: Update README and inline comments for significant changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & FAQ

### Getting Help

- 🐛 **Bug Reports**: [Open an issue](https://github.com/your-username/delin/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Request a feature](https://github.com/your-username/delin/issues/new?template=feature_request.md)
- 💬 **Discussions**: [Join our discussions](https://github.com/your-username/delin/discussions)
- 📧 **Email**: support@delinbox.com

### Frequently Asked Questions

<details>
<summary><strong>Q: Why isn't my camera working?</strong></summary>

Make sure you've granted camera permissions to the application. On Windows, check your privacy settings under Settings > Privacy & Security > Camera.
</details>

<details>
<summary><strong>Q: Can I process multiple documents at once?</strong></summary>

Yes! DelinBox supports batch processing. Use the "Multiple Photo Mode" to capture several documents in one session.
</details>

<details>
<summary><strong>Q: Where are my processed images saved?</strong></summary>

By default, images are saved in timestamped folders in your Documents directory. You can change this in Settings.
</details>

<details>
<summary><strong>Q: Is my data secure?</strong></summary>

Absolutely! All processing happens locally on your device. No images or data are sent to external servers.
</details>

### System Requirements

| Platform | Minimum Requirements |
|----------|---------------------|
| **Windows** | Windows 10 (1903+), 4GB RAM, DirectX 11 |
| **macOS** | macOS 10.15+, 4GB RAM, Metal support |
| **Linux** | Ubuntu 18.04+, 4GB RAM, OpenGL 3.3+ |

---

<div align="center">

  **DelinBox** - Making document scanning simple and efficient 📄✨

  Made with ❤️ by the DelinBox Team

  [⭐ Star us on GitHub](https://github.com/your-username/delin) • [🐦 Follow on Twitter](https://twitter.com/delinbox) • [📧 Contact Us](mailto:support@delinbox.com)

</div>
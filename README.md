# DelinBox (德邻盒子)

> A powerful OpenCV-based OCR client for document and ID card scanning

## Overview

DelinBox is a desktop application designed for efficient document and ID card OCR (Optical Character Recognition) processing. Built with modern web technologies and powered by OpenCV, it provides a user-friendly interface for capturing, editing, and processing various types of documents.

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
- Node.js (v16 or higher)
- Rust (latest stable version)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd delin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri dev
   ```

### Building for Production

```bash
# Build the application
npm run tauri build
```

The built application will be available in the `src-tauri/target/release/bundle/` directory.

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

## Project Structure

```
delin/
├── src/                    # Vue.js frontend source
│   ├── components/         # Reusable Vue components
│   ├── views/             # Page components
│   │   └── ocr/           # OCR-related views
│   ├── utils/             # Utility functions
│   └── assets/            # Static assets
├── src-tauri/             # Tauri backend source
│   ├── src/               # Rust source code
│   └── icons/             # Application icons
└── public/                # Public assets
```

## Contributing

We welcome contributions to DelinBox! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, bug reports, or feature requests, please open an issue on the GitHub repository.

---

**DelinBox** - Making document scanning simple and efficient. 📄✨
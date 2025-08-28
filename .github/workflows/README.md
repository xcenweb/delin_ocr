# GitHub Actions 工作流说明

## Android 构建工作流 (android-build.yml)

这个工作流用于构建德邻盒子的 Android APK 并自动发布 Release。

### 使用方法

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 **Build Android APK** 工作流
3. 点击 **Run workflow** 按钮
4. 输入版本号（例如：v1.0.0）
5. 点击 **Run workflow** 开始构建

### 构建过程

工作流会自动执行以下步骤：

1. **环境准备**
   - 设置 Node.js 20
   - 设置 Rust 工具链
   - 设置 Java JDK 17
   - 设置 Android SDK (API 34)

2. **项目构建**
   - 安装 npm 依赖
   - 初始化 Android 项目
   - 构建 APK 文件

## 构建环境

- **Node.js**: v20
- **Rust**: 稳定版，包含 Android 目标
- **Java JDK**: Temurin 17
- **Android SDK**: API 34
- **Build Tools**: 最新版本（自动检测）
- **NDK**: 最新版本（自动检测）
- **CMake**: 最新版本（自动检测）

3. **发布 Release**
   - 创建新的 GitHub Release
   - 上传 APK 文件到 Release
   - 提供下载链接

### 输出文件

- **APK 文件名格式**: `delin-{版本号}-android.apk`
- **支持架构**: ARM64, ARMv7, x86, x86_64
- **最低 Android 版本**: Android 7.0 (API 24)

### 注意事项

- 构建时间约 10-15 分钟
- 需要确保仓库有足够的 GitHub Actions 配额
- APK 文件会自动上传到对应版本的 Release 中
- 可以直接从 Release 页面下载 APK 安装到 Android 设备

### 故障排除

如果构建失败，请检查：

1. **依赖问题**: 确保 `package.json` 和 `Cargo.toml` 中的依赖版本正确
2. **权限问题**: 确保仓库启用了 Actions 并有写入权限
3. **版本冲突**: 确保输入的版本号没有与现有 Release 冲突

### 手动触发

这个工作流只能手动触发，不会在代码推送时自动运行。这样可以更好地控制发布时机。
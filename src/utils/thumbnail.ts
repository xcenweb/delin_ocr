// 缩略图生成相关

import { convertFileSrc } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'

/**
 * 根据文件路径生成可在浏览器中显示的图片URL
 * @param filePath 相对于AppData目录的文件路径
 * @returns 转换后的图片URL
 */
export const getThumbnailUrl = async (imageObject: { path: string, name: string }): Promise<string> => {
    try {
        // 构建完整的文件路径
        const fullPath = await join(await appDataDir(), imageObject.path)

        // 使用convertFileSrc将文件路径转换为可在浏览器中使用的URL
        const assetUrl = convertFileSrc(fullPath)

        return assetUrl
    } catch (error) {
        console.error('获取缩略图失败:', error)
        return ''
    }
}
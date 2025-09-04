// 缩略图生成读取相关
import { convertFileSrc } from '@tauri-apps/api/core'

/**
 * 根据文件路径生成可在浏览器中显示的图片URL
 * @param filePath 相对于AppData目录的文件路径
 * @returns 转换后的图片URL
 */
export const getThumbnailUrl = async (path: string) => {
    try {
        const assetUrl = convertFileSrc(path)
        return assetUrl
    } catch (error) {
        console.error('获取缩略图失败:', error)
        return ''
    }
}

// TODO: 各类文件缩略图生成
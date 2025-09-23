// 文件缩略图服务
import { convertFileSrc } from '@tauri-apps/api/core'

/**
 * 缩略图存储路径
 */
const thumbCachePath = 'user/thumbnailCache'

/**
 * 根据文件路径生成缩略图文件名
 * 使用文件路径的哈希值作为文件名，确保唯一性且可重复生成相同文件名
 * @param filePath 文件路径
 * @returns 缩略图文件名（哈希值）
 */
export const generateThumbnailName = (filePath: string): string => {
    let hash = 0
    for (let i = 0; i < filePath.length; i++) {
        const char = filePath.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return Math.abs(hash).toString(36) + '.jpg'
}

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
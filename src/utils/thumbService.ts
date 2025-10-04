// 文件缩略图服务
import { convertFileSrc } from '@tauri-apps/api/core'

/**
 * 缩略图存储路径
 */
const thumbCachePath = 'user/thumbCache'

/**
 * 根据文件路径生成缩略图文件名
 * @param path 文件路径
 * @returns 缩略图文件名
 */
export const generateThumbCacheName = (path: string): string => {
    let hash = 0
    for (let i = 0; i < path.length; i++) {
        const char = path.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return Math.abs(hash).toString(36)
}

/**
 * 根据文件路径生成可在浏览器中显示的图片URL
 * @param filePath 相对于AppData目录的文件路径
 * @returns 转换后的图片URL
 */
export const getThumbUrl = async (path: string) => {
    try {
        const assetUrl = convertFileSrc(path)
        return assetUrl
    } catch (error) {
        console.error('获取缩略图失败:', error)
        return ''
    }
}
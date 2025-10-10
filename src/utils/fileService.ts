// 文件服务
// TODO: 重构
import router from '@/router'
import { getThumbUrl } from './thumbService'
import { useSnackbar } from '@/components/global/snackbarService'

import { ref, computed } from 'vue'
import { useDateFormat } from '@vueuse/core'
import { readDir, BaseDirectory, stat, writeFile, mkdir, exists, remove } from '@tauri-apps/plugin-fs'
import { join, appDataDir } from '@tauri-apps/api/path'
import { fileCacheDB } from './dbService'

/**
 * 基础文件信息接口
 */
export interface BaseFileInfo {
    /** 文件/文件夹名 */
    name: string
    /** 相对路径 */
    relative_path: string
    /** 完整路径 */
    full_path: string
    /** 上次访问时间 */
    atime: string
    /** 上次修改时间 */
    mtime: string
    /** 创建时间 */
    birthtime: string
    /** 大小（字节） */
    size?: number
}

/**
 * 目录对象接口
 */
export interface DirectoryObject extends BaseFileInfo {
    /** 文件夹 */
    type: 'dir'
    /** 子目录数量 */
    count: number
}

/**
 * 文件对象接口
 */
export interface FileObject extends BaseFileInfo {
    /** 文件类型 */
    type: 'file'
    /** 文件缩略图 */
    thumbnail?: string
    /** 文件的标签 */
    tags?: string[]
}

/** 文件系统对象联合类型 */
type FileSystemObject = DirectoryObject | FileObject

/** 日期格式化模板 */
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

/** 原始文件列表数据 */
export const currentPath_fso = ref<FileSystemObject[]>([])

/**
 * 获取软件内用于存储实际的证件文件的完整路径
 */
export const getFullPath = async (relative_path: string) => {
    return await join(await appDataDir(), relative_path)
}

/**
 * 根据文件后缀名判断文件类型
 * @param name 文件名
 * @returns 文件类型
 */
export const getFileType = (name: string) => {
    const typeMap = {
        img: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
        pdf: ['.pdf']
    };
    const ext = name.toLowerCase().slice(name.lastIndexOf('.'))
    return Object.entries(typeMap).find(([_, exts]) => exts.includes(ext))?.[0] || 'file'
};

/**
 * 将字节数转换为可读的文件大小格式
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 对文件/文件夹列表进行排序
 */
export const sortedFiles = computed(() => {
    const files = [...currentPath_fso.value]

    // 分离文件夹和文件
    const dirs = files.filter(item => item.type === 'dir')
    const nonDirs = files.filter(item => item.type !== 'dir')

    // 只按字母顺序排序（A-Za-z）
    const sortFn = (a: FileSystemObject, b: FileSystemObject) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })

    return [...dirs.sort(sortFn), ...nonDirs.sort(sortFn)]
})

/**
 * 异步加载指定目录中的文件和文件夹信息
 * @param path 要加载的目录路径
 * @returns Promise<void>
 */
export const loadDirectory = async (path: string) => {
    try {
        const entries = await readDir(path, { baseDir: BaseDirectory.AppData })
        const result: FileSystemObject[] = []

        for (const entry of entries) {
            try {
                const relativePath = await join(path, entry.name)
                const fullPath = await join(await appDataDir(), relativePath)
                const fileStat = await stat(fullPath)

                // 基础信息对象
                const baseInfo: BaseFileInfo = {
                    name: entry.name,
                    relative_path: relativePath,
                    full_path: fullPath,
                    atime: useDateFormat(new Date(fileStat.atime || ''), DATE_FORMAT).value,
                    mtime: useDateFormat(new Date(fileStat.mtime || ''), DATE_FORMAT).value,
                    birthtime: useDateFormat(new Date(fileStat.birthtime || ''), DATE_FORMAT).value,
                    size: fileStat.size || 0
                }

                let fileObj: FileSystemObject

                if (entry.isDirectory) {
                    // 目录
                    let count
                    try {
                        const subEntries = await readDir(fullPath)
                        count = subEntries.length
                    } catch {
                        count = 0
                    }
                    fileObj = { ...baseInfo, type: 'dir', count } as DirectoryObject
                } else {
                    // 文件
                    fileObj = {
                        ...baseInfo,
                        type: 'file',
                        thumbnail: await getThumbUrl(fullPath)
                    } as FileObject
                }

                result.push(fileObj)
            } catch (error) {
                console.warn(`无法获取文件信息: ${entry.name}`, error)
            }
        }

        currentPath_fso.value = result
    } catch (error) {
        console.error('读取目录失败:', error)
    }
}

/**
 * 获取指定路径下的所有文件列表
 * @param path - 要获取的文件列表的目录路径
 */
export const getAllFiles = async (path: string) => {
    const result: FileObject[] = []

    async function traverseDirectory(currentPath: string) {
        try {
            const entries = await readDir(currentPath, { baseDir: BaseDirectory.AppData })

            for (const entry of entries) {
                if (entry.isDirectory) {
                    await traverseDirectory(await join(currentPath, entry.name))
                }
                if (entry.isFile) {
                    const relativePath = await join(currentPath, entry.name)
                    const fullPath = await getFullPath(relativePath)
                    const fileStat = await stat(fullPath)
                    result.push({
                        name: entry.name,
                        relative_path: relativePath,
                        full_path: fullPath,
                        type: 'file',
                        thumbnail: await getThumbUrl(fullPath),
                        atime: useDateFormat(new Date(fileStat.atime || ''), DATE_FORMAT).value,
                        mtime: useDateFormat(new Date(fileStat.mtime || ''), DATE_FORMAT).value,
                        birthtime: useDateFormat(new Date(fileStat.birthtime || ''), DATE_FORMAT).value,
                        size: fileStat.size || 0,
                        tags: (await fileCacheDB.getFileInfo(relativePath))?.tags?.split(',').filter(Boolean) ?? []
                    })
                }
            }
        } catch (error) {
            console.error('获取文件列表失败:', error)
        }
    }

    await traverseDirectory(path)
    return result
}

/**
 * 将 Blob URL 保存到本地文件系统
 * @param blobUrl
 * @param fileName - 文件名
 * @param targetPath - 目标路径
 * @param baseDir - 基础目录
 * @returns 成功时返回保存的完整路径，失败时返回 false
 */
export const saveBlobUrlToFile = async (blobUrl: string, fileName: string, targetPath: string = '', baseDir: BaseDirectory) => {
    try {
        // 从 Blob URL 获取数据
        const response = await fetch(blobUrl)
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // 目录不存在则创建
        if (!await exists(targetPath, { baseDir }) as boolean) {
            await mkdir(targetPath, { baseDir, recursive: true })
            console.log(`目录已创建: ${targetPath}`)
        }

        // 生成唯一文件路径
        const fullPath = await generateUniqueFilePath(fileName, targetPath, baseDir)
        await writeFile(fullPath, uint8Array, { baseDir }) // 写入文件

        console.log(`文件已成功保存到: ${fullPath} (大小: ${formatFileSize(arrayBuffer.byteLength)})`)
        return fullPath
    } catch (error) {
        console.error('保存文件失败:', error)
        return false
    }
}

/**
 * 生成唯一的文件路径，处理重复文件名
 * @param fileName - 原始文件名
 * @param targetPath - 目标路径
 * @param baseDir - 基础目录
 * @returns 唯一的文件路径
 */
export const generateUniqueFilePath = async (fileName: string, targetPath: string, baseDir: BaseDirectory): Promise<string> => {
    const basePath = targetPath ? `${targetPath}/${fileName}` : fileName
    let fullPath = basePath
    let counter = 1

    // 检查文件是否存在，如果存在则生成新的文件名
    while (await exists(fullPath, { baseDir }) as boolean) {
        const lastDotIndex = fileName.lastIndexOf('.')
        if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
            // 有扩展名的文件
            const nameWithoutExt = fileName.substring(0, lastDotIndex)
            const ext = fileName.substring(lastDotIndex)
            const newFileName = `${nameWithoutExt}(${counter})${ext}`
            fullPath = targetPath ? `${targetPath}/${newFileName}` : newFileName
        } else {
            // 无扩展名的文件
            const newFileName = `${fileName}(${counter})`
            fullPath = targetPath ? `${targetPath}/${newFileName}` : newFileName
        }
        counter++

        // 防止无限循环
        if (counter > 999) {
            throw new Error('generateUniqueFilePathError')
        }
    }

    return fullPath
}

/**
 * 删除文件/文件夹
 */
export const deleteFile = async (path: string) => {
    try {
        await remove(path, { recursive: true })
    } catch (error) {
        console.error('删除文件/文件夹失败:', error)
    }
}

/**
 * 打开文件
 * @param path 文件路径
 */
export const openFile = async (relative_path: string) => {
    const fullPath = await getFullPath(relative_path)
    const fileType = getFileType(fullPath)
    if (fileType === 'img') {
        fileCacheDB.updateAtime(relative_path)
        router.push({ name: 'image-viewer', query: { path: fullPath } })
    } else {
        useSnackbar().info('暂不支持的文件类型')
    }
}

/**
 * 获取最近访问的文件路径
 * @param limit 限制数量
 */
export const getRecentFiles = async (limit: number = 10) => {
    const result = await fileCacheDB.getRecentFiles(limit)
    const files: FileObject[] = []
    for (const item of result) {
        const fullPath = await getFullPath(item.relative_path)
        files.push({
            name: item.relative_path.split('/').pop() || item.relative_path,
            type: 'file',
            relative_path: item.relative_path,
            full_path: fullPath,
            thumbnail: await getThumbUrl(fullPath),
            atime: item.atime|| '',
            mtime: item.mtime|| '',
            birthtime: item.birthtime|| '',
            size: (await stat(fullPath)).size,
        })
    }
    return files
}
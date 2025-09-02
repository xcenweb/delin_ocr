// app文件系统

import router from '@/router'
import { ref, computed } from 'vue'
import { useDateFormat } from '@vueuse/core'
import { getThumbnailUrl } from './thumbnail'
import { readDir, BaseDirectory, stat, writeFile, mkdir, exists,  } from '@tauri-apps/plugin-fs'
import { join, appDataDir } from '@tauri-apps/api/path'

/** 基础文件信息接口 */
interface BaseFileInfo {
    name: string
    path: string
    fullPath: string
    info: {
        atime: string
        mtime: string
        birthtime: string
        size: number
    }
}

/** 目录对象接口 */
interface DirectoryObject extends BaseFileInfo {
    type: 'dir'
    count: number
}

/** 普通文件对象接口 */
interface FileObject extends BaseFileInfo {
    type: 'file'
    ext: string
}

/** 图片文件对象接口 */
interface ImageObject extends BaseFileInfo {
    type: 'img'
    ext: string
    thumbnail?: string
}

/** 文件系统对象联合类型 */
type FileSystemObject = DirectoryObject | FileObject | ImageObject

/** 日期格式化模板 */
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

/** 原始文件列表数据 */
const currentPath_fso = ref<FileSystemObject[]>([])

/** 当前排序类型 */
const sortType = ref<string>('name-asc')

/**
 * 根据文件后缀名判断文件类型
 * @param name 文件名
 * @returns 文件类型：'dir' | 'file' | 'img'
 */
const getFileType = (name: string): 'dir' | 'file' | 'img' => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const ext = name.toLowerCase().substring(name.lastIndexOf('.'))
    return imageExtensions.includes(ext) ? 'img' : 'file'
}

/**
 * 将字节数转换为人类可读的文件大小格式
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 排序后的文件列表
 * - 文件夹优先显示，然后根据选择的排序方式对文件夹和文件分别排序
 */
const sortedFiles = computed(() => {
    const files = [...currentPath_fso.value]

    // 分离文件夹和文件
    const dirs = files.filter(item => item.type === 'dir')
    const nonDirs = files.filter(item => item.type !== 'dir')

    // 通用排序函数
    const getSortFunction = () => {
        const [sortBy, order] = sortType.value.split('-')
        const isAsc = order === 'asc'

        if (sortBy === 'name') {
            return (a: FileSystemObject, b: FileSystemObject) =>
                isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        } else if (sortBy === 'mtime') {
            return (a: FileSystemObject, b: FileSystemObject) => {
                const timeA = new Date(a.info.mtime).getTime()
                const timeB = new Date(b.info.mtime).getTime()
                return isAsc ? timeA - timeB : timeB - timeA
            }
        }
    }

    const sortFn = getSortFunction()

    // 分别排序文件夹和文件，然后合并（文件夹优先）
    return [...dirs.sort(sortFn), ...nonDirs.sort(sortFn)]
})

/**
 * 异步加载指定目录的文件和文件夹信息
 * - 读取 DIRECTORY_PATH 目录下的所有条目，获取文件统计信息，并为目录计算子项数量
 */
const loadDirectory = async (path: string): Promise<void> => {
    try {
        const entries = await readDir(path, { baseDir:BaseDirectory.AppData })
        const result: FileSystemObject[] = []

        for (const entry of entries) {
            try {
                const relativePath = await join(path, entry.name)
                const fullPath =  await join(await appDataDir(), relativePath)
                const fileStat = await stat(fullPath)

                // 创建基础信息对象
                const baseInfo: BaseFileInfo = {
                    name: entry.name,
                    path: relativePath,
                    fullPath: fullPath,
                    info: {
                        atime: useDateFormat(new Date(fileStat.atime || Date.now()), DATE_FORMAT).value,
                        mtime: useDateFormat(new Date(fileStat.mtime || Date.now()), DATE_FORMAT).value,
                        birthtime: useDateFormat(new Date(fileStat.birthtime || Date.now()), DATE_FORMAT).value,
                        size: fileStat.size || 0
                    }
                }

                let fileObj: FileSystemObject

                if (entry.isDirectory) {
                    // 创建目录对象
                    let count = 0
                    try {
                        const subEntries = await readDir(fullPath)
                        count = subEntries.length
                    } catch {
                        count = 0
                    }

                    fileObj = {
                        ...baseInfo,
                        type: 'dir',
                        count
                    } as DirectoryObject
                } else {
                    const ext = entry.name.substring(entry.name.lastIndexOf('.') + 1)
                    const fileType = getFileType(entry.name)

                    if (fileType === 'img') {
                        // 创建图片对象
                        const thumbnail = await getThumbnailUrl({ path: relativePath, name: entry.name })
                        fileObj = {
                            ...baseInfo,
                            type: 'img',
                            ext,
                            thumbnail
                        } as ImageObject
                    } else {
                        // 创建普通文件对象
                        fileObj = {
                            ...baseInfo,
                            type: 'file',
                            ext
                        } as FileObject
                    }
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
 * 将 Blob URL 保存到本地文件系统
 * @param blobUrl - Blob URL 地址
 * @param fileName - 文件名（包含扩展名）
 * @param targetPath - 目标路径（相对于 baseDir）
 * @param baseDir - 基础目录
 * @returns 成功时返回保存的完整路径，失败时返回 false
 */
const saveBlobUrlToLocal = async (
    blobUrl: string,
    fileName: string,
    targetPath: string = '',
    baseDir: BaseDirectory
): Promise<string | false> => {
    try {
        // 输入参数验证
        if (!blobUrl || !blobUrl.startsWith('blob:')) {
            throw new Error('无效的 Blob URL')
        }
        if (!fileName || fileName.trim() === '') {
            throw new Error('文件名不能为空')
        }

        // 从 Blob URL 获取数据
        const response = await fetch(blobUrl)
        if (!response.ok) {
            throw new Error(`网络请求失败: ${response.status} ${response.statusText}`)
        }

        // 获取文件数据
        const arrayBuffer = await response.arrayBuffer()
        if (arrayBuffer.byteLength === 0) {
            throw new Error('文件数据为空')
        }
        const uint8Array = new Uint8Array(arrayBuffer)

        // 确保目标目录存在
        if (targetPath) {
            const dirExists = await exists(targetPath, { baseDir }) as boolean
            if (!dirExists) {
                await mkdir(targetPath, { baseDir, recursive: true })
                console.log(`目录已创建: ${targetPath}`)
            }
        }

        // 生成唯一文件路径
        const fullPath = await generateUniqueFilePath(
            fileName,
            targetPath,
            baseDir
        )

        // 写入文件
        await writeFile(fullPath, uint8Array, { baseDir })

        console.log(`文件已成功保存到: ${fullPath} (大小: ${formatFileSize(arrayBuffer.byteLength)})`)
        return fullPath
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('保存文件失败:', errorMessage)
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
const generateUniqueFilePath = async (
    fileName: string,
    targetPath: string,
    baseDir: BaseDirectory
): Promise<string> => {
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
        if (counter > 9999) {
            throw new Error('无法生成唯一文件名，请检查目标目录')
        }
    }

    return fullPath
}

/**
 * 打开文件夹
 */
const openFolder = (path: string) => {
    router.push({ name: 'file-next', query: { path: path } })
}

/**
 * 打开单张图片
 */
const openImg = (path: string) => {
    router.push({ name: 'image-viewer', query: { path: path } })
}

export {
    sortedFiles,
    currentPath_fso,
    sortType,

    loadDirectory,
    formatFileSize,
    saveBlobUrlToLocal,

    openFolder,
    openImg,
}
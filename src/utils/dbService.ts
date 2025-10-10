// 数据库缓存服务
import Database from '@tauri-apps/plugin-sql'
import { useDateFormat } from '@vueuse/core'
import { Block } from 'tesseract.js'
import { type FileObject } from './fileService'

/**
 * 缓存的文件及相关信息
 */
export interface filesCache {
    id?: number
    /** 类型 */
    type: 'file' | 'dir'
    /** 相对路径 */
    relative_path: string
    /** 标签 */
    tags: string
    /** OCR 识别出的文本 */
    recognized_text: string
    /** OCR 识别的原始块数据 */
    recognized_block: Block
    /** OCR 识别结果更新时间 */
    recognized_update?: string
    /** 上次被访问时间 */
    atime?: string
    /** 上次修改时间 */
    mtime?: string
    /** 创建时间 */
    birthtime?: string
}

/**
 * 数据库基础类
 */
class BaseDB {
    protected db!: Database
    private initialized = false

    /**
     * 初始化缓存数据库
     */
    protected async init() {
        if (this.initialized) return
        this.db = await Database.load('sqlite:user/cache.db')
        await this.createTable()
        this.initialized = true
    }

    /**
     * 初始化创建数据表
     */
    private async createTable() {
        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS files_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                relative_path TEXT NOT NULL UNIQUE,
                tags TEXT DEFAULT '',
                recognized_text TEXT DEFAULT '',
                recognized_block TEXT DEFAULT '',
                recognized_update TEXT DEFAULT '',
                atime TEXT,
                mtime TEXT,
                birthtime TEXT
            )
        `)
    }

    /**
     * 路径标准化
     * @param path 路径
     * @param separator '/' 分隔符
     * @returns 标准化后的路径
     */
    public normalizedPath(path: string, separator = '/') {
        return path.replace(/\\/g, separator)
    }

    /**
     * 获取当前时间
     */
    public getCurrentTime() {
        return useDateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss').value
    }
}

/**
 * 文件缓存
 */
class FileCacheDB extends BaseDB {
    tableName = 'files_cache'

    /**
     * 插入记录
     */
    async add(record: filesCache) {
        await this.init()
        const currentTime = this.getCurrentTime()

        const result = await this.db.execute(
            `INSERT INTO ${this.tableName} (type, relative_path, tags, recognized_text, recognized_block, recognized_update, atime, mtime, birthtime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                record.type,
                this.normalizedPath(record.relative_path),
                record.tags,
                record.recognized_text,
                record.recognized_block,
                currentTime,
                record.atime || currentTime,
                record.mtime || currentTime,
                record.birthtime || currentTime
            ]
        )
        return result.lastInsertId
    }

    /**
     * 更新访问时间
     */
    async updateAtime(relativePath: string) {
        console.log(relativePath)
        await this.init()
        console.log(await this.db.execute(
            `UPDATE ${this.tableName} SET atime = ? WHERE relative_path = ?`,
            [this.getCurrentTime(), relativePath]
        ))
    }

    /**
     * 根据路径获取一条记录
     */
    async getByPath(relativePath: string) {
        await this.init()
        const result = await this.db.select<filesCache>(`SELECT * FROM ${this.tableName} WHERE relative_path = ?`, [this.normalizedPath(relativePath)])
        return result
    }

    /**
     * 根据路径删除记录
     */
    async deleteByPath(relativePath: string) {
        await this.init()
        const result = await this.db.execute(`DELETE FROM ${this.tableName} WHERE relative_path = ?`, [this.normalizedPath(relativePath)])
        return result
    }

    /**
     * 获取所有已索引的文件路径
     */
    async getAllFiles() {
        await this.init()
        const result = await this.db.select<FileObject[]>(`SELECT * FROM ${this.tableName}`)
        return result
    }

    /**
     * 获取所有已索引的文件路径（分页）
     * @param page 页码，默认为1
     * @param pageSize 每页数量，默认为15
     * @returns 包含文件数据、分页信息的对象
     *          - data: 当前页的文件数据
     *          - pages: 总页数
     *          - total: 总记录数
     *          - currentPage: 当前页码
     */
    async getAllFilesPaging(currentPage: number = 1, pageSize: number = 15) {
        await this.init()
        const offset = (currentPage - 1) * pageSize
        const result = await this.db.select<FileObject[]>(`SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`, [pageSize, offset])
        const countResult = await this.db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM ${this.tableName}`)
        const total = countResult[0]?.count || 0
        const pages = Math.ceil(total / pageSize)
        return { data: result, pages, total, currentPage }
    }

    /**
     * 获取最近访问的文件
     * @param limit 返回记录数量限制
     */
    async getRecentFiles(limit: number = 10) {
        await this.init()
        const result = await this.db.select<filesCache[]>(
            `SELECT * FROM ${this.tableName} ORDER BY atime DESC LIMIT ?`,
            [limit]
        )
        return result
    }

    /**
     * 获取文件的信息
     * @param path 文件路径
     */
    async getFileInfo(path: string) {
        await this.init()
        const result = await this.db.select<filesCache[]>(
            `SELECT * FROM ${this.tableName} WHERE relative_path = ?`,
            [this.normalizedPath(path)]
        )
        return result[0]
    }
}

export const fileCacheDB = new FileCacheDB()
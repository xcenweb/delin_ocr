// 数据库缓存服务
import Database from '@tauri-apps/plugin-sql'
import { useDateFormat } from '@vueuse/core'
import { Block } from 'tesseract.js'

/**
 * 缓存的文件及相关信息
 */
export interface filesCache {
    id?: number
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
        const normalizedPath = this.normalizedPath(record.relative_path)

        const result = await this.db.execute(
            `INSERT INTO ${this.tableName} (relative_path, tags, recognized_text, recognized_block, recognized_update, atime, mtime, birthtime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                normalizedPath,
                record.tags,
                record.recognized_text,
                record.recognized_block,
                currentTime,
                currentTime,
                record.mtime || currentTime,
                record.birthtime || currentTime
            ]
        )
        return result.lastInsertId
    }

    /**
     * 更新记录
     */
    async update(record: filesCache) {
        await this.init()
        const currentTime = this.getCurrentTime()
        const normalizedPath = this.normalizedPath(record.relative_path)
        const result = await this.db.execute(
            `UPDATE ${this.tableName} SET tags = ?, recognized_text = ?, recognized_block = ?, recognized_update = ?, atime = ?, mtime = ?, birthtime = ? WHERE relative_path = ?`,
            [
                record.tags,
                record.recognized_text,
                record.recognized_block,
                currentTime,
                currentTime,
                record.mtime || currentTime,
                record.birthtime || currentTime,
                normalizedPath
            ]
        )
        return result
    }

    /**
     * 根据路径获取一条记录
     */
    async getByPath(relativePath: string) {
        await this.init()
        const result = await this.db.select<filesCache[]>(`SELECT * FROM ${this.tableName} WHERE relative_path = ?`, [this.normalizedPath(relativePath)])
        return result.length > 0 ? result[0] : null
    }

    /**
     * 根据路径删除记录
     */
    async deleteByPath(relativePath: string) {
        await this.init()
        const result = await this.db.execute(`DELETE FROM ${this.tableName} WHERE relative_path = ?`, [this.normalizedPath(relativePath)])
        return result
    }
}

export const fileCacheDB = new FileCacheDB()
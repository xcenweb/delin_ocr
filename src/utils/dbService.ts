// 数据库缓存服务
import Database from '@tauri-apps/plugin-sql';
import { useDateFormat } from '@vueuse/core';

// 数据类型定义
export interface OCRRecord {
    id?: number;
    relative_path: string;
    tags?: string;
    text?: string;
    block?: string;
    create_time?: string;
    update_time?: string;
}

/**
 * 数据库基础类
 */
class BaseDB {
    /** 数据库连接对象*/
    protected db!: Database;
    /** 初始化数据库连接的Promise */
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.init();
    }

    /**
     * 初始化数据库连接
     */
    private async init() {
        this.db = await Database.load('sqlite:' + 'user/cache.db');
        await this.initTables();
    }

    /**
     * 确保数据库已初始化
     */
    protected async ensureInitialized(): Promise<void> {
        await this.initPromise;
    }

    /**
     * 初始化数据表
     */
    private async initTables() {
        await this.db.execute(`
            CREATE TABLE IF NOT EXISTS "ocr_records" (
                "id"	INTEGER UNIQUE,
                "relative_path"	TEXT NOT NULL UNIQUE,
                "tags"	TEXT DEFAULT '',
                "text"	TEXT DEFAULT '',
                "block"	TEXT DEFAULT '',
                "create_time"	TEXT,
                "update_time"	TEXT,
                PRIMARY KEY("id" AUTOINCREMENT)
            );
        `);
    }

    /**
     * 通用: 路径标准化
     * @param path 路径
     * @param separator '/' 分隔符
     * @returns 标准化后的路径
     */
    public normalizedPath(path: string, separator = '/') {
        return path.replace(/\\/g, separator);
    }

    /**
     * 通用：获取当前时间
     */
    public getCurrentTime() {
        return useDateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss').value
    }

    /**
     * 注销连接
     */
    async destroy(): Promise<void> {
        await this.db.close();
    }
}

/**
 * OCR识别缓存
 */
class OCRRecords extends BaseDB {
    tableName = 'ocr_records';

    /**
     * 插入或更新OCR记录
     */
    async upsert(record: OCRRecord): Promise<number> {
        await this.ensureInitialized();
        const currentTime = this.getCurrentTime();

        const result = await this.db.execute(
            `INSERT OR REPLACE INTO ${this.tableName}
                (id, relative_path, tags, text, block, create_time, update_time)
                VALUES (
                    (SELECT id FROM ${this.tableName} WHERE relative_path = ?),
                    ?, ?, ?, ?,
                    COALESCE((SELECT create_time FROM ${this.tableName} WHERE relative_path = ?), ?), ?
                )`,
            [
                record.relative_path,
                record.relative_path,
                record.tags || '',
                record.text || '',
                record.block || '',
                record.relative_path,
                currentTime,
                currentTime
            ]
        );

        return result.lastInsertId as number;
    }

    /**
     * 根据路径获取OCR记录
     */
    async getByPath(relativePath: string): Promise<OCRRecord | null> {
        await this.ensureInitialized();
        const result = await this.db.select<OCRRecord[]>(`SELECT * FROM ${this.tableName} WHERE relative_path = ?`, [this.normalizedPath(relativePath)]);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * 根据路径删除OCR记录
     */
    async deleteByPath(relativePath: string): Promise<boolean> {
        await this.ensureInitialized();
        const result = await this.db.execute(`DELETE FROM ${this.tableName} WHERE relative_path = ?`, [this.normalizedPath(relativePath)]);
        return result.rowsAffected > 0;
    }

    /**
     * 获取所有OCR记录
     */
    async getAll(limit?: number, offset?: number): Promise<OCRRecord[]> {
        await this.ensureInitialized();
        let query = `SELECT * FROM ${this.tableName} ORDER BY update_time DESC`;
        const params: any[] = [];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
            if (offset) {
                query += ` OFFSET ?`;
                params.push(offset.toString());
            }
        }

        return await this.db.select<OCRRecord[]>(query, params);
    }

    /**
     * 搜索OCR文本
     */
    async search(keyword: string, limit?: number): Promise<OCRRecord[]> {
        await this.ensureInitialized();
        let query = `SELECT * FROM ${this.tableName} WHERE text LIKE ? OR tags LIKE ? ORDER BY update_time DESC`;
        const params = [`%${keyword}%`, `%${keyword}%`];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
        }

        return await this.db.select<OCRRecord[]>(query, params);
    }

    /**
     * 根据标签搜索OCR记录
     */
    async getByTags(tags: string[], limit?: number): Promise<OCRRecord[]> {
        await this.ensureInitialized();
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
        let query = `SELECT * FROM ${this.tableName} WHERE ${tagConditions} ORDER BY update_time DESC`;
        const params = tags.map(tag => `%${tag}%`);

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
        }

        return await this.db.select<OCRRecord[]>(query, params);
    }

    /**
     * 获取记录总数
     */
    async getCount(): Promise<number> {
        await this.ensureInitialized();
        const result = await this.db.select<{ count: number }[]>(
            `SELECT COUNT(*) as count FROM ${this.tableName}`
        );
        return result[0]?.count || 0;
    }
}

export const ocrRecordsDB = new OCRRecords();
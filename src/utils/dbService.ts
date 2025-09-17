// 数据库缓存服务
import Database from '@tauri-apps/plugin-sql';
import { useDateFormat } from '@vueuse/core';

// 数据类型定义
export interface FileRecord {
    id?: number;
    type: string;
    relative_path: string;
    tags?: string;
    atime?: string;
    mtime?: string;
    birthtime?: string;
}

export interface OCRRecord {
    id?: number;
    relative_path: string;
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
            CREATE TABLE IF NOT EXISTS "files_list" (
                "id"	INTEGER UNIQUE,
                "type"	TEXT NOT NULL,
                "relative_path"	TEXT NOT NULL UNIQUE,
                "tags"	TEXT DEFAULT '',
                "atime"	TEXT DEFAULT '',
                "mtime"	TEXT DEFAULT '',
                "birthtime"	TEXT DEFAULT '',
                PRIMARY KEY("id" AUTOINCREMENT)
            );
            CREATE TABLE IF NOT EXISTS "ocr_records" (
                "id"	INTEGER UNIQUE,
                "relative_path"	TEXT NOT NULL UNIQUE,
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
        return useDateFormat(new Date(), 'YYYY-MM-DD HH:mm:ss')
    }

    /**
     * 注销连接
     */
    async destroy(): Promise<void> {
        await this.ensureInitialized();
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
    async upsert(record: Omit<OCRRecord, 'id'>): Promise<number> {
        await this.ensureInitialized();
        const currentTime = this.getCurrentTime();

        // 尝试更新
        const updateResult = await this.db.execute(
            `UPDATE ${this.tableName} SET text = ?, block = ?, update_time = ? WHERE relative_path = ?`,
            [record.text || '', record.block || '', currentTime, record.relative_path]
        );

        // 如果更新成功，获取记录ID
        if (updateResult.rowsAffected > 0) {
            const existing = await this.getByPath(record.relative_path);
            return existing?.id || 0;
        }

        // 如果更新失败，插入新记录
        const insertResult = await this.db.execute(
            `INSERT INTO ${this.tableName} (relative_path, text, block, create_time, update_time) VALUES (?, ?, ?, ?, ?)`,
            [record.relative_path, record.text || '', record.block || '', currentTime, currentTime]
        );
        return insertResult.lastInsertId as number;
    }

    /**
     * 插入OCR记录
     */
    async insert(record: Omit<OCRRecord, 'id'>): Promise<number> {
        await this.ensureInitialized();
        const currentTime = this.getCurrentTime();
        const result = await this.db.execute(
            `INSERT INTO ${this.tableName} (relative_path, text, block, create_time, update_time) VALUES (?, ?, ?, ?, ?)`,
            [record.relative_path, record.text || '', record.block || '', currentTime, currentTime]
        );
        return result.lastInsertId as number;
    }

    /**
     * 更新OCR记录
     */
    async update(relativePath: string, record: Partial<OCRRecord>): Promise<boolean> {
        await this.ensureInitialized();
        const currentTime = this.getCurrentTime();
        const result = await this.db.execute(
            `UPDATE ${this.tableName} SET text = ?, block = ?, update_time = ? WHERE relative_path = ?`,
            [record.text || '', record.block || '', currentTime, relativePath]
        );
        return result.rowsAffected > 0;
    }

    /**
     * 根据路径获取OCR记录
     */
    async getByPath(relativePath: string): Promise<OCRRecord | null> {
        await this.ensureInitialized();
        const result = await this.db.select<OCRRecord[]>(
            `SELECT * FROM ${this.tableName} WHERE relative_path = ?`,
            [relativePath]
        );
        return result.length > 0 ? result[0] : null;
    }

    /**
     * 根据路径删除OCR记录
     */
    async deleteByPath(relativePath: string): Promise<boolean> {
        await this.ensureInitialized();
        const result = await this.db.execute(
            `DELETE FROM ${this.tableName} WHERE relative_path = ?`,
            [relativePath]
        );
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
        let query = `SELECT * FROM ${this.tableName} WHERE text LIKE ? ORDER BY update_time DESC`;
        const params = [`%${keyword}%`];

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
        const result = await this.db.select<{count: number}[]>(
            `SELECT COUNT(*) as count FROM ${this.tableName}`
        );
        return result[0]?.count || 0;
    }
}

/**
 * 文件列表缓存
 */
class FilesList extends BaseDB {
    tableName = 'files_list';

    /**
     * 插入或更新文件记录
     */
    async upsert(record: Omit<FileRecord, 'id'>): Promise<number> {
        await this.ensureInitialized();

        // 尝试更新
        const updateResult = await this.db.execute(
            `UPDATE ${this.tableName} SET type = ?, tags = ?, atime = ?, mtime = ?, birthtime = ? WHERE relative_path = ?`,
            [record.type, record.tags || '', record.atime || '', record.mtime || '', record.birthtime || '', record.relative_path]
        );

        // 如果更新成功，获取记录ID
        if (updateResult.rowsAffected > 0) {
            const existing = await this.getByPath(record.relative_path);
            return existing?.id || 0;
        }

        // 如果更新失败，插入新记录
        const insertResult = await this.db.execute(
            `INSERT INTO ${this.tableName} (type, relative_path, tags, atime, mtime, birthtime) VALUES (?, ?, ?, ?, ?, ?)`,
            [record.type, record.relative_path, record.tags || '', record.atime || '', record.mtime || '', record.birthtime || '']
        );
        return insertResult.lastInsertId as number;
    }

    /**
     * 插入文件记录
     */
    async insert(record: Omit<FileRecord, 'id'>): Promise<number> {
        await this.ensureInitialized();
        const result = await this.db.execute(
            `INSERT INTO ${this.tableName} (type, relative_path, tags, atime, mtime, birthtime) VALUES (?, ?, ?, ?, ?, ?)`,
            [record.type, record.relative_path, record.tags || '', record.atime || '', record.mtime || '', record.birthtime || '']
        );
        return result.lastInsertId as number;
    }

    /**
     * 更新文件记录
     */
    async update(relativePath: string, record: Partial<FileRecord>): Promise<boolean> {
        await this.ensureInitialized();
        const fields: string[] = [];
        const values: any[] = [];

        if (record.type !== undefined) {
            fields.push('type = ?');
            values.push(record.type);
        }
        if (record.tags !== undefined) {
            fields.push('tags = ?');
            values.push(record.tags);
        }
        if (record.atime !== undefined) {
            fields.push('atime = ?');
            values.push(record.atime);
        }
        if (record.mtime !== undefined) {
            fields.push('mtime = ?');
            values.push(record.mtime);
        }
        if (record.birthtime !== undefined) {
            fields.push('birthtime = ?');
            values.push(record.birthtime);
        }

        if (fields.length === 0) return false;

        values.push(relativePath);
        const result = await this.db.execute(
            `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE relative_path = ?`,
            values
        );
        return result.rowsAffected > 0;
    }

    /**
     * 根据路径获取文件记录
     */
    async getByPath(relativePath: string): Promise<FileRecord | null> {
        await this.ensureInitialized();
        const result = await this.db.select<FileRecord[]>(
            `SELECT * FROM ${this.tableName} WHERE relative_path = ?`,
            [relativePath]
        );
        return result.length > 0 ? result[0] : null;
    }

    /**
     * 根据路径删除文件记录
     */
    async deleteByPath(relativePath: string): Promise<boolean> {
        await this.ensureInitialized();
        const result = await this.db.execute(
            `DELETE FROM ${this.tableName} WHERE relative_path = ?`,
            [relativePath]
        );
        return result.rowsAffected > 0;
    }

    /**
     * 获取所有文件记录
     */
    async getAll(limit?: number, offset?: number): Promise<FileRecord[]> {
        await this.ensureInitialized();
        let query = `SELECT * FROM ${this.tableName} ORDER BY mtime DESC`;
        const params: any[] = [];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
            if (offset) {
                query += ` OFFSET ?`;
                params.push(offset.toString());
            }
        }

        return await this.db.select<FileRecord[]>(query, params);
    }

    /**
     * 根据文件类型获取记录
     */
    async getByType(type: string, limit?: number): Promise<FileRecord[]> {
        await this.ensureInitialized();
        let query = `SELECT * FROM ${this.tableName} WHERE type = ? ORDER BY mtime DESC`;
        const params = [type];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
        }

        return await this.db.select<FileRecord[]>(query, params);
    }

    /**
     * 根据标签搜索文件
     */
    async getByTags(tags: string[], limit?: number): Promise<FileRecord[]> {
        await this.ensureInitialized();
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
        let query = `SELECT * FROM ${this.tableName} WHERE ${tagConditions} ORDER BY mtime DESC`;
        const params = tags.map(tag => `%${tag}%`);

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
        }

        return await this.db.select<FileRecord[]>(query, params);
    }

    /**
     * 搜索文件
     */
    async search(keyword: string, limit?: number): Promise<FileRecord[]> {
        await this.ensureInitialized();
        let query = `SELECT * FROM ${this.tableName} WHERE relative_path LIKE ? OR tags LIKE ? ORDER BY mtime DESC`;
        const params = [`%${keyword}%`, `%${keyword}%`];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit.toString());
        }

        return await this.db.select<FileRecord[]>(query, params);
    }

    /**
     * 获取文件总数
     */
    async getCount(): Promise<number> {
        await this.ensureInitialized();
        const result = await this.db.select<{count: number}[]>(
            `SELECT COUNT(*) as count FROM ${this.tableName}`
        );
        return result[0]?.count || 0;
    }
}

export const ocrRecordsDB = new OCRRecords();
export const filesListDB = new FilesList();
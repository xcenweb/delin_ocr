// 数据库缓存服务
import Database from '@tauri-apps/plugin-sql';
import { useDateFormat } from '@vueuse/core';

import { FileObject } from './fileService';
import { OCRResult } from './ocrService';

/**
 * 数据库基础类
 */
class BaseDB {
    protected db!: Database;

    constructor() {
        this.init();
    }

    /**
     * 初始化数据库连接
     */
    private async init() {
        this.db = await Database.load('sqlite:' + 'user/cache.db');
        await this.initTables();
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
        await this.db.close();
    }
}

/**
 * OCR记录
 */
class OCRRecords extends BaseDB {

    tableName = 'ocr_records';

    /**
     * 更新文件的OCR识别缓存
     * @param relative_path 相对路径
     * @param ocrResult OCR识别结果
     */
    async update(relative_path: string, ocrResult: OCRResult) {
        return await this.db.execute(`UPDATE ${this.tableName} SET ocr_text = $1, ocr_block = $2, is_processed = 1 WHERE relative_path = $3`, [
            ocrResult.text, JSON.stringify(ocrResult.block), relative_path
        ])
    }

    /**
     * 获取文件的OCR识别缓存
     * @param relative_path 相对路径
     */
    async get(relative_path: string) {
        return await this.db.execute(`SELECT * FROM ${this.tableName} WHERE relative_path = $1`, [this.normalizedPath(relative_path)])
    }

    /**
     * 删除文件的OCR识别缓存
     * @param relative_path 相对路径
     * @returns
     */
    async delete(relative_path: string) {
        return await this.db.execute(`DELETE FROM ${this.tableName} WHERE relative_path = `, [this.normalizedPath(relative_path)])
    }
}

/**
 * 文件列表记录
 */
class FilesList extends BaseDB {

    tableName = 'files_list'

    /**
     * 插入文件
     * @param fileInfo 文件信息
     */
    async add(fileInfo: FileObject) {
        return await this.db.execute(`
            INSERT INTO ${this.tableName} (
                name, type, relative_path, atime, create_time, update_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            fileInfo.name, fileInfo.type, this.normalizedPath(fileInfo.path), fileInfo.info.atime, fileInfo.info.mtime, fileInfo.info.birthtime, fileInfo.info.size, new Date(), new Date(),
        ])
    }

    /**
     * 删除文件
     * @param relative_path 相对路径
     */
    async remove(relative_path: string) {
        return await this.db.execute(`DELETE FROM ${this.tableName} WHERE relative_path = `, [this.normalizedPath(relative_path)])
    }

    /**
     * 获取最近访问的前 limit 个文件
     * @param limit 个数
     */
    async getRecent(limit: number = 10) {
        return await this.db.execute(`SELECT * FROM ${this.tableName} ORDER BY last_viewed DESC LIMIT $1`, [limit])
    }

    /**
     * 更新文件标签
     * @param relative_path 相对路径
     * @param tags 标签字符串（逗号分隔）
     */
    async updateTags(relative_path: string, tags: string) {
        return await this.db.execute(`UPDATE ${this.tableName} SET tags = $1 WHERE relative_path = $2`, [
            tags, this.normalizedPath(relative_path)
        ])
    }

    /**
     * 根据标签查找文件
     * @param tag 标签名称
     */
    async getFilesByTag(tag: string) {
        return await this.db.select(`SELECT * FROM ${this.tableName} WHERE tags LIKE $1`, [`%${tag}%`])
    }
}

export const ocrRecordsDB = new OCRRecords();
export const filesListDB = new FilesList();
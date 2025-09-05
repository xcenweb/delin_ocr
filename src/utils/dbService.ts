// 数据库缓存服务
import Database from '@tauri-apps/plugin-sql';

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
            CREATE TABLE IF NOT EXISTS "ocr_records" (
                "id"	INTEGER UNIQUE,
                "name"	TEXT NOT NULL,
                "type"	TEXT NOT NULL,
                "relative_path"	TEXT NOT NULL UNIQUE,
                "tags"	TEXT DEFAULT '',
                "ocr_text"	TEXT DEFAULT '',
                "ocr_block"	TEXT DEFAULT '',
                "info_atme"	TEXT DEFAULT '',
                "info_mtime"	TEXT DEFAULT '',
                "info_birthtime"	TEXT DEFAULT '',
                "info_size"	INTEGER DEFAULT 0,
                "create_time"	TEXT,
                "update_time"	TEXT,
                "is_processed"	INTEGER DEFAULT 0,
                PRIMARY KEY("id" AUTOINCREMENT)
            );
        `);
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

    /**
     * 统一文件路径为 'xxx/xxx'
     */
    normalizedPath(path: string) {
        return path.replace(/\\/g, '/');
    }

    /**
     * 插入文件
     * @param fileInfo 文件信息
     */
    async addFile(fileInfo: FileObject) {
        await this.db.execute(`
            INSERT INTO ocr_records (
                name, type, relative_path, info_atme, info_mtime, info_birthtime, info_size, create_time, update_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            fileInfo.name, fileInfo.type, this.normalizedPath(fileInfo.path), fileInfo.info.atime, fileInfo.info.mtime, fileInfo.info.birthtime, fileInfo.info.size, new Date(), new Date(),
        ])
    }

    /**
     * 更新文件
     * @param relative_path 相对路径
     * @param fileInfo 文件信息
     */
    async updateFile(relative_path: string, fileInfo: FileObject) {

    }

    /**
     * 删除文件
     */
    async removeFile(relative_path: string) {
        await this.db.execute(`DELETE FROM ocr_records WHERE relative_path = `, [this.normalizedPath(relative_path)])
    }

    /**
     * 更新OCR识别结果缓存
     * @param relative_path 相对路径
     * @param ocrResult OCR识别结果
     */
    async updateRecord(relative_path: string, ocrResult: OCRResult) {
        await this.db.execute(`UPDATE ocr_records SET ocr_text = $1, ocr_block = $2, is_processed = 1 WHERE relative_path = $3`, [
            ocrResult.text, JSON.stringify(ocrResult.block), relative_path
        ])
    }

    /**
     * 获取图片的OCR识别结果缓存
     * @param relative_path 相对路径
     */
    async getRecord(relative_path: string) {
        const result = await this.db.execute(`SELECT * FROM ocr_records WHERE relative_path = $1`, [this.normalizedPath(relative_path)])
    }

    /**
     * 获取未处理的图片列表
     */
    async getUnprocessedImages() {
        const records = await this.db.select('SELECT * from ocr_records WHERE is_processed = 0')
    }

    /**
     * 获取最近访问的前 limit 个图片
     */
    async getRecentViewedImages(limit: number) {
        const records = await this.db.select(`SELECT * FROM ocr_records ORDER BY info_atime DESC LIMIT $1`, [limit])
    }
}

export const ocrRecordsDB = new OCRRecords();
import * as comlink from 'comlink'
import { Block } from 'tesseract.js'
import { convertFileSrc } from '@tauri-apps/api/core'
import { fileCacheDB } from './dbService'
import { getAllFiles } from './fileService'
import { useSnackbar } from '@/components/global/snackbarService'
import OcrWorker from '/src/worker/ocr-worker.ts?worker&inline'

class OcrService {
    ocr: {
        init: (languages: string[]) => Promise<boolean>
        getStatus: () => Promise<boolean>
        recognize: (src: string) => Promise<{ text: string, blocks: Block, tags: string }>
    }

    constructor() {
        this.ocr = comlink.wrap(new OcrWorker())
    }

    /**
     * 初始化OCR
     * @param languages 语言
     */
    async initialize(languages: string[] = ['chi_sim', 'eng']) {
        const status = await this.ocr.getStatus()
        if (status) {
            // useSnackbar().info('OCR已初始化')
            return true
        }
        return await this.ocr.init(languages)
    }

    /**
     * 批量索引新文件
     */
    async indexNewFiles() {
        const fo = await getAllFiles('user/file') // 所有文件
        const indexedRelativePaths = await fileCacheDB.getAllFiles() // 已索引文件
        const indexedPathSet = new Set(indexedRelativePaths.map(file => fileCacheDB.normalizedPath(file.relative_path))) // 已索引文件
        const unindexedFiles = fo.filter(file => !indexedPathSet.has(fileCacheDB.normalizedPath(file.relative_path))) // 未索引文件对象

        if (unindexedFiles.length > 0) {
            try {
                useSnackbar().info('OCR：正在构建索引...', true)

                for (const file of unindexedFiles) {
                    try {
                        const result = await this.ocr.recognize(convertFileSrc(file.full_path))
                        await fileCacheDB.add({
                            type: file.type,
                            relative_path: file.relative_path,
                            tags: result.tags,
                            recognized_block: result.blocks,
                            recognized_text: result.text,
                            atime: file.atime,
                            mtime: file.mtime,
                            birthtime: file.birthtime
                        })
                    } catch (error) {
                        console.error('OCR处理文件失败：', file.relative_path, error)
                    }
                }

                useSnackbar().success('OCR：索引完成')
            } catch (error) {
                useSnackbar().error('OCR：' + error)
            }
        }
    }
}

export const ocrService = new OcrService()
import Tesseract from 'tesseract.js'
import { ocrRecordsDB } from '@/utils/dbService'

let worker: Tesseract.Worker | null = null
let isInitialized = false

/**
 * worker初始化
 */
const init = async (languages: string[]) => {
    try {
        worker = await Tesseract.createWorker(languages, Tesseract.OEM.DEFAULT, {}, {})
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        })
        isInitialized = true
        return true
    } catch (error) {
        self.postMessage({ type: 'error', datas: error })
        return false
    }
}

/**
 * 清理OCR识别出的文本
 * @param {string} text - OCR识别出的原始文本
 * @returns {string} - 清理后的文本
 */
const cleanText = (text: string): string => {
    return text
        .split('\n')
        .map(line => {
            let cleaned = line.replace(/(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, ''); // 彻底清除中文字之间的所有空格
            cleaned = cleaned.replace(/\s+/g, ' ').trim(); // 压缩其余空白为单空格
            return cleaned;
        })
        .filter(line => line.length > 0)
        .join('\n');
}

/**
 * 处理图像并进行OCR识别
 * @param {ImageBitmap | HTMLImageElement | HTMLCanvasElement} src - 图像源
 * @returns {Promise<{text: string, blocks: any}>} - 识别结果
 */
const OCRecognize = async (src: string): Promise<{ text: string, blocks: any }> => {
    const io = await fetch(src)
    const imageBitmap = await createImageBitmap(await io.blob())
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.filter = 'brightness(1.5) contrast(1.5) grayscale(1)'
    ctx.drawImage(imageBitmap, 0, 0)
    imageBitmap.close()

    const { data: { text, blocks } } = await worker!.recognize(canvas, {}, { blocks: true })
    return { text: cleanText(text), blocks }
}

self.onmessage = async (event: MessageEvent<{ type: string, datas: any }>) => {
    try {
        // 初始化
        if (event.data.type === 'init' && !isInitialized) {
            const result = await init(event.data.datas.languages)
            self.postMessage({ type: 'inited', datas: result })
        }

        // 识别
        if (event.data.type === 'recognize' && isInitialized && worker) {
            const result = await OCRecognize(event.data.datas.src)
            self.postMessage({
                type: 'recognized',
                datas: {
                    ...result,
                    path: event.data.datas.path
                }
            })
        }

        // 销毁worker
        if (event.data.type === 'destroy' && worker) {
            await worker.terminate()
            worker = null
            isInitialized = false
        }
    } catch (error) {
        console.error(error)
        self.postMessage({ type: 'error', datas: error })
    }
}

export type { }
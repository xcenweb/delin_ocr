import Tesseract from 'tesseract.js'

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

self.onmessage = async (event: MessageEvent<{ type: string, datas: any }>) => {
    try {
        // 初始化
        if (event.data.type === 'init' && !isInitialized) {
            const result = await init(event.data.datas.languages)
            self.postMessage({ type: 'inited', datas: result })
        }

        // 识别一次
        if (event.data.type === 'recognize' && isInitialized && worker) {

            // 直接从 File 创建 ImageBitmap
            const imageBitmap = await createImageBitmap(event.data.datas.file)

            // 创建 OffscreenCanvas 进行图像预处理
            const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
            const ctx = canvas.getContext('2d')!

            // 应用图像处理滤镜并绘制
            ctx.filter = 'brightness(1.5) contrast(1.5) grayscale(1)'
            ctx.drawImage(imageBitmap, 0, 0)

            // 释放 ImageBitmap 资源
            imageBitmap.close()

            const { data: { text, blocks } } = await worker.recognize(canvas, {}, { blocks: true })
            self.postMessage({ type: 'recognized', datas: { text: cleanText(text), blocks } })
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
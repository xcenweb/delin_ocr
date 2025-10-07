import * as comlink from 'comlink'
import Tesseract from 'tesseract.js'
import { tagService } from '../utils/tagService'

let worker: Tesseract.Worker | null = null
let isInitialized = false

/**
 * ocr worker 初始化
 */
const init = async (languages: string[]) => {
    try {
        worker = await Tesseract.createWorker(languages, Tesseract.OEM.DEFAULT, {
            // logger: (m) => console.log(m),
        }, {})
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        })
        isInitialized = true
        return true
    } catch (error) {
        return false
    }
}

/**
 * 获取ocr worker状态
 */
const getStatus = async () => {
    return isInitialized
}

/**
 * 清理OCR识别出的文本
 * @param text - OCR识别出的原始文本
 * @returns - 清理后的文本
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
 * 处理图像以提高OCR识别准确率
 * @param src - 图像源
 * @returns 处理后的图像画布
 */
const processImage = async (src: string): Promise<OffscreenCanvas> => {
    const io = await fetch(src)
    const imageBitmap = await createImageBitmap(await io.blob())
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height)
    const ctx = canvas.getContext('2d')!
    // TODO: 优化图像处理
    ctx.filter = 'grayscale(1) contrast(1.2)'
    ctx.drawImage(imageBitmap, 0, 0)
    imageBitmap.close()
    return canvas
}

/**
 * 处理图像并进行OCR识别
 * @param src - 图像源
 * @returns - 识别结果和标签
 */
const recognize = async (src: string) => {
    if (!isInitialized || !worker) {
        throw new Error('Worker not initialized')
    }

    const canvas = await processImage(src)
    const { data: { text, blocks } } = await worker!.recognize(canvas, {}, { blocks: true })
    const tags = tagService.generateTags(text)

    return {
        text: cleanText(text),
        blocks,
        tags: tags.join(','),
    }
}

comlink.expose({
    init,
    getStatus,
    recognize,
})
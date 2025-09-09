// TODO: 监听文件列表，无cache则生成 {uuid}.cache，有cache但无文件需要删除cache
// TODO: 加密

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
        console.error('OCR Worker 初始化失败:', error)
        return false
    }
}

self.onmessage = async (event: MessageEvent<{ type: string, datas: any }>) => {
    // 初始化
    if (event.data.type === 'init' && !isInitialized) {
        const result = await init(event.data.datas.languages)
        self.postMessage({ type: 'inited', datas: result })
    }

    // 识别文本
    if (event.data.type === 'recognize' && isInitialized && worker) {
        try {
            const { data: result } = await worker.recognize(event.data.datas.image)
            self.postMessage({
                type: 'recognized',
                datas: {
                    text: result.text,
                    blocks: result.blocks
                }
            })
        } catch (error) {
            self.postMessage({
                type: 'error',
                datas: { error: (error as Error).message }
            })
        }
    }

    // 销毁
    if (event.data.type === 'destroy' && worker) {
        await worker.terminate()
        worker = null
        isInitialized = false
        self.postMessage({ type: 'destroyed', datas: true })
    }
}

export type { }
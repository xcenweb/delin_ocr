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
        console.error(error)
        return false
    }
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
            const { data: result } = await worker.recognize(event.data.datas.image, {}, { blocks: true })
            self.postMessage({
                type: 'recognized',
                datas: {
                    text: result.text,
                    blocks: result.blocks
                }
            })
        }

        // 销毁
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
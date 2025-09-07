// TODO: 监听文件列表，无cache则生成 {uuid}.cache，有cache但无文件需要删除cache
// TODO: 加密

import { useOCRService } from "@/utils/ocrService"

const ocrService = useOCRService()

/**
 * worker初始化
 */
const init = async (languages: string[], allfiles: string[]) => {
    await ocrService.initialize(languages)
    console.log(allfiles)
}

self.onmessage = async (event: MessageEvent<{ type: string, datas: any }>) => {
    if (event.data.type === 'init' && !ocrService.initialized) {
        await init(event.data.datas.languages, event.data.datas.allfiles)
        self.postMessage({ type: 'inited', datas: null })
    }
};

export type { }
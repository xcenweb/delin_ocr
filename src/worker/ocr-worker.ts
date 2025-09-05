// TODO: 监听文件列表，无cache则生成 {uuid}.cache，有cache但无文件需要删除cache
// TODO: 加密

import { useOCRService } from "@/utils/ocrService";

const ocrService = useOCRService()

/**
 * worker初始化
 */
const init = async (languages: string[], allfiles: string[]) => {
    await ocrService.initialize(languages)
    console.log(allfiles)
}

/**
 * 根据字符串生成固定UUID
 * @param str 输入字符串
 * @returns 固定格式的UUID
 */
const stringToUuid = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(32, '0').slice(-32);
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        '4' + hex.slice(13, 16),
        ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
        hex.slice(20)
    ].join('-');
}

/**
 * 创建缓存文件路径
 * @param path 源文件相对路径，将统一为 '/'
 * @returns 缓存文件路径
 */
const createCachePath = (path: string) => {
    return stringToUuid(path.replace(/\//g, '\\'))
}

self.onmessage = async (event: MessageEvent<{ type: string, datas: any }>) => {
    if (event.data.type === 'init' && !ocrService.initialized) {
        await init(event.data.datas.languages, event.data.datas.allfiles)
        self.postMessage({ type: 'inited', datas: null })
    }
};

export type { };
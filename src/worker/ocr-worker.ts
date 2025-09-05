/// <reference lib="webworker" />

// TODO: 监听文件列表，无cache则生成 {uuid}.cache，有cache但无文件需要删除cache

import { useOCRService } from "@/utils/ocrService";
import { getAllFiles } from "@/utils/fileService";
import { Block } from "typescript";

/**
 * 缓存文件模板
 */
interface CacheConstant {
    /** 标签 */
    tags: string[],
    /** 识别结果 */
    recognized: {
        text: string,
        block: Block[] | null
    }
}

self.onmessage = async (event) => {
    postMessage('started')
    setTimeout(() => {
        postMessage('finished')
    }, 5000)
};

export type { };
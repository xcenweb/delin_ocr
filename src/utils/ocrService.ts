import Tesseract, { Block } from 'tesseract.js'

/**
 * OCR识别结果
 */
export interface OCRResult {
  /** 识别到的文本 */
  text: string
  /** json */
  block: Block[] | null
}

/**
 * OCR识别进度
 */
export interface OCRProgress {
  /** 当前处理进度 */
  current: number
  /** 总任务数量 */
  total: number
  /** 当前任务状态 */
  status: string
}

export class OCRService {
  private worker: Tesseract.Worker | null = null
  private isInitialized = false

  constructor() { }

  /**
   * 获取初始化状态
   */
  get initialized(): boolean {
    return this.isInitialized
  }

  /**
   * 初始化OCR服务
   * @param languages 支持的语言，默认为中英文
   */
  async initialize(languages: Array<string> = ['chi_sim', 'eng']): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.worker = await Tesseract.createWorker(languages, Tesseract.OEM.DEFAULT, {}, {})
      await this.worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      })
      this.isInitialized = true
    } catch (error) {
      throw new Error(`OCR初始化失败: ${error}`)
    }
  }

  /**
   * 识别单个图片
   * @param imageSource 图片源（File对象或图片URL）
   */
  async recognize(imageSource: File | string): Promise<OCRResult> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('OCR服务未初始化')
    }

    try {
      const { data: result } = await this.worker.recognize(imageSource, {}, { blocks: true })
      return {
        text: result.text,
        block: result.blocks,
      }
    } catch (error) {
      throw new Error(`识别失败: ${error}`)
    }
  }

  /**
   * 批量识别图片
   * @param imageSources 图片源数组
   * @param onProgress 进度回调
   */
  async recognizeBatch(
    imageSources: (File | string)[],
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult[]> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('OCR服务未初始化')
    }

    const results: OCRResult[] = []
    const total = imageSources.length

    for (let i = 0; i < imageSources.length; i++) {
      const source = imageSources[i]

      onProgress?.({
        current: i + 1,
        total,
        status: `正在处理第 ${i + 1}/${total} 张图片`
      })

      try {
        const result = await this.recognize(source)
        results.push(result)
      } catch (error) {
        // 单个图片失败不影响整体处理
        results.push({ text: '', block: null })
      }
    }

    return results
  }

  /**
   * 销毁OCR服务
   */
  async destroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }

}

// 单例模式的OCR服务实例
let ocrServiceInstance: OCRService | null = null

/**
 * 获取OCR服务单例
 */
export function useOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService()
  }
  return ocrServiceInstance
}

/**
 * 销毁OCR服务单例
 */
export async function destroyOCRService(): Promise<void> {
  if (ocrServiceInstance) {
    await ocrServiceInstance.destroy()
    ocrServiceInstance = null
  }
}
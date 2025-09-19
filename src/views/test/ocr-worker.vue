<template>
    <v-app key="ocr-worker-test">
        <v-app-bar color="primary">
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>OCR Worker 测试</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pa-4">
                <!-- Worker 状态信息 -->
                <v-card class="mb-4">
                    <v-card-title>Worker 状态</v-card-title>
                    <v-card-text>
                        <v-chip
                            :color="workerStatus === 'initialized' ? 'success' : workerStatus === 'initializing' ? 'warning' : 'error'"
                            class="mr-2">
                            {{ workerStatusText }}
                        </v-chip>
                        <v-chip v-if="lastError" color="error">
                            错误: {{ lastError }}
                        </v-chip>
                    </v-card-text>
                </v-card>

                <!-- 文件选择与 OCR 操作 -->
                <v-card class="mb-4">
                    <v-card-title>图片识别</v-card-title>
                    <v-card-text>
                        <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect"
                            style="display: none;" />

                        <div class="d-flex gap-2 mb-3">
                            <v-btn @click="fileInput?.click()" color="primary" prepend-icon="mdi-image"
                                :disabled="workerStatus !== 'initialized'">
                                选择图片
                            </v-btn>

                            <v-btn @click="performOCR" color="success" prepend-icon="mdi-text-recognition"
                                :loading="isProcessing" :disabled="workerStatus !== 'initialized' || !selectedImage">
                                开始识别
                            </v-btn>

                            <v-btn @click="clearResults" color="grey" prepend-icon="mdi-delete" variant="outlined"
                                :disabled="!ocrResult">
                                清除结果
                            </v-btn>
                        </div>

                        <!-- 图片预览 -->
                        <div v-if="selectedImage">
                            <v-img :src="selectedImage.url" :alt="selectedImage.name" max-height="200" contain
                                class="mb-2 rounded" />
                            <div class="text-caption text-grey">
                                {{ selectedImage.name }} ({{ formatFileSize(selectedImage.size) }})
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- OCR 结果显示 -->
                <v-card v-if="ocrResult">
                    <v-card-title>识别结果</v-card-title>
                    <v-card-text>
                        <v-chip color="info" class="mb-3">
                            耗时: {{ processingTime }}ms
                        </v-chip>

                        <!-- 识别的文本 -->
                        <v-card variant="outlined" class="mb-3">
                            <v-card-title class="text-h6">识别文本</v-card-title>
                            <v-card-text>
                                <v-textarea v-model="ocrResult.text" readonly variant="outlined" :rows="6"
                                    class="mb-2" />
                                <div class="text-caption">
                                    字符数: {{ ocrResult.text.length }}
                                </div>
                            </v-card-text>
                        </v-card>

                        <!-- 文本块信息 -->
                        <v-card variant="outlined" v-if="ocrResult.blocks && ocrResult.blocks.length > 0">
                            <v-card-title class="text-h6">文本块详情</v-card-title>
                            <v-card-text>
                                <v-expansion-panels>
                                    <v-expansion-panel v-for="(block, index) in ocrResult.blocks" :key="index"
                                        :title="`文本块 ${index + 1}`">
                                        <v-expansion-panel-text>
                                            <div class="mb-2">
                                                <strong>文本:</strong> {{ block.text || '无文本' }}
                                            </div>
                                            <div class="mb-2">
                                                <strong>置信度:</strong> {{ (block.confidence || 0).toFixed(2) }}%
                                            </div>
                                            <div class="mb-2" v-if="block.bbox">
                                                <strong>边界框:</strong>
                                                x: {{ block.bbox.x0 }}, y: {{ block.bbox.y0 }},
                                                宽: {{ block.bbox.x1 - block.bbox.x0 }},
                                                高: {{ block.bbox.y1 - block.bbox.y0 }}
                                            </div>
                                        </v-expansion-panel-text>
                                    </v-expansion-panel>
                                </v-expansion-panels>
                            </v-card-text>
                        </v-card>
                    </v-card-text>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useWebWorker } from '@vueuse/core'

// OCR Worker 相关
import ocrWorkerUrl from '/src/worker/ocr-worker.ts?worker&url'

// 接口定义
interface SelectedImage {
    file: File
    url: string
    name: string
    size: number
}

interface OCRResult {
    text: string
    blocks?: Array<{
        text: string
        confidence: number
        bbox?: {
            x0: number
            y0: number
            x1: number
            y1: number
        }
    }>
}

// DOM 引用
const fileInput = ref<HTMLInputElement>()

// 响应式状态
const workerStatus = ref<'not-initialized' | 'initializing' | 'initialized' | 'error'>('not-initialized')
const lastError = ref<string>('')
const selectedImage = ref<SelectedImage | null>(null)
const ocrResult = ref<OCRResult | null>(null)
const isProcessing = ref(false)
const processingTime = ref(0)

// 创建 Web Worker
const ocrWorker = useWebWorker(ocrWorkerUrl, { type: 'module' })

// 计算属性
const workerStatusText = computed(() => {
    switch (workerStatus.value) {
        case 'not-initialized': return '未初始化'
        case 'initializing': return '初始化中...'
        case 'initialized': return '已初始化'
        case 'error': return '错误'
        default: return '未知'
    }
})

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 初始化 Worker
const initWorker = async () => {
    if (workerStatus.value === 'initializing') return

    workerStatus.value = 'initializing'
    lastError.value = ''

    try {
        ocrWorker.post({
            type: 'init',
            datas: {
                languages: ['chi_sim', 'eng'] // 中文简体 + 英文
            }
        })
    } catch (error) {
        workerStatus.value = 'error'
        lastError.value = error instanceof Error ? error.message : 'initializing_error'
    }
}

// 销毁 Worker
const destroyWorker = () => {
    ocrWorker.post({
        type: 'destroy',
        datas: null
    })
    workerStatus.value = 'not-initialized'
    lastError.value = ''
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // 清除之前的结果
    ocrResult.value = null

    // 创建文件 URL
    const url = URL.createObjectURL(file)

    // 释放之前的 URL
    if (selectedImage.value?.url) {
        URL.revokeObjectURL(selectedImage.value.url)
    }

    selectedImage.value = {
        file,
        url,
        name: file.name,
        size: file.size
    }
}

// 执行 OCR 识别
const performOCR = async () => {
    if (!selectedImage.value || workerStatus.value !== 'initialized') {
        return
    }

    isProcessing.value = true
    const startTime = Date.now()
    processingTime.value = startTime

    try {
        // 直接将 File 对象传输到 Worker
        ocrWorker.post({
            type: 'recognize',
            datas: {
                file: selectedImage.value.file
            }
        })
    } catch (error) {
        isProcessing.value = false
        lastError.value = error instanceof Error ? error.message : 'OCR_recognition_failed'
    }
}

// 清除结果
const clearResults = () => {
    ocrResult.value = null
    processingTime.value = 0
}

// 监听 Worker 消息
const handleWorkerMessage = (data: any) => {
    switch (data.type) {
        case 'inited':
            workerStatus.value = data.datas ? 'initialized' : 'error'
            if (!data.datas) {
                lastError.value = 'Worker 初始化失败'
            }
            break

        case 'recognized':
            isProcessing.value = false
            processingTime.value = Date.now() - (processingTime.value || Date.now())
            ocrResult.value = {
                text: data.datas.text || '',
                blocks: data.datas.blocks || []
            }
            break

        case 'error':
            isProcessing.value = false
            workerStatus.value = 'error'
            lastError.value = data.datas?.message || '未知错误'
            break
    }
}

// 生命周期钩子
onMounted(() => {
    // 监听 Worker 消息
    ocrWorker.data.value && handleWorkerMessage(ocrWorker.data.value)

    // 使用 watch 监听数据变化
    const { stop: stopWatching } = watchEffect(() => {
        if (ocrWorker.data.value) {
            handleWorkerMessage(ocrWorker.data.value)
        }
    })

    // 自动初始化 Worker
    initWorker()

    // 清理函数
    onUnmounted(() => {
        stopWatching()
        if (selectedImage.value?.url) {
            URL.revokeObjectURL(selectedImage.value.url)
        }
        destroyWorker()
    })
})
</script>

<style scoped>
.v-expansion-panel-text {
    padding-top: 8px;
}

.gap-2 {
    gap: 8px;
}

.text-grey {
    color: rgb(var(--v-theme-on-surface-variant));
}

.rounded {
    border-radius: 8px;
}
</style>
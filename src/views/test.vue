<template>
    <v-container class="pa-6">
        <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
                <v-card elevation="2">
                    <v-card-title class="text-h4 text-center pa-6">
                        Tesseract.js OCR 测试
                    </v-card-title>

                    <v-card-text>
                        <!-- 文件上传区域 -->
                        <v-row justify="center" class="mb-4">
                            <v-col cols="auto">
                                <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" multiple
                                    style="display: none" />
                                <v-btn color="primary" size="large" prepend-icon="mdi-upload"
                                    @click="fileInput?.click()" :disabled="isProcessing">
                                    选择图片进行识别
                                </v-btn>
                                <v-btn v-if="images.length > 0" color="error" size="large" prepend-icon="mdi-delete"
                                    @click="clearAll" :disabled="isProcessing" class="ml-2">
                                    清除所有
                                </v-btn>
                            </v-col>
                        </v-row>

                        <!-- 图片列表和识别结果 -->
                        <v-row v-if="images.length > 0">
                            <v-col cols="12">
                                <v-card variant="outlined">
                                    <v-card-subtitle class="text-h6 pa-4">
                                        图片识别结果 ({{ images.length }} 张图片):
                                    </v-card-subtitle>
                                    <v-card-text>
                                        <v-row>
                                            <v-col v-for="(image, index) in images" :key="image.id" cols="12" md="6"
                                                lg="4">
                                                <v-card variant="outlined" class="mb-4">
                                                    <!-- 图片预览 -->
                                                    <v-img :src="image.preview" :alt="`图片 ${index + 1}`" height="200"
                                                        cover class="mb-2" />

                                                    <v-card-text>


                                                        <!-- 错误信息 -->
                                                        <v-alert v-if="image.error" type="error" variant="tonal"
                                                            density="compact" class="mb-2">
                                                            {{ image.error }}
                                                        </v-alert>

                                                        <!-- 识别结果 -->
                                                        <div v-if="image.text && !image.isProcessing">
                                                            <div class="text-subtitle-2 mb-2">识别结果:</div>
                                                            <v-textarea :model-value="image.text" readonly
                                                                variant="outlined" density="compact" auto-grow rows="3"
                                                                max-rows="8" class="font-monospace text-body-2" />
                                                        </div>

                                                        <!-- 文件信息 -->
                                                        <div class="text-caption text-medium-emphasis mt-2">
                                                            {{ image.file.name }} ({{ Math.round(image.file.size / 1024)
                                                            }} KB)
                                                        </div>
                                                    </v-card-text>
                                                </v-card>
                                            </v-col>
                                        </v-row>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- 错误信息 -->
                        <v-row v-if="error">
                            <v-col cols="12">
                                <v-alert type="error" variant="tonal" closable @click:close="error = ''">
                                    {{ error }}
                                </v-alert>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getOCRService, type OCRProgress } from '@/utils/ocrService'
import { useSnackbar } from '@/components/global/snackbarService'

// 定义 ref 类型
const fileInput = ref<HTMLInputElement>()

interface ImageItem {
    id: string
    file: File
    preview: string
    text: string
    error: string
    isProcessing: boolean
}

const images = ref<ImageItem[]>([])
const isProcessing = ref<boolean>(false)
const error = ref<string>('')
const isInitializing = ref<boolean>(true)
const processedCount = ref<number>(0)
const totalCount = ref<number>(0)

// 全局 Snackbar 服务
const snackbar = useSnackbar()

// OCR 服务实例
const ocrService = getOCRService()

// 初始化 OCR 服务
const initializeOCR = async () => {
    try {
        isInitializing.value = true
        error.value = ''
        snackbar.persistent('正在初始化 Tesseract.js...', 'primary', true)
        await ocrService.initialize()
        snackbar.success('Tesseract.js 初始化完成')
    } catch (err) {
        console.error('初始化 OCR 失败:', err)
        error.value = '初始化失败: ' + (err as Error).message
        snackbar.error('初始化失败，请刷新页面重试')
    } finally {
        isInitializing.value = false
    }
}

const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files

    if (!files || files.length === 0) return

    // 重置状态
    error.value = ''
    images.value = []
    processedCount.value = 0
    totalCount.value = files.length

    // 创建图片项
    const imageItems: ImageItem[] = []
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const preview = URL.createObjectURL(file)

        imageItems.push({
            id: `image-${Date.now()}-${i}`,
            file,
            preview,
            text: '',
            error: '',
            isProcessing: false
        })
    }

    images.value = imageItems

    // 开始批量处理
    await processBatch()
}

// 批量处理所有图片
const processBatch = async () => {
    if (!ocrService.initialized || images.value.length === 0) return

    isProcessing.value = true
    processedCount.value = 0

    try {
        // 准备批量识别的数据
        const imageSources = images.value.map(img => img.file)

        // 设置处理状态
        images.value.forEach(img => {
            img.isProcessing = true
            img.error = ''
        })

        snackbar.persistent(`开始批量处理 ${imageSources.length} 张图片...`, 'info', true)

        // 执行批量识别
        const results = await ocrService.recognizeBatch(
            imageSources,
            (progress: OCRProgress) => {
                processedCount.value = progress.current
                snackbar.updateMessage(`${progress.status} (${progress.current}/${progress.total})`)
                // 更新对应图片的处理状态
                if (progress.current <= images.value.length) {
                    images.value[progress.current - 1].isProcessing = false
                }
            }
        )

        // 更新结果
        results.forEach((result, index) => {
            if (index < images.value.length) {
                const img = images.value[index]
                img.text = result.text
                img.isProcessing = false
            }
        })

        snackbar.success('批量处理完成')

    } catch (err) {
        console.error('批量处理失败:', err)
        error.value = '批量处理失败: ' + (err as Error).message
        snackbar.error('批量处理失败')
        // 重置所有图片的处理状态
        images.value.forEach(img => {
            img.isProcessing = false
            if (!img.text) {
                img.error = '处理失败'
            }
        })
    } finally {
        isProcessing.value = false
    }
}

// 清除所有结果
const clearAll = () => {
    // 释放预览URL内存
    images.value.forEach(img => {
        if (img.preview.startsWith('blob:')) {
            URL.revokeObjectURL(img.preview)
        }
    })

    images.value = []
    error.value = ''
    processedCount.value = 0
    totalCount.value = 0
    snackbar.info('已清除所有图片和结果')
}

// 页面加载时初始化
onMounted(() => {
    initializeOCR()
})

// 组件销毁时清理资源
onUnmounted(() => {
    // 释放所有预览URL内存
    images.value.forEach(img => {
        if (img.preview.startsWith('blob:')) {
            URL.revokeObjectURL(img.preview)
        }
    })
})
</script>
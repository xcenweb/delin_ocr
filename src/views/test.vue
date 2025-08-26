<template>
    <div class="pa-4">
        <h2>测试 saveBlobUrlToLocal 函数</h2>

        <v-card class="mt-4 pa-4">
            <v-card-title>创建测试图片</v-card-title>
            <v-card-text>
                <v-btn @click="createTestImage" color="primary" class="mr-2">
                    创建测试图片
                </v-btn>
                <v-btn @click="saveTestImage" color="success" :disabled="!testBlobUrl">
                    保存图片到本地
                </v-btn>
            </v-card-text>

            <v-card-text v-if="testBlobUrl">
                <p>测试图片预览：</p>
                <img :src="testBlobUrl" alt="测试图片" style="max-width: 200px; max-height: 200px;" />
                <p class="mt-2">Blob URL: {{ testBlobUrl }}</p>
            </v-card-text>
        </v-card>

        <v-card class="mt-4 pa-4">
            <v-card-title>保存设置</v-card-title>
            <v-card-text>
                <v-text-field v-model="fileName" label="文件名" hint="包含扩展名，如: test.png" persistent-hint />
                <v-text-field v-model="targetPath" label="目标路径" hint="相对于 AppData 的路径，留空则保存到根目录" persistent-hint />
            </v-card-text>
        </v-card>

        <v-card class="mt-4 pa-4" v-if="saveResults.length > 0">
            <v-card-title>保存结果</v-card-title>
            <v-card-text>
                <div v-for="(result, index) in saveResults" :key="index" class="mb-2">
                    <v-chip :color="result.success ? 'success' : 'error'" small>
                        {{ result.success ? '成功' : '失败' }}
                    </v-chip>
                    <span class="ml-2">{{ result.message }}</span>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { BaseDirectory } from '@tauri-apps/plugin-fs'
import { saveBlobUrlToLocal } from '@/utils/fileSystem'

// 测试用的 Blob URL
const testBlobUrl = ref<string>('')

// 保存设置
const fileName = ref<string>('test-image.png')
const targetPath = ref<string>('test-images')

// 保存结果
interface SaveResult {
    success: boolean
    message: string
    timestamp: string
}
const saveResults = ref<SaveResult[]>([])

/**
 * 创建一个测试用的图片 Blob URL
 */
const createTestImage = () => {
    // 创建一个 canvas 元素
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 绘制一个简单的测试图片
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(0, 0, 200, 200)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('测试图片', 100, 100)
    ctx.fillText(new Date().toLocaleTimeString(), 100, 130)

    // 转换为 Blob URL
    canvas.toBlob((blob) => {
        if (blob) {
            // 如果之前有 Blob URL，先释放它
            if (testBlobUrl.value) {
                URL.revokeObjectURL(testBlobUrl.value)
            }
            testBlobUrl.value = URL.createObjectURL(blob)
        }
    }, 'image/png')
}

/**
 * 测试保存图片到本地
 */
const saveTestImage = async () => {
    if (!testBlobUrl.value) {
        addSaveResult(false, '没有可保存的测试图片')
        return
    }

    try {
        const result = await saveBlobUrlToLocal(
            testBlobUrl.value,
            fileName.value,
            targetPath.value,
            BaseDirectory.AppData
        )

        if (result) {
            addSaveResult(true, `文件已成功保存到: ${result}`)
        } else {
            addSaveResult(false, '保存失败，请检查控制台错误信息')
        }
    } catch (error) {
        addSaveResult(false, `保存出错: ${error}`)
    }
}

/**
 * 添加保存结果记录
 */
const addSaveResult = (success: boolean, message: string) => {
    saveResults.value.unshift({
        success,
        message,
        timestamp: new Date().toLocaleString()
    })

    // 只保留最近的 10 条记录
    if (saveResults.value.length > 10) {
        saveResults.value = saveResults.value.slice(0, 10)
    }
}

// 组件卸载时清理 Blob URL
import { onUnmounted } from 'vue'
onUnmounted(() => {
    if (testBlobUrl.value) {
        URL.revokeObjectURL(testBlobUrl.value)
    }
})
</script>
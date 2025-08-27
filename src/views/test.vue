<template>
    <div class="image-container">
        <h2>图片显示测试</h2>
        <div v-if="imageSrc">
            <img :src="imageSrc" alt="扫描文件" style="max-width: 100%; height: auto;" />
        </div>
        <div v-else>
            <p>正在加载图片...</p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'

const imageSrc = ref<string>('')

onMounted(async () => {
    try {
        // 构建图片文件路径
        const filePath = await join(await appDataDir(), 'user/file/扫描文件_20250827_351073/1756270351101.jpg')

        // 使用convertFileSrc将文件路径转换为可在浏览器中使用的URL
        const assetUrl = convertFileSrc(filePath)
        imageSrc.value = assetUrl
    } catch (error) {
        console.error('加载图片失败:', error)
    }
})
</script>

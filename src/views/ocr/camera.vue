<template>
    <v-app>

        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
        </v-app-bar>

        <v-main class="d-flex flex-column position-relative">

            <div class="flex-grow-1 bg-black position-relative">
                <!-- 摄像画面容器 -->
                <div class="position-absolute overflow-hidden w-100 h-100 top-0 left-0">
                    <video autoplay playsinline muted ref="videoElement" class="w-100 h-100 left-0 top-0"
                        :srcObject="Camera.stream.value" @loadedmetadata="setupCanvas()"></video>
                    <canvas ref="overlayCanvas" class="position-absolute"></canvas>
                </div>

                <!-- 拍照模式选择 -->
                <div class="d-flex position-absolute" style="bottom: 18px; left: 50%; transform: translateX(-50%)">
                    <v-btn-toggle rounded="xl" v-model="takePhotoModel" mandatory base-color="grey-darken-1"
                        style="height: 30px;" :disabled="takedPhotos.length > 0">
                        <v-btn v-for="mod in takePhotoModelOptions" :key="mod.value" :value="mod.value" :text="mod.text"
                            flat color="primary" />
                    </v-btn-toggle>
                </div>
            </div>

            <!-- 控制区域 -->
            <v-sheet class="py-9 px-4">

                <div class="d-flex justify-space-around align-center">
                    <!-- 相册 -->
                    <v-btn icon="mdi-image-multiple" size="large" class="bg-grey-darken-3" />

                    <!-- 拍照 -->
                    <v-badge bordered location="top right" color="error" :content="takedPhotos.length"
                        :model-value="takePhotoModel === 'multiple'">
                        <v-btn icon size="x-large" class="bg-grey-darken-3" @click="takePhoto()"
                            :disabled="!Camera.stream.value">
                            <v-icon size="large">mdi-camera</v-icon>
                        </v-btn>
                    </v-badge>

                    <!-- 确认按钮 -->
                    <v-fade-transition>
                        <v-btn icon size="x-large" class="bg-grey-darken-3" :disabled="takedPhotos.length === 0"
                            v-if="takePhotoModel === 'multiple'" @click="gotoEditor()">
                            <v-icon size="large">mdi-check</v-icon>
                        </v-btn>
                    </v-fade-transition>

                    <!-- 闪光灯控制 -->
                    <v-btn :icon="Camera.isTorchOn.value ? 'mdi-flashlight' : 'mdi-flashlight-off'" size="large"
                        class="bg-grey-darken-3" @click="Camera.toggleTorch()" />
                </div>
            </v-sheet>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import router from '@/router'
import { onMounted, ref, watch } from 'vue'
import type { PhotoItem, Point } from './ts/types'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import * as Camera from './ts/camera'
import * as Persp from './ts/editor-persp'
import { edgeDetection } from './ts/camera-detection'

const route = useRoute()

/** 摄像头画面 */
const videoElement = ref<HTMLVideoElement>()
/** 矫正边框遮罩层 */
const overlayCanvas = ref<HTMLCanvasElement>()
/** Canvas 绘图上下文 */
const canvasContext = ref<CanvasRenderingContext2D | null>(null)

// 拍照功能
const takedPhotos = ref<PhotoItem[]>([])
const takePhotoModel = ref('single')
const takePhotoModelOptions = ref([
    { text: '单张', value: 'single' },
    { text: '多张', value: 'multiple' },
])

/**
 * 拍照
 */
const takePhoto = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx || !videoElement.value) return

    canvas.width = videoElement.value?.videoWidth || 0
    canvas.height = videoElement.value?.videoHeight || 0
    ctx.drawImage(videoElement.value, 0, 0)

    // 获取检测到的边缘点或使用默认点
    const points: Point[] = edgeDetection.getCurrentDetectedCorners() || edgeDetection.getDefaultCorners(canvas.width, canvas.height)

    // 生成图片blob
    canvas.toBlob(async (blob) => {
        if (!blob) return
        takedPhotos.value.push({
            src: URL.createObjectURL(blob),
            persped_src: URL.createObjectURL(await Persp.transform(blob, points) || blob),
            filtered_src: '',
            use_filter: 'original',
            points: [...points]
        })
        if (takePhotoModel.value === 'single') gotoEditor()
    }, 'image/png')
}

/**
 * 跳转到编辑器页面
 */
const gotoEditor = () => {
    const images = JSON.stringify(takedPhotos.value)
    router.push({ name: 'ocr-editor', state: { images } })
}

/**
 * canvas 遮罩层
 */
const setupCanvas = () => {
    if (!videoElement.value || !overlayCanvas.value) return
    Camera.setupCanvas(videoElement.value, overlayCanvas.value)

    // 获取canvas绘图上下文
    canvasContext.value = overlayCanvas.value.getContext('2d', { willReadFrequently: true })

    // 启动边缘检测处理
    if (canvasContext.value && Camera.stream.value) {
        edgeDetection.startVideoProcessing(
            videoElement.value,
            overlayCanvas.value,
            canvasContext.value,
            Camera.stream.value
        )
    }
}

onBeforeRouteLeave((to, from, next) => {
    // 停止边缘检测处理
    edgeDetection.stopVideoProcessing()
    edgeDetection.resetDetectionState()
    Camera.stop()
    next()
})

onMounted(() => {
    Camera.start()
    videoElement.value?.addEventListener('resize', setupCanvas)
    window.addEventListener('resize', setupCanvas)
})

watch(() => route.path, (o, n) => {
    if (n == '/ocr/editor') {
        Camera.start()
        takedPhotos.value = []
    }
})
</script>
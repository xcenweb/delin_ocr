<template>
    <v-app>
        <v-main class="d-flex flex-column position-relative">

            <v-app-bar>
                <v-btn icon="mdi-arrow-left" @click="$router.back()" />
                <!-- <template v-slot:append>
                    <v-btn icon="mdi-grid-off" />
                    <v-btn icon="mdi-selection-off" />
                </template> -->
            </v-app-bar>

            <!-- 视频区域 -->
            <div class="flex-grow-1 bg-black position-relative">

                <!-- 摄像画面容器 -->
                <div class="position-absolute overflow-hidden w-100 h-100 top-0 left-0" ref="videoContainerRef">

                    <video autoplay playsinline muted ref="videoElement" class="w-100 h-100 left-0 top-0"
                        :srcObject="stream" @loadedmetadata="onVideoMetadataLoaded"
                        style="object-fit: contain;" :style="{ imageRendering: 'pixelated' }"></video>

                    <canvas ref="canvasElement" class="position-absolute"
                        :style="`left: ${displayArea.left}px; top: ${displayArea.top}px; width: ${displayArea.width}px; height: ${displayArea.height}px;`"></canvas>

                </div>

                <!-- 拍照模式选择 -->
                <div class="d-flex position-absolute" style="bottom: 18px; left: 50%; transform: translateX(-50%)">
                    <v-btn-toggle rounded="xl" v-model="takePhotoModel" mandatory base-color="grey-darken-1"
                        style="height: 30px;" :disabled="takedPhotos.length > 0">
                        <v-btn v-for="value in takePhotoModelOptions" :key="value.value" :value="value.value"
                            :text="value.text" flat color="primary" />
                    </v-btn-toggle>
                </div>
            </div>

            <!-- 控制区域 -->
            <v-sheet class="pa-5">

                <v-select v-model="currentCamera" :items="cameras" item-title="label" item-value="deviceId"
                    label="当前摄像头" density="compact" :disabled="!enabled"
                    style="max-width: 360px; margin: 0 auto;"></v-select>

                <div class="d-flex justify-space-around align-center">

                    <!-- 相册 -->
                    <v-btn icon size="large" class="bg-grey-darken-3">
                        <v-icon>mdi-image</v-icon>
                        <input ref="fileInput" type="file" accept="image/*" style="display: none" />
                    </v-btn>

                    <!-- 拍照 -->
                    <v-badge bordered location="top right" color="error" :content="takedPhotos.length"
                        :model-value="takePhotoModel === 'multiple' ? true : false">
                        <v-btn icon size="x-large" class="bg-grey-darken-3" @click="takePhoto()" :disabled="!enabled">
                            <v-icon size="large">mdi-camera</v-icon>
                        </v-btn>
                    </v-badge>

                    <!-- 确认按钮 -->
                    <v-btn icon size="x-large" class="bg-grey-darken-3" :disabled="takedPhotos.length === 0"
                        v-if="takePhotoModel === 'multiple'" @click="confirmMultiplePhotos">
                        <v-icon size="large">mdi-check</v-icon>
                    </v-btn>

                    <!-- 闪光灯控制 -->
                    <v-btn icon size="large" class="bg-grey-darken-3" @click="toggleTorch()">
                        <v-icon>mdi-flashlight-off</v-icon>
                    </v-btn>
                </div>
            </v-sheet>

        </v-main>
    </v-app>
</template>

<style scoped></style>

<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, onDeactivated, watch, ref } from 'vue'
import { toggle, check } from "@sosweetham/tauri-plugin-torch-api";
import { useRouter } from 'vue-router'

async function toggleTorch() {
    const isTorchOn = await check()
    if (isTorchOn) {
        await toggle(false)
    } else {
        await toggle(true)
    }
}

// 导入摄像头相关功能
import {
    currentCamera,
    facingMode,
    stream,
    enabled,
    cameras,
    stop,
    setupCanvas,
    updateContainerSize,
    restart
} from './ts/camera-media'

// 导入拍照相关功能
import {
    takePhoto,
    takedPhotos,
    takePhotoModel,
    takePhotoModelOptions,
    videoElement,
} from './ts/camera'

// 导入边缘检测相关功能
import {
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
    displayArea,
    startVideoProcessing,
    stopVideoProcessing,
    initializeOpenCV,
    resetDetectionState
} from './ts/camera-detection'

const router = useRouter()

// 监听拍照新增照片
watch(() => takedPhotos.value.length, (newLength) => {
    // 单张拍照模式，拍照后直接跳转到编辑页面
    if (takePhotoModel.value === 'single' && newLength == 1) {
        router.push({
            name: 'ocr-editor',
            query: { photos: JSON.stringify(takedPhotos.value) }
        })
    }
})

/**
 * 确认多张拍照并跳转到编辑器
 */
const confirmMultiplePhotos = () => {
    if (takedPhotos.value.length > 0) {
        router.push({
            name: 'ocr-editor',
            query: { photos: JSON.stringify(takedPhotos.value) }
        })
    }
}

/**
 * 画布元素
 */
const canvasElement = ref<HTMLCanvasElement>()

/**
 * 画布上下文
 */
const ctx = ref<CanvasRenderingContext2D | null>(null)

/**
 * video与canvas容器
 */
const videoContainerRef = ref<HTMLElement>()

// 监听显示区域变化，更新canvas尺寸
watch(() => displayArea.value, (newArea) => {
    ctx.value = setupCanvas(canvasElement.value, newArea.width, newArea.height)
}, { deep: true })

/**
 * 视频元数据加载完成
 */
const onVideoMetadataLoaded = () => {
    if (videoElement.value && videoContainerRef.value) {

        takedPhotos.value = []

        videoWidth.value = videoElement.value.videoWidth
        videoHeight.value = videoElement.value.videoHeight

        updateContainerSize(videoContainerRef.value, containerWidth, containerHeight)
        ctx.value = setupCanvas(canvasElement.value, displayArea.value.width, displayArea.value.height)

        if (ctx.value && videoElement.value && canvasElement.value) {
            startVideoProcessing(videoElement.value, canvasElement.value, ctx.value, stream.value)
        }
    }
}

const handleResize = () => updateContainerSize(videoContainerRef.value, containerWidth, containerHeight)

// 初始化和清理
onMounted(async () => {
    console.log('onMounted')

    // 初始化OpenCV
    await initializeOpenCV()

    // 监听窗口大小变化并初始化容器尺寸
    window.addEventListener('resize', handleResize)
    handleResize()
})

onUnmounted(() => {
    console.log('onUnmounted')

    stopVideoProcessing()
    resetDetectionState()
    stop()
    window.removeEventListener('resize', handleResize)
})

onDeactivated(() => {
    console.log('onDeactivated')

    // 停止所有处理和清理资源
    stopVideoProcessing()
    resetDetectionState()
    stop()
})


onUpdated(() => {
    console.log('onUpdated')
    restart()
})

</script>
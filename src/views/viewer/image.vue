<!-- 图片预览器 -->
<template>
    <v-app>
        <v-main class="d-flex flex-column overflow-hidden main-no-scroll">
            <!-- 顶部导航栏 -->
            <v-app-bar :elevation="0" color="transparent">
                <v-btn icon="mdi-arrow-left" @click="$router.back()" variant="text" />
                <v-app-bar-title>{{ title }}</v-app-bar-title>
                <v-spacer />
                <v-btn icon="mdi-share-variant" @click="shareImage" variant="text" />
                <v-btn icon="mdi-open-in-app" @click="openImagePath" variant="text" />
            </v-app-bar>

            <!-- 图片显示区域 -->
            <div class="image-container" ref="imageContainer" @wheel.prevent="handleWheel" @mousedown="handleMouseDown"
                @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
                <v-img v-if="imagePath" :src="imageUrl" :class="['main-image', { 'image-loading': isLoading }]"
                    :style="imageStyles" @load="onImageLoad" @error="onImageError"
                    @touchstart.prevent="handleTouchStart" @touchmove.prevent="handleTouchMove"
                    @touchend.prevent="handleTouchEnd" />
                <v-overlay v-model="isLoading" class="align-center justify-center">
                    <v-progress-circular indeterminate />
                </v-overlay>
                <div v-if="!imagePath" class="error-container">
                    <v-icon size="64" color="grey">mdi-image-off</v-icon>
                    <p class="text-grey mt-2">无法加载图片</p>
                </div>
            </div>

            <!-- 底部工具栏 -->
            <v-sheet v-if="imagePath" class="toolbar-container" rounded="lg" elevation="2">
                <div class="d-flex justify-center align-center px-4 py-2">
                    <v-tooltip location="top" text="左旋转">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-rotate-left" variant="text" @click="rotateLeft" />
                        </template>
                    </v-tooltip>
                    <v-tooltip location="top" text="右旋转">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-rotate-right" variant="text" @click="rotateRight" />
                        </template>
                    </v-tooltip>
                    <v-tooltip location="top" text="放大">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-magnify-plus" variant="text" @click="zoomIn" />
                        </template>
                    </v-tooltip>
                    <v-tooltip location="top" text="缩小">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-magnify-minus" variant="text" @click="zoomOut" />
                        </template>
                    </v-tooltip>
                    <v-tooltip location="top" text="重置">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-fit-to-screen" variant="text" @click="resetZoom" />
                        </template>
                    </v-tooltip>
                </div>
            </v-sheet>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { useSnackbar } from '@/components/global/snackbarService'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

import { convertFileSrc } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import { shareFile } from "@choochmeque/tauri-plugin-sharekit-api"

// 路由实例
const route = useRoute();

// 响应式数据
const imagePath = ref<string>('');
const imageUrl = ref<string>('');
const rotation = ref<number>(0);
const scale = ref<number>(1);
const isLoading = ref<boolean>(true);
const imageContainer = ref<HTMLElement | null>(null);
const title = ref<string>('图片预览');

// 触摸相关状态
const lastTouchDistance = ref<number>(0);
const lastTouchX = ref<number>(0);
const lastTouchY = ref<number>(0);
const isDragging = ref<boolean>(false);
const translateX = ref<number>(0);
const translateY = ref<number>(0);

// 计算样式
const imageStyles = computed(() => {
    return {
        transform: `translate(${translateX.value}px, ${translateY.value}px) rotate(${rotation.value}deg) scale(${scale.value})`,
        transition: isDragging.value ? 'none' : 'transform 0.3s ease',
        cursor: isDragging.value ? 'grabbing' : (scale.value > 1 ? 'grab' : 'default')
    };
});

// 组件挂载时获取路径参数
onMounted(() => {
    const pathParam = route.query.path as string;
    if (pathParam) {
        imagePath.value = pathParam;
        imageUrl.value = convertFileSrc(pathParam);
    }
});

// 事件处理函数
const handleWheel = (event: WheelEvent) => {
    const delta = event.deltaY;
    if (delta < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
};

// 触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        lastTouchDistance.value = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    } else if (event.touches.length === 1) {
        isDragging.value = true;
        lastTouchX.value = event.touches[0].clientX;
        lastTouchY.value = event.touches[0].clientY;
    }
};

const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        const delta = distance - lastTouchDistance.value;
        if (Math.abs(delta) > 10) {
            if (delta > 0) {
                zoomIn();
            } else {
                zoomOut();
            }
            lastTouchDistance.value = distance;
        }
    } else if (event.touches.length === 1 && isDragging.value) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - lastTouchX.value;
        const deltaY = touch.clientY - lastTouchY.value;
        translateX.value += deltaX;
        translateY.value += deltaY;
        lastTouchX.value = touch.clientX;
        lastTouchY.value = touch.clientY;
    }
};

const handleTouchEnd = () => {
    isDragging.value = false;
    lastTouchDistance.value = 0;
};

// 鼠标事件处理
const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 0) { // 只响应左键
        isDragging.value = true;
        lastTouchX.value = event.clientX;
        lastTouchY.value = event.clientY;
        event.preventDefault(); // 阻止默认行为
    }
};

const handleMouseMove = (event: MouseEvent) => {
    if (isDragging.value) {
        event.preventDefault(); // 阻止默认行为
        const deltaX = event.clientX - lastTouchX.value;
        const deltaY = event.clientY - lastTouchY.value;

        // 添加移动限制，防止过度拖动
        const maxTranslate = (scale.value - 1) * 1000; // 根据缩放比例计算最大移动距离
        translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateX.value + deltaX));
        translateY.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateY.value + deltaY));

        lastTouchX.value = event.clientX;
        lastTouchY.value = event.clientY;
    }
};

const handleMouseUp = (event?: MouseEvent) => {
    if (isDragging.value) {
        isDragging.value = false;
        event?.preventDefault();
    }
};

// 图片加载事件处理
const onImageLoad = () => {
    isLoading.value = false;
    console.log('图片加载成功:', imageUrl.value);
};

const onImageError = () => {
    isLoading.value = false;
    console.error('图片加载失败:', imagePath.value);
};

// 图片操作函数
const rotateLeft = () => {
    rotation.value = (rotation.value - 90) % 360;
};

const rotateRight = () => {
    rotation.value = (rotation.value + 90) % 360;
};

const zoomIn = () => {
    if (scale.value < 5) {
        scale.value = Math.min(5, scale.value + 0.2);
    }
};

const zoomOut = () => {
    if (scale.value > 0.2) {
        scale.value = Math.max(0.2, scale.value - 0.2);
    }
};

const resetZoom = () => {
    scale.value = 1;
    rotation.value = 0;
    translateX.value = 0;
    translateY.value = 0;
};

// 分享图片
const shareImage = async () => {
    try {
        await shareFile(imagePath.value, { title: 'share file' });
    } catch (error) {
        useSnackbar().error(error as string);
    }
};

// 调用外部默认程序打开图片
const openImagePath = async () => {
    try {
        await openPath(imagePath.value);
    } catch (error) {
        // TODO: 适配安卓、ios
        useSnackbar().error('抱歉，当前系统暂不支持，请等待后续适配！');
    }
};
</script>

<style scoped>
.image-container {
    position: relative;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    background-color: rgba(0, 0, 0, 0.02);
}

.main-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
}

.image-loading {
    opacity: 0.5;
}

.error-container {
    text-align: center;
}

.toolbar-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
    .toolbar-container {
        background: rgba(30, 30, 30, 0.9);
    }
}
</style>
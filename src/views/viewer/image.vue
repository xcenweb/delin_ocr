<!-- 图片预览器 -->
<template>
    <v-app>

        <!-- 顶部导航栏 -->
        <v-app-bar :elevation="0" color="transparent" flat>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>{{ title }}</v-app-bar-title>
            <v-spacer />
            <v-btn icon="mdi-share-variant" @click="shareImage" />
            <v-btn icon="mdi-open-in-app" @click="openImagePath" />
        </v-app-bar>

        <v-main class="d-flex flex-column overflow-hidden">
            <!-- 图片显示区域 -->
            <v-sheet class="flex-grow-1 d-flex justify-center align-center overflow-hidden position-relative"
                color="background" @wheel.prevent="handleWheel" @mousedown="handleMouseDown"
                @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
                <v-img v-if="imagePath" :src="imageUrl" :class="['main-image', { 'image-loading': isLoading }]"
                    :style="imageStyles" @load="onImageLoad" @error="onImageError"
                    @touchstart.prevent="handleTouchStart" @touchmove.prevent="handleTouchMove"
                    @touchend.prevent="handleTouchEnd" contain />

                <v-overlay v-model="isLoading" class="align-center justify-center" contained>
                    <v-progress-circular indeterminate />
                </v-overlay>

                <v-sheet v-if="!imagePath" class="d-flex flex-column align-center justify-center text-center pa-4"
                    color="transparent">
                    <v-icon size="64" color="grey">mdi-image-off</v-icon>
                    <p class="text-grey mt-2">无法加载图片</p>
                </v-sheet>
            </v-sheet>
        </v-main>

        <!-- 底部工具栏 -->
        <v-bottom-navigation v-if="imagePath" grow>
            <v-btn icon="mdi-rotate-left" @click="rotateLeft" />
            <v-btn icon="mdi-rotate-right" @click="rotateRight" />
            <v-btn icon="mdi-magnify-plus" @click="zoomIn" />
            <v-btn icon="mdi-magnify-minus" @click="zoomOut" />
            <v-btn icon="mdi-fit-to-screen" @click="resetZoom" />
        </v-bottom-navigation>
    </v-app>
</template>

<script setup lang="ts">
import { useSnackbar } from '@/components/global/snackbarService'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { convertFileSrc } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import { shareFile } from "@choochmeque/tauri-plugin-sharekit-api"
import mime from 'mime';

// 路由实例
const route = useRoute();

// 响应式数据
const imagePath = ref<string>('');
const imageUrl = ref<string>('');
const rotation = ref<number>(0);
const scale = ref<number>(1);
const isLoading = ref<boolean>(true);
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
        await shareFile(imagePath.value, {
            mimeType: mime.getType(imagePath.value)!,
            title: 'share file'
        });
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
.main-image {
    user-select: none;
    -webkit-user-drag: none;
}

.image-loading {
    opacity: 0.5;
}

@media (prefers-color-scheme: dark) {
    .toolbar-container {
        background: rgba(30, 30, 30, 0.9);
    }
}
</style>

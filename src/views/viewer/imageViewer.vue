<!-- 图片预览器 -->
<template>
    <v-app>
        <v-main class="d-flex flex-column overflow-hidden main-no-scroll">
            <!-- 顶部导航栏 -->
            <v-app-bar color="transparent">
                <v-btn icon="mdi-arrow-left" @click="$router.back()" />
                <v-app-bar-title>图片预览</v-app-bar-title>
                <v-spacer />
                <v-btn icon="mdi-share-variant" @click="shareImage" />
            </v-app-bar>

            <!-- 图片显示区域 -->
            <div class="position-relative flex-grow-1 d-flex align-center justify-center pa-4">
                <v-img
                    v-if="imagePath"
                    :src="imageUrl"
                    class="w-100 h-100"
                    :style="{ ...imageTransform, objectFit: 'contain' }"
                    @load="onImageLoad"
                    @error="onImageError"
                />
                <div v-else class="text-center">
                    <v-icon size="64" color="grey">mdi-image-off</v-icon>
                    <p class="text-grey mt-2">无法加载图片</p>
                </div>
            </div>

            <!-- 底部操作栏 -->
            <v-sheet class="py-2" v-if="imagePath">
                <div class="d-flex justify-center align-center mx-5 my-2">
                    <v-btn prepend-icon="mdi-rotate-left" variant="text" size="small" text="左旋转" stacked @click="rotateLeft" />
                    <v-btn prepend-icon="mdi-rotate-right" variant="text" size="small" text="右旋转" stacked @click="rotateRight" />
                    <v-btn prepend-icon="mdi-magnify-plus" variant="text" size="small" text="放大" stacked @click="zoomIn" />
                    <v-btn prepend-icon="mdi-magnify-minus" variant="text" size="small" text="缩小" stacked @click="zoomOut" />
                    <v-btn prepend-icon="mdi-fit-to-screen" variant="text" size="small" text="适应" stacked @click="resetZoom" />
                </div>
            </v-sheet>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { convertFileSrc } from '@tauri-apps/api/core';

// 路由实例
const route = useRoute();

// 响应式数据
const imagePath = ref<string>('');
const imageUrl = ref<string>('');
const rotation = ref<number>(0);
const scale = ref<number>(1);
const imageLoaded = ref<boolean>(false);

// 计算图片变换样式
const imageTransform = computed(() => {
    return {
        transform: `rotate(${rotation.value}deg) scale(${scale.value})`,
        transition: 'transform 0.3s ease'
    };
});

// 组件挂载时获取路径参数
onMounted(() => {
    const pathParam = route.query.path as string;
    if (pathParam) {
        imagePath.value = pathParam;
        // 使用 Tauri 的 convertFileSrc 来转换文件路径为可访问的 URL
        imageUrl.value = convertFileSrc(pathParam);
    }
});

// 图片加载成功
const onImageLoad = () => {
    imageLoaded.value = true;
    console.log('图片加载成功:', imagePath.value);
};

// 图片加载失败
const onImageError = () => {
    imageLoaded.value = false;
    console.error('图片加载失败:', imagePath.value);
};

// 左旋转
const rotateLeft = () => {
    rotation.value -= 90;
};

// 右旋转
const rotateRight = () => {
    rotation.value += 90;
};

// 放大
const zoomIn = () => {
    if (scale.value < 10) {
        scale.value += 0.5;
    }
};

// 缩小
const zoomOut = () => {
    if (scale.value > 0.1) {
        scale.value -= 0.1;
    }
};

// 重置缩放
const resetZoom = () => {
    scale.value = 1;
    rotation.value = 0;
};

// 分享图片
const shareImage = () => {
    // TODO: 实现分享功能
    console.log('分享图片:', imagePath.value);
};

</script>

<style scoped>
.main-no-scroll {
    height: 100vh;
}

.v-img {
    transition: transform 0.3s ease;
}
</style>
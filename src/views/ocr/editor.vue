<!-- 通用编辑器 -->
<template>
    <v-app>
        <v-main class="d-flex flex-column overflow-hidden main-no-scroll">

            <v-app-bar :color="editorMode === 'edit' ? '' : 'transparent'">
                <v-btn icon @click="$router.back()" v-if="editorMode == 'edit'">
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <v-app-bar-title>
                    {{ editorMode === 'edit' ? '编辑' : '' }}
                </v-app-bar-title>
            </v-app-bar>

            <!-- 多图片 -->
            <z-swiper class="h-100 w-100 position-relative flex-grow-1" space-between="32px" :slides-per-view="1.1"
                centered-slides @slideChange="onSlideChange" @swiper="onSwiper($event)" v-show="editorMode === 'edit'">
                <z-swiper-item v-for="(image, i) in imageList" :key="i">
                    <v-img :src="image.processedSrc || image.src" class="w-100 h-100" style="object-fit: contain;" />
                </z-swiper-item>
            </z-swiper>

            <!-- 矫正模式下的图片选择框 -->
            <div class="position-relative flex-grow-1 ma-5" ref="containerRef" v-if="editorMode === 'crop'">
                <!-- 图片容器 -->
                <div class="position-absolute overflow-hidden w-100 h-100 top-0 left-0" ref="imageContainerRef">
                    <v-img :src="currentImage.src" ref="imageRef" @load="onImageLoad" class="w-100 h-100"
                        style="object-fit: contain;" />

                    <!-- 遮罩层 -->
                    <svg class="mask-layer position-absolute" :style="svgStyle"
                        :viewBox="`0 0 ${displayArea.width} ${displayArea.height}`" @pointerdown="onMaskPointerDown"
                        @pointermove="onMaskPointerMove" @pointerup="onMaskPointerUp">

                        <defs>
                            <mask id="selection-mask">
                                <rect x="0" y="0" :width="displayArea.width" :height="displayArea.height"
                                    fill="white" />
                                <path :d="selectionPath" fill="black" />
                            </mask>
                        </defs>

                        <!-- 遮罩 -->
                        <rect x="0" y="0" :width="displayArea.width" :height="displayArea.height" fill="rgba(0,0,0,0.5)"
                            mask="url(#selection-mask)" />

                        <!-- 选择框 -->
                        <path :d="selectionPath" fill="none" stroke="white" stroke-width="2" />

                        <!-- 角点 -->
                        <circle v-for="(point, index) in displayPoints" :key="index" :cx="point.x" :cy="point.y" r="6"
                            fill="white" @pointerdown="(e) => onCornerPointerDown(e, index)" class="handle-point" />

                        <!-- 边中点 -->
                        <rect v-for="(midPoint, index) in displayMidPoints" :key="'mid-' + index" :x="midPoint.x - 12.5"
                            :y="midPoint.y - 5" width="25" height="5" fill="white"
                            @pointerdown="(e) => onMidPointPointerDown(e, index)" class="handle-point"
                            :transform="`rotate(${midPoint.angle}, ${midPoint.x}, ${midPoint.y})`" />
                    </svg>
                </div>
            </div>

            <!-- 编辑器主操作栏 -->
            <v-sheet class="pt-2" v-if="editorMode === 'edit'">

                <!-- swiper控制 -->
                <div class="text-center pb-2">
                    <v-btn icon="mdi-chevron-left" size="x-small"
                        @click="() => swiperInstance['slidePrev'].slidePrev()" />
                    <span class="mx-2">{{ swiperslideIn + 1 }}/{{ imageList.length }}</span>
                    <v-btn icon="mdi-chevron-right" size="x-small"
                        @click="() => swiperInstance['slideNext'].slideNext()" />
                </div>

                <!-- 滤镜列表 -->
                <v-item-group v-model="selectedFilter" mandatory>
                    <v-row class="flex-nowrap overflow-x-auto pr-4 pb-1 pl-5 pr-8">
                        <v-col cols="3" md="2" lg="2" v-for="(f, index) in filterList" :key="index"
                            class="pl-3 pr-0 pt-4 pb-4">
                            <v-item v-slot="{ isSelected, toggle }">
                                <v-card :elevation="isSelected ? 8 : 2" :class="{ 'border-primary': isSelected }"
                                    @click="toggle" :ripple="true">
                                    <v-img :src="f.cover" aspect-ratio="1" cover>
                                        <v-card-subtitle
                                            class="position-absolute bottom-0 d-inline-block text-caption w-100 text-center pt-1"
                                            style="background: rgba(0,0,0,0.7);">
                                            <p>{{ f.name }}</p>
                                        </v-card-subtitle>
                                    </v-img>
                                </v-card>
                            </v-item>
                        </v-col>
                    </v-row>
                </v-item-group>

                <!-- 按钮栏 -->
                <div class="d-flex justify-space-between align-center pa-3">
                    <v-btn prepend-icon="mdi-crop-free" variant="text" size="small" stacked text="矫正"
                        @click="editorModeChange('crop', 'crop-enter')" />
                    <v-btn prepend-icon="mdi-pen" variant="text" size="small" stacked text="水印" />
                    <v-spacer />
                    <v-btn prepend-icon="mdi-check" text="保存全部" @click="saveAllImages" />
                </div>
            </v-sheet>

            <!-- 矫正 -->
            <v-sheet class="py-2" v-if="editorMode === 'crop'">
                <div class="d-flex justify-center align-center mx-5 my-2">
                    <v-btn icon="mdi-close" size="large" @click="editorModeChange('edit', 'crop-exit')" />
                    <v-spacer />
                    <v-btn prepend-icon="mdi-rotate-left" variant="text" size="x-small" text="左旋转" stacked />
                    <v-btn prepend-icon="mdi-rotate-right" variant="text" size="x-small" text="右旋转" stacked />
                    <v-btn prepend-icon="mdi-selection-search" variant="text" size="x-small" text="Ai框选" stacked />
                    <v-btn prepend-icon="mdi-undo" variant="text" size="x-small" text="重置框选" stacked />
                    <v-spacer />
                    <v-btn icon="mdi-check" size="large" @click="editorModeChange('edit', 'crop-confirm')" />
                </div>
            </v-sheet>
        </v-main>

        <LeavePopup :effect="editorMode === 'edit'" :onBeforeLeave="handleBeforeLeave" />

    </v-app>
</template>

<script setup lang="ts">
import { ZSwiper, ZSwiperItem } from '@zebra-ui/swiper';
import '@zebra-ui/swiper/index.scss'

import LeavePopup from '@/components/leavePopup.vue';

import { useEditor } from '@/views/ocr/ts/editor';
import { useEditorCrop } from '@/views/ocr/ts/editor-crop';
import { useEditorFilter } from '@/views/ocr/ts/editor-filter';

import { saveBlobUrlToLocal } from '@/utils/fileSystem';
import { BaseDirectory } from '@tauri-apps/plugin-fs';

// 使用编辑器通用功能
const {
    editorMode,
    imageList,
    swiperInstance,
    swiperslideIn,
    currentImage,
    editorModeChange: baseEditorModeChange,
    onSwiper,
    onSlideChange: baseOnSlideChange
} = useEditor();

// 使用透视矫正功能
const {
    containerRef,
    imageContainerRef,
    imageRef,
    displayArea,
    svgStyle,
    displayPoints,
    displayMidPoints,
    selectionPath,
    onImageLoad,
    onCornerPointerDown,
    onMidPointPointerDown,
    onMaskPointerDown,
    onMaskPointerUp,
    onMaskPointerMove,
    handleCropModeChange
} = useEditorCrop(imageList, swiperslideIn, currentImage, editorMode);

// 使用滤镜功能
const {
    selectedFilter,
    filterList,
    syncFilterWithImage,
    resetFilterToOriginal
} = useEditorFilter(imageList, swiperslideIn);

// 编辑模式切换处理
const editorModeChange = (toMode: string, event?: string) => {
    handleCropModeChange(toMode, event);

    if (event === 'crop-confirm') {
        resetFilterToOriginal();
    }

    baseEditorModeChange(toMode, event);
};

// swiper滑动切换事件处理
const onSlideChange = (swiper: any) => {
    baseOnSlideChange(swiper);
    syncFilterWithImage();
};

// 生成文件夹路径
const generateFolderPath = () => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0');
    const timestampSuffix = Date.now().toString().slice(-6);
    return `user/file/扫描文件_${dateStr}_${timestampSuffix}`;
};

// 保存全部图片
const saveAllImages = async () => {
    const folderPath = generateFolderPath();
    const totalImages = imageList.value.length;
    console.log(`开始保存 ${totalImages} 张图片到: ${folderPath}`);
    try {
        for (let i = 0; i < totalImages; i++) {
            const image = imageList.value[i];
            const imageSrc = image.processedSrc || image.src;

            if (!imageSrc) continue;

            const fileName = `${Date.now() + i}.jpg`;
            const result = await saveBlobUrlToLocal(imageSrc, fileName, folderPath, BaseDirectory.AppData);

            if (result) {
                console.log(`图片 ${i + 1} 保存成功: ${result}`);
            } else {
                console.error(`图片 ${i + 1} 保存失败`);
            }

            if (i < totalImages - 1) {
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        }
        console.log('所有图片保存完成');
    } catch (error) {
        console.error('保存图片时发生错误:', error);
    }
};

// 处理浏览器物理返回键的闭包
const handleBeforeLeave = (): boolean => {
    // 如果不在edit模式，先切换到edit模式
    if (editorMode.value !== 'edit') {
        editorModeChange('edit', 'exit');
        return false; // 阻止路由离开
    }
    // 在edit模式下，允许继续路由离开流程
    return true;
};

</script>

<style scoped>
.border-primary {
    border: 2px solid rgb(var(--v-theme-primary));
}

.main-no-scroll {
    height: 100vh;
}

.mask-layer,
.handle-point {
    touch-action: none;
}

.mask-layer {
    pointer-events: all;
}

.handle-point {
    cursor: pointer;
}
</style>
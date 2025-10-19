<template>
    <v-app>

        <v-app-bar :color="Editor.currentEditorMode.value === 'edit' ? '' : 'transparent'">
            <v-btn icon="mdi-arrow-left" @click="Editor.goback()" />
            <v-app-bar-title :text="Editor.currentEditorMode.value === 'edit' ? '编辑' : ''" />
        </v-app-bar>

        <v-main class="d-flex flex-column overflow-hidden">

            <!-- swiper -->
            <z-swiper class="h-100 w-100 position-relative flex-grow-1" space-between="32px" :slides-per-view="1.1"
                centered-slides @slideChange="Editor.onSlideChange" @swiper="Editor.onSwiper"
                v-show="Editor.currentEditorMode.value === 'edit'">
                <z-swiper-item v-for="(image, i) in Editor.imageList.value" :key="i">
                    <v-img :src="image.filtered_src || image.persped_src || image.src" class="w-100 h-100"
                        style="object-fit: contain;" />
                </z-swiper-item>
            </z-swiper>

            <!-- 矫正模式 -->
            <div class="position-relative flex-grow-1 ma-5" v-if="Editor.currentEditorMode.value === 'persp'"
                ref="containerRef">
                <div class="position-absolute overflow-hidden w-100 h-100 top-0 left-0" ref="imageContainerRef">

                    <!-- 图片 -->
                    <v-img :src="Editor.currentImage.value.src" class="w-100 h-100" style="object-fit: contain;"
                        ref="imageRef" @load="PerspCrop.onImageLoad" />

                    <!-- svg -->
                    <svg class="mask-layer position-absolute" :style="svgStyle"
                        :viewBox="`0 0 ${displayArea.width} ${displayArea.height}`"
                        @pointerdown="PerspCrop.onMaskPointerDown" @pointermove="PerspCrop.onMaskPointerMove"
                        @pointerup="PerspCrop.onMaskPointerUp" v-if="Persp.cropCurrentImage?.value">

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
                        <path :d="selectionPath" fill="none" stroke="white" stroke-opacity="0.8" stroke-width="1.5"
                            stroke-dasharray="6,4" />

                        <!-- 角点 -->
                        <circle v-for="(point, index) in displayPoints" :key="index" :cx="point.x" :cy="point.y" r="4.5"
                            fill="white" fill-opacity="0.8" stroke="rgba(0,0,0,0)" stroke-width="5" @pointerdown="(e) => PerspCrop.onCornerPointerDown(e, index)"
                            class="handle-point" />

                        <!-- 边中点 -->
                        <rect v-for="(midPoint, index) in displayMidPoints" :key="'mid-' + index" :x="midPoint.x - 12.5"
                            :y="midPoint.y - 3" width="25" height="3.5" fill="white" fill-opacity="0.7"
                            @pointerdown="(e) => PerspCrop.onMidPointPointerDown(e, index)" class="handle-point"
                            :transform="`rotate(${midPoint.angle}, ${midPoint.x}, ${midPoint.y})`" />
                    </svg>
                </div>
            </div>

            <!-- 编辑器主操作栏 -->
            <v-sheet class="pt-2" v-if="Editor.currentEditorMode.value === 'edit'">

                <!-- swiper 控制按钮 -->
                <div class="text-center pb-1" v-if="Editor.imageList.value.length > 1">
                    <v-btn icon="mdi-chevron-left" size="28px" @click="Editor.swiperInstance.value?.slidePrev()" />
                    <span class="mx-2">{{ Editor.swiperslideIn.value + 1 }} / {{ Editor.imageList.value.length }}</span>
                    <v-btn icon="mdi-chevron-right" size="28px" @click="Editor.swiperInstance.value?.slideNext()" />
                </div>

                <!-- 滤镜列表 -->
                <v-item-group v-model="Filter.currentFilter.value" mandatory>
                    <v-row class="flex-nowrap overflow-x-auto pb-1 pl-5 pr-8">
                        <v-col cols="3" sm="2" md="2" lg="1" v-for="(f, index) in Filter.filterList.value" :key="index"
                            class="pl-3 pr-0 pt-4 pb-2">
                            <v-item v-slot="{ isSelected, toggle }">
                                <v-card :elevation="isSelected ? 8 : 2" :class="{ 'border-primary': isSelected }"
                                    @click="toggle" :ripple="true">
                                    <v-img :src="f.cover" aspect-ratio="1" cover>
                                        <p style="background: rgba(0,0,0,0.6);" class=" position-absolute bottom-0
                                            d-inline-block text-caption w-100 text-center">{{ f.name }}</p>
                                    </v-img>
                                </v-card>
                            </v-item>
                        </v-col>
                    </v-row>
                </v-item-group>

                <!-- main 按钮栏 -->
                <div class="d-flex justify-space-between align-center pa-1 pl-3">
                    <v-btn prepend-icon="mdi-crop-free" variant="text" size="small" stacked text="矫正"
                        @click="Persp.enter()" />
                    <v-spacer />
                    <v-btn class="mr-3" prepend-icon="mdi-check" text="保存全部" @click="Editor.saveImages()" />
                </div>
            </v-sheet>

            <!-- 矫正 -->
            <v-sheet class="py-2" v-if="Editor.currentEditorMode.value === 'persp'">
                <div class="d-flex justify-center align-center mx-5 my-2">
                    <v-btn icon="mdi-close" size="large" @click="Persp.cancel()" />
                    <v-spacer />
                    <v-btn prepend-icon="mdi-rotate-left" variant="text" size="small" text="左旋转" stacked />
                    <v-btn prepend-icon="mdi-rotate-right" variant="text" size="small" text="右旋转" stacked />
                    <v-btn prepend-icon="mdi-selection-search" variant="text" size="small" text="Ai框选" stacked />
                    <v-spacer />
                    <v-btn icon="mdi-check" size="large" @click="Persp.confirm()" />
                </div>
            </v-sheet>
        </v-main>

        <leave-popup :leave="true" :dialog="Editor.currentEditorMode.value === 'edit'"
            @before-leave="Editor.onBeforeLeave" />
    </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import leavePopup from '@/components/leavePopup.vue'

import { ZSwiper, ZSwiperItem } from '@zebra-ui/swiper'
import '@zebra-ui/swiper/index.scss'

import * as Editor from './ts/editor'
import * as Filter from './ts/editor-filter'
import * as Persp from './ts/editor-persp'
import * as PerspCrop from './ts/editor-perspCrop'

const {
    containerRef,
    imageContainerRef,
    imageRef,
    displayArea,
    svgStyle,
    displayPoints,
    displayMidPoints,
    selectionPath,
} = PerspCrop

onMounted(() => {
    Editor.imageList.value = JSON.parse(history.state.images) || []
    console.log(Editor.imageList.value)
    PerspCrop.mount()
})

onUnmounted(() => {
    PerspCrop.unmount()
})
</script>

<style scoped>
.border-primary {
    border: 2px solid rgb(var(--v-theme-primary));
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
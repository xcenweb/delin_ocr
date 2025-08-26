<template>
    <v-app>
        <v-main class="d-flex flex-column">
            <v-app-bar>
                <v-btn icon @click="$router.replace({ name: 'ocr-camera' })">
                    <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <v-app-bar-title>区域选择</v-app-bar-title>
                <v-spacer></v-spacer>
                <v-btn @click="confirmSelection">确定</v-btn>
            </v-app-bar>

            <div class="position-relative flex-grow-1 ma-5" ref="containerRef">
                <!-- 图片容器 -->
                <div class="position-absolute overflow-hidden w-100 h-100 top-0 left-0" ref="imageContainerRef">
                    <v-img :src="imageUrl" ref="imageRef" @load="onImageLoad" class="w-100 h-100"
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

            <v-sheet class="pt-2 pb-2">
                <div class="d-flex justify-center align-center ml-5 mr-5 mb-2 mt-2">
                    <v-btn icon="mdi-close" size="large"></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn prepend-icon="mdi-rotate-left" variant="text" size="small" text="左旋转" stacked></v-btn>
                    <v-btn prepend-icon="mdi-rotate-right" variant="text" size="small" text="右旋转" stacked></v-btn>
                    <v-btn prepend-icon="mdi-select" variant="text" size="small" text="Ai框选" stacked></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-check" size="large" @click="imageUrl = 'https://picsum.photos/800/1200?1'"></v-btn>
                </div>
            </v-sheet>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 响应式数据
const imageUrl = ref('https://picsum.photos/1200/800');
const containerRef = ref<HTMLElement>();
const imageContainerRef = ref<HTMLElement>();
const imageRef = ref<HTMLImageElement>();
const imageWidth = ref(0);
const imageHeight = ref(0);
const containerWidth = ref(0);
const containerHeight = ref(0);

// 选择框的四个角点坐标（基于原始图片尺寸）
const points = ref([
    { x: 100, y: 100 }, // 左上
    { x: 700, y: 100 }, // 右上
    { x: 700, y: 500 }, // 右下
    { x: 100, y: 500 }, // 左下
]);

// 计算实际显示区域（object-fit: contain的显示区域）
const displayArea = computed(() => {
    if (!imageWidth.value || !imageHeight.value || !containerWidth.value || !containerHeight.value) {
        return { left: 0, top: 0, width: 0, height: 0, scaleX: 1, scaleY: 1 };
    }

    const isWider = (imageWidth.value / imageHeight.value) > (containerWidth.value / containerHeight.value);
    const width = isWider ? containerWidth.value : containerHeight.value * (imageWidth.value / imageHeight.value);
    const height = isWider ? containerWidth.value / (imageWidth.value / imageHeight.value) : containerHeight.value;

    return {
        left: isWider ? 0 : (containerWidth.value - width) / 2,
        top: isWider ? (containerHeight.value - height) / 2 : 0,
        width,
        height,
        scaleX: width / imageWidth.value,
        scaleY: height / imageHeight.value
    };
});

// SVG 样式
const svgStyle = computed(() =>
    `left: ${displayArea.value.left}px; top: ${displayArea.value.top}px; width: ${displayArea.value.width}px; height: ${displayArea.value.height}px;`
);

// 将原始坐标转换为显示坐标
const displayPoints = computed(() =>
    points.value.map(point => ({
        x: point.x * displayArea.value.scaleX,
        y: point.y * displayArea.value.scaleY
    }))
);

// 计算边的中点（显示坐标）
const displayMidPoints = computed(() =>
    displayPoints.value.map((point, index) => {
        const nextPoint = displayPoints.value[(index + 1) % 4];
        return {
            x: (point.x + nextPoint.x) / 2,
            y: (point.y + nextPoint.y) / 2,
            angle: Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI
        };
    })
);

// 计算选择框路径（使用显示坐标）
const selectionPath = computed(() =>
    `M ${displayPoints.value.map(p => `${p.x},${p.y}`).join(' L ')} Z`
);

// 拖拽状态
interface DragState {
    isDragging: boolean;
    type: 'corner' | 'mid' | 'move' | null;
    index: number;
    startX: number;
    startY: number;
    originalPoints: typeof points.value;
}

const dragState = ref<DragState>({
    isDragging: false,
    type: null,
    index: -1,
    startX: 0,
    startY: 0,
    originalPoints: [],
});

// 初始化拖拽状态
const initDragState = (e: PointerEvent, type: DragState['type'], index = -1) => {
    e.stopPropagation();
    dragState.value = {
        isDragging: true,
        type,
        index,
        startX: e.clientX,
        startY: e.clientY,
        originalPoints: [...points.value]
    };
};

// 图片加载完成
const onImageLoad = () => {
    if (!imageRef.value || !imageContainerRef.value) return;

    imageWidth.value = imageRef.value.naturalWidth;
    imageHeight.value = imageRef.value.naturalHeight;
    updateContainerSize();
};

// 事件处理
const onCornerPointerDown = (e: PointerEvent, index: number) => initDragState(e, 'corner', index);
const onMidPointPointerDown = (e: PointerEvent, index: number) => initDragState(e, 'mid', index);
const onMaskPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'path' && !target.getAttribute('fill')?.includes('rgba')) {
        initDragState(e, 'move');
    }
};
const onMaskPointerUp = () => { dragState.value.isDragging = false; };

// 坐标限制函数
const clampPoint = (x: number, y: number) => ({
    x: Math.max(0, Math.min(imageWidth.value, x)),
    y: Math.max(0, Math.min(imageHeight.value, y))
});

// 处理拖拽移动
const onMaskPointerMove = (e: PointerEvent) => {
    if (!dragState.value.isDragging) return;

    const scaledDx = (e.clientX - dragState.value.startX) / displayArea.value.scaleX;
    const scaledDy = (e.clientY - dragState.value.startY) / displayArea.value.scaleY;
    const { type, index, originalPoints } = dragState.value;

    if (type === 'corner') {
        // 移动角点
        points.value[index] = clampPoint(
            originalPoints[index].x + scaledDx,
            originalPoints[index].y + scaledDy
        );
    } else if (type === 'mid') {
        // 移动边的中点
        const nextIndex = (index + 1) % 4;
        const prevPoint = originalPoints[index];
        const nextPoint = originalPoints[nextIndex];

        // 计算边的垂直方向
        const edgeLength = Math.sqrt((nextPoint.x - prevPoint.x) ** 2 + (nextPoint.y - prevPoint.y) ** 2);
        const perpendicular = {
            x: -(nextPoint.y - prevPoint.y) / edgeLength,
            y: (nextPoint.x - prevPoint.x) / edgeLength
        };

        const moveDistance = scaledDx * perpendicular.x + scaledDy * perpendicular.y;

        // 更新两个端点
        points.value[index] = {
            x: prevPoint.x + perpendicular.x * moveDistance,
            y: prevPoint.y + perpendicular.y * moveDistance
        };
        points.value[nextIndex] = {
            x: nextPoint.x + perpendicular.x * moveDistance,
            y: nextPoint.y + perpendicular.y * moveDistance
        };
    } else if (type === 'move') {
        // 整体移动
        points.value = originalPoints.map(point =>
            clampPoint(point.x + scaledDx, point.y + scaledDy)
        );
    }
};

// 更新容器尺寸
const updateContainerSize = () => {
    if (!imageContainerRef.value) return;
    const rect = imageContainerRef.value.getBoundingClientRect();
    containerWidth.value = rect.width;
    containerHeight.value = rect.height;
};

// 确认选择
const confirmSelection = () => {
    console.log('Selected Points:', points.value);
};

// 生命周期
onMounted(() => {
    if (containerRef.value) {
        containerRef.value.style.touchAction = 'none';
    }
    window.addEventListener('resize', updateContainerSize);
    updateContainerSize();
});

onUnmounted(() => {
    window.removeEventListener('resize', updateContainerSize);
});
</script>

<style scoped>
.mask-layer {
    pointer-events: all;
    touch-action: none;
}

.handle-point {
    cursor: pointer;
    touch-action: none;
}
</style>
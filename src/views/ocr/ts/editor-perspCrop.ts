import { ref, computed } from 'vue'
import * as Persp from './editor-persp'

// DOM 元素引用
const containerRef = ref<HTMLElement>()
const imageContainerRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()

// 图片和容器尺寸
const imageWidth = ref(0)
const imageHeight = ref(0)
const containerWidth = ref(0)
const containerHeight = ref(0)

/** 拖拽状态接口 */
interface DragState {
    isDragging: boolean
    type: 'corner' | 'mid' | 'move' | null
    index: number
    startX: number
    startY: number
    originalPoints: any[]
}

/** 显示区域接口 */
interface DisplayArea {
    left: number
    top: number
    width: number
    height: number
    scaleX: number
    scaleY: number
}

/**
 * 计算图片在容器中的实际显示区域（object-fit: contain 效果）
 */
const displayArea = computed((): DisplayArea => {
    const defaultArea: DisplayArea = { left: 0, top: 0, width: 0, height: 0, scaleX: 1, scaleY: 1 }

    if (!imageWidth.value || !imageHeight.value || !containerWidth.value || !containerHeight.value) {
        return defaultArea
    }

    const imageRatio = imageWidth.value / imageHeight.value
    const containerRatio = containerWidth.value / containerHeight.value
    const isWider = imageRatio > containerRatio

    const width = isWider ? containerWidth.value : containerHeight.value * imageRatio
    const height = isWider ? containerWidth.value / imageRatio : containerHeight.value

    return {
        left: isWider ? 0 : (containerWidth.value - width) / 2,
        top: isWider ? (containerHeight.value - height) / 2 : 0,
        width,
        height,
        scaleX: width / imageWidth.value,
        scaleY: height / imageHeight.value
    }
})

/**
 * SVG 样式
 */
const svgStyle = computed(() =>
    `left: ${displayArea.value.left}px; top: ${displayArea.value.top}px; width: ${displayArea.value.width}px; height: ${displayArea.value.height}px;`
)

/**
 * 当前图片的选择框坐标点
 */
const points = computed({
    get: () => {
        return Persp.cropCurrentImage.value?.points || []
    },
    set: (newPoints) => {
        if (Persp.cropCurrentImage.value) {
            Persp.cropCurrentImage.value.points = newPoints
        }
    }
})

/**
 * 将原始坐标转换为显示坐标
 */
const displayPoints = computed(() =>
    points.value.map((point: any) => ({
        x: point.x * displayArea.value.scaleX,
        y: point.y * displayArea.value.scaleY
    }))
)

/**
 * 计算边的中点（显示坐标）
 */
const displayMidPoints = computed(() =>
    displayPoints.value.map((point: any, index: number) => {
        const nextPoint = displayPoints.value[(index + 1) % 4]
        return {
            x: (point.x + nextPoint.x) / 2,
            y: (point.y + nextPoint.y) / 2,
            angle: Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI
        }
    })
)

/**
 * 计算选择框路径（使用显示坐标）
 */
const selectionPath = computed(() =>
    `M ${displayPoints.value.map((p: any) => `${p.x},${p.y}`).join(' L ')} Z`
)

/** 拖拽状态 */
const dragState = ref<DragState>({
    isDragging: false,
    type: null,
    index: -1,
    startX: 0,
    startY: 0,
    originalPoints: []
})

/**
 * 初始化拖拽状态
 * @param e 指针事件
 * @param type 拖拽类型
 * @param index 拖拽点索引
 */
const initDragState = (e: PointerEvent, type: DragState['type'], index = -1): void => {
    e.stopPropagation()
    dragState.value = {
        isDragging: true,
        type,
        index,
        startX: e.clientX,
        startY: e.clientY,
        originalPoints: points.value.map(point => ({ x: point.x, y: point.y }))
    }
}

/**
 * 图片加载完成处理
 */
const onImageLoad = (): void => {
    if (!imageRef.value || !imageContainerRef.value) return

    imageWidth.value = imageRef.value.naturalWidth
    imageHeight.value = imageRef.value.naturalHeight
    updateContainerSize()
}

/** 事件处理函数 */
const onCornerPointerDown = (e: PointerEvent, index: number): void => initDragState(e, 'corner', index)
const onMidPointPointerDown = (e: PointerEvent, index: number): void => initDragState(e, 'mid', index)
const onMaskPointerDown = (e: PointerEvent): void => {
    const target = e.target as HTMLElement
    if (target.tagName === 'path' && !target.getAttribute('fill')?.includes('rgba')) {
        initDragState(e, 'move')
    }
}
const onMaskPointerUp = (): void => { dragState.value.isDragging = false }

/**
 * 坐标限制函数 - 限制在图片原始尺寸内
 * @param x X坐标
 * @param y Y坐标
 * @returns 限制后的坐标点
 */
const clampPoint = (x: number, y: number): any => ({
    x: Math.max(0, Math.min(imageWidth.value, x)),
    y: Math.max(0, Math.min(imageHeight.value, y))
})

/**
 * 处理拖拽移动事件
 * @param e 指针事件
 */
const onMaskPointerMove = (e: PointerEvent): void => {
    if (!dragState.value.isDragging || !Persp.cropCurrentImage.value) return

    // 将显示区域的像素差值转换为原始坐标系的差值
    const scaledDx = (e.clientX - dragState.value.startX) / displayArea.value.scaleX
    const scaledDy = (e.clientY - dragState.value.startY) / displayArea.value.scaleY
    const { type, index, originalPoints } = dragState.value

    if (type === 'corner') {
        // 移动角点
        const newPoints = [...points.value]
        newPoints[index] = clampPoint(
            originalPoints[index].x + scaledDx,
            originalPoints[index].y + scaledDy
        )
        points.value = newPoints
    } else if (type === 'mid') {
        // 移动边的中点
        const nextIndex = (index + 1) % 4
        const prevPoint = originalPoints[index]
        const nextPoint = originalPoints[nextIndex]

        // 计算边的垂直方向
        const edgeLength = Math.sqrt((nextPoint.x - prevPoint.x) ** 2 + (nextPoint.y - prevPoint.y) ** 2)
        const perpendicular = {
            x: -(nextPoint.y - prevPoint.y) / edgeLength,
            y: (nextPoint.x - prevPoint.x) / edgeLength
        }

        const moveDistance = scaledDx * perpendicular.x + scaledDy * perpendicular.y

        // 更新两个端点
        const newPoints = [...points.value]
        newPoints[index] = {
            x: prevPoint.x + perpendicular.x * moveDistance,
            y: prevPoint.y + perpendicular.y * moveDistance
        }
        newPoints[nextIndex] = {
            x: nextPoint.x + perpendicular.x * moveDistance,
            y: nextPoint.y + perpendicular.y * moveDistance
        }
        points.value = newPoints
    } else if (type === 'move') {
        // 整体移动选择框
        points.value = originalPoints.map((point: any) =>
            clampPoint(point.x + scaledDx, point.y + scaledDy)
        )
    }
}

/**
 * 更新容器尺寸
 */
const updateContainerSize = (): void => {
    if (!imageContainerRef.value) return
    const rect = imageContainerRef.value.getBoundingClientRect()
    containerWidth.value = rect.width
    containerHeight.value = rect.height
}

/** 监听容器尺寸变化 */
const resizeObserver = new ResizeObserver(() => {
    updateContainerSize()
})

// 生命周期
const mount = () => {
    if (containerRef.value) {
        containerRef.value.style.touchAction = 'none'
    }
    updateContainerSize()
    if (imageContainerRef.value) {
        resizeObserver.observe(imageContainerRef.value)
    }
}

const unmount = () => {
    resizeObserver.disconnect()
}

export {
    // DOM 引用
    containerRef,
    imageContainerRef,
    imageRef,

    // 计算属性
    displayArea,
    svgStyle,
    displayPoints,
    displayMidPoints,
    selectionPath,

    // 核心方法
    updateContainerSize,
    mount,
    unmount,

    // 事件处理方法
    onImageLoad,
    onCornerPointerDown,
    onMidPointPointerDown,
    onMaskPointerDown,
    onMaskPointerUp,
    onMaskPointerMove
}
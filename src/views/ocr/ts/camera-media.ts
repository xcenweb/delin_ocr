import { ref, shallowRef, reactive, watch } from 'vue'
import { useDevicesList, useUserMedia } from '@vueuse/core'

/**
 * 当前摄像头
 */
const currentCamera = shallowRef<string | undefined>()

/**
 * environment: 后置摄像头
 * user: 前置摄像头
 */
const facingMode = ref('environment')

// 摄像头相关
const constraints = reactive({
    video: {
        // width: { ideal: 720 },
        // height: { ideal: 1280 },
        frameRate: { ideal: 30 },
    } as MediaTrackConstraints,
    audio: false,
})

const { stream, enabled, stop, start, restart } = useUserMedia({ constraints })

// 获取摄像头列表
const { videoInputs: cameras } = useDevicesList({
    requestPermissions: true,
    constraints: constraints,
    onUpdated() {
        if (!cameras.value.find(i => i.deviceId === currentCamera.value)) {
            currentCamera.value = cameras.value[0]?.deviceId || undefined
        }
    },
})

// 监听 currentCamera 和 facingMode 的切换
watch([currentCamera, facingMode], () => {
    constraints.video.facingMode = facingMode.value
    constraints.video.deviceId = { exact: currentCamera.value }
    restart()
})

// 设置canvas尺寸和上下文
function setupCanvas(canvasElement: HTMLCanvasElement | undefined, width: number, height: number): CanvasRenderingContext2D | null {
    if (canvasElement && width > 0 && height > 0) {
        canvasElement.width = width
        canvasElement.height = height
        return canvasElement.getContext('2d', { willReadFrequently: true })
    }
    return null
}

// 更新容器尺寸
function updateContainerSize(containerRef: HTMLElement | undefined, containerWidth: any, containerHeight: any) {
    if (containerRef) {
        const containerRect = containerRef.getBoundingClientRect()
        containerWidth.value = containerRect.width
        containerHeight.value = containerRect.height
    }
}

export {
    // 响应式变量
    currentCamera,
    facingMode,
    constraints,
    stream,
    enabled,
    cameras,

    // 功能函数
    stop,
    start,
    restart,
    setupCanvas,
    updateContainerSize
}
// 摄像头、闪光灯控制

import { ref } from 'vue'
import { useDevicesList, useUserMedia } from '@vueuse/core'
import * as torch from '@sosweetham/tauri-plugin-torch-api'
import { useSnackbar } from '@/components/global/snackbarService'

const isTorchOn = ref(false)

/**
 * Toggle torch on/off
 */
const toggleTorch = async () => {
    try {
        await torch.toggle(!isTorchOn.value)
        isTorchOn.value = !isTorchOn.value
    } catch (error) {
        useSnackbar().error(error as string)
    }
}

/**
 * Setup canvas position and size based on video element
 * @param videoElement - The video element
 * @param overlayCanvas - The canvas element to position
 */
const setupCanvas = (videoElement: HTMLVideoElement, overlayCanvas: HTMLCanvasElement) => {
    if (!videoElement || !overlayCanvas) return

    // Get the actual display size and position of the video
    const videoRect = videoElement.getBoundingClientRect()
    const containerRect = videoElement.parentElement!.getBoundingClientRect()

    // Calculate the actual position and size of the video in the container
    const scaleX = videoRect.width / videoElement.videoWidth
    const scaleY = videoRect.height / videoElement.videoHeight
    const scale = Math.min(scaleX, scaleY)

    const actualWidth = videoElement.videoWidth * scale
    const actualHeight = videoElement.videoHeight * scale

    const offsetX = (containerRect.width - actualWidth) / 2
    const offsetY = (containerRect.height - actualHeight) / 2

    // Set the position and size of the canvas
    overlayCanvas.style.width = `${actualWidth}px`
    overlayCanvas.style.height = `${actualHeight}px`
    overlayCanvas.style.left = `${offsetX}px`
    overlayCanvas.style.top = `${offsetY + 0.143}px`

    // Set the actual drawing size of the canvas
    overlayCanvas.width = videoElement.videoWidth
    overlayCanvas.height = videoElement.videoHeight
}


/**
 * Camera constraints
 */
const constraints = {
    video: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        frameRate: { ideal: 30 },
    } as MediaTrackConstraints,
    audio: false,
}
const { videoInputs: cameras } = useDevicesList({
    requestPermissions: true,
    constraints: constraints,
    onUpdated() {
        constraints.video.deviceId = cameras.value.find(i => i.label.match(/back/i))?.deviceId || cameras.value[0]?.deviceId
    },
})
const { stream, enabled, stop, start } = useUserMedia({ constraints })

export {
    isTorchOn,
    stream,
    enabled,
    stop,
    start,
    toggleTorch,
    setupCanvas,
}

// 摄像头控制
import { useUserMedia } from '@vueuse/core'

/**
 * Setup canvas position and size based on video element
 * @param videoElement - The video element
 * @param overlayCanvas - The canvas element to position
 */
const setupCanvas = (videoElement: HTMLVideoElement, overlayCanvas: HTMLCanvasElement) => {
    if (!videoElement || !overlayCanvas) return

    // Get the actual display size and position of the video
    const videoRect = videoElement.getBoundingClientRect()
    const container = videoElement.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()

    // Calculate the actual position and size of the video in the container
    const scaleX = videoRect.width / (videoElement.videoWidth || 1)
    const scaleY = videoRect.height / (videoElement.videoHeight || 1)
    const scale = Math.min(scaleX, scaleY)

    const actualWidth = (videoElement.videoWidth || 0) * scale
    const actualHeight = (videoElement.videoHeight || 0) * scale

    const offsetX = (containerRect.width - actualWidth) / 2
    const offsetY = (containerRect.height - actualHeight) / 2

    // Set the position and size of the canvas
    overlayCanvas.style.width = `${actualWidth}px`
    overlayCanvas.style.height = `${actualHeight}px`
    overlayCanvas.style.left = `${offsetX}px`
    overlayCanvas.style.top = `${offsetY}px`

    // Set the actual drawing size of the canvas
    overlayCanvas.width = videoElement.videoWidth || 0
    overlayCanvas.height = videoElement.videoHeight || 0
}


/**
 * Camera constraints
 */
const { stream, enabled, stop, start } = useUserMedia({
    constraints: {
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: 30 }
        },
        audio: false
    }
})

export {
    stream,
    enabled,
    stop,
    start,
    setupCanvas,
}

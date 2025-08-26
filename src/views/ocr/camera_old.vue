<template>
    <div class="container">
        <div class="video-container">
            <video ref="video" muted autoplay playsinline @loadedmetadata="onVideoMetadataLoaded"></video>
            <canvas ref="canvas"></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import cvReadyPromise from '@techstark/opencv-js'

// 类型定义
interface Point {
    x: number;
    y: number;
}
interface Corners {
    topLeftCorner: Point | null;
    topRightCorner: Point | null;
    bottomLeftCorner: Point | null;
    bottomRightCorner: Point | null;
}

let cv: any

// 响应式变量
const video = ref<HTMLVideoElement>()
const canvas = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D | null>(null)
const stream = ref<MediaStream | null>(null)

// 检测相关变量
let isProcessing = false
let lastValidCorners: Point[] | null = null
let detectionHistory: Point[][] = []
let stableCount = 0
let noUpdateCount = 0

const MAX_HISTORY = 3
const STABLE_THRESHOLD = 1
const MOVE_THRESHOLD = 13
const MAX_NO_UPDATE = 20


// 工具函数
const scanner = {
    // 计算两点间距离
    distance(p1: Point, p2: Point): number {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    },

    // 计算两组点之间的平均距离
    averageDistanceBetweenPoints(points1: Point[], points2: Point[]): number {
        if (points1.length !== points2.length) return Infinity

        let totalDistance = 0
        for (let i = 0; i < points1.length; i++) {
            totalDistance += this.distance(points1[i], points2[i])
        }
        return totalDistance / points1.length
    },

    // 平滑处理角点
    smoothCorners(newCorners: Point[]): Point[] {
        if (detectionHistory.length === 0) return newCorners

        return newCorners.map((_, i) => {

            let sumX = newCorners[i].x
            let sumY = newCorners[i].y
            detectionHistory.forEach(history => {
                sumX += history[i].x
                sumY += history[i].y
            })

            return {
                x: sumX / (detectionHistory.length + 1),
                y: sumY / (detectionHistory.length + 1)
            }
        })
    },

    // 获取轮廓的四个角点
    getCornerPoints(contour: any): Corners {
        const rect = cv.minAreaRect(contour)
        const center = { x: rect.center.x, y: rect.center.y }

        const corners: Corners = {
            topLeftCorner: null,
            topRightCorner: null,
            bottomLeftCorner: null,
            bottomRightCorner: null
        }
        const maxDists = {
            topLeft: 0,
            topRight: 0,
            bottomLeft: 0,
            bottomRight: 0
        }

        for (let i = 0; i < contour.data32S.length; i += 2) {
            const point = {
                x: contour.data32S[i],
                y: contour.data32S[i + 1]
            }
            const dist = this.distance(point, center)

            if (point.x < center.x && point.y < center.y && dist > maxDists.topLeft) {
                corners.topLeftCorner = point
                maxDists.topLeft = dist
            } else if (point.x > center.x && point.y < center.y && dist > maxDists.topRight) {
                corners.topRightCorner = point
                maxDists.topRight = dist
            } else if (point.x < center.x && point.y > center.y && dist > maxDists.bottomLeft) {
                corners.bottomLeftCorner = point
                maxDists.bottomLeft = dist
            } else if (point.x > center.x && point.y > center.y && dist > maxDists.bottomRight) {
                corners.bottomRightCorner = point
                maxDists.bottomRight = dist
            }
        }

        return corners
    },

    // 验证轮廓是否为有效的文档形状
    isValidDocumentContour(contour: any, width: number, height: number): boolean {
        const area = cv.contourArea(contour)
        if (area < 5000 || area > (width * height * 0.9)) return false

        const rect = cv.boundingRect(contour)
        const rectArea = rect.width * rect.height
        if (area / rectArea < 0.5) return false

        const contourAspectRatio = Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height)
        return contourAspectRatio <= 5
    }
}

// 在 canvas 上绘制轮廓
function drawContourOnCanvas(points: Point[]) {
    if (!ctx.value || points.length !== 4) return

    ctx.value.strokeStyle = 'pink'
    ctx.value.lineWidth = 4
    ctx.value.setLineDash([])

    ctx.value.beginPath()

    ctx.value.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.value!.lineTo(p.x, p.y))
    ctx.value.closePath()
    ctx.value.stroke()
}

// 处理单帧视频
function processVideoFrame() {
    if (!isProcessing || !stream.value || !video.value || video.value.readyState !== 4) {
        isProcessing = false
        return
    }

    setTimeout(processVideoFrame, 33)

    try {
        if (!ctx.value || !canvas.value) return

        ctx.value.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
        const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)
        const src = cv.matFromImageData(imageData)

        const edges = new cv.Mat()
        const blurred = new cv.Mat()
        const thresh = new cv.Mat()
        const contours = new cv.MatVector()
        const hierarchy = new cv.Mat()

        try {
            // 图像处理流水线
            const gray = new cv.Mat()
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
            cv.Canny(blurred, edges, 75, 200)

            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
            cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel)
            cv.threshold(edges, thresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

            ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)

            // 查找最大有效轮廓
            let maxArea = 0
            let maxContour = null
            for (let i = 0; i < contours.size(); ++i) {
                const contour = contours.get(i)
                const area = cv.contourArea(contour)
                if (area > maxArea && scanner.isValidDocumentContour(contour, canvas.value!.width, canvas.value!.height)) {
                    maxArea = area
                    maxContour && maxContour.delete() // 释放之前的最大轮廓
                    maxContour = contour
                } else {
                    contour.delete()
                }
            }

            // 处理最大轮廓
            let currentCorners = null
            if (maxContour) {
                const perimeter = cv.arcLength(maxContour, true)
                const approx = new cv.Mat()
                cv.approxPolyDP(maxContour, approx, 0.02 * perimeter, true)

                if (approx.rows === 4) {
                    const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = scanner.getCornerPoints(maxContour)
                    const corners = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]
                    if (corners.every(p => p)) currentCorners = corners as Point[]
                }
                approx.delete()
                maxContour.delete()
            }

            // 稳定性处理与超时机制
            let displayCorners = null

            if (currentCorners) {
                noUpdateCount = 0
                const smoothedCorners = scanner.smoothCorners(currentCorners)

                if (lastValidCorners) {
                    const avgDistance = scanner.averageDistanceBetweenPoints(smoothedCorners, lastValidCorners)

                    if (avgDistance < MOVE_THRESHOLD) {
                        stableCount++
                        if (stableCount >= STABLE_THRESHOLD) {
                            displayCorners = smoothedCorners
                            lastValidCorners = [...smoothedCorners]
                            detectionHistory.push([...smoothedCorners])
                            detectionHistory.length > MAX_HISTORY && detectionHistory.shift()
                        } else {
                            displayCorners = lastValidCorners
                        }
                    } else {
                        stableCount = 1
                        displayCorners = smoothedCorners
                        lastValidCorners = [...smoothedCorners]
                        detectionHistory.push([...smoothedCorners])
                        detectionHistory.length > MAX_HISTORY && detectionHistory.shift()
                    }
                } else {
                    displayCorners = smoothedCorners
                    lastValidCorners = [...smoothedCorners]
                    detectionHistory.push([...smoothedCorners])
                    stableCount = 1
                }
            } else {
                noUpdateCount++

                if (lastValidCorners) {
                    displayCorners = lastValidCorners
                    stableCount = 0

                    if (noUpdateCount > MAX_NO_UPDATE) {
                        lastValidCorners = null
                        detectionHistory = []
                        stableCount = 0
                        noUpdateCount = 0
                    }
                }
            }

            // 绘制轮廓
            displayCorners && drawContourOnCanvas(displayCorners)

            gray.delete()
            kernel.delete()
        } catch (procErr) {
            console.error('OpenCV 处理错误:', procErr)
            lastValidCorners = null
            detectionHistory = []
            stableCount = 0
            noUpdateCount = 0
        } finally {
            src.delete()
            edges.delete()
            blurred.delete()
            thresh.delete()
            contours.delete()
            hierarchy.delete()
        }

    } catch (err) {
        console.error('处理视频帧时出错:', err)
        isProcessing = false
        setTimeout(processVideoFrame, 1000)
    }
}

// 开始视频处理循环
function startVideoProcessing() {
    if (isProcessing) return
    isProcessing = true
    processVideoFrame()
}

// 当视频元数据加载完成时触发
function onVideoMetadataLoaded() {
    if (video.value && canvas.value) {
        canvas.value.width = video.value.videoWidth
        canvas.value.height = video.value.videoHeight
        ctx.value = canvas.value.getContext('2d')
        startVideoProcessing()
    }
}

// 初始化摄像头
async function initCamera() {
    try {
        stream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        })

        if (video.value) {
            video.value.srcObject = stream.value
        }
    } catch (err) {
        console.error('访问摄像头失败:', err)
    }
}

// 初始化 OpenCV
async function main() {
    try {
        cv = await cvReadyPromise
        console.log('OpenCV.js 加载完成')
        await initCamera()
    } catch (error) {
        console.error('OpenCV.js 加载失败:', error)
    }
}

// 组件挂载时初始化
onMounted(async () => {
    await main()
})

// 组件卸载时清理资源
onUnmounted(() => {
    isProcessing = false
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
    }
})
</script>

<style scoped>
.container {
    position: relative;
    width: 100%;
    margin: 0 auto;
}

.video-container {
    position: relative;
    width: 100%;
    height: 480px;
}

video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
}

canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>
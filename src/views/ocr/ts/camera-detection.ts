import { ref, computed } from 'vue'
import cvReadyPromise from '@techstark/opencv-js'

// OpenCV 类型定义
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

// OpenCV 检测相关变量和常量
let isProcessing = false
let lastValidCorners: Point[] | null = null
let detectionHistory: Point[][] = []
let stableCount = 0
let noUpdateCount = 0

const DETECTION_CONFIG = {
    MAX_HISTORY: 3,
    STABLE_THRESHOLD: 2,
    MOVE_THRESHOLD: 20,
    MAX_NO_UPDATE: 15,
    FRAME_RATE: 30,
    CANVAS_STYLE: { strokeStyle: 'pink', lineWidth: 4 }
} as const

// 视频和容器尺寸
const videoWidth = ref(0)
const videoHeight = ref(0)
const containerWidth = ref(0)
const containerHeight = ref(0)

// 计算实际显示区域（object-fit: contain的显示区域）
const displayArea = computed(() => {
    if (!videoWidth.value || !videoHeight.value || !containerWidth.value || !containerHeight.value) {
        return { left: 0, top: 0, width: 0, height: 0, scaleX: 1, scaleY: 1 }
    }

    const videoAspect = videoWidth.value / videoHeight.value
    const containerAspect = containerWidth.value / containerHeight.value

    let displayWidth, displayHeight, left, top

    if (videoAspect > containerAspect) {
        // 视频更宽，以容器宽度为准
        displayWidth = containerWidth.value
        displayHeight = containerWidth.value / videoAspect
        left = 0
        top = (containerHeight.value - displayHeight) / 2
    } else {
        // 视频更高，以容器高度为准
        displayWidth = containerHeight.value * videoAspect
        displayHeight = containerHeight.value
        left = (containerWidth.value - displayWidth) / 2
        top = 0
    }

    const scaleX = displayWidth / videoWidth.value
    const scaleY = displayHeight / videoHeight.value

    return { left, top, width: displayWidth, height: displayHeight, scaleX, scaleY }
})

// OpenCV 工具函数
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
            detectionHistory.forEach((history: { x: number; y: number }[]) => {
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
        // 降低最小面积要求，适应书本内页等较小目标
        const minArea = Math.max(2000, (width * height) * 0.05)
        if (area < minArea || area > (width * height * 0.95)) return false

        const rect = cv.boundingRect(contour)
        const rectArea = rect.width * rect.height
        // 放宽面积比例要求，适应不规则形状
        if (area / rectArea < 0.3) return false

        // 放宽宽高比限制，适应各种书本尺寸
        const contourAspectRatio = Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height)
        if (contourAspectRatio > 10) return false

        // 添加尺寸检查，确保轮廓足够大
        const minDimension = Math.min(width, height) * 0.1
        if (rect.width < minDimension || rect.height < minDimension) return false

        return true
    }
}

// 在 canvas 上绘制轮廓
function drawContourOnCanvas(points: Point[], ctx: CanvasRenderingContext2D) {
    if (!ctx || points.length !== 4) return

    const { strokeStyle, lineWidth } = DETECTION_CONFIG.CANVAS_STYLE
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((p: { x: number; y: number }) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.stroke()
}

// 处理单帧视频
function processVideoFrame(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    stream: MediaStream | undefined
) {
    if (!isProcessing || !stream || !videoElement || videoElement.readyState !== 4) {
        isProcessing = false
        return
    }

    try {
        if (!ctx || !canvasElement) return

        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
        const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height)
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

            // 增强对比度
            const enhanced = new cv.Mat()
            cv.equalizeHist(gray, enhanced)

            // 自适应高斯模糊
            cv.GaussianBlur(enhanced, blurred, new cv.Size(3, 3), 0)

            // 降低Canny阈值以捕获更多边缘，特别适合书本内页
            cv.Canny(blurred, edges, 30, 100)

            // 使用更大的形态学核来连接断开的边缘
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(7, 7))
            cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel)

            // 再次膨胀以增强边缘连接
            const dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
            cv.dilate(edges, edges, dilateKernel)

            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

            enhanced.delete()
            dilateKernel.delete()

            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

            // 查找所有有效轮廓并选择最佳的
            const validContours = []
            for (let i = 0; i < contours.size(); ++i) {
                const contour = contours.get(i)
                const area = cv.contourArea(contour)
                if (scanner.isValidDocumentContour(contour, canvasElement.width, canvasElement.height)) {
                    validContours.push({ contour, area })
                } else {
                    contour.delete()
                }
            }

            // 按面积排序，选择最大的有效轮廓
            validContours.sort((a, b) => b.area - a.area)
            let maxContour = null
            if (validContours.length > 0) {
                maxContour = validContours[0].contour
                // 清理其他轮廓
                for (let i = 1; i < validContours.length; i++) {
                    validContours[i].contour.delete()
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

                    if (avgDistance < DETECTION_CONFIG.MOVE_THRESHOLD) {
                        stableCount++
                        if (stableCount >= DETECTION_CONFIG.STABLE_THRESHOLD) {
                            displayCorners = smoothedCorners
                            lastValidCorners = [...smoothedCorners]
                            detectionHistory.push([...smoothedCorners])
                            detectionHistory.length > DETECTION_CONFIG.MAX_HISTORY && detectionHistory.shift()
                        } else {
                            displayCorners = lastValidCorners
                        }
                    } else {
                        stableCount = 1
                        displayCorners = smoothedCorners
                        lastValidCorners = [...smoothedCorners]
                        detectionHistory.push([...smoothedCorners])
                        detectionHistory.length > DETECTION_CONFIG.MAX_HISTORY && detectionHistory.shift()
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

                    if (noUpdateCount > DETECTION_CONFIG.MAX_NO_UPDATE) {
                        lastValidCorners = null
                        detectionHistory = []
                        stableCount = 0
                        noUpdateCount = 0
                    }
                }
            }

            // 绘制轮廓
            displayCorners && drawContourOnCanvas(displayCorners, ctx)

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
        // 发生错误时延迟重试，但仍需检查isProcessing状态
        if (isProcessing) {
            setTimeout(() => processVideoFrame(videoElement, canvasElement, ctx, stream), 1000)
        }
        return
    }

    // 在函数末尾安排下一帧处理，确保可以被stopVideoProcessing正确停止
    if (isProcessing) {
        setTimeout(() => processVideoFrame(videoElement, canvasElement, ctx, stream), DETECTION_CONFIG.FRAME_RATE)
    }
}

// 开始视频处理循环
function startVideoProcessing(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    stream: MediaStream | undefined
) {
    if (isProcessing) return
    isProcessing = true
    processVideoFrame(videoElement, canvasElement, ctx, stream)
}

// 停止视频处理
function stopVideoProcessing() {
    isProcessing = false
}

// 初始化OpenCV
async function initializeOpenCV() {
    try {
        cv = await cvReadyPromise
        console.log('OpenCV.js 加载完成')
        return true
    } catch (error) {
        console.error('OpenCV.js 加载失败:', error)
        return false
    }
}

// 重置检测状态
function resetDetectionState() {
    lastValidCorners = null
    detectionHistory = []
    stableCount = 0
    noUpdateCount = 0
}

// 获取当前检测到的边框坐标
function getCurrentDetectedCorners(): Point[] | null {
    return lastValidCorners ? [...lastValidCorners] : null
}

// 获取默认边框坐标（基于显示区域的默认框）
function getDefaultCorners(): Point[] {
    const { width, height } = displayArea.value
    const actualWidth = width || 640
    const actualHeight = height || 480

    // 使用更小的边距，确保默认框能包含更多内容
    const margin = Math.min(actualWidth, actualHeight) * 0.05

    return [
        { x: margin, y: margin }, // 左上
        { x: actualWidth - margin, y: margin }, // 右上
        { x: actualWidth - margin, y: actualHeight - margin }, // 右下
        { x: margin, y: actualHeight - margin } // 左下
    ]
}

/**
 * 透视变换校正文档
 * @param imageData 原始图像数据
 * @param points 四个角点坐标 [左上, 右上, 右下, 左下]
 * @param outputWidth 输出图像宽度（可选，自动计算）
 * @param outputHeight 输出图像高度（可选，自动计算）
 * @returns 校正后的图像数据
 */
function perspectiveTransform(
    imageData: ImageData,
    points: Point[],
    outputWidth?: number,
    outputHeight?: number
): ImageData | null {
    if (!cv || points.length !== 4) return null

    try {
        // 如果没有指定输出尺寸，则自动计算最佳尺寸
        if (!outputWidth || !outputHeight) {
            // 计算四边形的宽度和高度
            const topWidth = Math.sqrt(
                Math.pow(points[1].x - points[0].x, 2) +
                Math.pow(points[1].y - points[0].y, 2)
            )
            const bottomWidth = Math.sqrt(
                Math.pow(points[2].x - points[3].x, 2) +
                Math.pow(points[2].y - points[3].y, 2)
            )
            const leftHeight = Math.sqrt(
                Math.pow(points[3].x - points[0].x, 2) +
                Math.pow(points[3].y - points[0].y, 2)
            )
            const rightHeight = Math.sqrt(
                Math.pow(points[2].x - points[1].x, 2) +
                Math.pow(points[2].y - points[1].y, 2)
            )

            // 使用最大宽度和高度作为输出尺寸
            outputWidth = Math.max(topWidth, bottomWidth)
            outputHeight = Math.max(leftHeight, rightHeight)

            // 确保输出尺寸不会过小或过大，但保持宽高比
            const minSize = 200
            const maxSize = 2000

            // 计算缩放比例，确保最小边不小于minSize，最大边不超过maxSize
            const minScale = Math.max(minSize / outputWidth, minSize / outputHeight)
            const maxScale = Math.min(maxSize / outputWidth, maxSize / outputHeight)

            // 应用缩放，优先保证最小尺寸要求
            let scale = 1
            if (minScale > 1) {
                scale = minScale
            } else if (maxScale < 1) {
                scale = maxScale
            }

            outputWidth = Math.round(outputWidth * scale)
            outputHeight = Math.round(outputHeight * scale)
        }

        // 创建源图像矩阵
        const src = cv.matFromImageData(imageData)

        // 定义源点（检测到的四个角点）
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            points[0].x, points[0].y,  // 左上
            points[1].x, points[1].y,  // 右上
            points[2].x, points[2].y,  // 右下
            points[3].x, points[3].y   // 左下
        ])

        // 定义目标点（矩形的四个角）
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,                           // 左上
            outputWidth, 0,                 // 右上
            outputWidth, outputHeight,      // 右下
            0, outputHeight                 // 左下
        ])

        // 计算透视变换矩阵
        const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints)

        // 创建输出图像
        const dst = new cv.Mat()
        const dsize = new cv.Size(outputWidth, outputHeight)

        // 执行透视变换
        cv.warpPerspective(src, dst, transformMatrix, dsize)

        // 转换为ImageData
        const canvas = document.createElement('canvas')
        canvas.width = outputWidth
        canvas.height = outputHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            src.delete()
            srcPoints.delete()
            dstPoints.delete()
            transformMatrix.delete()
            dst.delete()
            return null
        }

        cv.imshow(canvas, dst)
        const correctedImageData = ctx.getImageData(0, 0, outputWidth, outputHeight)

        // 添加调试信息
        console.log('📐 透视变换完成:', {
            原始尺寸: `${imageData.width}x${imageData.height}`,
            输出尺寸: `${outputWidth}x${outputHeight}`,
            检测点: points
        })

        // 清理内存
        src.delete()
        srcPoints.delete()
        dstPoints.delete()
        transformMatrix.delete()
        dst.delete()

        return correctedImageData
    } catch (error) {
        console.error('透视变换失败:', error)
        return null
    }
}

export {
    // 类型定义
    type Point,
    type Corners,

    // 响应式变量
    videoWidth,
    videoHeight,
    containerWidth,
    containerHeight,
    displayArea,

    // 常量
    DETECTION_CONFIG,

    // 工具函数
    scanner,

    // 主要功能函数
    drawContourOnCanvas,
    processVideoFrame,
    startVideoProcessing,
    stopVideoProcessing,
    initializeOpenCV,
    resetDetectionState,
    getCurrentDetectedCorners,
    getDefaultCorners,
    perspectiveTransform
}
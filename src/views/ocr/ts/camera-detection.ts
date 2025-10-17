import { getOpenCv } from "./opencv"
import type { Point } from "./types"

/**
 * 文档边缘检测平滑配置
 */
const DETECTION_CONFIG = {
    MAX_HISTORY: 3,
    STABLE_THRESHOLD: 2,
    MOVE_THRESHOLD: 20,
    MAX_NO_UPDATE: 15,
    FRAME_RATE: 30,
} as const

/**
 * 文档边缘检测
 */
class EdgeDetection {
    private isProcessing = false
    private lastValidCorners: Point[] | null = null
    private detectionHistory: Point[][] = []
    private stableCount = 0
    private noUpdateCount = 0

    constructor() { }

    /**
     * 计算两点间距离
     */
    private distance(p1: Point, p2: Point) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    }

    /**
     * 计算两组点之间的平均距离
     */
    private averageDistanceBetweenPoints(points1: Point[], points2: Point[]) {
        if (points1.length !== points2.length) return Infinity

        let totalDistance = 0
        for (let i = 0; i < points1.length; i++) {
            totalDistance += this.distance(points1[i], points2[i])
        }
        return totalDistance / points1.length
    }

    /**
     * 平滑处理角点
     */
    private smoothCorners(newCorners: Point[]): Point[] {
        if (this.detectionHistory.length === 0) return newCorners

        return newCorners.map((_, i) => {
            let sumX = newCorners[i].x
            let sumY = newCorners[i].y
            this.detectionHistory.forEach(history => {
                sumX += history[i].x
                sumY += history[i].y
            })

            return {
                x: sumX / (this.detectionHistory.length + 1),
                y: sumY / (this.detectionHistory.length + 1)
            }
        })
    }

    /**
     * 获取轮廓的四个角点
     */
    private async getCornerPoints(contour: any) {
        const cv = await getOpenCv()
        const rect = cv.minAreaRect(contour)
        const center = { x: rect.center.x, y: rect.center.y }

        const corners = {
            topLeftCorner: null as Point | null,
            topRightCorner: null as Point | null,
            bottomLeftCorner: null as Point | null,
            bottomRightCorner: null as Point | null
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
    }

    /**
     * 验证轮廓是否为有效的文档形状
     */
    private async isValidDocumentContour(contour: any, width: number, height: number) {
        const cv = await getOpenCv()
        const area = cv.contourArea(contour)
        const minArea = Math.max(2000, (width * height) * 0.05)
        if (area < minArea || area > (width * height * 0.95)) return false

        const rect = cv.boundingRect(contour)
        const rectArea = rect.width * rect.height
        if (area / rectArea < 0.3) return false

        const contourAspectRatio = Math.max(rect.width, rect.height) / Math.min(rect.width, rect.height)
        if (contourAspectRatio > 10) return false

        const minDimension = Math.min(width, height) * 0.1
        if (rect.width < minDimension || rect.height < minDimension) return false

        return true
    }

    /**
     * 在 canvas 上绘制轮廓
     */
    public drawContourOnCanvas(points: Point[], ctx: CanvasRenderingContext2D) {
        if (!ctx || points.length !== 4) return
        ctx.strokeStyle = 'pink'
        ctx.lineWidth = 10
        ctx.setLineDash([])

        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        points.slice(1).forEach((p: Point) => ctx.lineTo(p.x, p.y))
        ctx.closePath()
        ctx.stroke()
    }

    /**
     * 处理单帧视频
     */
    public async processVideoFrame(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement, ctx: CanvasRenderingContext2D, stream: MediaStream | undefined) {
        if (!this.isProcessing || !stream || !videoElement || videoElement.readyState !== 4) {
            this.isProcessing = false
            return
        }

        try {
            if (!ctx || !canvasElement) return

            const cv = await getOpenCv()

            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
            const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height)
            const src = cv.matFromImageData(imageData)

            const edges = new cv.Mat()
            const contours = new cv.MatVector()
            const hierarchy = new cv.Mat()

            // 简化图像处理流程
            const gray = new cv.Mat()
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
            cv.GaussianBlur(gray, edges, new cv.Size(3, 3), 0)
            cv.Canny(edges, edges, 30, 100)

            // 仅用一次闭运算连接边缘
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
            cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel)

            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

            // 查找有效轮廓
            let currentCorners = null
            for (let i = 0; i < contours.size(); ++i) {
                const contour = contours.get(i)
                if (await this.isValidDocumentContour(contour, canvasElement.width, canvasElement.height)) {
                    // 获取角点
                    const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = await this.getCornerPoints(contour)
                    const corners = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]
                    if (corners.every(p => p)) {
                        currentCorners = corners as Point[]
                    }
                    contour.delete()
                    break
                }
            }

            // 稳定性处理与平滑
            let displayCorners = null
            if (currentCorners) {
                this.noUpdateCount = 0
                const smoothedCorners = this.smoothCorners(currentCorners)

                if (this.lastValidCorners) {
                    const avgDistance = this.averageDistanceBetweenPoints(smoothedCorners, this.lastValidCorners)

                    if (avgDistance < DETECTION_CONFIG.MOVE_THRESHOLD) {
                        this.stableCount++
                        if (this.stableCount >= DETECTION_CONFIG.STABLE_THRESHOLD) {
                            displayCorners = smoothedCorners
                            this.lastValidCorners = [...smoothedCorners]
                            this.detectionHistory.push([...smoothedCorners])
                            if (this.detectionHistory.length > DETECTION_CONFIG.MAX_HISTORY) {
                                this.detectionHistory.shift()
                            }
                        } else {
                            displayCorners = this.lastValidCorners
                        }
                    } else {
                        this.stableCount = 1
                        displayCorners = smoothedCorners
                        this.lastValidCorners = [...smoothedCorners]
                        this.detectionHistory.push([...smoothedCorners])
                        if (this.detectionHistory.length > DETECTION_CONFIG.MAX_HISTORY) {
                            this.detectionHistory.shift()
                        }
                    }
                } else {
                    displayCorners = smoothedCorners
                    this.lastValidCorners = [...smoothedCorners]
                    this.detectionHistory.push([...smoothedCorners])
                    this.stableCount = 1
                }
            } else {
                this.noUpdateCount++

                if (this.lastValidCorners) {
                    displayCorners = this.lastValidCorners
                    this.stableCount = 0

                    if (this.noUpdateCount > DETECTION_CONFIG.MAX_NO_UPDATE) {
                        this.resetDetectionState()
                    }
                }
            }

            // 绘制轮廓
            displayCorners && this.drawContourOnCanvas(displayCorners, ctx)

            // 清理资源
            gray.delete()
            edges.delete()
            kernel.delete()
            src.delete()
            contours.delete()
            hierarchy.delete()

        } catch (err) {
            console.error('处理视频帧时出错:', err)
            this.isProcessing = false
            if (this.isProcessing) {
                setTimeout(() => this.processVideoFrame(videoElement, canvasElement, ctx, stream), 1000)
            }
            return
        }

        // 安排下一帧
        if (this.isProcessing) {
            setTimeout(() => this.processVideoFrame(videoElement, canvasElement, ctx, stream), 1000 / DETECTION_CONFIG.FRAME_RATE)
        }
    }

    /**
     * 开始视频处理循环
     */
    public startVideoProcessing(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement, ctx: CanvasRenderingContext2D, stream: MediaStream | undefined) {
        if (this.isProcessing) return
        this.isProcessing = true
        this.processVideoFrame(videoElement, canvasElement, ctx, stream)
    }

    /**
     * 停止视频处理
     */
    public stopVideoProcessing() {
        this.isProcessing = false
    }

    /**
     * 重置检测状态
     */
    public resetDetectionState() {
        this.lastValidCorners = null
        this.detectionHistory = []
        this.stableCount = 0
        this.noUpdateCount = 0
    }

    /**
     * 获取当前检测到的边框坐标
     */
    public getCurrentDetectedCorners(): Point[] | null {
        return this.lastValidCorners ? [...this.lastValidCorners] : null
    }

    /**
     * 获取默认边框坐标
     * @param width - 宽度
     * @param height - 高度
     * @returns - 默认边框坐标
     */
    public getDefaultCorners(width: number, height: number) {
        const actualWidth = width || 640
        const actualHeight = height || 480

        return [
            { x: 0, y: 0 },
            { x: actualWidth, y: 0 },
            { x: actualWidth, y: actualHeight },
            { x: 0, y: actualHeight }
        ]
    }
}

export const edgeDetection = new EdgeDetection()
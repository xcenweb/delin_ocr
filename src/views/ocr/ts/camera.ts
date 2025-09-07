import { ref } from 'vue';
import { getCurrentDetectedCorners, getDefaultCorners, perspectiveTransform, displayArea, type Point } from './camera-detection';

/**
 * 照片项接口
 */
interface PhotoItem {
    /** 图片blobURL */
    src: string;
    /** 校正后的图片blobURL */
    processedSrc?: string;
    /** 当前使用的滤镜alias */
    filter?: string;
    /** 应用滤镜后的图片blobURL */
    filteredSrc?: string;
    /** 边框四角点坐标 [左上, 右上, 右下, 左下] */
    points: Point[];
}

/**
 * 已拍摄的照片列表
 */
const takedPhotos = ref<PhotoItem[]>([]);

/**
 * 拍照模式
 * - single
 * - multiple
 */
const takePhotoModel = ref('single');

/**
 * 拍照模式选项
 */
const takePhotoModelOptions = ref([
    { text: '单张', value: 'single' },
    { text: '多张', value: 'multiple' },
]);

/**
 * 视频元素
 */
const videoElement = ref<HTMLVideoElement>();

/**
 * 拍照并保存图片到列表
 */
const takePhoto = () => {
    const videoEl: any = videoElement.value
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) return

    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight

    // 绘制当前视频帧
    ctx.drawImage(videoEl, 0, 0)

    // 获取当前检测到的边框坐标，如果没有则使用默认框
    const detectedCorners = getCurrentDetectedCorners()
    const points = detectedCorners || getDefaultCorners()

    // 获取原始图像数据用于透视变换
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // 将显示区域的坐标转换为视频坐标系
    const { scaleX, scaleY } = displayArea.value
    const videoPoints = points.map(point => ({
        x: point.x / scaleX,
        y: point.y / scaleY
    }))

    // 执行透视变换校正
    const correctedImageData = perspectiveTransform(imageData, videoPoints)

    // 生成原图blob
    canvas.toBlob(blob => {
        if (!blob) return

        const url = URL.createObjectURL(blob)

        // 如果透视变换成功，生成校正后的图片
        if (correctedImageData) {
            const correctedCanvas = document.createElement('canvas')
            const correctedCtx = correctedCanvas.getContext('2d', { willReadFrequently: true })

            if (correctedCtx) {
                correctedCanvas.width = correctedImageData.width
                correctedCanvas.height = correctedImageData.height

                correctedCtx.imageSmoothingEnabled = false // 在文档校正结果上禁用图像平滑以保持文字清晰度FUCK
                correctedCtx.putImageData(correctedImageData, 0, 0)

                // 转换为blob URL
                correctedCanvas.toBlob(correctedBlob => {
                    if (correctedBlob) {
                        const processedUrl = URL.createObjectURL(correctedBlob)

                        const photoItem: PhotoItem = {
                            src: url,
                            processedSrc: processedUrl,
                            points: [...videoPoints] // 保存视频坐标系的坐标
                        }
                        takedPhotos.value.push(photoItem)

                        console.log('📸 原图大小:', canvas.width, 'x', canvas.height)
                        console.log('📸 校正图大小:', correctedCanvas.width, 'x', correctedCanvas.height)
                        console.log('📍 显示区域坐标:', points)
                        console.log('📍 视频坐标系坐标:', videoPoints)
                    }
                }, 'image/png')
            } else {
                // 无法获取校正canvas上下文，只保存原图
                const photoItem: PhotoItem = {
                    src: url,
                    points: [...videoPoints]
                }
                takedPhotos.value.push(photoItem)
                console.warn('⚠️ 无法创建校正图片上下文，仅保存原图')
            }
        } else {
            // 透视变换失败，只保存原图
            const photoItem: PhotoItem = {
                src: url,
                points: [...videoPoints] // 保存视频坐标系的坐标
            }
            takedPhotos.value.push(photoItem)

            console.log('📸 图片大小:', canvas.width, 'x', canvas.height)
            console.log('📍 显示区域坐标:', points)
            console.log('📍 视频坐标系坐标:', videoPoints)
            console.warn('⚠️ 文档校正失败，仅保存原图')
        }
    }, 'image/png') // 改为PNG格式
}

export {
    type PhotoItem,

    videoElement,
    takedPhotos,
    takePhotoModel,
    takePhotoModelOptions,

    takePhoto,
}
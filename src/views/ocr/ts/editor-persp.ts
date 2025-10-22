import { ref } from 'vue'
import { getOpenCv } from './opencv'
import * as Editor from './editor'
import type { Point, PhotoItem } from './types'
import { useSnackbar } from '@/components/global/snackbarService'

/**
 * 透视模式单图片信息
 */
const cropCurrentImage = ref<PhotoItem>()

/**
 * 深拷贝图片对象，避免引用问题
 */
const deepClonePhotoItem = (item: PhotoItem): PhotoItem => {
    return {
        src: item.src,
        persped_src: item.persped_src,
        filtered_src: item.filtered_src,
        use_filter: item.use_filter,
        points: item.points.map(point => ({ x: point.x, y: point.y }))
    }
}

/**
 * 进入透视校正模式
 */
const enter = async () => {
    // 使用深拷贝避免修改原始数据
    if (Editor.currentImage.value) {
        cropCurrentImage.value = deepClonePhotoItem(Editor.currentImage.value)
    }
    Editor.currentEditorMode.value = 'persp'
};

/**
 * 退出透视校正模式
 */
const cancel = async () => {
    cropCurrentImage.value = undefined
    Editor.currentEditorMode.value = 'edit'
};

/**
 * 确认修改
 */
const confirm = async () => {
    // 将修改的数据写回去
    if (cropCurrentImage.value && Editor.currentImage.value) {
        Editor.currentImage.value.points = [...cropCurrentImage.value.points]

        // 执行透视变换并更新persped_src
        try {
            // 获取原始图片的blob
            const response = await fetch(cropCurrentImage.value.src)
            const blob = await response.blob()

            // 执行透视变换
            const resultBlob = await transform(blob, cropCurrentImage.value.points)

            if (resultBlob) {
                if (Editor.currentImage.value.persped_src) {
                    // 释放内存
                    URL.revokeObjectURL(Editor.currentImage.value.persped_src)
                }
                Editor.currentImage.value.persped_src = URL.createObjectURL(resultBlob)
                Editor.currentEditorMode.value = 'edit'
                useSnackbar().success('矫正成功')
            } else {
                throw new Error('矫正失败')
            }
        } catch (error) {
            useSnackbar().error('矫正过程中发生错误：' + error)
        }
    }
}

/**
 * 透视变换校正图片
 * @param blob 输入图像的Blob对象
 * @param points 四个角点坐标 [左上, 右上, 右下, 左下]
 * @returns 处理后图像的Blob对象
 */
const transform = async (blob: Blob, points: Point[]) => {
    try {
        const cv = await getOpenCv()
        const imgBitmap = await createImageBitmap(blob)

        // 创建源Canvas并绘制图像
        const srcCanvas = document.createElement('canvas')
        srcCanvas.width = imgBitmap.width
        srcCanvas.height = imgBitmap.height
        const srcCtx = srcCanvas.getContext('2d')

        if (!srcCtx) {
            imgBitmap.close()
            return null
        }

        srcCtx.drawImage(imgBitmap, 0, 0)

        // 判断是否是全选状态（四个角点分别是左上、右上、右下、左下）
        const isFullSelection =
            points[0].x === 0 && points[0].y === 0 &&  // 左上角
            points[1].x === imgBitmap.width && points[1].y === 0 &&  // 右上角
            points[2].x === imgBitmap.width && points[2].y === imgBitmap.height &&  // 右下角
            points[3].x === 0 && points[3].y === imgBitmap.height;  // 左下角

        // 如果是全选状态，则不处理，直接返回null
        if (isFullSelection) {
            imgBitmap.close()
            return null
        }

        // 计算输出尺寸
        const widthTop = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
        const widthBottom = Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y)
        const heightLeft = Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y)
        const heightRight = Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y)

        const outputWidth = Math.ceil(Math.max(widthTop, widthBottom))
        const outputHeight = Math.ceil(Math.max(heightLeft, heightRight))

        // 准备OpenCV需要的点数据
        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            points[0].x, points[0].y,
            points[1].x, points[1].y,
            points[2].x, points[2].y,
            points[3].x, points[3].y
        ])

        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            outputWidth, 0,
            outputWidth, outputHeight,
            0, outputHeight
        ])

        // 执行透视变换
        const transformMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints)
        const srcMat = cv.imread(srcCanvas)
        const dstMat = new cv.Mat()
        cv.warpPerspective(srcMat, dstMat, transformMatrix, new cv.Size(outputWidth, outputHeight))

        // 转换为Blob输出
        const dstCanvas = document.createElement('canvas')
        dstCanvas.width = outputWidth
        dstCanvas.height = outputHeight
        cv.imshow(dstCanvas, dstMat)
        const resultBlob = await new Promise<Blob | null>(resolve =>
            dstCanvas.toBlob(resolve, 'image/png')
        );

        // 清理资源
        imgBitmap.close();
        srcMat.delete();
        dstMat.delete();
        srcPoints.delete();
        dstPoints.delete();
        transformMatrix.delete();

        return resultBlob;
    } catch (error) {
        console.error('透视变换失败:', error);
        return null;
    }
}

export {
    cropCurrentImage,
    enter,
    cancel,
    confirm,
    transform,
    deepClonePhotoItem
}
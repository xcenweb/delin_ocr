/**
 * 图片信息数组
 */
export interface PhotoItem {
    /** 图片 blobURL */
    src: string
    /** 校正后的图片 blobURL */
    persped_src: string
    /** 应用滤镜后的图片 blobURL */
    filtered_src?: string
    /** 当前使用的滤镜 */
    use_filter: string
    /** 矫正框角点坐标  */
    points: Point[]
}

/**
 * 矫正框角点坐标 [左上, 右上, 右下, 左下]
 */
export interface Point {
    x: number
    y: number
}
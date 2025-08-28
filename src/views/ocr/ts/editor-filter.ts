import { ref, watch, type Ref } from 'vue';
import type { PhotoItem } from '@/views/ocr/ts/camera';

/**
 * 图像滤镜处理工具类
 */
class ImageFilterProcessor {
    /**
     * 应用滤镜到图片
     * @param imageSrc 图片源URL
     * @param filterAlias 滤镜别名
     * @returns Promise<string> 处理后的blob URL
     */
    static async applyFilter(imageSrc: string, filterAlias: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                canvas.width = img.width;
                canvas.height = img.height;

                // 绘制原图
                ctx.drawImage(img, 0, 0);

                // 应用滤镜
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const filteredData = this.processImageData(imageData, filterAlias);
                ctx.putImageData(filteredData, 0, 0);

                // 转换为blob URL
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        resolve(url);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/jpeg', 0.9);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageSrc;
        });
    }

    /**
     * 处理图像数据应用滤镜效果
     * @param imageData 原始图像数据
     * @param filterAlias 滤镜别名
     * @returns 处理后的图像数据
     */
    private static processImageData(imageData: ImageData, filterAlias: string): ImageData {
        const data = imageData.data;
        const newImageData = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height);
        const newData = newImageData.data;

        switch (filterAlias) {
            case 'original':
                // 原图，不做处理
                break;

            case 'enhance':
                // 增强：提高对比度和饱和度
                for (let i = 0; i < newData.length; i += 4) {
                    // 对比度增强
                    newData[i] = Math.min(255, (newData[i] - 128) * 1.2 + 128);     // R
                    newData[i + 1] = Math.min(255, (newData[i + 1] - 128) * 1.2 + 128); // G
                    newData[i + 2] = Math.min(255, (newData[i + 2] - 128) * 1.2 + 128); // B
                }
                break;

            case 'sharpening':
                // 锐化：使用卷积核进行锐化处理
                this.applySharpenFilter(newImageData);
                break;

            case 'mono':
                // 黑白：转换为灰度
                for (let i = 0; i < newData.length; i += 4) {
                    const gray = Math.round(0.299 * newData[i] + 0.587 * newData[i + 1] + 0.114 * newData[i + 2]);
                    newData[i] = gray;     // R
                    newData[i + 1] = gray; // G
                    newData[i + 2] = gray; // B
                }
                break;

            case 'moire-pattern':
                // 去摩尔纹：轻微模糊处理
                this.applyAntiMoireFilter(newImageData);
                break;

            default:
                console.warn(`Unknown filter: ${filterAlias}`);
        }

        return newImageData;
    }

    /**
     * 应用锐化滤镜
     */
    private static applySharpenFilter(imageData: ImageData): void {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(data);

        // 锐化卷积核
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) { // RGB通道
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                        }
                    }
                    const outputIdx = (y * width + x) * 4 + c;
                    output[outputIdx] = Math.max(0, Math.min(255, sum));
                }
            }
        }

        // 复制处理后的数据
        for (let i = 0; i < data.length; i++) {
            data[i] = output[i];
        }
    }

    /**
     * 应用去摩尔纹滤镜
     */
    private static applyAntiMoireFilter(imageData: ImageData): void {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(data);

        // 轻微高斯模糊
        const kernel = [
            1, 2, 1,
            2, 4, 2,
            1, 2, 1
        ];
        const kernelSum = 16;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) { // RGB通道
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                        }
                    }
                    const outputIdx = (y * width + x) * 4 + c;
                    output[outputIdx] = Math.round(sum / kernelSum);
                }
            }
        }

        // 复制处理后的数据
        for (let i = 0; i < data.length; i++) {
            data[i] = output[i];
        }
    }
}

/** 滤镜配置接口 */
interface FilterConfig {
    name: string;
    alias: string;
    cover: string;
}

/**
 * 滤镜功能组合式函数
 * @param imageList 图片列表
 * @param swiperslideIn 当前滑块索引
 * @returns 滤镜相关的响应式数据和方法
 */
export function useEditorFilter(
    imageList: Ref<PhotoItem[]>,
    swiperslideIn: Ref<number>
) {
    /** 当前选中的滤镜索引 */
    const selectedFilter = ref(0);

    /** 支持的滤镜配置列表 */
    const filterList = ref<FilterConfig[]>([
        { name: '原图', alias: 'original', cover: '/images/editor/filter.png' },
        { name: '增强', alias: 'enhance', cover: '/images/editor/filter.png' },
        { name: '锐化', alias: 'sharpening', cover: '/images/editor/filter.png' },
        { name: '黑白', alias: 'mono', cover: '/images/editor/filter.png' },
        { name: '去摩尔纹', alias: 'moire-pattern', cover: '/images/editor/filter.png' }
    ]);

    /**
     * 监听滤镜选择变化，同步到当前图片
     */
    watch(
        () => selectedFilter.value,
        async (index) => {
            const currentImage = imageList.value[swiperslideIn.value];
            const newFilter = filterList.value[index]?.alias;

            if (currentImage && newFilter && currentImage.filter !== newFilter) {
                console.log('滤镜切换:', {
                    imageIndex: swiperslideIn.value,
                    from: currentImage.filter,
                    to: newFilter
                });

                // 清理旧的filteredSrc
                if (currentImage.filteredSrc) {
                    URL.revokeObjectURL(currentImage.filteredSrc);
                    currentImage.filteredSrc = undefined;
                }

                // 更新滤镜类型
                currentImage.filter = newFilter;

                // 应用新滤镜
                await applyFilterToImage(currentImage, newFilter);
            }
        }
    );

    /**
     * 应用滤镜到指定图片
     * @param image 图片对象
     * @param filterAlias 滤镜别名
     */
    const applyFilterToImage = async (image: PhotoItem, filterAlias: string) => {
        try {
            // 获取源图片URL（优先使用processedSrc，否则使用src）
            const sourceSrc = image.processedSrc || image.src;

            if (filterAlias === 'original') {
                // 原图滤镜，清理filteredSrc
                if (image.filteredSrc) {
                    URL.revokeObjectURL(image.filteredSrc);
                    image.filteredSrc = undefined;
                }
            } else {
                // 应用滤镜处理
                const filteredUrl = await ImageFilterProcessor.applyFilter(sourceSrc, filterAlias);
                image.filteredSrc = filteredUrl;
            }
        } catch (error) {
            console.error('应用滤镜失败:', error);
        }
    };

    /**
     * 同步滤镜选择与当前图片的滤镜状态
     */
    const syncFilterWithImage = async () => {
        const currentImage = imageList.value[swiperslideIn.value];
        if (!currentImage) return;

        const filterIndex = filterList.value.findIndex(f => f.alias === currentImage.filter);
        selectedFilter.value = filterIndex >= 0 ? filterIndex : 0;

        // 如果当前图片没有应用滤镜，应用当前选中的滤镜
        const currentFilter = currentImage.filter || 'original';
        if (!currentImage.filteredSrc && currentFilter !== 'original') {
            await applyFilterToImage(currentImage, currentFilter);
        }
    };

    /**
     * 重置当前图片滤镜为原图
     */
    const resetFilterToOriginal = () => {
        selectedFilter.value = 0;
    };

    /**
     * 清理所有图片的滤镜资源
     */
    const cleanupFilterResources = () => {
        imageList.value.forEach(image => {
            if (image.filteredSrc) {
                URL.revokeObjectURL(image.filteredSrc);
                image.filteredSrc = undefined;
            }
        });
    };

    return {
        // 响应式数据
        selectedFilter,
        filterList,

        // 方法
        applyFilterToImage,
        syncFilterWithImage,
        resetFilterToOriginal,
        cleanupFilterResources
    };
}
import { ref, computed } from 'vue'
import * as Editor from './editor'
import { useSnackbar } from '@/components/global/snackbarService'

/**
 * 滤镜列表
 */
const filterList = ref([
    { id: 'original', name: '原图', cover: '/images/editor/filter.png' },
    { id: 'enhance', name: '增强', cover: '/images/editor/filter.png' },
    { id: 'sharpening', name: '锐化', cover: '/images/editor/filter.png' },
    { id: 'mono', name: '黑白', cover: '/images/editor/filter.png' },
    { id: 'scan', name: '扫描', cover: '/images/editor/filter.png' },
    { id: 'remshad', name: '去阴影', cover: '/images/editor/filter.png' }
])

/**
 * 当前图片所使用的滤镜
 */
const currentFilter = computed({
    get: () => {
        return filterList.value.findIndex((item) => item.id === Editor.currentImage.value?.use_filter)
    },
    set: async (value) => {
        // 设置滤镜
        useSnackbar().info('正在应用滤镜...', true)
        if (await applyFilterToImage(Editor.currentImage.value.persped_src, filterList.value[value].id)) {
            Editor.currentImage.value.use_filter = filterList.value[value].id
            useSnackbar().success('滤镜应用成功！')
        } else {
            useSnackbar().error('滤镜应用失败！')
            Editor.currentImage.value.use_filter = 'original'
        }
    }
})

/**
 * 为图片应用滤镜
 * @param src 图片bloburl
 * @param filterId 滤镜名
 * @returns
 */
const applyFilterToImage = async (src: string, filterId: string) => {
    try {
        // 获取当前图片
        const currentImage = Editor.currentImage.value;
        if (!currentImage) return false;

        // 如果之前有滤镜结果，先释放
        if (currentImage.filtered_src) {
            URL.revokeObjectURL(currentImage.filtered_src);
            currentImage.filtered_src = undefined;
        }

        switch (filterId) {
            case 'original':
                // 原图不需要处理
                break
            case 'enhance':
                // 增强：提高对比度
                currentImage.filtered_src = await applyEnhanceFilter(src);
                break
            case 'sharpening':
                // 锐化处理
                currentImage.filtered_src = await applySharpenFilter(src);
                break
            case 'mono':
                // 黑白效果
                currentImage.filtered_src = await applyMonoFilter(src);
                break
            case 'scan':
                // 扫描效果：高对比度凸显文字
                currentImage.filtered_src = await applyScanFilter(src);
                break
            case 'remshad':
                // 去阴影：使用更有效的算法
                currentImage.filtered_src = await applyRemshadFilter(src);
                break
            default:
                return false
        }

        // 如果是原图，确保filtered_src为undefined
        if (filterId === 'original') {
            currentImage.filtered_src = undefined;
        }

        return true
    } catch (error) {
        console.error('滤镜应用失败:', error);
        return false
    }
}

/**
 * 应用增强滤镜
 * @param src 图片源
 * @returns 处理后的Blob URL
 */
const applyEnhanceFilter = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Canvas 上下文错误'));

            // 保持原始尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 增强对比度 - 优化算法性能
            const len = data.length;
            for (let i = 0; i < len; i += 4) {
                // 对比度增强
                data[i] = Math.min(255, (data[i] - 128) * 1.2 + 128);     // R
                data[i + 1] = Math.min(255, (data[i + 1] - 128) * 1.2 + 128); // G
                data[i + 2] = Math.min(255, (data[i + 2] - 128) * 1.2 + 128); // B
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('无法创建Blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = src;
    });
};

/**
 * 应用锐化滤镜
 * @param src 图片源
 * @returns 处理后的Blob URL
 */
const applySharpenFilter = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Canvas 上下文错误'));

            // 保持原始尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

            // 优化：只处理内部像素，避免边界检查
            for (let y = 1; y < height - 1; y++) {
                const rowOffset = y * width;
                const prevRowOffset = (y - 1) * width;
                const nextRowOffset = (y + 1) * width;

                for (let x = 1; x < width - 1; x++) {
                    for (let c = 0; c < 3; c++) { // RGB通道
                        let sum = 0;
                        const idx = (rowOffset + x) * 4 + c;

                        // 优化的卷积计算
                        sum += data[(prevRowOffset + x - 1) * 4 + c] * kernel[0];
                        sum += data[(prevRowOffset + x) * 4 + c] * kernel[1];
                        sum += data[(prevRowOffset + x + 1) * 4 + c] * kernel[2];
                        sum += data[(rowOffset + x - 1) * 4 + c] * kernel[3];
                        sum += data[idx] * kernel[4];
                        sum += data[(rowOffset + x + 1) * 4 + c] * kernel[5];
                        sum += data[(nextRowOffset + x - 1) * 4 + c] * kernel[6];
                        sum += data[(nextRowOffset + x) * 4 + c] * kernel[7];
                        sum += data[(nextRowOffset + x + 1) * 4 + c] * kernel[8];

                        output[idx] = Math.max(0, Math.min(255, sum));
                    }
                }
            }

            // 复制处理后的数据
            for (let i = 0; i < data.length; i++) {
                data[i] = output[i];
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('无法创建Blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = src;
    });
};

/**
 * 应用黑白滤镜
 * @param src 图片源
 * @returns 处理后的Blob URL
 */
const applyMonoFilter = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Canvas 上下文错误'));

            // 保持原始尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 转换为灰度 - 优化算法性能
            const len = data.length;
            for (let i = 0; i < len; i += 4) {
                const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                data[i] = gray;     // R
                data[i + 1] = gray; // G
                data[i + 2] = gray; // B
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('无法创建Blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = src;
    });
};

/**
 * 应用扫描滤镜（高对比度凸显文字）
 * @param src 图片源
 * @returns 处理后的Blob URL
 */
const applyScanFilter = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Canvas 上下文错误'));

            // 保持原始尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 扫描效果：高对比度 + 二值化处理
            const len = data.length;
            for (let i = 0; i < len; i += 4) {
                // 先转为灰度
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                // 高对比度处理
                let enhancedGray = (gray - 128) * 1.8 + 128; // 提高对比度增强因子

                // 限制在0-255范围内
                enhancedGray = Math.max(0, Math.min(255, enhancedGray));

                // 二值化处理，增强文字与背景对比
                const binaryGray = enhancedGray > 100 ? 255 : 0; // 调整阈值使效果更明显

                data[i] = binaryGray;     // R
                data[i + 1] = binaryGray; // G
                data[i + 2] = binaryGray; // B
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('无法创建Blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = src;
    });
};

/**
 * 应用去阴影滤镜
 * @param src 图片源
 * @returns 处理后的Blob URL
 */
const applyRemshadFilter = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Canvas 上下文错误'));

            // 保持原始尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;

            // 去阴影算法：优化版本，使用更高效的局部处理
            const radius = 3; // 减小半径以提高性能
            const output = new Uint8ClampedArray(data.length);

            // 优化：使用更高效的算法，只处理必要的像素
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;

                    // 简化版去阴影算法：只在必要时进行局部处理
                    if (data[idx] < 100 || data[idx + 1] < 100 || data[idx + 2] < 100) {
                        // 对暗区进行处理
                        let minR = 255, minG = 255, minB = 255;

                        // 限制搜索范围以提高性能
                        const startY = Math.max(0, y - radius);
                        const endY = Math.min(height - 1, y + radius);
                        const startX = Math.max(0, x - radius);
                        const endX = Math.min(width - 1, x + radius);

                        for (let ky = startY; ky <= endY; ky++) {
                            for (let kx = startX; kx <= endX; kx++) {
                                const nIdx = (ky * width + kx) * 4;
                                minR = Math.min(minR, data[nIdx]);
                                minG = Math.min(minG, data[nIdx + 1]);
                                minB = Math.min(minB, data[nIdx + 2]);
                            }
                        }

                        // 基于局部最小值调整当前像素
                        const adjustR = Math.min(255, data[idx] + (128 - minR) * 0.5);
                        const adjustG = Math.min(255, data[idx + 1] + (128 - minG) * 0.5);
                        const adjustB = Math.min(255, data[idx + 2] + (128 - minB) * 0.5);

                        output[idx] = adjustR;
                        output[idx + 1] = adjustG;
                        output[idx + 2] = adjustB;
                        output[idx + 3] = data[idx + 3]; // Alpha 保持不变
                    } else {
                        // 亮区保持不变
                        output[idx] = data[idx];
                        output[idx + 1] = data[idx + 1];
                        output[idx + 2] = data[idx + 2];
                        output[idx + 3] = data[idx + 3];
                    }
                }
            }

            // 复制处理后的数据
            for (let i = 0; i < data.length; i++) {
                data[i] = output[i];
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                } else {
                    reject(new Error('无法创建Blob'));
                }
            }, 'image/png');
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = src;
    });
}

export {
    currentFilter,
    filterList,
}
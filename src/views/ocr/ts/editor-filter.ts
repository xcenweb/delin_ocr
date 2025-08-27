import { ref, watch, type Ref } from 'vue';
import type { PhotoItem } from '@/views/ocr/ts/camera';

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
        (index) => {
            const currentImage = imageList.value[swiperslideIn.value];
            const newFilter = filterList.value[index]?.alias;

            if (currentImage && newFilter && currentImage.filter !== newFilter) {
                console.log('滤镜切换:', {
                    imageIndex: swiperslideIn.value,
                    from: currentImage.filter,
                    to: newFilter
                });
                currentImage.filter = newFilter;
            }
        }
    );

    /**
     * 同步滤镜选择与当前图片的滤镜状态
     */
    const syncFilterWithImage = () => {
        const currentImage = imageList.value[swiperslideIn.value];
        if (!currentImage) return;

        const filterIndex = filterList.value.findIndex(f => f.alias === currentImage.filter);
        selectedFilter.value = filterIndex >= 0 ? filterIndex : 0;
    };

    /**
     * 重置当前图片滤镜为原图
     */
    const resetFilterToOriginal = () => {
        selectedFilter.value = 0;
    };

    return {
        // 响应式数据
        selectedFilter,
        filterList,

        // 方法
        syncFilterWithImage,
        resetFilterToOriginal
    };
}
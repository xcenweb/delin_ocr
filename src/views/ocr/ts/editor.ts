import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { PhotoItem } from '@/views/ocr/ts/camera';

/**
 * 编辑器通用逻辑
 * @returns 编辑器相关的响应式数据和方法
 */
export function useEditor() {
    const route = useRoute();

    /**
     * 编辑器当前模式
     * - edit: 编辑模式（默认）
     * - crop: 矫正模式
     * - watermark: 水印模式（待实现）
     */
    const editorMode = ref<'edit' | 'crop' | 'watermark' | string>('edit');

    /** 编辑的图片列表 */
    const imageList = ref<PhotoItem[]>([]);

    /** Swiper 实例引用 */
    const swiperInstance = ref<any>({});

    /** 当前 Swiper 滑块索引 */
    const swiperslideIn = ref(0);

    /**
     * Swiper 实例初始化
     * @param swiper Swiper 实例
     */
    const onSwiper = (swiper: any) => {
        swiperInstance.value.slidePrev = swiper;
        swiperInstance.value.slideNext = swiper;
    };

    /**
     * Swiper 滑动切换事件处理
     * @param swiper Swiper 实例
     */
    const onSlideChange = (swiper: any) => {
        swiperslideIn.value = swiper.activeIndex;
    };

    /**
     * 当前选中的图片（基于 Swiper 索引）
     */
    const currentImage = computed(() => {
        const fallbackImage = { src: '', points: [] };
        return imageList.value[swiperslideIn.value] || imageList.value[0] || fallbackImage;
    });

    /**
     * 编辑模式切换
     * @param toMode 目标模式
     * @param event 触发事件类型
     */
    const editorModeChange = (toMode: 'edit' | 'crop' | 'watermark', event?: string) => {
        console.log('编辑器模式切换:', { from: editorMode.value, to: toMode, event });
        editorMode.value = toMode;
    };

    /**
     * 监听路由参数变化，接收相机传递的照片数据
     */
    watch(
        () => route.query.photos,
        (photos: any) => {
            if (!photos) return;

            try {
                const photoItems: PhotoItem[] = JSON.parse(photos) || [];
                console.log('编辑器接收照片:', photoItems.length, '张');

                imageList.value = photoItems.map((item: PhotoItem) => ({
                    src: item.src,
                    filter: 'original',
                    processedSrc: item.processedSrc,
                    points: item.points || []
                }));
            } catch (error) {
                console.error('解析照片数据失败:', error);
            }
        },
        { immediate: true }
    );

    return {
        // 响应式数据
        editorMode,
        imageList,
        swiperInstance,
        swiperslideIn,
        currentImage,

        // 方法
        editorModeChange,
        onSwiper,
        onSlideChange
    };
}
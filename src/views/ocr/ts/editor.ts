import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { PhotoItem } from '@/views/ocr/ts/camera';

/**
 * 编辑器通用逻辑
 */
export function useEditor() {
    const route = useRoute();

    /**
     * 编辑器当前模式
     * - `edit` 编辑（默认）
     * - `crop` 矫正
     * - `watermark` TODO:水印
     */
    const editorMode = ref('edit');

    /**
     * 编辑的图片列表
     */
    const imageList = ref<PhotoItem[]>([]);

    // zswiper相关
    const swiperInstance: any = ref({});
    const swiperslideIn = ref(0);

    /**
     * swiper实例初始化
     */
    const onSwiper = (swiper: any) => {
        swiperInstance.value['slidePrev'] = swiper;
        swiperInstance.value['slideNext'] = swiper;
    };

    /**
     * swiper滑动切换事件
     */
    const onSlideChange = (swiper: any) => {
        swiperslideIn.value = swiper.activeIndex;
    };

    /**
     * 当前图片（基于当前swiper索引）
     */
    const currentImage = computed(() => {
        return imageList.value[swiperslideIn.value] || imageList.value[0] || { src: '', points: [] };
    });

    /**
     * 编辑模式切换
     * @param toMode 切换到的模式
     * @param event 触发事件
     */
    const editorModeChange = (toMode: string, event?: string) => {
        console.log('编辑器模式切换为:', { toMode, event });
        editorMode.value = toMode;
    };

    // 监听路由参数变化，接收相机传过来的照片
    watch(() => route.query.photos, (photos: any) => {
        if (!photos) return;
        const photoItems = JSON.parse(photos) || [];
        console.log('编辑器接收到的照片:', photoItems);

        // 清空现有图片列表
        imageList.value = [];

        // 将接收到的照片添加到图片列表
        photoItems.forEach((photoItem: PhotoItem) => {
            imageList.value.push({
                src: photoItem.src,
                filter: 'original',
                processedSrc: photoItem.processedSrc,
                points: photoItem.points || []
            });
        });
    }, { immediate: true });

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
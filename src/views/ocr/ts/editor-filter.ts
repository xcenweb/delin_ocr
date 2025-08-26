import { ref, watch } from 'vue';

/**
 * 滤镜功能
 */
export function useEditorFilter(
    imageList: any,
    swiperslideIn: any
) {
    /**
     * 当前选中的滤镜索引
     */
    const selectedFilter = ref(0);

    /**
     * 支持的滤镜列表
     */
    const filterList = ref([
        { name: '原图', alias: 'original', cover: '/images/editor/filter.png' },
        { name: '增强', alias: 'enhance', cover: '/images/editor/filter.png' },
        { name: '锐化', alias: 'sharpening', cover: '/images/editor/filter.png' },
        { name: '黑白', alias: 'mono', cover: '/images/editor/filter.png' },
        { name: '去摩尔纹', alias: 'moire-pattern', cover: '/images/editor/filter.png' },
    ]);

    /**
     * 滤镜切换监听
     */
    watch(() => selectedFilter.value, (index) => {
        // 用户手动更改滤镜
        if (imageList.value[swiperslideIn.value].filter != filterList.value[index].alias) {
            console.log('手动更换滤镜：', swiperslideIn.value, imageList.value[swiperslideIn.value].filter, '=>', filterList.value[index].alias);
            imageList.value[swiperslideIn.value].filter = filterList.value[index].alias;
        }
    });

    /**
     * 当swiper切换时，同步滤镜选择
     */
    const syncFilterWithImage = () => {
        // 滤镜与图片匹配
        const filter_name = imageList.value[swiperslideIn.value].filter;
        selectedFilter.value = filterList.value.findIndex(f => f.alias === filter_name);
    };

    /**
     * 重置滤镜为原图
     */
    const resetFilterToOriginal = () => {
        selectedFilter.value = 0; // 将重新矫正后图片的滤镜设置为original
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
// 编辑器当前模式
import { ref, computed } from 'vue'
import router from '@/router'
import { PhotoItem } from './types'
import { useSnackbar } from '@/components/global/snackbarService'

/**
 * 所有正在编辑的图片列表
 */
const imageList = ref<PhotoItem[]>([])

/**
 * 编辑器当前模式
 */
const currentEditorMode = ref<'edit' | 'persp' | 'watermark'>('edit')

/**
 * 编辑器展示的图片及信息
 */
const currentImage = computed(() => {
    return imageList.value[swiperslideIn.value];
})

// swiper
const swiperInstance = ref<any>(null)
const swiperslideIn = ref(0)
const onSwiper = (swiper: any) => {
    swiperInstance.value = swiper
};
const onSlideChange = (swiper: any) => {
    swiperslideIn.value = swiper.activeIndex
}

/**
 * 保存编辑器中所有图片
 */
const saveImages = () => {
    alert(JSON.stringify(imageList.value))
    useSnackbar().success('保存成功')
};

/**
 * 退出
 */
const goback = () => {
    if (currentEditorMode.value === 'edit') {
        router.back()
    } else {
        currentEditorMode.value = 'edit'
    }
};

/**
 * 退出之前
 */
const onBeforeLeave = () => {
    if (currentEditorMode.value !== 'edit') {
        goback()
        return false
    }
    return true
};

export {
    onSwiper,
    onSlideChange,
    saveImages,
    goback,
    onBeforeLeave,
    imageList,
    currentImage,
    swiperInstance,
    swiperslideIn,
    currentEditorMode,
}
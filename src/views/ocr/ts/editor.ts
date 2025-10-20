// 编辑器当前模式
import { ref, computed } from 'vue'
import router from '@/router'
import { PhotoItem } from './types'
import { useSnackbar } from '@/components/global/snackbarService'
import * as fileService from '@/utils/fileService'
import { ocrService } from '@/utils/ocrService'

/**
 * 所有正在编辑的图片列表
 */
const imageList = ref<PhotoItem[]>([])

/**
 * 编辑器当前模式
 */
const currentEditorMode = ref<'edit' | 'persp' | 'watermark'>('edit')

/**
 * 是否可以离开编辑器
 */
const canLeave = ref(false)

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
const saveImages = async () => {
    try {
        // alert(await ocrService.ocr.getStatus())
        useSnackbar().info('正在保存图片...', true)
        // TODO: 通过OCR识别自动重命名图片，多张图片识别后重命名（xxx_1.png...）归类到文件夹
        imageList.value.forEach(async (item) => {
            const src = item.filtered_src || item.persped_src || item.src
            fileService.saveBlobUrlToFile(src, await fileService.getUserFilePath(`/test/test.png`))
        })
        useSnackbar().success('保存成功')
        canLeave.value = true
        setTimeout(() => router.go(-2), 1000)
    } catch (error) {
        useSnackbar().error(error as string)
        return
    }
}

/**
 * 退出编辑器
 */
const goback = () => {
    if (currentEditorMode.value === 'edit') {
        router.back()
    } else {
        currentEditorMode.value = 'edit'
    }
}

/**
 * 退出编辑器前
 */
const onBeforeLeave = () => {
    if (currentEditorMode.value !== 'edit') {
        goback()
        return false
    }
    return true
}

export {
    onSwiper,
    onSlideChange,
    saveImages,
    goback,
    onBeforeLeave,
    canLeave,
    imageList,
    currentImage,
    swiperInstance,
    swiperslideIn,
    currentEditorMode,
}
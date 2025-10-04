<template>
    <v-app>
        <!-- pc 左侧导航栏 -->
        <v-navigation-drawer :rail="true" :mobile-breakpoint="600" :elevation="3" :touchless="true">

            <!-- 导航按钮 -->
            <v-list nav v-model:selected="selectedItem">
                <v-list-item v-for="(item, i) in navigator_list" :key="item.id" :value="item" color="primary"
                    class="text-center" @click="() => swiperInstance.slideTo.slideTo(item.id)">
                    <template v-slot:prepend>
                        <div class="d-flex flex-column align-center">
                            <v-icon size="24" :icon="item.icon"></v-icon>
                            <span class="text-caption mt-1">{{ item.text }}</span>
                        </div>
                    </template>
                </v-list-item>
            </v-list>

            <!-- 底部独立按钮 -->
            <template v-slot:append>
                <v-list nav>
                    <v-list-item color="primary" to="/setting" class="text-center">
                        <template v-slot:prepend>
                            <div class="d-flex flex-column align-center">
                                <v-icon size="24" class="mb-1" icon="mdi-cog"></v-icon>
                                <span class="text-caption">设置</span>
                            </div>
                        </template>
                    </v-list-item>
                </v-list>
            </template>
        </v-navigation-drawer>

        <v-main class="d-flex flex-column overflow-hidden"
            style="--v-layout-top: 0px; --v-layout-bottom: 0px; height: 100vh;">
            <v-container fluid class="pa-0" style="height: 100%;">
                <z-swiper @swiper="onSwiper($event, 'slideTo')" @slideChange="onSlideChange"
                    style="box-sizing: border-box; height: 100%;">
                    <z-swiper-item style="box-sizing: border-box; height: 100%;">
                        <div class="swiper-page-container">
                            <home-view />
                        </div>
                    </z-swiper-item>
                    <z-swiper-item style="box-sizing: border-box; height: 100%;">
                        <div class="swiper-page-container">
                            <certificate-view />
                        </div>
                    </z-swiper-item>
                    <z-swiper-item style="box-sizing: border-box; height: 100%;">
                        <div class="swiper-page-container">
                            <file-view />
                        </div>
                    </z-swiper-item>
                    <z-swiper-item style="box-sizing: border-box; height: 100%;">
                        <div class="swiper-page-container">
                            <user-view />
                        </div>
                    </z-swiper-item>
                </z-swiper>
            </v-container>
        </v-main>

        <!-- mobile 底部导航栏 -->
        <v-bottom-navigation grow mandatory v-model="swiperslideIn" class="d-sm-none">
            <template v-for="(item, index) in navigator_list" :key="item.id">
                <v-btn color="primary" :ripple="false" @click="() => swiperInstance.slideTo.slideTo(item.id)">
                    <v-icon>{{ item.icon }}</v-icon>
                    <span>{{ item.text }}</span>
                </v-btn>
                <v-spacer v-if="index === 1" />
            </template>
        </v-bottom-navigation>

        <!-- mobile 底栏居中悬浮按钮 -->
        <v-btn color="primary" icon="mdi-camera" class="d-sm-none position-fixed nav-bottom-fab" size="large"
            :elevation="4" @click="$router.push({ name: 'ocr-camera' })"></v-btn>

    </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSnackbar } from '@/components/global/snackbarService'

// 导入视图组件
import homeView from './main/home.vue'
import certificateView from './main/certificate.vue'
import fileView from './main/file.vue'
import userView from './main/user.vue'

// 导航栏列表
const navigator_list = ref([
    { id: 0, text: '首页', icon: 'mdi-home' },
    { id: 1, text: '证件', icon: 'mdi-cards' },
    { id: 2, text: '文件', icon: 'mdi-folder' },
    { id: 3, text: '我的', icon: 'mdi-account' },
]);

// zswiper
import { ZSwiper, ZSwiperItem } from '@zebra-ui/swiper'
import '@zebra-ui/swiper/index.scss'
const swiperslideIn = ref(0)
const swiperInstance: any = ref({})
const selectedItem = ref([navigator_list.value[0]])
const onSwiper = (swiper: any, name: string) => {
    swiperInstance.value[name] = swiper;
    swiperslideIn.value = 0
}
const onSlideChange = (swiper: any) => {
    swiperslideIn.value = swiper.activeIndex
    selectedItem.value = [navigator_list.value[swiper.activeIndex]]
}

// ocr worker
// 主要目的是生成索引
import * as comlink from 'comlink'
import { Block } from 'tesseract.js'
import { getAllFiles } from '@/utils/fileService'
import { fileCacheDB } from '@/utils/dbService'
import { convertFileSrc } from '@tauri-apps/api/core'
import OcrWorker from '/src/worker/ocr-worker.ts?worker&inline'
const ocr = comlink.wrap(new OcrWorker) as {
    init: (languages: string[]) => Promise<boolean>
    getStatus: () => Promise<boolean>
    recognize: (src: string) => Promise<{ text: string, blocks: Block, tags: string[] }>
}
onMounted(async () => {
    // 初始化 ocr worker
    useSnackbar().success('OCR: ' + await ocr.init(['chi_sim', 'eng']) ? 'running' : 'error', true)
    // 加载目录下所有文件
    // TODO 获取所有已创建索引的列表-当前文件列表=待索引文件列表
    const files = await getAllFiles('user/file')
    files.forEach(async (file) => {
        const fileInfo = await fileCacheDB.getByPath(file.relative_path)
        if (fileInfo) {
            // 已存在则跳过
            console.log(JSON.parse(fileInfo.tags))
            return
        } else {
            // 识别后写入数据库
            ocr.recognize(convertFileSrc(file.full_path)).then(async (result) => {
                fileCacheDB.add({
                    relative_path: file.relative_path,
                    tags: JSON.stringify(result.tags),
                    recognized_block: result.blocks,
                    recognized_text: result.text,
                })
            }).catch((error) => {
                console.error('OCR:', error)
            })
        }
    })
    useSnackbar().success('OCR: 索引构建完成')
})
</script>

<style scoped>
.nav-bottom-fab {
    bottom: 18px;
    inset-inline: 50%;
    transform: translateX(-50%);
    z-index: 1010;
}

.swiper-page-container {
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
}
</style>

<style>
html,
body {
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
}
</style>
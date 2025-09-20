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
import { onActivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSnackbar } from '@/components/global/snackbarService'

// https://swiper.zebraui.com/
import { ZSwiper, ZSwiperItem } from '@zebra-ui/swiper'
import '@zebra-ui/swiper/index.scss'

// 导入视图组件
import homeView from './main/home.vue'
import certificateView from './main/certificate.vue'
import fileView from './main/file.vue'
import userView from './main/user.vue'

// 导航栏列表npm
const navigator_list = ref([
    { id: 0, text: '首页', icon: 'mdi-home' },
    { id: 1, text: '证件', icon: 'mdi-cards' },
    { id: 2, text: '文件', icon: 'mdi-folder' },
    { id: 3, text: '我的', icon: 'mdi-account' },
]);

// zswiper
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

// TODO: ocr worker
import { useWebWorker } from '@vueuse/core'
import { getAllFiles } from '@/utils/fileService'
import ocrWorkerUrl from '/src/worker/ocr-worker.ts?worker&url'
import { convertFileSrc } from '@tauri-apps/api/core'
import { ocrRecordsDB } from '@/utils/dbService'

const ocrWorker = useWebWorker(ocrWorkerUrl, { type: 'module' })
onMounted(() => {
    ocrWorker.post({
        type: 'init',
        datas: {
            languages: ['chi_sim', 'eng'],
        }
    })
    watch(ocrWorker.data, (result: { type: string, datas: any }) => {
        if (result.type === 'error') {
            useSnackbar().error('ocr-worker: ' + result.datas)
        }
        if (result.type === 'inited') {
            useSnackbar().success('ocr-worker: running!')
        }
        if (result.type === 'recognized') {
            useSnackbar().success('ocr-worker: ' + result.datas.text)
            // await ocrRecordsDB.upsert()
        }
    })
})
onActivated(async () => {
    const files = await getAllFiles('user/file')
    // ocrWorker.post({ type: 'recognize', datas: { file: await file.blob() } })
    files.forEach(file => {
        ocrRecordsDB.getByPath(file.path).then(async (res) => {
            if (!res) {
                ocrWorker.post({
                    type: 'recognize',
                    datas: {
                        src: convertFileSrc(file.fullPath),
                        path: file.path
                    }
                })
            }
        })
    })
})

onUnmounted(() => {
    ocrWorker.terminate()
})
</script>

<style scoped>
.nav-bottom-fab {
    bottom: 18px;
    inset-inline: 50%;
    transform: translateX(-50%);
    z-index: 9999;
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
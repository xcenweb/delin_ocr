<template>
    <v-app class="d-flex flex-column position-relative overflow-hidden overflow-y-auto">
        <v-main>

            <div style="background: linear-gradient(135deg, #4285F4 0%, #6366F1 50%, #8B5CF6 100%); height: 180px;">
                <div class="w-full pr-4 pt-3 pl-5 d-flex justify-space-between align-center">
                    <p class="text-white text-h6">首页</p>
                </div>
            </div>

            <!-- <v-card class="position-relative mt-n16 ma-4 pa-3">
                <v-row>
                    <v-col cols="3" v-for="certificate in certificateTypes" :key="certificate.id">
                        <div class="text-center pa-1" @click="" style="cursor: pointer;">
                            <v-icon :icon="certificate.icon" :color="certificate.color" size="30" />
                            <p class="text-caption font-weight-medium">{{ certificate.name }}</p>
                            <p class="text-caption text-grey-darken-1">{{ certificate.count }}张</p>
                        </div>
                    </v-col>
                </v-row>
            </v-card> -->
            <v-card class="position-relative mt-n16 mx-3 mx-sm-4 mx-md-auto my-3 pa-4" max-width="680">
                <v-row>
                    <v-col cols="4" v-for="feature in features" :key="feature.title">
                        <div class="text-center" :hover="true" @click="goToFeature(feature.route)">
                            <v-icon :icon="feature.icon" color="#4285F4" size="45" class="mb-2" />
                            <p>{{ feature.title }}</p>
                        </div>
                    </v-col>
                </v-row>
            </v-card>

            <div class="d-flex justify-space-between align-center mb-4 ml-5 mt-8">
                <h3 class="font-weight-bold">最近文件</h3>
                <v-chip class="mr-4" append-icon="mdi-chevron-right" size="small" variant="outlined"
                    @click="router.push({ name: 'recent_files' })">
                    查看全部
                </v-chip>
            </div>
            <v-row class="d-flex flex-nowrap overflow-x-auto mb-5 pl-4 pr-8 swiper-no-swiping">
                <v-col cols="4" sm="3" md="2" lg="2" xl="2" xxl="2" v-for="(fso, index) in recentFiles" :key="index"
                    class="pl-3 pr-0 pt-4 pb-4">
                    <v-card @click="openFile(fso.relative_path)">
                        <v-img :src="fso.thumbnail" aspect-ratio="0.7" cover>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ fso.name }}
                            </v-card-subtitle>
                        </v-img>
                    </v-card>
                </v-col>
                <v-progress-circular v-if="!isLoading" indeterminate class="ma-auto mt-16" />
                <div v-if="!recentFiles && isLoading" class="text-center ma-auto mt-16">
                    <v-icon size="48" color="grey lighten-1">mdi-folder-open</v-icon>
                    <p class="text-subtitle-1 font-weight-medium mt-2">暂无文件</p>
                </div>
            </v-row>

        </v-main>
    </v-app>

</template>

<script setup lang="ts">
import { onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFileDialog } from '@vueuse/core'
import { useSnackbar } from '@/components/global/snackbarService'
import { openFile, type FileObject } from '@/utils/fileService'
import { getRecentFiles } from '@/utils/fileService'

const router = useRouter()

const features = ref([
    { title: '在线导入', icon: 'mdi-cloud-upload-outline', route: 'online-import' },
    { title: '文件导入', icon: 'mdi-file-upload-outline', route: 'select-file' },
    { title: '扫描导入', icon: 'mdi-camera-outline', route: 'ocr-camera' }
])

const certificateTypes = ref([
    { name: '身份证', icon: 'mdi-card-account-details', color: '#4285F4', count: 0 },
    { name: '驾驶证', icon: 'mdi-car', color: '#34A853', count: 0 },
    { name: '护照', icon: 'mdi-passport', color: '#EA4335', count: 0 },
    { name: '户口本', icon: 'mdi-home-account', color: '#FBBC04', count: 0 },
    { name: '学历证书', icon: 'mdi-school', color: '#9C27B0', count: 0 },
    { name: '荣誉证书', icon: 'mdi-trophy', color: '#FF9800', count: 0 },
    { name: '房产证', icon: 'mdi-home-city', color: '#795548', count: 0 },
    { name: '其他证件', icon: 'mdi-file-document', color: '#607D8B', count: 0 }
])

const isLoading = ref(false)
const recentFiles = ref<FileObject[]>()

/**
 * 跳转功能
 * @param routeName
 */
const goToFeature = (routeName: any) => {
    if (routeName === 'select-file') {
        const { files, open, reset, onCancel, onChange } = useFileDialog({
            accept: 'image/*,.pdf',
            directory: false,
        })
        open()
        onChange((files) => {
            console.log(files)
            useSnackbar().info('TODO: 暂不支持...')
        })
    }
    if (routeName) {
        router.push({ name: routeName })
    }
}

// 最近浏览文件
onMounted(async () => {
    recentFiles.value = await getRecentFiles(10)
    isLoading.value = true
})
onActivated(async () => {
    recentFiles.value = await getRecentFiles(10)
})
</script>


<style>
.bottom-gradient {
    background-image: linear-gradient(to top, rgba(0, 0, 0, 0.5) 5%, transparent 30px);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    pointer-events: none;
}
</style>
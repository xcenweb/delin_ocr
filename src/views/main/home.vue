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
            <v-card class="position-relative mt-n16 ma-4 pa-4">
                <v-row>
                    <v-col cols="4" v-for="feature in features" :key="feature.title">
                        <div class="text-center pa-0" :hover="true">
                            <v-icon :icon="feature.icon" color="#4285F4" size="45" class="mb-2" />
                            <p>{{ feature.title }}</p>
                        </div>
                    </v-col>
                </v-row>
            </v-card>

            <div class="d-flex justify-space-between align-center mb-4 ml-5 mt-8">
                <h3 class="font-weight-bold">最近浏览</h3>
                <v-chip class="mr-4" append-icon="mdi-chevron-right" size="small" variant="outlined">
                    查看全部
                </v-chip>
            </div>
            <v-row class="d-flex flex-nowrap overflow-x-auto mb-5 pl-4 pr-8 swiper-no-swiping">
                <v-col cols="4" sm="3" lg="2" v-for="(file, index) in recentFiles" :key="index"
                    class="pl-3 pr-0 pt-4 pb-4">
                    <v-card>
                        <v-img :src="file.cover" aspect-ratio="0.7" cover>
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                </div>
                            </template>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ file.name }}587888878888888
                            </v-card-subtitle>
                        </v-img>
                    </v-card>
                </v-col>
            </v-row>
            <div class="d-flex justify-space-between align-center mb-4 ml-5 mt-8">
                <h3 class="font-weight-bold">最近浏览</h3>
                <v-chip class="mr-4" append-icon="mdi-chevron-right" size="small" variant="outlined">
                    查看全部
                </v-chip>
            </div>
            <v-row class="d-flex flex-nowrap overflow-x-auto mb-5 pl-4 pr-8 swiper-no-swiping">
                <v-col cols="4" sm="3" lg="2" v-for="(file, index) in recentFiles" :key="index"
                    class="pl-3 pr-0 pt-4 pb-4">
                    <v-card>
                        <v-img :src="file.cover" aspect-ratio="0.7" cover>
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                </div>
                            </template>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ file.name }}587888878888888
                            </v-card-subtitle>
                        </v-img>
                    </v-card>
                </v-col>
            </v-row>
            <div class="d-flex justify-space-between align-center mb-4 ml-5 mt-8">
                <h3 class="font-weight-bold">最近浏览</h3>
                <v-chip class="mr-4" append-icon="mdi-chevron-right" size="small" variant="outlined">
                    查看全部
                </v-chip>
            </div>
            <v-row class="d-flex flex-nowrap overflow-x-auto mb-5 pl-4 pr-8 swiper-no-swiping">
                <v-col cols="4" sm="3" lg="2" v-for="(file, index) in recentFiles" :key="index"
                    class="pl-3 pr-0 pt-4 pb-4">
                    <v-card>
                        <v-img :src="file.cover" aspect-ratio="0.7" cover>
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                </div>
                            </template>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ file.name }}587888878888888
                            </v-card-subtitle>
                        </v-img>
                    </v-card>
                </v-col>
            </v-row>
            <div class="d-flex justify-space-between align-center mb-4 ml-5 mt-8">
                <h3 class="font-weight-bold">最近浏览</h3>
                <v-chip class="mr-4" append-icon="mdi-chevron-right" size="small" variant="outlined">
                    查看全部
                </v-chip>
            </div>
            <v-row class="d-flex flex-nowrap overflow-x-auto mb-5 pl-4 pr-8 swiper-no-swiping">
                <v-col cols="4" sm="3" lg="2" v-for="(file, index) in recentFiles" :key="index"
                    class="pl-3 pr-0 pt-4 pb-4">
                    <v-card>
                        <v-img :src="file.cover" aspect-ratio="0.7" cover>
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                </div>
                            </template>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ file.name }}587888878888888
                            </v-card-subtitle>
                        </v-img>
                    </v-card>
                </v-col>
            </v-row>
            <div class="d-flex justify-space-between align-center mb-4 ml-5 mt-8">
                <h3 class="font-weight-bold">最近浏览</h3>
                <v-chip class="mr-4" append-icon="mdi-chevron-right" size="small" variant="outlined">
                    查看全部
                </v-chip>
            </div>
            <v-row class="d-flex flex-nowrap overflow-x-auto mb-5 pl-4 pr-8 swiper-no-swiping">
                <v-col cols="4" sm="3" lg="2" v-for="(file, index) in recentFiles" :key="index"
                    class="pl-3 pr-0 pt-4 pb-4">
                    <v-card>
                        <v-img :src="file.cover" aspect-ratio="0.7" cover>
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                </div>
                            </template>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ file.name }}587888878888888
                            </v-card-subtitle>
                        </v-img>
                    </v-card>
                </v-col>
            </v-row>

        </v-main>
    </v-app>

</template>

<script setup>
import { ref } from 'vue'

const features = ref([
    {
        title: '在线导入',
        icon: 'mdi-cloud-upload-outline',
        color: '#4285F4'
    },
    {
        title: '文件导入',
        icon: 'mdi-file-upload-outline',
        color: '#4285F4'
    },
    {
        title: '扫描导入',
        icon: 'mdi-camera-outline',
        color: '#4285F4'
    }
])

const certificateTypes = ref([
    {
        id: 1,
        name: '身份证',
        icon: 'mdi-card-account-details',
        color: '#4285F4',
        count: 0
    },
    {
        id: 2,
        name: '驾驶证',
        icon: 'mdi-car',
        color: '#34A853',
        count: 0
    },
    {
        id: 3,
        name: '护照',
        icon: 'mdi-passport',
        color: '#EA4335',
        count: 0
    },
    {
        id: 4,
        name: '户口本',
        icon: 'mdi-home-account',
        color: '#FBBC04',
        count: 0
    },
    {
        id: 5,
        name: '学历证书',
        icon: 'mdi-school',
        color: '#9C27B0',
        count: 0
    },
    {
        id: 6,
        name: '荣誉证书',
        icon: 'mdi-trophy',
        color: '#FF9800',
        count: 0
    },
    {
        id: 7,
        name: '房产证',
        icon: 'mdi-home-city',
        color: '#795548',
        count: 0
    },
    {
        id: 8,
        name: '其他证件',
        icon: 'mdi-file-document',
        color: '#607D8B',
        count: 0
    }
])

const recentFiles = ref([
    {
        id: 1,
        name: '营业执照证书',
        cover: 'https://picsum.photos/200/300'
    },
    {
        id: 2,
        name: '资质证书',
        cover: 'https://picsum.photos/200/300?random=2'
    },
    {
        id: 3,
        name: '证书文件',
        cover: 'https://picsum.photos/200/300?random=3'
    },
    {
        id: 4,
        name: '合同文件',
        cover: 'https://picsum.photos/200/300?random=4'
    },
    {
        id: 5,
        name: '发票文件',
        cover: 'https://picsum.photos/200/300?random=5'
    }
])
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
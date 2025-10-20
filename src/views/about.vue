<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>关于</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-container>
                <!-- 应用信息卡片 -->
                <v-card class="mb-4">
                    <v-card-text class="text-center py-6">
                        <v-avatar size="64" class="mb-3">
                            <v-img src="/logo.svg"></v-img>
                        </v-avatar>
                        <h2 class="text-h6 font-weight-bold mb-1">DelinBox<v-chip color="success" text="MIT" size="x-small" class="ml-1"></v-chip></h2>
                        <p class="text-subtitle-2 text--secondary mb-3">智能文档扫描与OCR识别工具</p>
                        <v-chip variant="outlined" color="primary" size="small">
                            版本 v{{ appVersion }}
                        </v-chip>
                    </v-card-text>
                </v-card>

                <!-- 开源许可卡片 -->
                <v-card class="mb-4">
                    <v-card-title class="text-subtitle-1 font-weight-bold">开源技术</v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="pa-3">
                        <v-row dense>
                            <v-col cols="6" md="4" v-for="tech in openSourceTechs" :key="tech.name" class="py-2">
                                <div class="d-flex align-center">
                                    <v-icon color="primary" class="ml-2">{{ tech.icon }}</v-icon>
                                    <span class="text-caption ml-2">{{ tech.name }}</span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <!-- 项目链接卡片 -->
                <v-card class="mb-4">
                    <v-card-title class="text-subtitle-1 font-weight-bold">项目链接</v-card-title>
                    <v-divider></v-divider>
                    <v-list class="py-0">
                        <v-list-item @click="openUrl('https://github.com/')">
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon start color="primary">mdi-github</v-icon>
                                    <span>GitHub</span>
                                </div>
                            </template>
                            <template v-slot:append>
                                <v-icon>mdi-open-in-new</v-icon>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getVersion } from '@tauri-apps/api/app';
import { openUrl } from '@tauri-apps/plugin-opener';

// 应用版本
const appVersion = ref('');

// 开源技术列表
const openSourceTechs = [
    { name: 'Vue 3', icon: 'mdi-vuejs' },
    { name: 'VueUse', icon: 'mdi-tools' },
    { name: 'Tauri', icon: 'mdi-hub-outline' },
    { name: 'ZebraSwiper', icon: 'mdi-view-carousel' },
    { name: 'Vue I18n', icon: 'mdi-translate' },
    { name: 'Vuetify', icon: 'mdi-vuetify' },
    { name: 'Rust', icon: 'mdi-hub-outline' },
    { name: 'Tesseract.js', icon: 'mdi-ocr' },
    { name: 'OpenCV.js', icon: 'mdi-image-filter-black-white' }
];

// 页面加载时获取数据
onMounted(async () => {
    appVersion.value = await getVersion();
});
</script>
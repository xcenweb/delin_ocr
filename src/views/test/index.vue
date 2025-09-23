<template>
    <v-app key="index">
        <!-- 顶部导航 -->
        <v-app-bar flat color="primary">
            <v-btn icon @click="$router.back()">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-toolbar-title>开发者测试</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pa-4">
                <v-card class="mb-4">
                    <v-card-title>info</v-card-title>
                    <v-card-text>
                        <div class="text-body-2 mb-2">平台: {{ platform() }}({{ arch() }})</div>
                        <div class="text-body-2 mb-2">平台版本: {{ version() }}</div>
                        <div class="text-body-2 mb-2">应用版本: {{ appVersion }}</div>
                        <div class="text-body-2 mb-2">Tauri版本: {{ tauriVersion }}</div>
                        <div class="text-body-2 mb-2">应用名称: {{ name }}</div>
                        <div class="text-body-2 mb-2">应用包名: {{ identifier }}</div>
                    </v-card-text>
                </v-card>
                <v-card>
                    <v-card-title>测试项目</v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="item in testList" :key="item.name" :to="item.path">
                                <v-list-item-title>· {{ item.name }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getVersion, getTauriVersion, getName, getIdentifier } from '@tauri-apps/api/app';
import { platform, version, arch } from '@tauri-apps/plugin-os';

const appVersion = ref('');
const tauriVersion = ref('');
const name = ref('');
const identifier = ref('');

const testList = [
    { name: '数据库测试 (user/cache.db)', path: '/test/db' },
    { name: '路径测试 - 系统路径访问', path: '/test/path' },
    { name: 'OCR Worker测试', path: '/test/ocr-worker' },
    { name: 'TagService 测试', path: '/test/tag-service' },
    { name: '更新检测测试', path: '/test/update' },
];

onMounted(async () => {
    appVersion.value = await getVersion();
    tauriVersion.value = await getTauriVersion();
    name.value = await getName();
    identifier.value = await getIdentifier();
});
</script>
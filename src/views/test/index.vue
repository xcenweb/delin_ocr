<template>
    <v-app>
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
                    <v-card-title>系统信息</v-card-title>
                    <v-card-text>
                        <div class="text-body-2 mb-2">应用版本: {{ appVersion }}</div>
                        <div class="text-body-2 mb-2">Tauri版本: {{ tauriVersion }}</div>
                        <div class="text-body-2">平台: {{ platform() }}</div>
                    </v-card-text>
                </v-card>
                <v-card>
                    <v-card-title>测试项目</v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="item in testList" :key="item.name" @click="() => $router.push(item.path)">
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
import { getVersion, getTauriVersion } from '@tauri-apps/api/app';
import { platform } from '@tauri-apps/plugin-os';
const appVersion = ref('');
const tauriVersion = ref('');

const testList = [
    { name: '数据库测试', path: '/test/db' },
];

onMounted(async () => {
    appVersion.value = await getVersion();
    tauriVersion.value = await getTauriVersion();
});
</script>
<template>
    <v-app key="path_test">
        <!-- 顶部导航 -->
        <v-app-bar flat color="primary">
            <v-btn icon @click="$router.back()">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-toolbar-title>路径测试</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pa-1">
                <v-card class="mb-16">
                    <v-card-title>
                        系统路径
                        <v-spacer></v-spacer>
                    </v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item v-for="(pathInfo, index) in systemPaths" :key="index" class="mb-2">
                                <v-list-item-title class="text-body-1 mb-1">
                                    {{ pathInfo.name }}
                                </v-list-item-title>
                                <v-list-item-text class="mb-2">
                                    {{ pathInfo.path }}
                                </v-list-item-text>

                                <template v-if="pathInfo.accessible && pathInfo.files">
                                    <v-chip v-for="file in pathInfo.files.slice(0, 5)" :key="file" size="small"
                                        class="mr-1 mb-1" variant="outlined">
                                        {{ file }}
                                    </v-chip>
                                    <v-chip v-if="pathInfo.files.length > 5" size="small" variant="tonal"
                                        color="primary">
                                        +{{ pathInfo.files.length - 5 }} 更多
                                    </v-chip>
                                </template>

                                <template v-if="pathInfo.error">
                                    <v-alert type="error" variant="tonal" density="compact" class="mt-2">
                                        {{ pathInfo.error }}
                                    </v-alert>
                                </template>

                                <template v-slot:append>
                                    <v-btn icon size="small" variant="text" @click="testPath(pathInfo)"
                                        :loading="pathInfo.testing">
                                        <v-icon>mdi-refresh</v-icon>
                                    </v-btn>
                                </template>
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
import { readDir, exists } from '@tauri-apps/plugin-fs';
import { platform, arch, version } from '@tauri-apps/plugin-os';
import {
    appDataDir,
    appConfigDir,
    appCacheDir,
    appLogDir,
    audioDir,
    dataDir,
    desktopDir,
    documentDir,
    downloadDir,
    localDataDir,
    pictureDir,
    templateDir,
    videoDir,
    homeDir
} from '@tauri-apps/api/path';

// 系统信息
const platformInfo = ref('');
const archInfo = ref('');
const versionInfo = ref('');

// 路径相关
interface PathInfo {
    name: string;
    path: string;
    accessible: boolean;
    files?: string[];
    error?: string;
    testing?: boolean;
}

const systemPaths = ref<PathInfo[]>([]);
const loadingPaths = ref(false);

// 获取系统信息
onMounted(async () => {
    try {
        platformInfo.value = await platform();
        archInfo.value = await arch();
        versionInfo.value = await version();
        await loadSystemPaths();
    } catch (error) {
        console.error('获取系统信息失败:', error);
    }
});

// 加载系统路径
const loadSystemPaths = async () => {
    loadingPaths.value = true;

    const pathGetters = [
        { name: '应用数据目录', getter: appDataDir },
        { name: '应用配置目录', getter: appConfigDir },
        { name: '应用缓存目录', getter: appCacheDir },
        { name: '应用日志目录', getter: appLogDir },
        { name: '音频目录', getter: audioDir },
        { name: '数据目录', getter: dataDir },
        { name: '桌面目录', getter: desktopDir },
        { name: '文档目录', getter: documentDir },
        { name: '下载目录', getter: downloadDir },
        { name: '本地数据目录', getter: localDataDir },
        { name: '图片目录', getter: pictureDir },
        { name: '模板目录', getter: templateDir },
        { name: '视频目录', getter: videoDir },
        { name: '用户主目录', getter: homeDir },
    ];

    const paths: PathInfo[] = [];

    for (const pathGetter of pathGetters) {
        try {
            const path = await pathGetter.getter();
            const pathInfo: PathInfo = {
                name: pathGetter.name,
                path,
                accessible: false,
            };

            await testPathAccess(pathInfo);
            paths.push(pathInfo);
        } catch (error) {
            paths.push({
                name: pathGetter.name,
                path: '获取失败',
                accessible: false,
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    }

    systemPaths.value = paths;
    loadingPaths.value = false;
};

// 测试路径访问性
const testPathAccess = async (pathInfo: PathInfo) => {
    try {
        // 检查路径是否存在
        const pathExists = await exists(pathInfo.path);

        if (!pathExists) {
            pathInfo.accessible = false;
            pathInfo.error = '路径不存在';
            return;
        }

        // 尝试读取目录内容
        const entries = await readDir(pathInfo.path);
        pathInfo.accessible = true;
        pathInfo.files = entries.map(entry => entry.name).slice(0, 20); // 限制显示前20个文件
        pathInfo.error = undefined;
    } catch (error) {
        pathInfo.accessible = false;
        pathInfo.error = error instanceof Error ? error.message : '访问失败'+error;
    }
};

// 测试单个路径
const testPath = async (pathInfo: PathInfo) => {
    pathInfo.testing = true;
    await testPathAccess(pathInfo);
    pathInfo.testing = false;
};
</script>

<style scoped>
code {
    background-color: rgba(var(--v-theme-on-surface), 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.875em;
}

.v-list-item {
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.v-list-item:last-child {
    border-bottom: none;
}
</style>
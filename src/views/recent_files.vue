<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>最近文件</v-app-bar-title>
            <v-spacer />
            <v-btn icon="mdi-refresh" @click="refreshFiles" :loading="loading" />
        </v-app-bar>

        <v-main>
            <!-- 时间范围选择 -->
            <v-card class="ma-3" elevation="1">
                <v-card-text class="py-2">
                    <v-chip-group v-model="selectedDays" mandatory>
                        <v-chip
                            v-for="option in dayOptions"
                            :key="option.value"
                            :value="option.value"
                            size="small"
                            variant="outlined"
                        >
                            {{ option.label }}
                        </v-chip>
                    </v-chip-group>
                </v-card-text>
            </v-card>

            <!-- 文件统计 -->
            <div class="px-3 pb-2">
                <p class="text-caption text-grey-darken-1">
                    共找到 {{ recentFiles.length }} 个文件
                </p>
            </div>

            <!-- 文件列表 -->
            <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
                <div class="text-center">
                    <v-progress-circular indeterminate color="primary" />
                    <p class="text-caption text-grey mt-2">正在加载最近文件...</p>
                </div>
            </div>

            <v-row class="px-3" v-else-if="recentFiles.length > 0">
                <v-col cols="12" sm="12" md="6" lg="4" v-for="(file, i) in recentFiles" :key="i" class="pb-0 pt-3">
                    <v-card @click="openFile(file.full_path)" :ripple="false"
                        v-on-long-press.prevent="[() => onLongPress(file.full_path), { delay: 500 }]">
                        <template v-slot:prepend>
                            <v-img :src="file.thumbnail" width="55" aspect-ratio="1" cover rounded class="mr-1">
                                <template v-slot:error>
                                    <v-icon icon="mdi-file" color="grey" size="55" />
                                </template>
                            </v-img>
                        </template>
                        <template v-slot:title>
                            <p class="text-subtitle-2 text-truncate">{{ file.name }}</p>
                        </template>
                        <template v-slot:subtitle>
                            <p class="text-caption text-grey">
                                {{ getLatestTimeText(file) }} · {{ formatFileSize(file.info.size) }}
                            </p>
                            <p class="text-caption text-grey-lighten-1">
                                {{ getRelativePath(file.full_path) }}
                            </p>
                        </template>
                        <template v-slot:append>
                            <v-chip size="x-small" color="primary" variant="tonal" class="text-caption">
                                {{ getTimeLabel(file) }}
                            </v-chip>
                        </template>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 空状态 -->
            <div class="d-flex w-100 align-center justify-center" style="margin-top: 60%;" v-else>
                <div class="text-center">
                    <v-icon size="80" color="grey-lighten-2" icon="mdi-clock-outline" />
                    <p class="text-h6 mt-4 mb-2">暂无最近文件</p>
                    <p class="text-body-2 text-grey-darken-1">最近{{ selectedDays }}天内没有活动文件</p>
                </div>
            </div>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { vOnLongPress } from '@vueuse/components'
import { useSnackbar } from '@/components/global/snackbarService'
import { getRecentFiles, openFile, formatFileSize, type FileObject } from '@/utils/fileService'

const router = useRouter()
const snackbar = useSnackbar()

// 响应式数据
const loading = ref(true)
const recentFiles = ref<FileObject[]>([])
const selectedDays = ref(30)

// 时间范围选项
const dayOptions = [
    { label: '最近7天', value: 7 },
    { label: '最近30天', value: 30 },
    { label: '最近90天', value: 90 }
]

// 获取文件的最新时间
const getLatestTime = (file: FileObject): number => {
    return Math.max(
        new Date(file.info.atime).getTime(),
        new Date(file.info.mtime).getTime(),
        new Date(file.info.birthtime).getTime()
    )
}

// 获取文件的最新时间显示文本
const getLatestTimeText = (file: FileObject): string => {
    const times = [
        { time: new Date(file.info.atime).getTime(), label: '访问' },
        { time: new Date(file.info.mtime).getTime(), label: '修改' },
        { time: new Date(file.info.birthtime).getTime(), label: '创建' }
    ]

    const latest = times.reduce((prev, current) => prev.time > current.time ? prev : current)
    return new Date(latest.time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 获取时间标签
const getTimeLabel = (file: FileObject): string => {
    const now = Date.now()
    const latestTime = getLatestTime(file)
    const diffDays = Math.floor((now - latestTime) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays <= 7) return `${diffDays}天前`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`
    return `${Math.floor(diffDays / 30)}月前`
}

// 获取相对路径显示
const pathDisplayCache = new Map<string, string>()
const getRelativePath = (fullPath: string): string => {
    if (pathDisplayCache.has(fullPath)) {
        return pathDisplayCache.get(fullPath)!
    }

    // 简化路径显示，只显示相对于 user/file 的路径
    const parts = fullPath.replace(/\\/g, '/').split('/')
    const userFileIndex = parts.findIndex(part => part === 'file')
    let result: string

    if (userFileIndex >= 0 && userFileIndex < parts.length - 1) {
        result = parts.slice(userFileIndex + 1, -1).join('/') || '根目录'
    } else {
        result = parts.slice(0, -1).join('/') || '根目录'
    }

    pathDisplayCache.set(fullPath, result)
    return result
}

// 加载最近文件
const loadRecentFiles = async () => {
    loading.value = true
    try {
        const files = await getRecentFiles('user/file', 200, selectedDays.value)
        recentFiles.value = files
    } catch (error) {
        console.error('加载最近文件失败:', error)
        snackbar.error('加载最近文件失败')
    } finally {
        loading.value = false
    }
}

// 刷新文件列表
const refreshFiles = async () => {
    await loadRecentFiles()
    snackbar.success('刷新完成')
}

// 长按事件
const onLongPress = (path: string) => {
    snackbar.info('长按功能待实现: ' + path)
}

// 监听时间范围变化
watch(selectedDays, () => {
    loadRecentFiles()
})

// 页面加载时获取数据
onMounted(() => {
    loadRecentFiles()
})
</script>
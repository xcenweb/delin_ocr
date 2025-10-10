<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>最近文件</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <!-- 加载中 -->
            <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
                <div class="text-center">
                    <v-progress-circular indeterminate color="primary" />
                    <p class="text-caption text-grey mt-2">正在加载最近文件...</p>
                </div>
            </div>

            <!-- 文件列表 -->
            <div v-else-if="recentFiles.length > 0">
                <div v-for="(group, index) in groupedFiles" :key="index">
                    <div class="text-subtitle-1 font-weight-bold px-4 pt-4 pb-2">{{ group.date }}</div>
                    <v-row class="px-3">
                        <v-col cols="12" sm="12" md="6" lg="4" v-for="(file, i) in group.files" :key="i" class="pb-0 pt-3">
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
                                        {{ file.birthtime }} · {{ formatFileSize(file.size ?? 0) }}
                                    </p>
                                </template>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>
            </div>

            <!-- 空状态 -->
            <div class="d-flex w-100 align-center justify-center" style="margin-top: 60%;" v-else>
                <div class="text-center">
                    <v-icon size="80" color="grey-lighten-2" icon="mdi-clock-outline" />
                    <p class="text-h6 mt-4 mb-2">暂无最近文件</p>
                </div>
            </div>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { vOnLongPress } from '@vueuse/components'
import { useSnackbar } from '@/components/global/snackbarService'
import { formatFileSize, getRecentFiles, type FileObject, openFile } from '@/utils/fileService'

const loading = ref(true)
const recentFiles = ref<FileObject[]>([])

// 对最近文件按照 年-月 进行分组
const groupedFiles = computed(() => {
    const groups: { date: string; files: FileObject[] }[] = []
    recentFiles.value.forEach(file => {
        const d = new Date(file.mtime)
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        let group = groups.find(g => g.date === yearMonth)
        if (!group) {
            group = { date: yearMonth, files: [] }
            groups.push(group)
        }
        group.files.push(file)
    })
    return groups
})

// 加载最近文件
const loadRecentFiles = async () => {
    loading.value = true
    try {
        recentFiles.value = await getRecentFiles(200)
    } catch (error) {
        useSnackbar().error('加载最近文件失败')
    } finally {
        loading.value = false
    }
}

// 长按事件
const onLongPress = (path: string) => {
    useSnackbar().info('长按功能待实现: ' + path)
}

// 页面加载时获取数据
onMounted(() => {
    loadRecentFiles()
})
</script>
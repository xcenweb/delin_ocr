<template>
    <v-row class="px-3 pt-3" v-if="sortedFiles.length > 0">

        <v-col cols="12" sm="12" md="6" lg="4" v-for="(fso, i) in sortedFiles" :key="i" class="pb-0 pt-3">

            <!-- 普通文件夹 -->
            <v-card v-if="fso.type == 'dir'" @click="openFolder(fso.relative_path)" :ripple="false"
                v-on-long-press.prevent="[() => onLongPress(fso.relative_path), { delay: 500 }]">
                <template v-slot:prepend>
                    <v-icon icon="mdi-folder" color="#FFA726" size="55" />
                </template>
                <template v-slot:title>
                    <p class="text-subtitle-2 text-truncate">{{ fso.name }}</p>
                </template>
                <template v-slot:subtitle>
                    <p class="text-grey-darken-1 text-truncate">{{ fso.count }} 项</p>
                </template>
                <template v-slot:append>
                    <v-icon icon="mdi-chevron-right" color="grey-lighten-1" size="20" class="ml-2" />
                </template>
            </v-card>

            <!-- 普通文件 -->
            <v-card v-if="fso.type == 'file'" @click="openFile(fso.relative_path)" :ripple="false"
                v-on-long-press.prevent="[() => onLongPress(fso.full_path), { delay: 500 }]">
                <template v-slot:prepend>
                    <v-img :src="fso.thumbnail" width="55" aspect-ratio="1" cover rounded class="mr-1">
                        <template v-slot:error>
                            <v-icon icon="mdi-file" color="grey" size="55" />
                        </template>
                    </v-img>
                </template>
                <template v-slot:title>
                    <p class="text-subtitle-2 text-truncate">{{ fso.name }}</p>
                </template>
                <template v-slot:subtitle>
                    <p class="text-caption text-grey">{{ fso.info.mtime }} · {{ formatFileSize(fso.info.size) }}</p>
                </template>
            </v-card>

        </v-col>
    </v-row>

    <div class="d-flex w-100 align-center justify-center" style="margin-top: 60%;" v-if="sortedFiles.length === 0">
        <div class="text-center">
            <v-icon size="80" color="grey-lighten-2" icon="mdi-folder-open" />
            <p class="text-h6 mt-4 mb-2">暂无文件</p>
            <p class="text-body-2 text-grey-darken-1">还没有任何文件，开始扫描文档吧</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import router from "@/router";
import { sortedFiles, formatFileSize, loadDirectory } from "@/utils/fileService"
import { onActivated, onMounted } from 'vue';
import { vOnLongPress } from '@vueuse/components'
import { openFile } from "@/utils/fileService";

const props = withDefaults(defineProps<{
    /** 目标路径 */
    path: string,
}>(), {
    path: '',
});

onMounted(() => loadDirectory(props.path))
onActivated(() => loadDirectory(props.path))

/**
 * 打开文件夹
 */
const openFolder = (path: string) => {
    router.push({ name: 'manage_files', query: { path: path } })
}

// TODO: 文件/文件夹 列表长按响应
const onLongPress = (path: string) => {
    alert('长按响应' + path)
}
</script>
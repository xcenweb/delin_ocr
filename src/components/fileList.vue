// 文件列表组件
<template>
    <v-row class="px-3 pt-3" v-if="sortedFiles.length > 0">

        <v-col cols="12" sm="12" md="6" lg="4" v-for="(fso, i) in sortedFiles" :key="i" class="pb-0 pt-2">

            <!-- 普通文件夹 -->
            <v-card v-if="fso.type == 'dir'" @click="openFolder(fso.path)" :ripple="false"
                v-on-long-press.prevent="[onLongPress, { delay: 500, modifiers: { stop: false } }]">
                <template v-slot:prepend>
                    <v-icon icon="mdi-folder" color="#FFA726" size="60" />
                </template>
                <template v-slot:title>
                    <p class="text-subtitle-1 text-truncate">{{ fso.name }}</p>
                </template>
                <template v-slot:subtitle>
                    <p class="text-grey-darken-1">{{ fso.count }} 项</p>
                </template>
                <template v-slot:append>
                    <v-icon icon="mdi-chevron-right" color="grey-lighten-1" size="20" class="ml-2" />
                </template>
            </v-card>

            <!-- 普通文件 -->
            <v-card v-if="fso.type == 'file'" @click="openFile(fso.fullPath)" :ripple="false"
                v-on-long-press.prevent="[onLongPress, { delay: 500, modifiers: { stop: false } }]">
                <template v-slot:prepend>
                    <v-img :src="fso.thumbnail" width="60" aspect-ratio="1" cover rounded />
                </template>
                <template v-slot:title>
                    <p class="text-subtitle-1 text-truncate">{{ fso.name }}</p>
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
import { sortType, sortedFiles, formatFileSize, loadDirectory, getAllFiles } from "@/utils/fileService"
import { onActivated, onMounted } from 'vue';
import { vOnLongPress } from '@vueuse/components'

const props = withDefaults(defineProps<{
    /** 目标路径 */
    path: string,
}>(), {
    path: '',
});

sortType.value = 'name-dsc'

onMounted(() => {
    // console.log(getAllFiles('user/file'))
    loadDirectory(props.path)
})
onActivated(() => {
    loadDirectory(props.path)
})

/**
 * 打开文件夹
 */
const openFolder = (path: string) => {
    router.push({ name: 'file-next', query: { path: path } })
}

/**
 * 预览一张图片
 * TODO: 增加可预览目录下所有图片
 */
const openFile = (path: string) => {
    router.push({ name: 'image-viewer', query: { path: path } })
}

// TODO: 切换排序方式
const selectSort = (type: string) => {

}

// TODO: 文件/文件夹 列表长按响应
const onLongPress = () => {
    alert('长按响应')
}
</script>
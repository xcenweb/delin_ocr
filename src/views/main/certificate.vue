<template>
    <v-app class="d-flex flex-column position-relative overflow-hidden overflow-y-auto">

        <div class="d-flex justify-space-between align-center mb-4 px-4 pt-4">
            <h3 class="font-weight-bold">我的证件</h3>
            <v-btn color="primary" prepend-icon="mdi-plus" variant="outlined" to="/ocr/camera" size="small"
                text="添加证件" />
        </div>

        <v-container class="pa-0 mb-16" fluid>
            <!-- 搜索栏 -->
            <v-text-field class="mx-4 mb-2" v-model="searchQuery" prepend-inner-icon="mdi-magnify" placeholder="搜索一下"
                variant="outlined" density="compact" clearable hide-details>
            </v-text-field>

            <!-- 标签栏 -->
            <v-slide-group v-model="selectedTag" mandatory show-arrows="desktop" mobile-breakpoint="sm"
                class="mb-5 swiper-no-swiping">
                <v-spacer style="width: 12px;" class="d-sm-none"></v-spacer>
                <v-slide-group-item v-slot="{ isSelected, toggle }" value="all">
                    <v-chip :color="isSelected ? 'primary' : undefined" :variant="isSelected ? 'flat' : 'outlined'"
                        class="ma-1" @click="toggle" density="compact">
                        <p>全部 ({{ certificate_lists.length }})</p>
                    </v-chip>
                </v-slide-group-item>
                <v-slide-group-item v-for="tag in tagCategories" :key="tag.id" :value="tag.id"
                    v-slot="{ isSelected, toggle }">
                    <v-chip :color="tag.color" :variant="isSelected ? 'flat' : 'outlined'" :prepend-icon="tag.icon"
                        class="ma-1" @click="toggle" density="compact">
                        <p>{{ tag.name }} ({{ tagCertificateCount(tag.id) }})</p>
                    </v-chip>
                </v-slide-group-item>
                <v-spacer style="width: 12px;" class="d-sm-none"></v-spacer>
            </v-slide-group>

            <!-- 证件列表 -->
            <v-row v-if="filteredCertificates.length > 0" class="px-5">
                <v-col cols="6" sm="4" md="3" lg="2" v-for="certificate in filteredCertificates"
                    :key="certificate.relative_path" class="pt-1 px-2">

                    <v-card @click="openFile(certificate.relative_path)">
                        <v-img :src="certificate.thumbnail" aspect-ratio="1.95" cover>
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                </div>
                            </template>
                            <div class="fill-height bottom-gradient"></div>
                            <v-card-subtitle
                                class="text-white pl-2 pb-1 pr-1 position-absolute bottom-0 d-inline-block text-caption w-100">
                                {{ certificate.name }}
                            </v-card-subtitle>
                        </v-img>
                        <v-card-actions class="pa-2 pt-0 pb-0" style="min-height: 35px;">
                            <v-chip-group class="text-no-wrap">
                                <v-chip v-for="tag in certificate.tags" :key="tag" size="x-small" density="comfortable"
                                    variant="flat" class="my-1" :text="getTagName(tag)" />
                            </v-chip-group>
                            <v-spacer></v-spacer>
                            <!-- <v-menu open-on-hover open-on-click>
                                <template v-slot:activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" size="x-small" v-bind="props"></v-btn>
                                </template>
                                <v-list>
                                    <v-list-item @click="">
                                        <v-list-item-title>
                                            <v-icon start size="small">mdi-pencil</v-icon>编辑
                                        </v-list-item-title>
                                    </v-list-item>
                                    <v-list-item @click="">
                                        <v-list-item-title>
                                            <v-icon start size="small">mdi-delete</v-icon>删除
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu> -->
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <div class="text-center pt-16" v-else>
                <v-icon size="80" color="grey-lighten-2">{{ emptyStateConfig.icon }}</v-icon>
                <p class="text-h6 mt-4 mb-2">{{ emptyStateConfig.title }}</p>
            </div>
        </v-container>
    </v-app>
</template>

<script setup lang="ts">
import { type FileObject, getAllFiles, openFile } from '@/utils/fileService'
import { BASE_TAGS } from '@/utils/tagService'
import { ref, computed, onMounted } from 'vue'

const searchQuery = ref('')
const selectedTag = ref('all')


// 标签栏中指定要显示的标签
const tagCategories = ref(BASE_TAGS)

/** 统计每个标签下证件数量 */
const tagCertificateCount = (tagId: string) => certificate_lists.value.filter(cert => cert.tags?.includes(tagId)).length
/** 获取该标签的正式名字 */
const getTagName = (tagId: string) => tagCategories.value.find(tag => tag.id === tagId)?.name || tagId

const certificate_lists = ref<FileObject[]>([])

const filteredCertificates = computed(() => {
    let filtered = certificate_lists.value
    if (selectedTag.value !== 'all') {
        filtered = filtered.filter(cert => cert.tags?.includes(selectedTag.value))
    }
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(cert =>
            cert.name.toLowerCase().includes(query) ||
            cert.tags?.some(tag => getTagName(tag).toLowerCase().includes(query))
        )
    }
    return filtered
})

const emptyStateConfig = computed(() => {
    if (searchQuery.value) {
        return { icon: 'mdi-card-search', title: '未找到相关证件' }
    }
    if (selectedTag.value !== 'all') {
        return { icon: 'mdi-card-plus', title: '该标签下无证件' }
    }
    return { icon: 'mdi-card-plus', title: '还没有证件' }
})

onMounted(async() => {
    certificate_lists.value = await getAllFiles('user/file')
})
</script>

<style scoped>
.bottom-gradient {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
</style>
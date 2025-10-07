<template>
    <v-app class="d-flex flex-column position-relative overflow-hidden overflow-y-auto">

        <div class="d-flex justify-space-between align-center mb-4 px-4 pt-4">
            <h3 class="font-weight-bold">我的证件</h3>
            <v-btn color="primary" prepend-icon="mdi-plus" variant="outlined" to="/ocr/camera" size="small">
                添加证件
            </v-btn>
        </div>

        <v-main>
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
                        <p>全部 ({{ totalCount }})</p>
                    </v-chip>
                </v-slide-group-item>
                <v-slide-group-item v-for="tag in tagCategories" :key="tag.id" :value="tag.id"
                    v-slot="{ isSelected, toggle }">
                    <v-chip :color="tag.color" :variant="isSelected ? 'flat' : 'outlined'" :prepend-icon="tag.icon"
                        class="ma-1" @click="toggle" density="compact">
                        <p>{{ tag.name }} ({{ tag.count }})</p>
                    </v-chip>
                </v-slide-group-item>
            </v-slide-group>

            <!-- 证件列表 -->
            <v-row v-if="filteredCertificates.length > 0" class="px-5">
                <v-col cols="6" sm="4" md="3" lg="2" v-for="certificate in filteredCertificates"
                    :key="certificate.relative_path" class="pt-1 px-2">

                    <v-card @click="">
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
                                    variant="flat" class="my-1" :text="tag" />
                            </v-chip-group>
                            <v-spacer></v-spacer>
                            <v-menu open-on-hover open-on-click>
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
                            </v-menu>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <div class="text-center py-8" v-else>
                <v-icon size="80" color="grey-lighten-2">{{ emptyStateConfig.icon }}</v-icon>
                <p class="text-h6 mt-4 mb-2">{{ emptyStateConfig.title }}</p>
            </div>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { fileCacheDB } from '@/utils/dbService'
import { FileObject } from '@/utils/fileService'
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedTag = ref('all')

const tagCategories = ref([
    { id: 'id_card', name: '身份证', icon: 'mdi-card-account-details', color: '#4285F4', count: 0 },
    { id: 'driver_license', name: '驾驶证', icon: 'mdi-car', color: '#34A853', count: 0 },
    { id: 'passport', name: '护照', icon: 'mdi-passport', color: '#EA4335', count: 0 },
    { id: 'household', name: '户口本', icon: 'mdi-home-account', color: '#FBBC04', count: 0 },
    { id: 'degree', name: '学历证书', icon: 'mdi-school', color: '#9C27B0', count: 0 },
    { id: 'award', name: '荣誉证书', icon: 'mdi-trophy', color: '#FF9800', count: 0 },
    { id: 'property', name: '房产证', icon: 'mdi-home-city', color: '#795548', count: 0 },
    { id: 'other', name: '其他', icon: 'mdi-file-document', color: '#607D8B', count: 0 }
])

const certificate_lists = ref<FileObject[]>([
    {
        type: 'file',
        name: '身份证',
        thumbnail: 'https://picsum.photos/200/300?random=1',
        relative_path: '',
        full_path: '',
        atime: '',
        mtime: '',
        birthtime: '',
        tags: ['id_card'],
    },
    {
        type: 'file',
        name: '驾驶证',
        thumbnail: 'https://picsum.photos/200/300?random=2',
        relative_path: '',
        full_path: '',
        atime: '',
        mtime: '',
        birthtime: '',
        tags: ['driving_license'],
    },
    {
        type: 'file',
        name: '护照',
        thumbnail: 'https://picsum.photos/200/300?random=3',
        relative_path: '',
        full_path: '',
        atime: '',
        mtime: '',
        birthtime: '',
        tags: ['passport'],
    }
])

const totalCount = computed(() => certificate_lists.value.length)

const filteredCertificates = computed(() => {
    let filtered = certificate_lists.value

    if (selectedTag.value !== 'all') {
        filtered = filtered.filter(cert =>
            cert.tags?.includes(selectedTag.value)
        )
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(cert =>
            cert.name.toLowerCase().includes(query) ||
            (cert.tags?.some(tag => {
                const tagCategory = tagCategories.value.find(t => t.id === tag)
                return tagCategory ? tagCategory.name.toLowerCase().includes(query) : false
            }))
        )
    }

    return filtered
})

// 优化空状态配置逻辑，减少冗余代码
const emptyStateConfig = computed(() => {
    if (searchQuery.value) {
        return { icon: 'mdi-card-search', title: '未找到相关证件' }
    } else if (selectedTag.value !== 'all') {
        return { icon: 'mdi-card-plus', title: `该标签下无证件` }
    } else {
        return { icon: 'mdi-card-plus', title: '还没有证件' }
    }
})
</script>

<style scoped>
.bottom-gradient {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
</style>
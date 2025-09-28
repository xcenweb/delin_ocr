<template>
    <v-app class="d-flex flex-column position-relative overflow-hidden overflow-y-auto">
        <v-main>
            <div class="d-flex justify-space-between align-center mb-4 px-4 pt-4">
                <h3 class="font-weight-bold">我的证件</h3>
                <v-btn color="primary" prepend-icon="mdi-plus" variant="outlined" to="/ocr/camera" size="small">
                    添加证件
                </v-btn>
            </div>

            <div class="px-4 mb-2">
                <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" placeholder="搜索证件..."
                    variant="outlined" density="compact" clearable hide-details>
                </v-text-field>
            </div>

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

            <v-row v-if="filteredCertificates.length > 0" class="px-5">
                <v-col cols="6" sm="4" md="3" lg="2" v-for="certificate in filteredCertificates" :key="certificate.id"
                    class="pt-1 px-2">

                    <v-card @click="viewCertificate(certificate)">
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
                        <v-card-actions class="pa-2 pt-0 pb-0" style="min-height: 40px;">
                            <v-chip-group class="text-no-wrap">
                                <v-chip v-for="tag in certificate.tags" :key="tag" :color="getTagColor(tag)"
                                    size="x-small" density="comfortable" variant="flat" class="my-1" :text="tag" />
                            </v-chip-group>
                            <v-spacer></v-spacer>
                            <v-menu open-on-hover open-on-click>
                                <template v-slot:activator="{ props }">
                                    <v-btn icon="mdi-dots-vertical" size="x-small" variant="text"
                                        v-bind="props"></v-btn>
                                </template>
                                <v-list>
                                    <v-list-item @click="editCertificate(certificate)">
                                        <v-list-item-title>
                                            <v-icon start size="small">mdi-pencil</v-icon>编辑
                                        </v-list-item-title>
                                    </v-list-item>
                                    <v-list-item @click="deleteCertificate(certificate)">
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
                <v-icon size="80" color="grey-lighten-2">mdi-card-plus</v-icon>
                <p class="text-h6 mt-4 mb-2">{{ getEmptyStateTitle() }}</p>
                <p class="text-body-2 text-grey mb-4">{{ getEmptyStateSubtitle() }}</p>
                <v-btn color="primary" prepend-icon="mdi-camera" text="立即添加" to="/ocr/camera" />
            </div>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const searchQuery = ref('')
const selectedTag = ref('all')

const tagCategories = ref([
    { id: 'id_card', name: '身份证', icon: 'mdi-card-account-details', color: '#4285F4' },
    { id: 'driver_license', name: '驾驶证', icon: 'mdi-car', color: '#34A853' },
    { id: 'passport', name: '护照', icon: 'mdi-passport', color: '#EA4335' },
    { id: 'household', name: '户口本', icon: 'mdi-home-account', color: '#FBBC04' },
    { id: 'degree', name: '学历证书', icon: 'mdi-school', color: '#9C27B0' },
    { id: 'award', name: '荣誉证书', icon: 'mdi-trophy', color: '#FF9800' },
    { id: 'property', name: '房产证', icon: 'mdi-home-city', color: '#795548' },
    { id: 'other', name: '其他', icon: 'mdi-file-document', color: '#607D8B' }
])

const certificates = ref([
    {
        name: '身份证',
        thumbnail: 'https://picsum.photos/200/300?random=1',
        createdAt: new Date('2024-01-15'),
        tags: ['身份证', '工作', '重要']
    },
    {
        name: '驾驶证',
        thumbnail: 'https://picsum.photos/200/300?random=2',
        createdAt: new Date('2024-01-10'),
        tags: ['驾驶证', '工作', '重要']
    },
    {
        name: '护照',
        thumbnail: 'https://picsum.photos/200/300?random=3',
        createdAt: new Date('2024-01-05'),
        tags: ['护照']
    }
])

const totalCount = computed(() => certificates.value.length)

const filteredCertificates = computed(() => {
    let filtered = certificates.value

    if (selectedTag.value !== 'all') {
        const tagName = tagCategories.value.find(t => t.id === selectedTag.value)?.name
        filtered = filtered.filter(cert =>
            tagName && cert.tags?.includes(tagName)
        )
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(cert =>
            cert.name.toLowerCase().includes(query) ||
            (cert.tags?.some(tag => tag.toLowerCase().includes(query)))
        )
    }

    return filtered
})

const getTagColor = (tagName) => {
    const tag = tagCategories.value.find(t => t.name === tagName)
    return tag ? tag.color : '#9E9E9E'
}

const getEmptyStateTitle = () => {
    if (searchQuery.value) return '未找到相关证件'
    if (selectedTag.value !== 'all') return `还没有${tagCategories.value.find(t => t.id === selectedTag.value)?.name}的证件`
    return '还没有证件'
}

const getEmptyStateSubtitle = () => {
    if (searchQuery.value) return '尝试使用其他关键词搜索'
    if (selectedTag.value !== 'all') return `点击添加包含${tagCategories.value.find(t => t.id === selectedTag.value)?.name}标签的证件`
    return '点击下方相机按钮开始添加证件'
}

const viewCertificate = (certificate) => console.log('查看证件:', certificate)
const editCertificate = (certificate) => console.log('编辑证件:', certificate)
const deleteCertificate = (certificate) => console.log('删除证件:', certificate)

const updateTagCounts = () => {
    tagCategories.value.forEach(tag => {
        tag.count = certificates.value.filter(cert =>
            cert.tags?.includes(tag.name)
        ).length
    })
}

onMounted(() => updateTagCounts())
</script>

<style scoped>
.bottom-gradient {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
</style>
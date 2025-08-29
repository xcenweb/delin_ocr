<template>
    <v-app class="d-flex flex-column position-relative overflow-hidden overflow-y-auto">
        <v-main>
            <!-- 顶部操作区域 -->
            <div class="d-flex justify-space-between align-center mb-4 px-4 pt-4">
                <h3 class="font-weight-bold">我的证件</h3>
                <v-btn color="primary" prepend-icon="mdi-plus" variant="outlined" to="/ocr/camera" size="small">
                    添加证件
                </v-btn>
            </div>

            <!-- 搜索区域 -->
            <div class="px-3 mb-2">
                <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" placeholder="搜索证件..."
                    variant="outlined" density="compact" clearable hide-details>
                </v-text-field>
            </div>

            <!-- 证件分类标签 -->
            <v-slide-group v-model="selectedCategory" mandatory show-arrows="desktop" mobile-breakpoint="sm"
                class="mb-5 swiper-no-swiping">
                <v-spacer style="width: 8px;" class="d-sm-none"></v-spacer>
                <v-slide-group-item v-slot="{ isSelected, toggle }" value="all">
                    <v-chip :color="isSelected ? 'primary' : undefined" :variant="isSelected ? 'flat' : 'outlined'"
                        class="ma-1" @click="toggle" density="compact">
                        <p>全部 ({{ totalCount }})</p>
                    </v-chip>
                </v-slide-group-item>
                <v-slide-group-item v-for="type in certificateTypes" :key="type.id" :value="type.id"
                    v-slot="{ isSelected, toggle }">
                    <v-chip :color="isSelected ? 'primary' : undefined" :variant="isSelected ? 'flat' : 'outlined'"
                        :prepend-icon="type.icon" class="ma-1" @click="toggle" density="compact">
                        <p>{{ type.name }} ({{ type.count }})</p>
                    </v-chip>
                </v-slide-group-item>
            </v-slide-group>

            <!-- 证件列表 -->
            <v-row v-if="filteredCertificates.length > 0" class="px-3">
                <v-col cols="6" sm="4" md="3" lg="2" v-for="certificate in filteredCertificates" :key="certificate.id"
                    class="pt-0">

                    <v-card @click="viewCertificate(certificate)">
                        <v-img :src="certificate.thumbnail" aspect-ratio="1.9" cover>
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
                            <v-chip :color="getCertificateTypeById(certificate.typeId)?.color" size="x-small"
                                variant="flat">
                                {{ getCertificateTypeById(certificate.typeId)?.name }}
                            </v-chip>
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

            <!-- 空状态 -->
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

// 搜索查询
const searchQuery = ref('')

// 选中的分类
const selectedCategory = ref('all')

// 证件类型定义（与home.vue保持一致）
const certificateTypes = ref([
    {
        id: 1,
        name: '身份证',
        icon: 'mdi-card-account-details',
        color: '#4285F4',
        count: 0
    },
    {
        id: 2,
        name: '驾驶证',
        icon: 'mdi-car',
        color: '#34A853',
        count: 0
    },
    {
        id: 3,
        name: '护照',
        icon: 'mdi-passport',
        color: '#EA4335',
        count: 0
    },
    {
        id: 4,
        name: '户口本',
        icon: 'mdi-home-account',
        color: '#FBBC04',
        count: 0
    },
    {
        id: 5,
        name: '学历证书',
        icon: 'mdi-school',
        color: '#9C27B0',
        count: 0
    },
    {
        id: 6,
        name: '荣誉证书',
        icon: 'mdi-trophy',
        color: '#FF9800',
        count: 0
    },
    {
        id: 7,
        name: '房产证',
        icon: 'mdi-home-city',
        color: '#795548',
        count: 0
    },
    {
        id: 8,
        name: '其他证件',
        icon: 'mdi-file-document',
        color: '#607D8B',
        count: 0
    }
])

// 证件数据（示例数据）
const certificates = ref([
    {
        id: 1,
        name: '身份证',
        typeId: 1,
        thumbnail: 'https://picsum.photos/200/300?random=1',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 2,
        name: '驾驶证',
        typeId: 2,
        thumbnail: 'https://picsum.photos/200/300?random=2',
        createdAt: new Date('2024-01-10')
    },
    {
        id: 3,
        name: '护照',
        typeId: 3,
        thumbnail: 'https://picsum.photos/200/300?random=3',
        createdAt: new Date('2024-01-05')
    }
])

// 计算属性
const totalCount = computed(() => certificates.value.length)

const filteredCertificates = computed(() => {
    let filtered = certificates.value

    // 按分类筛选
    if (selectedCategory.value !== 'all') {
        filtered = filtered.filter(cert => cert.typeId === selectedCategory.value)
    }

    // 按搜索关键词筛选
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(cert =>
            cert.name.toLowerCase().includes(query) ||
            getCertificateTypeById(cert.typeId)?.name.toLowerCase().includes(query)
        )
    }

    return filtered
})

// 方法
const getCertificateTypeById = (typeId) => {
    return certificateTypes.value.find(type => type.id === typeId)
}

const getEmptyStateTitle = () => {
    if (searchQuery.value) {
        return '未找到相关证件'
    }
    if (selectedCategory.value !== 'all') {
        const type = getCertificateTypeById(selectedCategory.value)
        return `还没有${type?.name}`
    }
    return '还没有证件'
}

const getEmptyStateSubtitle = () => {
    if (searchQuery.value) {
        return '尝试使用其他关键词搜索'
    }
    return '点击下方相机按钮开始添加证件'
}

const viewCertificate = (certificate) => {
    console.log('查看证件:', certificate)
    // TODO: 跳转到证件详情页面
}

const editCertificate = (certificate) => {
    console.log('编辑证件:', certificate)
    // TODO: 跳转到证件编辑页面
}

const deleteCertificate = (certificate) => {
    console.log('删除证件:', certificate)
    // TODO: 显示删除确认对话框
}

const updateCertificateTypeCounts = () => {
    certificateTypes.value.forEach(type => {
        type.count = certificates.value.filter(cert => cert.typeId === type.id).length
    })
}

// 生命周期
onMounted(() => {
    updateCertificateTypeCounts()
})
</script>

<style scoped>
.bottom-gradient {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
</style>
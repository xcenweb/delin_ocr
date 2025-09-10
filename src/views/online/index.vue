<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>
                在线导入
            </v-app-bar-title>
        </v-app-bar>
        <v-main>
            <v-container fluid>
                <v-row dense>
                    <v-col v-for="site in sites" :key="site.url" cols="12" sm="6" md="4" lg="3">
                        <v-card class="h-100">
                            <v-card-item>
                                <div class="d-flex align-center">
                                    <v-avatar color="primary" class="mr-3" size="36">
                                        <v-icon size="24">{{ site.icon }}</v-icon>
                                    </v-avatar>
                                    <div class="text-h6">{{ site.name }}</div>
                                </div>
                                <div class="text-body-2 text-medium-emphasis mt-2">
                                    {{ site.desc }}
                                </div>
                            </v-card-item>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface SiteItem {
    name: string
    url: string
    desc: string
    icon: string
}

const sites = ref<SiteItem[]>([
    { name: '到梦空间-实信网实践证书查询', url: '', desc: '到梦空间-实信网实践证书查询', icon: 'mdi-' },
])
</script>

<style scoped>
/* 根据需要微调卡片交互反馈 */
.v-card:hover {
    cursor: pointer;
}
</style>
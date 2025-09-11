<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>在线导入</v-app-bar-title>
        </v-app-bar>
        <v-main>
            <v-row class="pa-3">
                <v-col v-for="site in sites" :key="site.url" cols="12" sm="6" md="4" lg="3">
                    <v-card>
                        <template v-slot:prepend>
                            <v-avatar size="40" class="mr-1"></v-avatar>
                        </template>
                        <template v-slot:title>
                            <p class="text-subtitle-1 text-truncate">{{ site.name }}</p>
                        </template>
                        <template v-slot:subtitle>
                            <p class="text-grey-darken-1 text-truncate">{{ site.desc }}</p>
                        </template>
                    </v-card>
                </v-col>
            </v-row>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

invoke('get_input').then(res => {
    console.log(res)
})

const sites = ref([
    { name: '到梦空间', url: '', desc: '实信网实践证书查询/第二课堂成绩单纪念证书查询', ico: '' },
])
</script>
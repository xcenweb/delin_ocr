<template>
    <v-app class="d-flex flex-column position-relative overflow-hidden overflow-y-auto">
        <v-main>
            <v-card class="ma-3 rounded-lg">
                <v-card-text class="d-flex align-center">
                    <v-avatar size="64" color="white">
                        <v-img src="/images/avatar.png"></v-img>
                    </v-avatar>
                    <div class="ml-4 flex-grow-1">
                        <div class="text-h6 font-weight-bold">用户名</div>
                    </div>
                    <v-btn icon size="small" variant="text">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                </v-card-text>
            </v-card>
            <!-- 版本信息 -->
            <v-card class="ma-3 rounded-lg">
                <v-card-text class="d-flex align-center">
                    <div class="text-h6 font-weight-bold">版本信息</div>
                    <div class="ml-4 flex-grow-1">v{{ appVersion }}</div>
                </v-card-text>
            </v-card>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app';
import { onMounted, ref } from 'vue';
const appVersion = ref('');
onMounted(async () => {
    appVersion.value = await getVersion();
})
</script>
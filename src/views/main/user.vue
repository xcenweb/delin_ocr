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
            <v-card class="ma-3 rounded-lg">
                <v-card-text class="d-flex align-center">
                    <div class="text-h6 font-weight-bold">版本信息</div>
                    <div class="ml-4 flex-grow-1">v{{ appVersion }}</div>
                    <v-btn icon size="small" variant="text" @click="useUpdatePopup().check()">
                        <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card v-if="isDev" class="ma-3 rounded-lg">
                <v-card-text>
                    <div class="text-h6 font-weight-bold mb-3">开发者工具</div>
                    <v-btn color="primary" variant="outlined" class="mr-2" to="/test">
                        <v-icon start>mdi-test-tube</v-icon>
                        测试
                    </v-btn>
                </v-card-text>
            </v-card>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUpdatePopup } from '@/components/global/updatePopupService';

const appVersion = ref('');
const router = useRouter();
const isDev = import.meta.env.DEV;

onMounted(async () => {
    appVersion.value = await getVersion();
})
</script>
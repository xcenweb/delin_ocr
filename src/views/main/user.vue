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
                </v-card-text>
            </v-card>

            <v-card class="ma-3 pa-3 d-flex align-center">
                <p>版本信息</p>
                <p class="ml-4">v{{ appVersion }}</p>
                <v-spacer></v-spacer>
                <v-btn text="检查更新" prepend-icon="mdi-refresh" size="small" @click="useUpdatePopup().check()"
                    variant="tonal" />
            </v-card>
            <v-card class="ma-3 pa-3 d-flex align-center" to="/setting">
                <p>设置</p>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-arrow-right" size="x-small" @click="useUpdatePopup().check()"
                    variant="text" />
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
import { useUpdatePopup } from '@/components/global/updatePopupService';

const appVersion = ref('');
const isDev = import.meta.env.DEV;

onMounted(async () => {
    appVersion.value = await getVersion();
})
</script>
<template>
    <v-dialog v-model="useUpdatePopup().visible.value" persistent scrollable max-width="500px">
        <v-card title="发现新版本" :subtitle="'v'+useUpdatePopup().newVersion+'更新内容如下：'" class="pa-2">
            <template v-slot:text>
                <p style="white-space: pre-line;">
                    {{ useUpdatePopup().notes }}
                </p>
            </template>
            <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn text="取消" @click="useUpdatePopup().hide()" />
                <v-btn text="前往下载" @click="useUpdatePopup().update()" />
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useUpdatePopup } from '@/components/global/updateService'
</script>

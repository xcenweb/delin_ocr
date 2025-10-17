<template>
    <v-dialog v-model="useUpdatePopup().visible.value" persistent scrollable max-width="500px">
        <v-card class="pa-1">
            <template v-slot:title>
                <div class="d-flex align-center">
                    <span>发现新版本</span>
                    <v-chip v-if="useUpdatePopup().getVersionType(useUpdatePopup().networkVersion) === 'beta'"
                        color="warning" size="small" class="ml-2">
                        Beta
                    </v-chip>
                    <v-chip v-else-if="useUpdatePopup().getVersionType(useUpdatePopup().networkVersion) === 'alpha'"
                        color="error" size="small" class="ml-2">
                        Alpha
                    </v-chip>
                </div>
            </template>
            <template v-slot:subtitle>
                {{ useUpdatePopup().networkVersion }} 更新内容：
            </template>
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
import { useUpdatePopup } from '@/components/global/updatePopupService'
</script>
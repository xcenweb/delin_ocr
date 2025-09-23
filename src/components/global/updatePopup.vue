<template>
    <v-dialog v-model="updateService.visible.value" persistent scrollable max-width="500px">
        <v-card title="新版本！" prepend-icon="mdi-update">
            <template v-slot:text>
                <p>v{{ updateService.newVersion }} 更新内容：</p><br>
                <div style="white-space: pre-line;" class="font-weight-regular">
                    {{ updateService.notes }}
                </div>
            </template>
            <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn text="立即更新" @click="" />
                <v-btn text="暂不更新" @click="updateService.hide()" />
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useUpdateService } from '@/components/global/updateService'
const updateService = useUpdateService()
</script>

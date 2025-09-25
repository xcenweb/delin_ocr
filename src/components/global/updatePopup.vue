<template>
    <v-dialog v-model="useUpdatePopup().visible.value" persistent scrollable max-width="500px">
        <v-card title="新版本！" prepend-icon="mdi-update">
            <template v-slot:text>
                <p>v{{ useUpdatePopup().newVersion }} 更新内容：</p><br>
                <div style="white-space: pre-line;" class="font-weight-regular">
                    {{ useUpdatePopup().notes }}
                </div>
            </template>
            <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn text="立即更新" @click="useUpdatePopup().update()" variant="tonal" />
                <v-btn text="暂不更新" @click="useUpdatePopup().hide()" variant="plain" />
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useUpdatePopup } from '@/components/global/updateService'
</script>

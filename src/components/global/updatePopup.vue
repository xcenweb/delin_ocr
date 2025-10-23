<template>
    <v-dialog v-model="useUpdatePopup().visible.value" persistent scrollable max-width="500px">
        <v-card class="pa-1">
            <template v-slot:title>
                <div class="d-flex align-center">
                    <span>发现新版本</span>
                    <v-chip :text="updatePopup.getVersionType(updatePopup.releaseVersion)"
                        :color="updatePopup.getVersionType(updatePopup.releaseVersion) === 'official' ? 'sucess' : 'warning'"
                        size="x-small" class="text-uppercase ml-1" />
                </div>
            </template>
            <template v-slot:subtitle>
                {{ updatePopup.releaseVersion }}
            </template>
            <template v-slot:text>
                <p style="white-space: pre-line; line-height: normal; font-size: 0.9em;">
                    {{ updatePopup.releaseNotes }}
                </p>
            </template>
            <template v-slot:actions>
                <v-spacer></v-spacer>
                <v-btn text="取消" @click="updatePopup.hide()" />
                <v-btn text="前往下载" @click="updatePopup.update()" />
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useUpdatePopup } from '@/components/global/updatePopupService'
const updatePopup = useUpdatePopup()
</script>
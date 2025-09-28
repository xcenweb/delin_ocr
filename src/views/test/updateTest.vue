<template>
    <v-app>
        <v-app-bar flat color="primary">
            <v-btn icon @click="$router.back()">
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-toolbar-title>更新检测测试</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <v-container>
                <v-btn color="primary" @click="checkForUpdates">检测更新</v-btn>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { useUpdatePopup } from '@/components/global/updatePopupService'

const checkForUpdates = async () => {
    await useUpdatePopup().check()
}
</script>
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
import { useUpdateService } from '@/components/global/updateService'

const checkForUpdates = async () => {
    await useUpdateService().check()
}
</script>
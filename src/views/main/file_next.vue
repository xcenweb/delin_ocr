<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>
                {{ $route.query.path?.toString().split('/').pop() || '' }}
            </v-app-bar-title>
        </v-app-bar>
        <v-main>
            <file-list :path="$route.query.path?.toString() || ''" />
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>
import fileList from '@/components/fileList.vue';
</script>
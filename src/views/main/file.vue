<template>
    <v-app class="">
        <v-main>
            <!-- 文件列表展示 -->
            <file-list path="user/file" />
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import fileList from '@/components/fileList.vue';
</script>
<template>
    <v-app class="h-100 d-flex flex-column position-relative overflow-hidden overflow-y-auto">
        <v-main>
            <!-- 文件列表展示 -->
            <file-list path="user/file"></file-list>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import fileList from '@/components/fileList.vue';
</script>
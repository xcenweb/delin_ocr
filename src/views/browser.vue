<template>
    <v-app>
        <!-- 顶部导航栏 -->
        <v-toolbar color="primary" dark>
            <v-btn icon="mdi-arrow-left" @click="exitBrowser" />
            <v-toolbar-title>浏览器</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" @click="refreshPage" />
        </v-toolbar>

        <!-- 加载指示器 -->
        <v-progress-linear v-if="isLoading" indeterminate color="primary" height="3"></v-progress-linear>

        <!-- 主内容区 - 内嵌浏览器 -->
        <v-main fluid class="pa-0" style="height: calc(100vh - 64px);">
            <iframe ref="browserFrame" :src="currentUrl" frameborder="0" class="w-100 h-100"
                @load="onFrameLoad"></iframe>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// 状态变量
const currentUrl = ref('');
const isLoading = ref(true);
const browserFrame = ref(null);
const route = useRoute();
const router = useRouter();

// 从URL参数获取初始URL
onMounted(() => {
    watch(() => route.query.url, (newUrl) => {
        setUrlWithProtocol(newUrl || 'example.com');
    }, { immediate: true });
});

// 设置URL并确保包含协议
const setUrlWithProtocol = (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        currentUrl.value = `https://${url}`;
    } else {
        currentUrl.value = url;
    }
};

// 刷新页面
const refreshPage = () => {
    if (browserFrame.value) {
        // 通过重新设置src属性来刷新页面，避免跨域问题
        browserFrame.value.src = currentUrl.value;
        isLoading.value = true;
    }
};

// 退出浏览器（返回上一页或指定页面）
const exitBrowser = () => {
    router.back();
};

// 当iframe加载完成时
const onFrameLoad = () => {
    isLoading.value = false;
};
</script>
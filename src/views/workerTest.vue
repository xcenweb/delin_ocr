<template>
    <v-app>
        <v-main>
            <v-container>
                <v-card class="mx-auto mt-10" max-width="600" elevation="2">
                    <v-card-title>Web Worker 示例</v-card-title>
                    <v-card-text>
                        <p>计数：<output>{{ result }}</output></p>
                        <v-btn class="mr-2" color="success" @click="startWorker" :disabled="isWorkerRunning">
                            开始工作
                        </v-btn>
                        <v-btn color="error" @click="stopWorker" :disabled="!isWorkerRunning">
                            停止工作
                        </v-btn>
                        <p v-if="!isWorkerSupported" class="mt-4 red--text">
                            抱歉，你的浏览器不支持 Web Workers...
                        </p>
                        <p class="mt-4">
                            <strong>注意：</strong> Internet Explorer 9 及更早 IE 版本浏览器不支持 Web Workers.
                        </p>
                    </v-card-text>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useWebWorker } from '@vueuse/core'
import router from '@/router'

// 响应式数据
const result = ref<number>(0)
const isWorkerRunning = ref<boolean>(false)
const isWorkerSupported = ref<boolean>(typeof Worker !== "undefined")

const { data, post, terminate, worker } = useWebWorker('/src/worker/test.ts')
// 开始工作
function startWorker(): void {
    if (!isWorkerSupported.value || !worker.value) {
        return
    }

    // 监听来自 Worker 的消息
    worker.value.onmessage = function (event: MessageEvent<number>) {
        result.value = event.data
    }

    // 向 Worker 发送开始消息
    post('start')
    isWorkerRunning.value = true
}

// 停止工作
function stopWorker(): void {
    if (worker.value) {
        // 向 Worker 发送停止消息
        post('stop')
        result.value = 0
    }
    isWorkerRunning.value = false
}

// 组件卸载时清理 Worker
onUnmounted(() => {
    if (worker.value) {
        terminate()
        worker.value.terminate()
    }
})
</script>
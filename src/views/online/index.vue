<template>
  <v-container fluid class="pa-0" style="height: 100vh;">
    <v-row no-gutters style="height: 100%;">
      <!-- 左侧控制面板 25% -->
      <v-col cols="3" style="height: 100%; border-right: 1px solid #e0e0e0;">
        <v-card
          class="control-panel h-100"
          elevation="0"
          style="border-radius: 0;"
        >
          <v-card-title class="d-flex align-center justify-center bg-primary text-white">
            <v-icon left>mdi-web</v-icon>
            <span>在线网页操作</span>
          </v-card-title>

          <v-card-text class="pa-4">
            <!-- 目标网址 -->
            <v-text-field
              v-model="targetUrl"
              label="目标网址"
              variant="outlined"
              density="compact"
              readonly
              class="mb-3"
              prepend-inner-icon="mdi-link"
            />

            <!-- 状态显示 -->
            <v-chip
              :color="webviewStatus.color"
              :text="webviewStatus.text"
              size="small"
              class="mb-4 w-100 justify-center"
            />

            <!-- 主要操作按钮 -->
            <div class="mb-3">
              <v-btn
                v-if="!webview"
                color="primary"
                variant="elevated"
                size="large"
                block
                @click="createWebview"
              >
                <v-icon left>mdi-plus</v-icon>
                创建网页视图
              </v-btn>

              <v-btn
                v-else
                color="success"
                variant="elevated"
                size="large"
                block
                @click="loadWebpage"
              >
                <v-icon left>mdi-refresh</v-icon>
                重新加载
              </v-btn>
            </div>

            <!-- 关闭按钮 -->
            <v-btn
              v-if="webview"
              color="error"
              variant="elevated"
              size="small"
              block
              @click="closeWebview"
            >
              <v-icon left>mdi-close-circle</v-icon>
              关闭视图
            </v-btn>

            <v-divider class="my-4" />

            <!-- 操作说明 -->
            <div class="text-caption text-medium-emphasis">
              <v-icon size="small" class="mr-1">mdi-information</v-icon>
              操作说明：
              <ul class="mt-2 ml-4">
                <li>点击"创建网页视图"开始</li>
                <li>"重新加载"刷新当前页面</li>
                <li>"关闭视图"结束当前会话</li>
              </ul>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 右侧 Webview 区域 75% -->
      <v-col cols="9" style="height: 100%; position: relative;">
        <div
          ref="webviewContainer"
          class="webview-container"
          :style="{
            height: '100%',
            width: '100%',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }"
        >
          <div v-if="!webview" class="text-center">
            <v-icon size="120" color="grey-lighten-2">mdi-monitor</v-icon>
            <h2 class="text-grey-darken-1 mt-4 mb-2">网页视图区域</h2>
            <p class="text-grey mb-4">点击左侧控制面板的"创建网页视图"按钮开始</p>

            <v-card class="mx-auto" max-width="400" elevation="1">
              <v-card-text>
                <div class="text-h6 mb-2">目标网站信息</div>
                <p class="text-body-2 text-medium-emphasis mb-2">
                  <strong>网址：</strong>{{ targetUrl }}
                </p>
                <p class="text-body-2 text-medium-emphasis">
                  <strong>功能：</strong>证书列表页面浏览
                </p>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Window } from '@tauri-apps/api/window'
import { Webview } from '@tauri-apps/api/webview'
import snackbarService from '@/components/global/snackbarService'

// 响应式数据
const webview = ref<Webview | null>(null)
const webviewContainer = ref<HTMLElement | null>(null)
const targetUrl = ref('https://www.5idream.net/public/activity/certificate/list.html')
const webviewCreated = ref(false)

// 计算属性
const webviewStatus = computed(() => {
  if (!webview.value) {
    return { color: 'grey', text: '未创建' }
  }
  if (webviewCreated.value) {
    return { color: 'success', text: '已连接' }
  }
  return { color: 'warning', text: '连接中...' }
})

// 创建 Webview
const createWebview = async () => {
  try {
    snackbarService.info('正在创建网页视图...')

    // 获取当前窗口
    const currentWindow = Window.getCurrent()

    // 计算webview的位置和尺寸（占据右侧75%区域）
    const leftPanelWidth = Math.floor(window.innerWidth * 0.25) // 25%左侧控制面板
    const webviewWidth = window.innerWidth - leftPanelWidth // 75%右侧区域

    // 创建 webview
    const webviewInstance = new Webview(currentWindow, 'online-webview', {
      url: targetUrl.value,
      x: leftPanelWidth,
      y: 0,
      width: webviewWidth,
      height: window.innerHeight
    })

    // 监听 webview 创建成功事件
    webviewInstance.once('tauri://created', () => {
      webviewCreated.value = true
      snackbarService.success('网页视图创建成功！')
      console.log('Webview created successfully')
    })

    // 监听 webview 创建错误事件
    webviewInstance.once('tauri://error', (error) => {
      console.error('Failed to create webview:', error)
      snackbarService.error('创建网页视图失败: ' + JSON.stringify(error))
      webview.value = null
      webviewCreated.value = false
    })

    // 监听页面加载事件
    await webviewInstance.listen('tauri://page-load-start', () => {
      console.log('Page loading started')
      snackbarService.info('页面开始加载...')
    })

    await webviewInstance.listen('tauri://page-load-finish', () => {
      console.log('Page loading finished')
      snackbarService.success('页面加载完成！')
    })

    // 监听页面加载事件
    await webviewInstance.listen('tauri://page-load-start', () => {
      console.log('Page loading started')
      snackbarService.info('页面开始加载...')
    })

    await webviewInstance.listen('tauri://page-load-finish', () => {
      console.log('Page loading finished')
      snackbarService.success('页面加载完成！')
    })

    webview.value = webviewInstance

  } catch (error) {
    console.error('Error creating webview:', error)
    snackbarService.error('创建网页视图时发生错误: ' + error)
  }
}

// 重新加载网页
const loadWebpage = async () => {
  if (!webview.value) {
    snackbarService.warning('请先创建网页视图')
    return
  }

  try {
    snackbarService.info('正在重新加载网页...')
    // 注意：Tauri webview API 可能没有直接的 reload 方法，可以通过重新创建来实现
    await closeWebview()
    setTimeout(() => {
      createWebview()
    }, 500)
  } catch (error) {
    console.error('Error reloading webpage:', error)
    snackbarService.error('重新加载失败: ' + error)
  }
}

// 关闭 webview
const closeWebview = async () => {
  if (!webview.value) {
    snackbarService.warning('没有可关闭的网页视图')
    return
  }

  try {
    await webview.value.close()
    webview.value = null
    webviewCreated.value = false
    snackbarService.success('网页视图已关闭')
  } catch (error) {
    console.error('Error closing webview:', error)
    snackbarService.error('关闭网页视图失败: ' + error)
  }
}

// 生命周期钩子
onMounted(() => {
  // 初始化时无需特殊操作
})

onUnmounted(() => {
  // 清理 webview
  if (webview.value) {
    closeWebview()
  }
})
</script>

<style scoped>
.control-panel {
  background-color: #fafafa;
  border-right: 1px solid #e0e0e0;
}

.webview-container {
  position: relative;
  transition: all 0.3s ease;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .control-panel {
    font-size: 0.875rem;
  }
}

@media (max-width: 600px) {
  .control-panel {
    font-size: 0.75rem;
  }
}
</style>
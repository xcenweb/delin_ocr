<template>
  <!-- 全局 Snackbar 消息提示组件 -->
  <v-snackbar v-model="snackbarService.visible.value" :color="snackbarService.color.value"
    :timeout="snackbarService.timeout.value" location="top" transition="slide-y-transition">
    <v-row align="center" no-gutters>
      <!-- 进度圆圈 -->
      <v-col cols="auto" v-if="snackbarService.showProgress.value">
        <v-progress-circular indeterminate size="20" width="3" class="mr-3 ml-1" />
      </v-col>
      <!-- 消息文本 -->
      <v-col>
        {{ snackbarService.message.value }}
      </v-col>
    </v-row>
    <!-- 关闭按钮 -->
    <template v-slot:actions>
      <v-btn icon="mdi-close" @click="snackbarService.hide()" size="small" />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useSnackbar } from '@/components/global/snackbarService'
const snackbarService = useSnackbar()
</script>
<template>
  <!-- 全局 Loading Dialog 组件 -->
  <v-dialog v-model="loadingDialogService.visible.value" :persistent="!loadingDialogService.cancellable.value" 
    max-width="400" transition="dialog-bottom-transition">
    <v-card>
      <v-card-title v-if="loadingDialogService.title.value" class="text-h6 font-weight-bold">
        {{ loadingDialogService.title.value }}
      </v-card-title>

      <v-card-text>
        <v-row align="center" no-gutters>
          <!-- 进度圆圈 -->
          <v-col cols="auto">
            <v-progress-circular indeterminate class="mr-4" />
          </v-col>
          <!-- 消息文本 -->
          <v-col>
            {{ loadingDialogService.message.value }}
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 取消按钮 -->
      <v-card-actions v-if="loadingDialogService.cancellable.value" class="justify-end">
        <v-btn @click="loadingDialogService.handleCancel()" color="primary">
          {{ loadingDialogService.cancelText.value }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useLoadingDialog } from '@/components/global/loadingDialogService'

const loadingDialogService = useLoadingDialog()
</script>
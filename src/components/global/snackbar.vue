<template>
  <!-- 全局 Snackbar 消息提示组件 -->
  <v-snackbar v-model="useSnackbar().visible.value" :color="useSnackbar().color.value"
    :timeout="useSnackbar().timeout.value" location="top" transition="slide-y-transition" rounded="lg" min-width="40px">
    <v-row align="center" no-gutters>
      <v-col cols="auto" v-if="useSnackbar().showProgress.value">
        <v-progress-circular indeterminate size="20" width="3" class="mr-3 ml-1" />
      </v-col>
      <v-col>
        <p>{{ useSnackbar().message.value }}</p>
      </v-col>
    </v-row>
    <template v-slot:actions>
      <v-btn icon="mdi-close" @click="useSnackbar().hide()" size="small" />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useSnackbar } from '@/components/global/snackbarService'
</script>
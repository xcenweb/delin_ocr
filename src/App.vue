<template>
  <router-view v-slot="{ Component }">
    <transition :name="slideTransition">
      <vue-page-stack @back="onBack" @forward="onForward">
        <component :is="Component" :key="$route.fullPath"></component>
      </vue-page-stack>
    </transition>
  </router-view>

  <globalSnackbar />
  <globalUpdatePopup />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import globalSnackbar from '@/components/global/snackbar.vue'
import globalUpdatePopup from '@/components/global/updatePopup.vue'

import { settingService } from './utils/settingService'
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import updateService from './components/global/updatePopupService'

const theme = useTheme()
const slideTransition = ref('slide-left')

const onBack = () => {
  console.log('back')
  slideTransition.value = 'slide-right'
}

const onForward = () => {
  console.log('forward')
  slideTransition.value = 'slide-left'
}

// 监听主题改变
watch(() => settingService.get('theme'), (newValue) => {
  theme.change(newValue)
})

// 每次启动时检测是否有更新
onMounted(() => {
  if (settingService.get('autoCheckUpdate')) {
    updateService.check(true)
  }
})
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 200ms ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 200ms ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
}
</style>

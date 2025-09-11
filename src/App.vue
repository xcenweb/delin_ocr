<template>
  <router-view v-slot="{ Component }">
    <transition :name="slideTransition">
      <vue-page-stack @back="onBack" @forward="onForward">
        <component :is="Component" :key="$route.fullPath"></component>
      </vue-page-stack>
    </transition>
  </router-view>

  <GlobalSnackbar />
</template>

<script setup>
import { ref } from 'vue'
import GlobalSnackbar from '@/components/global/Snackbar.vue'

// TODO: 完善动画
const slideTransition = ref('slide-left')

const onBack = () => {
  console.log('back')
  slideTransition.value = 'slide-right'
};

const onForward = () => {
  console.log('forward')
  slideTransition.value = 'slide-left'
};

// TODO: 监听当前路由'/'，两次返回（间隔2s）则退出app
// router.currentRoute.value.path
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 240ms ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 240ms ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
}
</style>

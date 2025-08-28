import { createRouter, createWebHistory } from 'vue-router'

import camera_test from '@/views/test.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // 首页
        {
            path: '/',
            name: 'main',
            component: () => import('@/views/main.vue'),
            // component: () => import('@/views/test.vue'),
        },
        {
            path: '/file_next',
            name: 'file-next',
            component: () => import('@/views/main/file_next.vue')
        },

        // ocr相关功能页面
        {
            path: '/ocr/camera',
            name: 'ocr-camera',
            component: () => import('@/views/ocr/camera.vue')
        },
        {
            path: '/ocr/editor',
            name: 'ocr-editor',
            component: () => import('@/views/ocr/editor.vue'),
        },
        {
            path: '/ocr/select',
            name: 'ocr-result',
            component: () => import('@/views/ocr/select.vue')
        },

        // tests
        {
            path: '/test',
            name: 'test',
            component: camera_test
        },

        // setting
        {
            path: '/setting',
            name: 'setting',
            component: () => import('@/views/setting.vue')
        }
    ]
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
    if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
        if (!localStorage.getItem('vuetify:dynamic-reload')) {
            console.log('Reloading page to fix dynamic import error')
            localStorage.setItem('vuetify:dynamic-reload', 'true')
            location.assign(to.fullPath)
        } else {
            console.error('Dynamic import error, reloading page did not fix it', err)
        }
    } else {
        console.error(err)
    }
})

router.isReady().then(() => {
    localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
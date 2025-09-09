import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // 首页
        {
            path: '/',
            name: 'main',
            component: () => import('@/views/main.vue'),
        },
        {
            path: '/file_next',
            name: 'file-next',
            component: () => import('@/views/main/file_next.vue')
        },

        // 预览器
        {
            path: '/viewer/image',
            name: 'image-viewer',
            component: () => import('@/views/viewer/image.vue')
        },
        {
            path: '/viewer/browser',
            name: 'browser-viewer',
            component: () => import('@/views/viewer/browser.vue')
        },

        // ocr相关功能
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

        // 在线导入证书
        {
            path: '/online-import',
            name: 'online-import',
            component: () => import('@/views/online/index.vue')
        },

        // test
        {
            path: '/test',
            component: () => import('@/views/test.vue')
        },

        // 设置页面
        {
            path: '/setting',
            name: 'setting',
            component: () => import('@/views/setting.vue')
        },
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
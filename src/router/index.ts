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
            path: '/image-viewer',
            name: 'image-viewer',
            component: () => import('@/views/viewer/imageViewer.vue')
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

        // test
        {
            path: '/test',
            component: () => import('@/views/test.vue')
        },
        {
            path: '/testWorker',
            component: () => import('@/views/workerTest.vue')
        },

        // 设置页面
        {
            path: '/setting',
            name: 'setting',
            component: () => import('@/views/setting.vue')
        },

        {
            path: '/browser',
            name: 'browser',
            component: () => import('@/views/browser.vue')
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
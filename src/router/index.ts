import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'main',
            component: () => import('@/views/main.vue'),
        },
        {
            path: '/manage_files',
            name: 'manage_files',
            component: () => import('@/views/manage_files.vue')
        },
        {
            path: '/recent_files',
            name: 'recent_files',
            component: () => import('@/views/recent_files.vue')
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

        // all test
        {
            path: '/test/',
            component: () => import('@/views/test/index.vue')
        },
        {
            path: '/test/path',
            component: () => import('@/views/test/path.vue')
        },
        {
            path: '/test/tag-service',
            component: () => import('@/views/test/tag-service.vue')
        },
        {
            path: '/test/update',
            name: 'update-test',
            component: () => import('@/views/test/updateTest.vue')
        },
        {
            path: '/setting',
            name: 'setting',
            component: () => import('@/views/setting.vue')
        },
        {
            path: '/about',
            name: 'about',
            component: () => import('@/views/about.vue')
        },
    ]
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err: any, to: any) => {
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
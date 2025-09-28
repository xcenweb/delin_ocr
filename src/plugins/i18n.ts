import { createI18n } from 'vue-i18n'

import zh from '@/locales/zh.json'

export default createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'zh',
    messages: {
        'zh': zh,
    },
    globalInjection: true,
})
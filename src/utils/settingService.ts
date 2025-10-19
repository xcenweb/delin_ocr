import { useStorage } from '@vueuse/core'

/**
 * 可选设置项
 */
export const optionsSetting = {
    theme: [
        { text: '系统', value: 'system' },
        { text: '浅色', value: 'light' },
        { text: '深色', value: 'dark' }
    ],
    language: [
        { text: '简体中文', value: 'zh' },
        { text: 'English', value: 'en' }
    ],
    ocrLanguages: [
        { text: '简体中文', value: 'chi_sim' },
        { text: 'English', value: 'eng' },
    ],
    updateChannel: [
        { text: '正式版', value: 'official' },
        { text: '测试版', value: 'beta' },
        { text: '内测版', value: 'alpha' }
    ]
} as const

// 获取可选设置项的 value
type ValueOf<T> = T extends readonly { value: infer V }[] ? V : never;
export interface AppSettings {
    theme: ValueOf<typeof optionsSetting.theme>;
    language: ValueOf<typeof optionsSetting.language>;
    ocrLanguages: ValueOf<typeof optionsSetting.ocrLanguages>[];
    autoCheckUpdate: boolean;
    updateChannel: ValueOf<typeof optionsSetting.updateChannel>;
}

/**
 * 默认设置项
 */
export const defaultSetting: AppSettings = {
    theme: 'system',
    language: 'zh',
    ocrLanguages: ['chi_sim', 'eng'],
    autoCheckUpdate: true,
    updateChannel: 'beta'
}

class SettingService {
    private storage = useStorage('app-settings', defaultSetting)

    /**
     * 获取所有设置项
     * @returns 全部设置项
     */
    getAll() {
        return { ...this.storage.value }
    }

    /**
     * 获取一个设置项
     * @param key
     */
    get<K extends keyof AppSettings>(key: K) {
        return this.storage.value[key]
    }

    /**
     * 设置或更新指定设置项
     * @param key 设置项键名
     * @param value 新值
     */
    set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
        if (this.storage.value[key] === value) return
        this.storage.value[key] = value
    }

    /**
     * 重置所有设置项
     */
    reset() {
        this.storage.value = { ...defaultSetting }
    }
}

export const settingService = new SettingService()
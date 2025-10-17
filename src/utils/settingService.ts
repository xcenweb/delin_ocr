import { useStorageAsync } from '@vueuse/core'

// 设置接口定义
export interface AppSettings {
    // 外观设置
    theme: 'light' | 'dark' | 'system';
    language: string;

    // OCR设置
    ocrLanguages: string[];

    // 更新设置
    autoCheckUpdate: boolean;
    updateChannel: 'official' | 'beta' | 'alpha';
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    language: 'zh',
    ocrLanguages: ['chi_sim'],
    autoCheckUpdate: true,
    updateChannel: 'beta'
};

class SettingService {
    private storage = useStorageAsync('app-settings', DEFAULT_SETTINGS);

    // 获取所有设置
    async getSettings(): Promise<AppSettings> {
        return this.storage.value || DEFAULT_SETTINGS;
    }

    // 获取单个设置项
    async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
        const settings = await this.getSettings();
        return settings[key];
    }

    // 更新设置
    async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
        const currentSettings = await this.getSettings();
        this.storage.value = { ...currentSettings, ...newSettings };
    }

    // 更新单个设置项
    async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
        await this.updateSettings({ [key]: value });
    }

    // 重置为默认设置
    async resetToDefault(): Promise<void> {
        this.storage.value = DEFAULT_SETTINGS;
    }
}

// 导出设置服务实例
export const settingService = new SettingService();
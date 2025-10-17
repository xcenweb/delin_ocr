<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>设置</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pa-4">
                <!-- 外观设置 -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="pb-0">外观</v-card-title>
                    <v-card-text class="pa-0">
                        <v-list lines="two">
                            <!-- 主题设置 -->
                            <v-list-item>
                                <template v-slot:title>
                                    <div class="d-flex align-center">
                                        <v-icon start>mdi-theme-light-dark</v-icon>
                                        <span>主题</span>
                                    </div>
                                </template>
                                <template v-slot:append>
                                    <v-select v-model="settings.theme" :items="themeOptions" item-title="text"
                                        item-value="value" density="compact" variant="outlined" hide-details single-line
                                        style="width: 150px" @update:model-value="updateSetting('theme', $event)" />
                                </template>
                            </v-list-item>

                            <!-- 语言设置 -->
                            <v-list-item>
                                <template v-slot:title>
                                    <div class="d-flex align-center">
                                        <v-icon start>mdi-translate</v-icon>
                                        <span>语言</span>
                                    </div>
                                </template>
                                <template v-slot:append>
                                    <v-select v-model="settings.language" :items="languageOptions" item-title="text"
                                        item-value="value" density="compact" variant="outlined" hide-details single-line
                                        style="width: 150px" @update:model-value="updateSetting('language', $event)" />
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>

                <!-- OCR设置 -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="pb-0">OCR</v-card-title>
                    <v-card-text class="pa-0">
                        <v-list lines="two">
                            <!-- OCR语言 -->
                            <v-list-item>
                                <template v-slot:title>
                                    <div class="d-flex align-center">
                                        <v-icon start>mdi-flag</v-icon>
                                        <span>识别语言</span>
                                    </div>
                                </template>
                                <template v-slot:append>
                                    <v-btn variant="outlined" size="small" @click="openLanguageDialog">
                                        选择语言
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>

                <!-- 更新设置 -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="pb-0">更新设置</v-card-title>
                    <v-card-text class="pa-0">
                        <v-list lines="two">
                            <!-- 自动检查更新 -->
                            <v-list-item>
                                <template v-slot:title>
                                    <div class="d-flex align-center">
                                        <v-icon start>mdi-update</v-icon>
                                        <span>自动检查更新</span>
                                    </div>
                                </template>
                                <template v-slot:append>
                                    <v-switch v-model="settings.autoCheckUpdate" color="primary" hide-details
                                        @update:model-value="handleBooleanUpdate('autoCheckUpdate', $event)" />
                                </template>
                            </v-list-item>

                            <!-- 更新渠道 -->
                            <v-list-item>
                                <template v-slot:title>
                                    <div class="d-flex align-center">
                                        <v-icon start>mdi-source-branch</v-icon>
                                        <span>更新渠道</span>
                                    </div>
                                </template>
                                <template v-slot:append>
                                    <v-select v-model="settings.updateChannel" :items="channelOptions" item-title="text"
                                        item-value="value" density="compact" variant="outlined" hide-details single-line
                                        style="width: 150px"
                                        @update:model-value="updateSetting('updateChannel', $event)" />
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>

                <v-btn block color="error" variant="outlined" @click="resetSettings">
                    恢复默认设置
                </v-btn>
            </v-container>
        </v-main>

        <!-- OCR语言选择弹窗 -->
        <v-dialog v-model="languageDialog" max-width="400" max-height="500">
            <v-card class="pa-1">
                <v-card-title class="d-flex align-center">
                    <span>选择OCR识别语言</span>
                </v-card-title>

                <v-card-text>
                    <!-- 搜索框 -->
                    <v-text-field v-model="searchText" label="搜索语言" prepend-inner-icon="mdi-magnify" clearable
                        density="compact" ></v-text-field>

                    <!-- 语言列表 -->
                    <v-list height="200">
                        <v-list-item v-for="language in filteredLanguages" :key="language.value"
                            @click="toggleLanguageSelection(language.value)">
                            <template v-slot:prepend>
                                <v-checkbox-btn :model-value="isLanguageSelected(language.value)"
                                    @click.stop="toggleLanguageSelection(language.value)"></v-checkbox-btn>
                            </template>
                            <v-list-item-title>{{ language.text }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item v-if="filteredLanguages.length === 0">
                            <v-list-item-title class="text-center text-grey">
                                未找到匹配的语言
                            </v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="取消" variant="text" @click="languageDialog = false" />
                    <v-btn text="确定" color="primary" variant="flat" @click="saveLanguageSelection" />
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSnackbar } from '@/components/global/snackbarService';
import { settingService, type AppSettings } from '@/utils/settingService';

// 设置数据
const settings = ref<AppSettings>({
    theme: 'system',
    language: 'zh',
    ocrLanguages: ['chi_sim'],
    autoCheckUpdate: true,
    updateChannel: 'beta'
});

// 弹窗控制
const languageDialog = ref(false);
const searchText = ref('');

// 临时存储选择的语言
const tempSelectedLanguages = ref<string[]>([]);

// 主题选项
const themeOptions = [
    { text: '跟随系统', value: 'system' },
    { text: '浅色模式', value: 'light' },
    { text: '深色模式', value: 'dark' }
];

// 语言选项
const languageOptions = [
    { text: '简体中文', value: 'zh' },
    { text: 'English', value: 'en' }
];

// OCR语言选项
const ocrLanguageOptions = [
    { text: '简体中文', value: 'chi_sim' },
    { text: '繁体中文', value: 'chi_tra' },
    { text: 'English', value: 'eng' },
    { text: 'Japanese', value: 'jpn' },
    { text: 'Korean', value: 'kor' },
    { text: 'French', value: 'fra' },
    { text: 'Spanish', value: 'spa' },
    { text: 'German', value: 'deu' },
    { text: 'Russian', value: 'rus' },
    { text: 'Arabic', value: 'ara' },
    { text: 'Italian', value: 'ita' },
    { text: 'Portuguese', value: 'por' },
    { text: 'Turkish', value: 'tur' },
    { text: 'Vietnamese', value: 'vie' },
    { text: 'Thai', value: 'tha' },
    { text: 'Indonesian', value: 'ind' }
];

// 过滤后的语言列表
const filteredLanguages = computed(() => {
    if (!searchText.value) {
        return ocrLanguageOptions;
    }

    const search = searchText.value.toLowerCase();
    return ocrLanguageOptions.filter(lang =>
        lang.text.toLowerCase().includes(search) ||
        lang.value.toLowerCase().includes(search)
    );
});

// 更新渠道选项
const channelOptions = [
    { text: '正式版', value: 'official' },
    { text: 'Beta版', value: 'beta' },
    { text: 'Alpha版', value: 'alpha' }
];

// 打开语言选择弹窗
const openLanguageDialog = () => {
    tempSelectedLanguages.value = [...settings.value.ocrLanguages];
    searchText.value = '';
    languageDialog.value = true;
};

// 判断语言是否被选中
const isLanguageSelected = (language: string) => {
    return tempSelectedLanguages.value.includes(language);
};

// 切换语言选择
const toggleLanguageSelection = (language: string) => {
    const index = tempSelectedLanguages.value.indexOf(language);
    if (index > -1) {
        tempSelectedLanguages.value.splice(index, 1);
    } else {
        tempSelectedLanguages.value.push(language);
    }
};

// 保存语言选择
const saveLanguageSelection = async () => {
    if (tempSelectedLanguages.value.length === 0) {
        useSnackbar().error('请至少选择一种语言');
        return;
    }

    try {
        await updateSetting('ocrLanguages', tempSelectedLanguages.value);
        languageDialog.value = false;
    } catch (error) {
        console.error('Failed to save language selection:', error);
        useSnackbar().error('保存语言设置失败');
    }
};

// 更新设置
const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    try {
        await settingService.updateSetting(key, value);
        // 不再显示"设置已保存"提示，避免过多提示
    } catch (error) {
        console.error('Failed to update setting:', error);
        useSnackbar().error('保存设置失败');
    }
};

// 处理布尔值更新
const handleBooleanUpdate = async <K extends keyof AppSettings>(
    key: K,
    value: boolean | null
) => {
    const boolValue = value ?? false;
    await updateSetting(key, boolValue as AppSettings[K]);
};

// 重置设置
const resetSettings = async () => {
    try {
        await settingService.resetToDefault();
        const newSettings = await settingService.getSettings();
        settings.value = { ...newSettings };
        useSnackbar().success('已恢复默认设置');
    } catch (error) {
        console.error('Failed to reset settings:', error);
        useSnackbar().error('恢复默认设置失败');
    }
};

// 初始化设置
onMounted(async () => {
    try {
        const loadedSettings = await settingService.getSettings();
        settings.value = { ...loadedSettings };
    } catch (error) {
        console.error('Failed to load settings:', error);
        useSnackbar().error('加载设置失败');
    }
});
</script>

<style scoped>
.v-list-item {
    min-height: 50px;
}
</style>
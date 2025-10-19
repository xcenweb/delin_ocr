<template>
    <v-app>
        <v-app-bar>
            <v-btn icon="mdi-arrow-left" @click="$router.back()" />
            <v-app-bar-title>设置</v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-container>

                <!-- 外观设置卡片 -->
                <v-card class="mb-4">
                    <v-card-title class="text-subtitle-1 font-weight-bold">外观</v-card-title>
                    <v-divider></v-divider>
                    <v-list lines="two" class="py-0">
                        <v-list-item>
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon start>mdi-theme-light-dark</v-icon>
                                    <span>主题</span>
                                </div>
                            </template>
                            <template v-slot:append>
                                <v-select v-model="settings.theme" :items="optionsSetting.theme" item-title="text"
                                    item-value="value" density="compact" variant="outlined" hide-details
                                    style="max-width: 150px;"
                                    @update:model-value="updateSetting('theme', $event === null ? 'system' : $event)" />
                            </template>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon start>mdi-translate</v-icon>
                                    <span>界面语言</span>
                                </div>
                            </template>
                            <template v-slot:append>
                                <v-select v-model="settings.language" :items="optionsSetting.language" item-title="text"
                                    item-value="value" density="compact" variant="outlined" hide-details
                                    style="max-width: 150px;" @update:model-value="updateSetting('language', $event)" />
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card>

                <!-- OCR设置卡片 -->
                <v-card class="mb-4">
                    <v-card-title class="text-subtitle-1 font-weight-bold">OCR</v-card-title>
                    <v-divider></v-divider>
                    <v-list lines="two" class="py-0">
                        <v-list-item>
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon start>mdi-text-recognition</v-icon>
                                    <span>可识别语言</span>
                                </div>
                            </template>
                            <template v-slot:append>
                                <v-btn color="primary" size="small" @click="showOcrLanguageDialog = true">
                                    已选{{ settings.ocrLanguages.length }}个
                                </v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card>

                <!-- 更新设置卡片 -->
                <v-card class="mb-4">
                    <v-card-title class="text-subtitle-1 font-weight-bold">更新</v-card-title>
                    <v-divider></v-divider>
                    <v-list lines="two" class="py-0">
                        <v-list-item>
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon start>mdi-update</v-icon>
                                    <span>自动检查更新</span>
                                </div>
                            </template>
                            <template v-slot:append>
                                <v-switch v-model="settings.autoCheckUpdate" hide-details color="primary"
                                    @update:model-value="updateSetting('autoCheckUpdate', $event === null ? false : $event)" />
                            </template>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:title>
                                <div class="d-flex align-center">
                                    <v-icon start>mdi-source-branch</v-icon>
                                    <span>更新通道</span>
                                </div>
                            </template>
                            <template v-slot:append>
                                <v-select v-model="settings.updateChannel" :items="optionsSetting.updateChannel"
                                    item-title="text" item-value="value" density="compact" variant="outlined"
                                    hide-details style="max-width: 150px;"
                                    @update:model-value="updateSetting('updateChannel', $event)" />
                            </template>
                        </v-list-item>
                    </v-list>
                </v-card>
                <v-btn prepend-icon="mdi-refresh" block color="error" variant="outlined" @click="confirmReset"
                    text="恢复默认设置" />
            </v-container>
        </v-main>
    </v-app>

    <!-- 确认重置对话框 -->
    <v-dialog v-model="showResetDialog" max-width="500">
        <v-card>
            <v-card-title class="text-subtitle-1 font-weight-bold">确认重置</v-card-title>
            <v-card-text>确定要将所有设置恢复为默认值吗？</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="showResetDialog = false">取消</v-btn>
                <v-btn color="primary" @click="resetSettings">确定</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- OCR语言选择对话框 -->
    <v-dialog v-model="showOcrLanguageDialog" max-width="500">
        <v-card>
            <v-card-title class="text-subtitle-1 font-weight-bold">选择OCR语言</v-card-title>
            <v-card-text>
                <v-text-field v-model="ocrLanguageSearch" label="搜索语言" prepend-inner-icon="mdi-magnify" clearable
                    hide-details density="compact" class="mb-4" />
                <v-list select-strategy="leaf" nav>
                    <v-list-item v-for="lang in filteredOcrLanguages" :key="lang.value" :value="lang.value"
                        @click="toggleOcrLanguage(lang.value)">
                        <template v-slot:prepend>
                            <v-checkbox-btn :model-value="isLanguageSelected(lang.value)"
                                @click.stop="toggleOcrLanguage(lang.value)" />
                        </template>
                        <v-list-item-title>{{ lang.text }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="showOcrLanguageDialog = false">关闭</v-btn>
                <v-btn color="primary" @click="saveOcrLanguages">保存</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getVersion } from '@tauri-apps/api/app'
import { settingService, type AppSettings, optionsSetting } from '@/utils/settingService'
import { useSnackbar } from '@/components/global/snackbarService'

// 应用版本
const appVersion = ref('')

// 设置项
const settings = ref<AppSettings>(settingService.getAll())

// 重置确认对话框状态
const showResetDialog = ref(false)

// OCR语言选择对话框状态
const showOcrLanguageDialog = ref(false)

// OCR语言搜索关键词
const ocrLanguageSearch = ref('')

// 临时存储选中的OCR语言
const tempSelectedOcrLanguages = ref([...settings.value.ocrLanguages])

// 过滤后的OCR语言列表
const filteredOcrLanguages = computed(() => {
    if (!ocrLanguageSearch.value) {
        return optionsSetting.ocrLanguages
    }
    const search = ocrLanguageSearch.value.toLowerCase()
    return optionsSetting.ocrLanguages.filter(lang =>
        lang.text.toLowerCase().includes(search) || lang.value.toLowerCase().includes(search)
    )
})

// 检查语言是否被选中
const isLanguageSelected = (language: string) => {
    return tempSelectedOcrLanguages.value.includes(language)
}

// 切换OCR语言选择
const toggleOcrLanguage = (language: string) => {
    const index = tempSelectedOcrLanguages.value.indexOf(language)
    if (index > -1) {
        // 已选中，移除
        tempSelectedOcrLanguages.value.splice(index, 1)
    } else {
        // 未选中，添加
        tempSelectedOcrLanguages.value.push(language)
    }
}

// 保存OCR语言设置
const saveOcrLanguages = () => {
    updateSetting('ocrLanguages', [...tempSelectedOcrLanguages.value])
    showOcrLanguageDialog.value = false
    useSnackbar().info('OCR语言设置已更新')
}

// 更新设置项
const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    settingService.set(key, value)
    settings.value = settingService.getAll()
    useSnackbar().info('设置已更新')
}

// 显示重置确认对话框
const confirmReset = () => {
    showResetDialog.value = true
}

// 恢复默认设置
const resetSettings = () => {
    settingService.reset()
    settings.value = settingService.getAll()
    showResetDialog.value = false
    useSnackbar().info('已恢复默认设置')
}

// 页面加载时获取数据
onMounted(async () => {
    appVersion.value = await getVersion()
})
</script>
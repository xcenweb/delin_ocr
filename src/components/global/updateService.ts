import { ref } from 'vue'
import { fetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'
import { type Platform, platform } from '@tauri-apps/plugin-os'
import { useSnackbar } from './snackbarService'
import { openUrl } from '@tauri-apps/plugin-opener'

/**
 * 更新服务状态管理
 */
class UpdateService {
    /** 平台 */
    public platform: Platform = platform()

    /** 更新弹窗显示状态 */
    public visible = ref(false)

    /** 当前版本号 */
    public currentVersion = ''

    /** 最新版本号 */
    public newVersion = ''

    /** 更新内容 */
    public notes = ''

    /** 更新下载链接 */
    public link = ''

    /**
     * 显示更新弹窗
     */
    show(): void {
        this.visible.value = true
    }

    /**
     * 隐藏更新弹窗
     */
    hide(): void {
        this.visible.value = false
    }

    /**
     * 检测更新
     */
    async check(): Promise<void> {
        try {
            useSnackbar().info('正在检查更新...', true)

            const response = await fetch('https://api.github.com/repos/xcenweb/delin_ocr/releases/latest', { method: 'GET' })
            const data = await response.json()

            this.currentVersion = await getVersion()
            this.newVersion = data.tag_name.replace('v', '')
            this.notes = data.body
            this.link = 'https://github.com/xcenweb/delin_ocr/releases/latest'

            if (this.newVersion > this.currentVersion) {
                this.show()
                useSnackbar().hide()
            } else {
                useSnackbar().success('当前为最新版本')
            }

        } catch (error) {
            useSnackbar().error('检测更新失败' + error)
        }
    }

    /**
     * 更新
     */
    async update(): Promise<void> {
        try {
            if (!this.link) {
                useSnackbar().error('无效的更新')
            }
            if (this.platform === 'android') {
                await openUrl(this.link)
            } else {
                await openUrl(this.link)
            }
        } catch (error) {
            useSnackbar().error('更新失败' + error)
        }
    }
}

// 创建全局单例实例
const updateService = new UpdateService()

/**
 * 获取全局更新服务实例
 * @returns 更新服务实例
 */
export function useUpdatePopup(): UpdateService {
    return updateService
}

// 导出默认实例
export default updateService

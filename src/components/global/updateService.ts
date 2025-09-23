import { ref } from 'vue'
import { fetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'
import { type Platform, platform } from '@tauri-apps/plugin-os'
import { useSnackbar } from './snackbarService'

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
            const response = await fetch('http://ocr.yuncen.top/upload/version.json', { method: 'GET' })
            const data = await response.json()

            this.currentVersion = await getVersion()
            this.newVersion = data.version
            this.notes = data.notes

            if (this.newVersion > this.currentVersion) {
                this.show()
            } else {
                useSnackbar().success('当前为最新版本')
            }

        } catch (error) {
            useSnackbar().error('检测更新失败' + error)
        }
    }
}

// 创建全局单例实例
const updateService = new UpdateService()

/**
 * 获取全局更新服务实例
 * @returns 更新服务实例
 */
export function useUpdateService(): UpdateService {
    return updateService
}

// 导出默认实例
export default updateService

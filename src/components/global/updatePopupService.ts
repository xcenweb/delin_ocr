import { ref } from 'vue'
import semver from 'semver'
import { fetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'
import { useSnackbar } from './snackbarService'
import { openUrl } from '@tauri-apps/plugin-opener'
import { settingService } from '@/utils/settingService'
import { type Platform, platform } from '@tauri-apps/plugin-os'

/**
 * 更新服务状态管理
 */
class UpdateService {
    /** 当前平台 */
    public platform: Platform = platform()

    /** 更新弹窗显示状态 */
    public visible = ref(false)

    /** 当前版本号 */
    public currentVersion = ''

    /** 最新版本号 */
    public releaseVersion = ''

    /** 更新内容 */
    public releaseNotes = ''

    /** 更新下载链接 */
    public link = ''

    /**
     * 显示更新弹窗
     */
    show() {
        this.visible.value = true
    }

    /**
     * 隐藏更新弹窗
     */
    hide() {
        this.visible.value = false
    }

    /**
     * 获取版本类型
     * @param version 版本号
     * @returns 版本类型
     */
    getVersionType(version: string) {
        const preStr = semver.prerelease(version)
        return preStr ? preStr[0] : 'official'
    }

    /**
     * 检测更新
     * @param silent 是否静默检查
     */
    async check(silent: boolean = false) {
        try {
            if (!silent) useSnackbar().info('正在检查更新...', true)

            const response = await fetch('http://ocr.yuncen.top:223/', { method: 'GET' })
            const data = await response.json()

            // 获取真实版本信息
            this.currentVersion = await getVersion()
            this.releaseVersion = data.tag_name
            this.releaseNotes = data.body?.trim() || ''
            this.link = `https://github.com/xcenweb/delin_ocr/releases/tag/${this.releaseVersion}`

            if (semver.gt(this.releaseVersion, this.currentVersion) && this.getVersionType(this.releaseVersion) === settingService.get('updateChannel')) {
                this.show()
            } else {
                if (!silent) useSnackbar().info('当前已是最新版本！')
            }
        } catch (error) {
            console.error('检查更新失败:', error)
            if (!silent) useSnackbar().error('检测更新失败！')
        }
    }

    /**
     * 更新
     */
    async update() {
        try {
            await openUrl(this.link)
        } catch (error) {
            console.error('更新失败:', error)
            useSnackbar().error('更新失败: ' + (error instanceof Error ? error.message : String(error)))
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
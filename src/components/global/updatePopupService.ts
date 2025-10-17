import { ref } from 'vue'
import semver from 'semver'
import { fetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'
import { useSnackbar } from './snackbarService'
import { openUrl } from '@tauri-apps/plugin-opener'
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
    public localhostVersion = ''

    /** 最新版本号 */
    public networkVersion = ''

    /** 更新内容 */
    public notes = ''

    /** 更新下载链接 */
    public link = ''

    /** 可更新到的版本渠道 */
    public channel: 'official' | 'beta' | 'alpha' = 'beta'

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
     * @returns 版本类型 ('beta' | 'alpha' | 'official')
     */
    getVersionType(version: string): 'beta' | 'alpha' | 'official' {
        if (version.includes('alpha')) {
            return 'alpha';
        } else if (version.includes('beta')) {
            return 'beta';
        } else {
            return 'official';
        }
    }

    /**
     * 判断版本是否符合当前渠道设置
     * @param version 版本号
     * @returns 是否符合渠道设置
     */
    private isVersionAllowedForChannel(version: string): boolean {
        const isPrerelease = semver.prerelease(version) !== null;

        // official 渠道只接收正式版本
        if (this.channel === 'official') {
            return !isPrerelease;
        }

        // beta 渠道接收正式版本和 beta 版本
        if (this.channel === 'beta') {
            return !isPrerelease || (version.includes('beta') && !version.includes('alpha'));
        }

        // alpha 渠道接收所有版本
        return true;
    }

    /**
     * 检测更新
     * @param silent 是否静默检查
     */
    async check(silent: boolean = false) {
        try {
            if (!silent) {
                useSnackbar().info('正在检查更新...', true)
            }

            const response = await fetch('http://ocr.yuncen.top:223/', { method: 'GET' })
            const data = await response.json()

            // 获取真实版本信息
            this.localhostVersion = await getVersion()
            this.networkVersion = data.tag_name
            this.notes = data.body?.trim() || ''
            this.link = 'https://github.com/xcenweb/delin_ocr/releases/tag/' + this.networkVersion

            // 检查是否有新版本
            if (semver.gt(this.networkVersion, this.localhostVersion)) {
                // 检查新版本是否符合当前渠道设置
                if (this.isVersionAllowedForChannel(this.networkVersion)) {
                    this.show()
                    if (!silent) {
                        useSnackbar().hide()
                    }
                } else {
                    // 不符合当前渠道设置
                    if (!silent) {
                        useSnackbar().success('当前渠道设置下无可用更新')
                    }
                }
            } else {
                // 没有新版本
                if (!silent) {
                    useSnackbar().success('当前为最新版本')
                }
            }
        } catch (error) {
            console.error('检查更新失败:', error)
            if (!silent) {
                useSnackbar().error('检测更新失败！')
            }
        }
    }

    /**
     * 更新
     */
    async update() {
        try {
            if (!this.link) {
                useSnackbar().error('无效的更新链接')
                return
            }

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
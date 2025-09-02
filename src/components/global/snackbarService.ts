import { ref } from 'vue'

/**
 * Snackbar 配置接口
 */
export interface SnackbarConfig {
  /** 消息文本 */
  message: string
  /** 颜色类型 */
  color?: 'success' | 'error' | 'warning' | 'info' | 'primary'
  /** 显示时长（毫秒），-1 表示持久显示 */
  timeout?: number
  /** 是否显示进度圆圈 */
  showProgress?: boolean
}

/**
 * Snackbar 状态管理
 */
class SnackbarService {
  /** 是否显示 snackbar */
  public visible = ref(false)

  /** snackbar 文本内容 */
  public message = ref('')

  /** snackbar 颜色 */
  public color = ref<string>('primary')

  /** 超时时间 */
  public timeout = ref(3500)

  /** 是否显示进度圆圈 */
  public showProgress = ref(false)

  /** 当前超时定时器 */
  private timeoutId: number | null = null

  /**
   * 显示 snackbar
   * @param config - snackbar 配置
   */
  show(config: SnackbarConfig): void {
    // 清除之前的定时器
    this.clearTimeout()

    // 设置配置
    this.message.value = config.message
    this.color.value = config.color || 'info'
    this.timeout.value = config.timeout ?? 3000
    this.showProgress.value = config.showProgress || false

    // 显示 snackbar
    this.visible.value = true

    // 设置自动隐藏（如果不是持久显示）
    if (this.timeout.value > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.hide()
      }, this.timeout.value)
    }
  }

  /**
   * 显示成功消息
   * @param message - 消息文本
   * @param showProgress - 是否显示进度圆圈
   */
  success(message: string, showProgress = false): void {
    this.show({
      message,
      color: 'success',
      showProgress
    })
  }

  /**
   * 显示错误消息
   * @param message - 消息文本
   * @param showProgress - 是否显示进度圆圈
   */
  error(message: string, showProgress = false): void {
    this.show({
      message,
      color: 'error',
      showProgress
    })
  }

  /**
   * 显示警告消息
   * @param message - 消息文本
   * @param showProgress - 是否显示进度圆圈
   */
  warning(message: string, showProgress = false): void {
    this.show({
      message,
      color: 'warning',
      showProgress
    })
  }

  /**
   * 显示信息消息
   * @param message - 消息文本
   * @param showProgress - 是否显示进度圆圈
   */
  info(message: string, showProgress = false): void {
    this.show({
      message,
      color: 'primary',
      showProgress
    })
  }

  /**
   * 显示持久消息（需要手动关闭）
   * @param message - 消息文本
   * @param color - 颜色类型
   * @param showProgress - 是否显示进度圆圈
   */
  persistent(message: string, color: SnackbarConfig['color'] = 'primary', showProgress = true): void {
    this.show({
      message,
      color,
      timeout: -1,
      showProgress
    })
  }

  /**
   * 更新当前显示的消息文本
   * @param message - 新的消息文本
   */
  updateMessage(message: string): void {
    if (this.visible.value) {
      this.message.value = message
    }
  }

  /**
   * 切换进度圆圈的显示状态
   * @param show - 是否显示进度圆圈
   */
  toggleProgress(show?: boolean): void {
    this.showProgress.value = show ?? !this.showProgress.value
  }

  /**
   * 隐藏 snackbar
   */
  hide(): void {
    this.visible.value = false
    this.clearTimeout()
  }

  /**
   * 清除超时定时器
   */
  private clearTimeout(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

// 创建全局单例实例
const snackbarService = new SnackbarService()

/**
 * 获取全局 snackbar 服务实例
 * @returns snackbar 服务实例
 */
export function useSnackbar(): SnackbarService {
  return snackbarService
}

// 导出默认实例
export default snackbarService
// import { useLoadingDialog } from '@/components/global/loadingDialogService'

// // 在需要的地方获取服务实例
// const loadingDialog = useLoadingDialog()

// // 显示loading dialog
// loadingDialog.show({
//   title: 'Processing',     // 可选标题
//   message: 'Please wait...', // 消息文本
//   cancellable: true,       // 是否可取消
//   cancelText: 'Cancel'     // 取消按钮文本
// }, () => {
//   // 取消操作的回调函数
//   console.log('Operation cancelled')
// })

// // 隐藏loading dialog
// loadingDialog.hide()
import { ref } from 'vue'

/**
 * Loading Dialog 配置接口
 */
export interface LoadingDialogConfig {
  /** 标题 */
  title?: string
  /** 消息文本 */
  message: string
  /** 是否可取消 */
  cancellable?: boolean
  /** 取消按钮文本 */
  cancelText?: string
}

/**
 * Loading Dialog 状态管理
 */
class LoadingDialogService {
  /** 是否显示 dialog */
  public visible = ref(false)

  /** dialog 标题 */
  public title = ref<string>('')

  /** dialog 文本内容 */
  public message = ref('')

  /** 是否可取消 */
  public cancellable = ref(false)

  /** 取消按钮文本 */
  public cancelText = ref('Cancel')

  /** 取消回调 */
  private onCancelCallback: (() => void) | null = null

  /**
   * 显示 loading dialog
   * @param config - dialog 配置
   * @param onCancel - 取消回调函数
   */
  show(config: LoadingDialogConfig, onCancel?: () => void): void {
    // 设置配置
    this.title.value = config.title || ''
    this.message.value = config.message
    this.cancellable.value = config.cancellable || false
    this.cancelText.value = config.cancelText || 'Cancel'

    // 设置回调
    this.onCancelCallback = onCancel || null

    // 显示 dialog
    this.visible.value = true
  }

  /**
   * 隐藏 loading dialog
   */
  hide(): void {
    this.visible.value = false
  }

  /**
   * 处理取消操作
   */
  handleCancel(): void {
    this.hide()
    if (this.onCancelCallback) {
      this.onCancelCallback()
    }
  }
}

// 创建全局单例实例
const loadingDialogService = new LoadingDialogService()

/**
 * 获取全局 loading dialog 服务实例
 * @returns loading dialog 服务实例
 */
export function useLoadingDialog(): LoadingDialogService {
  return loadingDialogService
}

// 导出默认实例
export default loadingDialogService
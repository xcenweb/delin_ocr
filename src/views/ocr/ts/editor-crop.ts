import { ref, computed, onMounted, onUnmounted } from 'vue';
import { perspectiveTransform, getDefaultCorners } from '@/views/ocr/ts/camera-detection';
import type { PhotoItem } from '@/views/ocr/ts/camera';

/**
 * 拖拽状态接口
 */
interface DragState {
    isDragging: boolean;
    type: 'corner' | 'mid' | 'move' | null;
    index: number;
    startX: number;
    startY: number;
    originalPoints: { x: number; y: number }[];
}

/**
 * 透视矫正功能
 */
export function useEditorCrop(
    imageList: any,
    swiperslideIn: any,
    currentImage: any,
    editorMode: any
) {
    /**
     * 临时存储crop模式下调整中的points
     * 只有在确认时才会真正保存到imageList中
     */
    const tempPoints = ref<{ x: number; y: number }[]>([]);

    // 选择框相关的响应式数据
    const containerRef = ref<HTMLElement>();
    const imageContainerRef = ref<HTMLElement>();
    const imageRef = ref<HTMLImageElement>();
    const imageWidth = ref(0);
    const imageHeight = ref(0);
    const containerWidth = ref(0);
    const containerHeight = ref(0);

    /**
     * 当前图片的选择框坐标
     */
    const points = computed({
        get: () => {
            // 在crop模式下使用临时points，否则使用真实数据
            if (editorMode.value === 'crop' && tempPoints.value.length > 0) {
                return tempPoints.value;
            }
            return currentImage.value.points || getDefaultCorners();
        },
        set: (newPoints) => {
            // 在crop模式下只修改临时points，不直接修改imageList
            if (editorMode.value === 'crop') {
                tempPoints.value = [...newPoints];
            } else {
                // 在edit模式下直接修改imageList
                if (imageList.value[swiperslideIn.value]) {
                    imageList.value[swiperslideIn.value].points = newPoints;
                }
            }
        }
    });

    /**
     * 计算实际显示区域（object-fit: contain的显示区域）
     */
    const displayArea = computed(() => {
        if (!imageWidth.value || !imageHeight.value || !containerWidth.value || !containerHeight.value) {
            return { left: 0, top: 0, width: 0, height: 0, scaleX: 1, scaleY: 1 };
        }

        const isWider = (imageWidth.value / imageHeight.value) > (containerWidth.value / containerHeight.value);
        const width = isWider ? containerWidth.value : containerHeight.value * (imageWidth.value / imageHeight.value);
        const height = isWider ? containerWidth.value / (imageWidth.value / imageHeight.value) : containerHeight.value;

        return {
            left: isWider ? 0 : (containerWidth.value - width) / 2,
            top: isWider ? (containerHeight.value - height) / 2 : 0,
            width,
            height,
            scaleX: width / imageWidth.value,
            scaleY: height / imageHeight.value
        };
    });

    /**
     * SVG 样式
     */
    const svgStyle = computed(() =>
        `left: ${displayArea.value.left}px; top: ${displayArea.value.top}px; width: ${displayArea.value.width}px; height: ${displayArea.value.height}px;`
    );

    /**
     * 将原始坐标转换为显示坐标
     * 注意：从camera.ts保存的points是视频坐标系的坐标，需要转换为显示坐标
     */
    const displayPoints = computed(() =>
        points.value.map((point: { x: number; y: number }) => ({
            x: point.x * displayArea.value.scaleX,
            y: point.y * displayArea.value.scaleY
        }))
    );

    /**
     * 计算边的中点（显示坐标）
     */
    const displayMidPoints = computed(() =>
        displayPoints.value.map((point: { x: number; y: number }, index: number) => {
            const nextPoint = displayPoints.value[(index + 1) % 4];
            return {
                x: (point.x + nextPoint.x) / 2,
                y: (point.y + nextPoint.y) / 2,
                angle: Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI
            };
        })
    );

    /**
     * 计算选择框路径（使用显示坐标）
     */
    const selectionPath = computed(() =>
        `M ${displayPoints.value.map((p: { x: number; y: number }) => `${p.x},${p.y}`).join(' L ')} Z`
    );

    // 拖拽状态
    const dragState = ref<DragState>({
        isDragging: false,
        type: null,
        index: -1,
        startX: 0,
        startY: 0,
        originalPoints: [],
    });

    /**
     * 初始化拖拽状态
     */
    const initDragState = (e: PointerEvent, type: DragState['type'], index = -1) => {
        e.stopPropagation();
        dragState.value = {
            isDragging: true,
            type,
            index,
            startX: e.clientX,
            startY: e.clientY,
            originalPoints: [...points.value]
        };
    };

    /**
     * 图片加载完成
     */
    const onImageLoad = () => {
        if (!imageRef.value || !imageContainerRef.value) return;

        imageWidth.value = imageRef.value.naturalWidth;
        imageHeight.value = imageRef.value.naturalHeight;
        updateContainerSize();
    };

    // 事件处理
    const onCornerPointerDown = (e: PointerEvent, index: number) => initDragState(e, 'corner', index);
    const onMidPointPointerDown = (e: PointerEvent, index: number) => initDragState(e, 'mid', index);
    const onMaskPointerDown = (e: PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'path' && !target.getAttribute('fill')?.includes('rgba')) {
            initDragState(e, 'move');
        }
    };
    const onMaskPointerUp = () => { dragState.value.isDragging = false; };

    /**
     * 坐标限制函数 - 限制在图片原始尺寸内
     */
    const clampPoint = (x: number, y: number) => ({
        x: Math.max(0, Math.min(imageWidth.value, x)),
        y: Math.max(0, Math.min(imageHeight.value, y))
    });

    /**
     * 处理拖拽移动
     */
    const onMaskPointerMove = (e: PointerEvent) => {
        if (!dragState.value.isDragging) return;

        // 将显示区域的像素差值转换为视频坐标系的差值
        const scaledDx = (e.clientX - dragState.value.startX) / displayArea.value.scaleX;
        const scaledDy = (e.clientY - dragState.value.startY) / displayArea.value.scaleY;
        const { type, index, originalPoints } = dragState.value;

        if (type === 'corner') {
            // 移动角点
            const newPoints = [...points.value];
            newPoints[index] = clampPoint(
                originalPoints[index].x + scaledDx,
                originalPoints[index].y + scaledDy
            );
            points.value = newPoints;
        } else if (type === 'mid') {
            // 移动边的中点
            const nextIndex = (index + 1) % 4;
            const prevPoint = originalPoints[index];
            const nextPoint = originalPoints[nextIndex];

            // 计算边的垂直方向
            const edgeLength = Math.sqrt((nextPoint.x - prevPoint.x) ** 2 + (nextPoint.y - prevPoint.y) ** 2);
            const perpendicular = {
                x: -(nextPoint.y - prevPoint.y) / edgeLength,
                y: (nextPoint.x - prevPoint.x) / edgeLength
            };

            const moveDistance = scaledDx * perpendicular.x + scaledDy * perpendicular.y;

            // 更新两个端点
            const newPoints = [...points.value];
            newPoints[index] = {
                x: prevPoint.x + perpendicular.x * moveDistance,
                y: prevPoint.y + perpendicular.y * moveDistance
            };
            newPoints[nextIndex] = {
                x: nextPoint.x + perpendicular.x * moveDistance,
                y: nextPoint.y + perpendicular.y * moveDistance
            };
            points.value = newPoints;
        } else if (type === 'move') {
            // 整体移动
            points.value = originalPoints.map((point: { x: number; y: number }) =>
                clampPoint(point.x + scaledDx, point.y + scaledDy)
            );
        }
    };

    /**
     * 更新容器尺寸
     */
    const updateContainerSize = () => {
        if (!imageContainerRef.value) return;
        const rect = imageContainerRef.value.getBoundingClientRect();
        containerWidth.value = rect.width;
        containerHeight.value = rect.height;
    };

    /**
     * 执行透视变换并更新processedSrc
     */
    const performPerspectiveTransform = async () => {
        const currentImg = currentImage.value;
        if (!currentImg) return;

        try {
            // 创建Image对象来加载图片
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = currentImg.src;
            });

            // 创建canvas获取图像数据
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 设置canvas尺寸为图片原始尺寸
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // 绘制当前图片
            ctx.drawImage(img, 0, 0);

            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // 使用当前的points进行透视变换
            const correctedImageData = perspectiveTransform(imageData, points.value);

            if (correctedImageData) {
                // 创建新的canvas用于校正后的图片
                const correctedCanvas = document.createElement('canvas');
                const correctedCtx = correctedCanvas.getContext('2d');

                if (correctedCtx) {
                    correctedCanvas.width = correctedImageData.width;
                    correctedCanvas.height = correctedImageData.height;
                    correctedCtx.putImageData(correctedImageData, 0, 0);

                    // 转换为blob URL
                    correctedCanvas.toBlob(blob => {
                        if (blob) {
                            // 删除旧的processedSrc URL
                            if (currentImg.processedSrc) {
                                URL.revokeObjectURL(currentImg.processedSrc);
                            }

                            // 创建新的URL并更新
                            const newProcessedUrl = URL.createObjectURL(blob);
                            imageList.value[swiperslideIn.value].processedSrc = newProcessedUrl;

                            console.log('✅ 透视变换完成，已更新processedSrc');
                            console.log('📐 新图片尺寸:', correctedImageData.width, 'x', correctedImageData.height);
                        }
                    }, 'image/jpeg');
                }
            } else {
                console.warn('⚠️ 透视变换失败');
            }
        } catch (error) {
            console.error('❌ 透视变换过程中发生错误:', error);
        }
    };

    /**
     * 透视矫正模式切换处理
     */
    const handleCropModeChange = (toMode: string, event?: string) => {
        switch (event) {
            case 'crop-enter':
                // 进入crop模式时，初始化临时points为当前图片的points
                tempPoints.value = JSON.parse(JSON.stringify(currentImage.value.points || [
                    { x: 100, y: 100 }, { x: 700, y: 100 }, { x: 700, y: 500 }, { x: 100, y: 500 }
                ]));
                break;
            case 'crop-exit':
                // 退出crop模式时，清空临时points（不保存调整）
                tempPoints.value = [];
                break;
            case 'exit':
                // 物理返回键退出
                tempPoints.value = [];
                break;
            case 'crop-confirm':
                // 确认时，将临时points保存到imageList，然后执行透视变换
                if (tempPoints.value.length > 0 && imageList.value[swiperslideIn.value]) {
                    imageList.value[swiperslideIn.value].points = [...tempPoints.value];
                }
                performPerspectiveTransform();
                tempPoints.value = []; // 清空临时points
                break;
        }
    };

    // 生命周期
    onMounted(() => {
        if (containerRef.value) {
            containerRef.value.style.touchAction = 'none';
        }
        window.addEventListener('resize', updateContainerSize);
        updateContainerSize();
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateContainerSize);
    });

    return {
        // 响应式数据
        tempPoints,
        containerRef,
        imageContainerRef,
        imageRef,
        imageWidth,
        imageHeight,
        containerWidth,
        containerHeight,
        points,
        displayArea,
        svgStyle,
        displayPoints,
        displayMidPoints,
        selectionPath,
        dragState,

        // 方法
        onImageLoad,
        onCornerPointerDown,
        onMidPointPointerDown,
        onMaskPointerDown,
        onMaskPointerUp,
        onMaskPointerMove,
        performPerspectiveTransform,
        handleCropModeChange,
        updateContainerSize
    };
}
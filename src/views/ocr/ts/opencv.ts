import cvReadyPromise, { type CV } from "@techstark/opencv-js";

// 缓存Promise以避免重复初始化
let cachedCvPromise: Promise<CV> | null = null;

export async function getOpenCv() {
    if (!cachedCvPromise) {
        cachedCvPromise = Promise.resolve(cvReadyPromise);
    }
    const cv = await cachedCvPromise;
    return cv;
}
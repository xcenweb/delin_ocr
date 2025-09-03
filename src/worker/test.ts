let count = 0;
let timer: ReturnType<typeof setInterval> | null = null;

self.onmessage = function(e: MessageEvent<string>) {
    if (e.data === 'start') {
        // 开始计数
        if (timer) {
            clearInterval(timer);
        }
        timer = setInterval(() => {
            count++;
            self.postMessage(count);
        }, 100);
    } else if (e.data === 'stop') {
        // 停止计数
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        count = 0;
    }
}

export type {}; // 确保这是一个模块
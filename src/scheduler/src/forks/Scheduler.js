/**
 * 任务调度器，用来调度任务,处理优先队列
 * @param callback 回调函数
 */
export function scheduleCallback(callback) {
    requestIdleCallback(callback);
}
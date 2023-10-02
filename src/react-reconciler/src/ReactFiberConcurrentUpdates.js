import {HostRoot} from "./ReactWorkTags";
import { mergeLanes, NoLanes } from './ReactFiberLane';

const concurrentQueues = [];
let concurrentQueuesIndex = 0;


export function markUpdateLaneFromFiberToRoot(sourceFiber) {
    let node = sourceFiber;
    let parent = sourceFiber.return;
    while (parent !== null) {
        node = parent;
        parent = parent.return;
    }
    if (node.tag === HostRoot) {
        return node.stateNode;
    }
    return null;
}

export function enqueueConcurrentHookUpdate(fiber, queue, update,lane) {
    enqueueUpdate(fiber, queue, update,lane);
    return getRootForUpdatedFiber(fiber);
}

function enqueueUpdate(fiber, queue, update, lane) {
    concurrentQueues[concurrentQueuesIndex++] = fiber;//fiber
    concurrentQueues[concurrentQueuesIndex++] = queue;//更新队列
    concurrentQueues[concurrentQueuesIndex++] = update;//更新
    concurrentQueues[concurrentQueuesIndex++] = lane;//更新优先级
    fiber.lanes = mergeLanes(fiber.lanes, lane);
}

function getRootForUpdatedFiber(sourceFiber) {
    let node = sourceFiber;
    let parent = node.return;
    while (parent !== null) {
        node = parent;
        parent = node.return;
    }
    return node.tag === HostRoot ? node.stateNode : null;
}

export function finishQueueingConcurrentUpdates() {
    const endIndex = concurrentQueuesIndex;
    concurrentQueuesIndex = 0;
    let i = 0;
    while (i < endIndex) {
        const fiber = concurrentQueues[i++];
        const queue = concurrentQueues[i++];
        const update = concurrentQueues[i++];
        const lane = concurrentQueues[i++];
        if (queue !== null && update !== null) {
            const pending = queue.pending;
            if (pending === null) {
                update.next = update;
            } else {
                update.next = pending.next;
                pending.next = update;
            }
            queue.pending = update;
        }
    }
}

export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
    enqueueUpdate(fiber, queue, update, lane);
    return getRootForUpdatedFiber(fiber);
}
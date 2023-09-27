import { HostRoot } from "./ReactWorkTags";

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
    let node = sourceFiber;
    let parent = sourceFiber.return;
    while (parent !== null) {
        node = parent;
        parent = parent.return;
    }
    if (node.tag === HostRoot) {
        const root = node.stateNode;
        return root;
    }
    return null;
}

export function finishQueueingConcurrentUpdates() {
    const endIndex = concurrentQueuesIndex;
    concurrentQueuesIndex = 0;
    let i = 0;
    while (i < endIndex) {
        const fiber = concurrentQueues[i++];
        const queue = concurrentQueues[i++];
        const update = concurrentQueues[i++];
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
import { createHostRootFiber } from "./ReactFiber";
import { initializeUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { NoTimestamp, createLaneMap, NoLanes } from 'react-reconciler/src/ReactFiberLane';

/**
 * 创建根fiberNode
 * @param containerInfo
 * @constructor
 */
function FiberRootNode(containerInfo) {
    this.containerInfo = containerInfo;
    this.expirationTimes =createLaneMap(NoTimestamp);
    this.expiredLanes = NoLanes;
}

/**
 * 创建fiberRoot的根
 * @param containerInfo
 * @returns {FiberRootNode}
 * @see 参考./readmePic/fiberroot.png
 */
export function createFiberRoot(containerInfo) {
    const root = new FiberRootNode(containerInfo);
    //创建根fiber，HostRoot就是根节点
    const uninitializedFiber = createHostRootFiber();
    //根容器的current指向当前的根fiber
    root.current = uninitializedFiber;
    //根fiber的stateNode，也就是真实dom节点指向FiberRootNode
    uninitializedFiber.stateNode = root;
    //初始化更新队列
    initializeUpdateQueue(uninitializedFiber);
    return root;
}
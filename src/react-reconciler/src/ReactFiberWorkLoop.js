import {
    IdlePriority as IdleSchedulerPriority,
    ImmediatePriority as ImmediateSchedulerPriority,
    NormalPriority as NormalSchedulerPriority,
    scheduleCallback as Scheduler_scheduleCallback,
    UserBlockingPriority as UserBlockingSchedulerPriority,
    cancelCallback as Scheduler_cancelCallback
} from "./Scheduler";


import {createWorkInProgress} from "./ReactFiber";
import {beginWork} from "./ReactFiberBeginWork";
import {completeWork} from "./ReactFiberCompleteWork";
import {ChildDeletion, MutationMask, NoFlags, Passive, Placement, Update} from "./ReactFiberFlags";
import {
    commitLayoutEffects,
    commitMutationEffectsOnFiber,
    commitPassiveMountEffects,
    commitPassiveUnmountEffects
} from "./ReactFiberCommitWork";
import {flushSyncCallbacks, scheduleSyncCallback} from './ReactFiberSyncTaskQueue';
import {
    getHighestPriorityLane,
    getNextLanes,
    includesBlockingLane,
    markRootUpdated,
    NoLane,
    NoLanes,
    SyncLane
} from './ReactFiberLane';
import {
    ContinuousEventPriority,
    DefaultEventPriority,
    DiscreteEventPriority,
    getCurrentUpdatePriority,
    IdleEventPriority,
    lanesToEventPriority,
    setCurrentUpdatePriority
} from './ReactEventPriorities';
import {getCurrentEventPriority} from 'react-dom-bindings/src/client/ReactDOMHostConfig';

import {finishQueueingConcurrentUpdates} from "./ReactFiberConcurrentUpdates";
import {FunctionComponent, HostComponent, HostRoot, HostText} from "./ReactWorkTags";

let workInProgress = null;//正在工作中的fiber
let rootDoesHavePassiveEffects = false;
let rootWithPendingPassiveEffects = null;
let workInProgressRootRenderLanes = NoLanes;


const RootInProgress = 0;
const RootCompleted = 5;
let workInProgressRoot = null;
let workInProgressRootExitStatus = RootInProgress;


/**
 * 调度，更新root，源码中此处有一个任务的功能
 * @param root root节点
 * @param fiber
 * @param lane
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
    markRootUpdated(root, lane);
    //确保调度执行root上的更新
    ensureRootIsScheduled(root);
}

/**
 * 确保调度执行root上的更新
 * @param {*} root
 */
function ensureRootIsScheduled(root) {

    //告诉浏览器要执行此函数performConcurrentWorkOnRoot
    // scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
    // Scheduler_scheduleCallback(NormalSchedulerPriority, performConcurrentWorkOnRoot.bind(null, root));
    const existingCallbackNode = root.callbackNode;
    const nextLanes = getNextLanes(root, root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes);


    if (nextLanes === NoLanes) {
        root.callbackNode = null;
        root.callbackPriority = NoLane;
        return;
    }

    const newCallbackPriority = getHighestPriorityLane(nextLanes);

    const existingCallbackPriority = root.callbackPriority;
    if (existingCallbackPriority === newCallbackPriority) {
        return;
    }
    if (existingCallbackNode != null) {
        Scheduler_cancelCallback(existingCallbackNode);
    }

    let newCallbackNode;
    if (newCallbackPriority === SyncLane) {
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
        queueMicrotask(flushSyncCallbacks);
        newCallbackNode = null;
    } else {
        let schedulerPriorityLevel;
        switch (lanesToEventPriority(nextLanes)) {
            case DiscreteEventPriority:
                schedulerPriorityLevel = ImmediateSchedulerPriority;
                break;
            case ContinuousEventPriority:
                schedulerPriorityLevel = UserBlockingSchedulerPriority;
                break;
            case DefaultEventPriority:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
            case IdleEventPriority:
                schedulerPriorityLevel = IdleSchedulerPriority;
                break;
            default:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
        }
        newCallbackNode = Scheduler_scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root))
        root.callbackNode = newCallbackNode;
        // Scheduler_scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root))
    }
}

function performSyncWorkOnRoot(root) {
    const lanes = getNextLanes(root, NoLanes);
    renderRootSync(root, lanes);
    root.finishedWork = root.current.alternate
    commitRoot(root)
    return null;//如果没有任务了一定要返回null
}

/**
 * 根据虚拟dom构建fiber树，创建真实的dom节点并插入容器
 * @param root root
 * @param didTimeout
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
    // 第一次渲染都是同步
    // renderRootSync(root);
    //开始进入提交阶段，执行副作用，修改真实dom
    // printFiber(finishedWork);
    const originalCallbackNode = root.callbackNode;
    const lanes = getNextLanes(root, NoLanes);
    if (lanes === NoLanes) {
        return null;
    }
    const shouldTimeSlice = !includesBlockingLane(root, lanes) && (!didTimeout);
    const exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes);
    if (exitStatus !== RootInProgress) {
        root.finishedWork = root.current.alternate;
        commitRoot(root);
    }
    if (root.callbackNode === originalCallbackNode) {
        return performConcurrentWorkOnRoot.bind(null, root);
    }
    return null;

    // if (shouldTimeSlice) {
    //     renderRootConcurrent(root, lanes)
    // } else {
    //     renderRootSync(root, lanes);
    // }
    // root.finishedWork = root.current.alternate;
    // commitRoot(root);
}

function renderRootConcurrent(root, lanes) {
    //TODO
    if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
        prepareFreshStack(root, lanes);
    }
    workLoopConcurrent();
    if (workInProgress !== null) {
        return RootInProgress;
    }
    workInProgressRoot = null;
    workInProgressRootRenderLanes = NoLanes;
    return workInProgressRootExitStatus;
    // renderRootConcurrent()
    // console.log('renderRootSync', root, lanes);
}

function workLoopConcurrent() {
    // sleep(1000);
    performUnitOfWork(workInProgress);
    console.log('shouldYield()', shouldYield(), workInProgress?.type);
}

export function flushPassiveEffects() {
    if (rootWithPendingPassiveEffects !== null) {
        const root = rootWithPendingPassiveEffects;
        commitPassiveUnmountEffects(root.current);
        commitPassiveMountEffects(root, root.current);
    }
}

function commitRoot(root) {
    const previousPriority = getCurrentUpdatePriority();
    try {
        setCurrentUpdatePriority(DiscreteEventPriority);
        commitRootImpl(root);
    } finally {
        setCurrentUpdatePriority(previousPriority);
    }
}

/**
 * 提交阶段，执行副作用，修改真实dom
 * @param root
 */
function commitRootImpl(root) {
    const {finishedWork} = root;
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    workInProgressRoot = null;
    workInProgressRootRenderLanes = NoLanes;

    if ((finishedWork.subtreeFlags & Passive) !== NoFlags || (finishedWork.flags & Passive) !== NoFlags) {
        if (!rootDoesHavePassiveEffects) {
            rootDoesHavePassiveEffects = true;
            // scheduleCallback(flushPassiveEffects);
            Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffects);
        }
    }
    const subtreeHasEffects =
        (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
    //如果自己有副作用，或者子节点有副作用，就执行副作用
    if (subtreeHasEffects || rootHasEffect) {
        commitMutationEffectsOnFiber(finishedWork, root);
        commitLayoutEffects(finishedWork, root);
        root.current = finishedWork;
        if (rootDoesHavePassiveEffects) {
            rootDoesHavePassiveEffects = false;
            rootWithPendingPassiveEffects = root;
        }
    }
    //dom变更后，指向新的fiber树
    root.current = finishedWork;
}

/**
 * 准备新的workInProgress，根据旧的fiber树创建新的fiber树
 * @param root
 * @param lanes
 */
function prepareFreshStack(root, lanes) {
    workInProgressRoot = root;
    workInProgress = createWorkInProgress(root.current, null);
    workInProgressRootRenderLanes = lanes;
    finishQueueingConcurrentUpdates();
}

/**
 * 两个fiber树互相切换，一个是做展示，一个是做渲染
 * 同步渲染fiber树的dom
 * @param root root根fiberRoot
 * @param lanes
 */
function renderRootSync(root, lanes) {
    //不是一个根，或者是更高优先级的更新
    if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
        prepareFreshStack(root, lanes);
    }
    // prepareFreshStack(root, lanes);
    workLoopSync();
    return workInProgressRootExitStatus;
}



/**
 * 执行任务
 */
function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);//执行工作单元
    }
}
/**
 * 执行一个工作单元
 * @param unitOfWork
 */
function performUnitOfWork(unitOfWork) {
    // 获取新的fiber对应的老fiber
    const current = unitOfWork.alternate;
    const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}
/**
 * 完成一个工作单元，找到下一个工作单元
 * @param {*} unitOfWork 
 * @returns 
 */
function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;
    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;
        //执行此fiber的完成工作，如果是原生的dom节点，就创建dom节点
        completeWork(current, completedWork);
        const siblingFiber = completedWork.sibling;
        // 有弟弟 ，将弟弟设置为工作单元
        if (siblingFiber !== null) {
            workInProgress = siblingFiber;
            return;
        }
        // 没弟弟，这是最后一个子节点,父亲的所有子节点都完成了
        completedWork = returnFiber;
        workInProgress = completedWork;
    } while (completedWork !== null);
    if (workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted;
    }
}

export function requestUpdateLane() {
    const updateLane = getCurrentUpdatePriority();
    if (updateLane !== NoLane) {
        return updateLane;
    }
    return getCurrentEventPriority();
}


/**
 * 打印标记
 * @param {*} fiber
 */
function printFiber(fiber) {
    if (fiber.flags !== 0) {
        console.log(
            getFlags(fiber.flags),
            getTag(fiber.tag),
            typeof fiber.type === "function" ? fiber.type.name : fiber.type,
            fiber.memoizedProps
        );
        if (fiber.deletions) {
            for (let i = 0; i < fiber.deletions.length; i++) {
                const childToDelete = fiber.deletions[i];
                console.log(getTag(childToDelete.tag), childToDelete.type, childToDelete.memoizedProps);
            }
        }
    }
    let child = fiber.child;
    while (child) {
        printFiber(child);
        child = child.sibling;
    }
}
/**
 * 获取标记
 * @param {*} tag 
 * @returns 
 */
function getTag(tag) {
    switch (tag) {
        case FunctionComponent:
            return `FunctionComponent`;
        case HostRoot:
            return `HostRoot`;
        case HostComponent:
            return `HostComponent`;
        case HostText:
            return HostText;
        default:
            return tag;
    }
}
function getFlags(flags) {
    if (flags === (Update | Placement | ChildDeletion)) {
        return `自己移动和子元素有删除`;
    }
    if (flags === (ChildDeletion | Update)) {
        return `自己有更新和子元素有删除`;
    }
    if (flags === ChildDeletion) {
        return `子元素有删除`;
    }
    if (flags === (Placement | Update)) {
        return `移动并更新`;
    }
    if (flags === Placement) {
        return `插入`;
    }
    if (flags === Update) {
        return `更新`;
    }
    return flags;
}

import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { MutationMask, NoFlags, Update, Placement, ChildDeletion } from "./ReactFiberFlags";
import { commitMutationEffectsOnFiber } from "./ReactFiberCommitWork";
import { finishQueueingConcurrentUpdates } from "./ReactFiberConcurrentUpdates";
import { FunctionComponent, HostRoot, HostComponent, HostText } from "./ReactWorkTags";

let workInProgress = null;//正在工作中的fiber

/**
 * 调度，更新root，源码中此处有一个任务的功能
 * @param root root节点
 */
export function scheduleUpdateOnFiber(root) {
    //确保调度执行root上的更新
    ensureRootIsScheduled(root);
}

/**
 * 确保调度执行root上的更新
 * @param {*} root 
 */
function ensureRootIsScheduled(root) {
    //告诉浏览器要执行此函数performConcurrentWorkOnRoot
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

/**
 * 根据虚拟dom构建fiber树，创建真实的dom节点并插入容器
 * @param root root
 */
function performConcurrentWorkOnRoot(root) {
    // 第一次渲染都是同步
    renderRootSync(root);
    //开始进入提交阶段，执行副作用，修改真实dom
    const finishedWork = root.current.alternate;
    printFiber(finishedWork);
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    root.finishedWork = finishedWork;
    commitRoot(root);
}

/**
 * 提交阶段，执行副作用，修改真实dom
 * @param root
 */
function commitRoot(root) {
    const { finishedWork } = root;
    const subtreeHasEffects =
        (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
    //如果自己有副作用，或者子节点有副作用，就执行副作用
    if (subtreeHasEffects || rootHasEffect) {
        commitMutationEffectsOnFiber(finishedWork, root);
    }
    //dom变更后，指向新的fiber树
    root.current = finishedWork;
}

/**
 * 两个fiber树互相切换，一个是做展示，一个是做渲染
 * 同步渲染fiber树的dom
 * @param root root根fiberRoot
 */
function renderRootSync(root) {
    prepareFreshStack(root);
    workLoopSync();
}

/**
 * 准备新的workInProgress，根据旧的fiber树创建新的fiber树
 * @param root
 */
function prepareFreshStack(root) {
    workInProgress = createWorkInProgress(root.current, null);
    finishQueueingConcurrentUpdates();
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
    const next = beginWork(current, unitOfWork);
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

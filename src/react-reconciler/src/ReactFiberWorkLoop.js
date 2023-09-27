import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { MutationMask, NoFlags } from "./ReactFiberFlags";
import { commitMutationEffectsOnFiber } from "./ReactFiberCommitWork";


let workInProgress = null;

export function scheduleUpdateOnFiber(root) {
    ensureRootIsScheduled(root);
}
function ensureRootIsScheduled(root) {
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

function performConcurrentWorkOnRoot(root) {
    renderRootSync(root);

    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    commitRoot(root);
}
function commitRoot(root) {
    const { finishedWork } = root;
    const subtreeHasEffects =
        (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
    if (subtreeHasEffects || rootHasEffect) {
        commitMutationEffectsOnFiber(finishedWork, root);
    }
    root.current = finishedWork;
}




function prepareFreshStack(root) {
    workInProgress = createWorkInProgress(root.current, null);
    // finishQueueingConcurrentUpdates();
}
function renderRootSync(root) {
    prepareFreshStack(root);
    workLoopSync();
}

function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}
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

function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;

    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;
        completeWork(current, completedWork);
        const siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            workInProgress = siblingFiber;
            return;
        }
        completedWork = returnFiber;
        workInProgress = completedWork;
    } while (completedWork !== null);
}
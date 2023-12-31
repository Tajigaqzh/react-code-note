import {HostRoot, HostComponent, HostText, FunctionComponent, ContextProvider} from "./ReactWorkTags";
import {MutationMask, Placement, Update, Passive, LayoutMask, Ref} from "./ReactFiberFlags";
import {insertBefore, appendChild, commitUpdate, removeChild} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout} from "./ReactHookEffectTags";

// 真实的父亲节点
let hostParent = null;

export function commitPassiveUnmountEffects(finishedWork) {
    commitPassiveUnmountOnFiber(finishedWork);
}

function commitPassiveUnmountOnFiber(finishedWork) {
    switch (finishedWork.tag) {
        case FunctionComponent: {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            if (finishedWork.flags & Passive) {
                commitHookPassiveUnmountEffects(finishedWork, HookHasEffect | HookPassive);
            }
            break;
        }
        default: {
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
        }
    }
}

function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
    commitHookEffectListUnmount(hookFlags, finishedWork);
}

function commitHookEffectListUnmount(flags, finishedWork) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if ((effect.tag & flags) === flags) {
                const destroy = effect.destroy;
                effect.destroy = undefined;
                if (destroy !== undefined) {
                    destroy();
                }
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
}

export function commitPassiveMountEffects(root, finishedWork) {
    commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent: {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
            if (flags & Passive) {
                commitHookPassiveMountEffects(finishedWork, HookPassive | HookHasEffect);
            }
            break;
        }
        case HostRoot: {
            recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
            break;
        }
        default:
            break;
    }
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
    commitHookEffectListMount(hookFlags, finishedWork);
}

/**
 * mount时提交更新副作用
 * @param flags
 * @param finishedWork
 */
function commitHookEffectListMount(flags, finishedWork) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if ((effect.tag & flags) === flags) {
                const create = effect.create;
                effect.destroy = create();
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
}


function recursivelyTraversePassiveMountEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & Passive) {
        let child = parentFiber.child;
        while (child !== null) {
            commitPassiveMountOnFiber(root, child);
            child = child.sibling;
        }
    }
}

function recursivelyTraversePassiveUnmountEffects(parentFiber) {
    if (parentFiber.subtreeFlags & Passive) {
        let child = parentFiber.child;
        while (child !== null) {
            commitPassiveUnmountOnFiber(child);
            child = child.sibling;
        }
    }
}


/**
 * 提交删除副作用
 * @param {*} root 根节点
 * @param returnFiber 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
    let parent = returnFiber;
    //找到真实的父亲节点
    findParent: while (parent !== null) {
        switch (parent.tag) {
            case HostComponent: {
                hostParent = parent.stateNode;//dom节点
                break findParent;//跳出循环
            }
            case HostRoot: {
                hostParent = parent.stateNode.containerInfo;
                break findParent;
            }
            default:
                break;
        }
        parent = parent.return;
    }

    commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber);
    hostParent = null;
}


/**
 * 提交删除副作用
 * @param {*} finishedRoot 
 * @param {*} nearestMountedAncestor 
 * @param {*} deletedFiber 
 */
function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
    switch (deletedFiber.tag) {
        case HostComponent:
        case HostText: {
            recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
            if (hostParent !== null) {
                removeChild(hostParent, deletedFiber.stateNode);
            }
            break;
        }
        default:
            break;
    }
}

function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
    let child = parent.child;
    while (child !== null) {
        commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
        child = child.sibling;
    }
}

/**
 * 递归遍历处理变更的副作用
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber 
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
    //先把父fiber上的该删除的节点都删除
    const deletions = parentFiber.deletions;
    if (deletions !== null) {
        for (let i = 0; i < deletions.length; i++) {
            const childToDelete = deletions[i];
            commitDeletionEffects(root, parentFiber, childToDelete);
        }
    }
    //在去处理剩下的子节点
    if (parentFiber.subtreeFlags & MutationMask) {
        let { child } = parentFiber;
        while (child !== null) {
            commitMutationEffectsOnFiber(child, root);
            child = child.sibling;
        }
    }
}

function isHostParent(fiber) {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
}
function getHostParentFiber(fiber) {
    let parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
    return parent;
}
function insertOrAppendPlacementNode(node, before, parent) {
    const { tag } = node;
    const isHost = tag === HostComponent || tag === HostText;
    if (isHost) {
        const { stateNode } = node;
        if (before) {
            insertBefore(parent, stateNode, before);
        } else {
            appendChild(parent, stateNode);
        }
    } else {
        const { child } = node;
        if (child !== null) {
            insertOrAppendPlacementNode(child, before, parent);
            let { sibling } = child;
            while (sibling !== null) {
                insertOrAppendPlacementNode(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}
function getHostSibling(fiber) {
    let node = fiber;
    siblings: while (true) {
        // 如果我们没有找到任何东西，让我们试试下一个弟弟
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) {
                // 如果我们是根Fiber或者父亲是原生节点，我们就是最后的弟弟
                return null;
            }
            node = node.return;
        }
        // node.sibling.return = node.return
        node = node.sibling;
        while (node.tag !== HostComponent && node.tag !== HostText) {
            // 如果它不是原生节点，并且，我们可能在其中有一个原生节点
            // 试着向下搜索，直到找到为止
            if (node.flags & Placement) {
                // 如果我们没有孩子，可以试试弟弟
                continue siblings;
            } else {
                // node.child.return = node
                node = node.child;
            }
        } // Check if this host node is stable or about to be placed.
        // 检查此原生节点是否稳定可以放置
        if (!(node.flags & Placement)) {
            // 找到它了!
            return node.stateNode;
        }
    }
}
function commitPlacement(finishedWork) {
    const parentFiber = getHostParentFiber(finishedWork);
    switch (parentFiber.tag) {
        case HostComponent: {
            const parent = parentFiber.stateNode;
            const before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
        case HostRoot: {
            const parent = parentFiber.stateNode.containerInfo;
            const before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
        default:
            break;
    }
}


function commitReconciliationEffects(finishedWork) {
    const {flags} = finishedWork;
    if (flags & Placement) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
}

export function commitLayoutEffects(finishedWork, root) {
    const current = finishedWork.alternate;
    commitLayoutEffectOnFiber(root, current, finishedWork);
}

function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case FunctionComponent: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & LayoutMask) {//4
                commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
            }
            break;
        }
        case HostRoot: {
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
        }
        default:
            break;
    }
}

function recursivelyTraverseLayoutEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & LayoutMask) {
        let child = parentFiber.child;
        while (child !== null) {
            const current = child.alternate;
            commitLayoutEffectOnFiber(root, current, child);
            child = child.sibling;
        }
    }
}


export function commitMutationEffectsOnFiber(finishedWork, root) {
    const current = finishedWork.alternate;
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case HostRoot:
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            break;
        case FunctionComponent:
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
            }
            break;
        case HostComponent: {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & Ref) {
                commitAttachRef(finishedWork);
            }
            if (flags & Update) {
                const instance = finishedWork.stateNode;
                if (instance != null) {
                    const newProps = finishedWork.memoizedProps;
                    const oldProps = current !== null ? current.memoizedProps : newProps;
                    const type = finishedWork.type;
                    const updatePayload = finishedWork.updateQueue;
                    finishedWork.updateQueue = null;
                    if (updatePayload !== null) {
                        commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                    }
                }
            }
            break;
        }
        case HostText: {
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            break;
        }

        case ContextProvider:{
            recursivelyTraverseMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            break;
        }
        default: {
            break;
        }
    }
}

/**
 * 提交layout effect
 * @param finishedWork
 * @param hookFlags
 */
function commitHookLayoutEffects(finishedWork, hookFlags) {
    commitHookEffectListMount(hookFlags, finishedWork);
}

function commitAttachRef(finishedWork) {
    const ref = finishedWork.ref;
    if (ref !== null) {
        const instance = finishedWork.stateNode;
        if (typeof ref === "function") {
            ref(instance)
        } else {
            ref.current = instance;
        }
    }
}
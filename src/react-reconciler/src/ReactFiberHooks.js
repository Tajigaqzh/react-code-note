import ReactSharedInternals from "shared/ReactSharedInternals";
import {enqueueConcurrentHookUpdate} from "./ReactFiberConcurrentUpdates";
import {Passive as PassiveEffect, Update as UpdateEffect} from "./ReactFiberFlags";
import {HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout} from "./ReactHookEffectTags";
import {scheduleUpdateOnFiber, requestUpdateLane} from "./ReactFiberWorkLoop";
import is from "shared/is.js";

const {ReactCurrentDispatcher} = ReactSharedInternals;
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;

/**
 * 挂载的时候用的不同的dispatcher
 */
const HooksDispatcherOnMountInDEV = {
    useReducer: mountReducer,
    useState: mountState,
    useEffect: mountEffect,
    useLayoutEffect: mountLayoutEffect,
    useRef: mountRef,
};

/**
 * 更新的时候用的不同的dispatcher
 */
const HooksDispatcherOnUpdateInDEV = {
    useReducer: updateReducer,
    useState: updateState,
    useEffect: updateEffect,
    useLayoutEffect: updateLayoutEffect,
    useRef: updateRef,
};

function mountRef(initialValue) {
    const hook = mountWorkInProgressHook();
    const ref = {
        current: initialValue,
    };
    hook.memoizedState = ref;
    return ref;
}

function updateRef() {
    const hook = updateWorkInProgressHook();
    return hook.memoizedState;
}

function mountEffect(create, deps) {
    return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountLayoutEffect(create, deps) {
    return mountEffectImpl(PassiveEffect, HookLayout, create, deps)
}

function updateLayoutEffect(create, deps) {
    return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    //给当前的函数组件fiber添加flags
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps);
}

function pushEffect(tag, create, destroy, deps) {
    const effect = {
        tag, create, destroy, deps, next: null
    };
    let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
}

function createFunctionComponentUpdateQueue() {
    return {
        lastEffect: null,
    };
}

function updateEffect(create, deps) {
    return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy;
    if (currentHook !== null) {
        const prevEffect = currentHook.memoizedState;
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
            const prevDeps = prevEffect.deps;
            //用新数组和老数组记性对比，如果一样的话
            if (areHookInputsEqual(nextDeps, prevDeps)) {
                //不管要不要重新执行，都要把新的effect组成完整的循环链表放到fiber.updateQueue
                hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
                return;
            }
        }
    }
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destroy, nextDeps);

}

/**
 * 比较新老依赖数组是否相等
 * @param nextDeps 新数组
 * @param prevDeps 老数组
 * @returns {boolean}
 */
function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) {
        return false;
    }
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (is(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}

function mountWorkInProgressHook() {
    const hook = {
        memoizedState: null,
        queue: null,
        next: null,
    };
    if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
}

function dispatchReducerAction(fiber, queue, action) {
    const update = {
        action,
        next: null,
    };
    const root = enqueueConcurrentHookUpdate(fiber, queue, update);
    scheduleUpdateOnFiber(root, fiber);
}

function mountReducer(reducer, initialArg) {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = initialArg;
    const queue = {
        pending: null, dispatch: null,
    };
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memoizedState, dispatch];
}

function updateReducer(reducer) {
    const hook = updateWorkInProgressHook()
    const queue = hook.queue
    queue.lastRenderedReducer = reducer
    const current = currentHook
    const pendingQueue = queue.pending
    let newState = current.memoizedState
    if (pendingQueue !== null) {
        queue.pending = null
        const first = pendingQueue.next
        let update = first
        do {
            //小优化，如果计算过了直接使用计算得到的值，不用再计算了
            if (update.hasEagerState) {
                newState = update.eagerState
            } else {
                const action = update.action
                newState = reducer(newState, action)
            }
            update = update.next
        } while (update !== null && update !== first)
    }
    hook.memoizedState = queue.lastRenderedState = newState
    return [hook.memoizedState, queue.dispatch]
}

function mountState(initialState) {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = hook.baseState = initialState;
    const queue = {
        pending: null,
        dispatch: null,
        lastRenderedState: initialState,//上一个state
        lastRenderedReducer: basicStateReducer,//上一个reducer
    }
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue))

    return [hook.memoizedState, dispatch]
}

function updateState() {
    return updateReducer(basicStateReducer)
}

/**
 * 挂载的时候和useReducer是一样的，但是更新的时候不一样
 * @param fiber
 * @param queue
 * @param action
 */
function dispatchSetState(fiber, queue, action) {
    const lane = requestUpdateLane(fiber);
    const update = {
        lane,
        action,
        next: null,
        hasEagerState: false,//是否有紧急更新状态
        eagerState: null,
    }
    //派发动作后，利用上一次的状态和上一次的reducer，计算出新的状态
    const {lastRenderedReducer, lastRenderedState} = queue;
    const eagerState = lastRenderedReducer(lastRenderedState, action);
    update.hasEagerState = true
    update.eagerState = eagerState
    if (is(eagerState, lastRenderedState)) {
        //如果新的状态和上一次的状态一样，就不用更新了
        return
    }
    //真正的入队更新，并调度逻辑
    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    scheduleUpdateOnFiber(root, fiber, lane)
}

function updateWorkInProgressHook() {
    if (currentHook === null) {
        const current = currentlyRenderingFiber.alternate
        currentHook = current.memoizedState
    } else {
        currentHook = currentHook.next
    }
    const newHook = {
        memoizedState: currentHook.memoizedState,
        queue: currentHook.queue,
        next: null
    }
    if (workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
    } else {
        workInProgressHook = workInProgressHook.next = newHook
    }
    return workInProgressHook
}


/**
 * useState其实就是一个内置了一个reducer的useReducer，useState对useReducer进行了优化
 * 当传入的state不变时，不会触发更新，加了lastRenderedState属性，和lastRenderReducer
 * @param state
 * @param action
 * @returns {*}
 */
function basicStateReducer(state, action) {
    return typeof action === 'function' ? action(state) : action;
}


export function renderWithHooks(current, workInProgress, Component, props) {
    currentlyRenderingFiber = workInProgress;
    workInProgress.updateQueue = null;
    workInProgress.memoizedState = null;
    if (current !== null && current.memoizedState !== null) {
        ReactCurrentDispatcher.current = HooksDispatcherOnUpdateInDEV;
    } else {
        ReactCurrentDispatcher.current = HooksDispatcherOnMountInDEV;
    }
    const children = Component(props);
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
    return children;
}
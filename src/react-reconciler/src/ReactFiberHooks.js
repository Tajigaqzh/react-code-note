import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";



const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;

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
        pending: null,
        dispatch: null,
    };
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memoizedState, dispatch];
}

const HooksDispatcherOnMountInDEV = {
    useReducer: mountReducer
};
function useReducer(reducer, initialArg) {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = initialArg;
    const queue = {
        pending: null,
        dispatch: null,
    };
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memoizedState, dispatch];
}


// function mountReducer(reducer, initialArg) {
//     const hook = mountWorkInProgressHook();
//     hook.memoizedState = initialArg;
//     const queue = {
//         pending: null,
//         dispatch: null,
//     };
//     hook.queue = queue;
//     const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
//     return [hook.memoizedState, dispatch];
// }



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

const HooksDispatcherOnUpdateInDEV = {
    useReducer: updateReducer
};

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







export function renderWithHooks(current, workInProgress, Component, props) {
    currentlyRenderingFiber = workInProgress;
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
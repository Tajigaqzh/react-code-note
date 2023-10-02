import {ContextProvider, HostComponent, HostRoot, HostText, IndeterminateComponent} from "./ReactWorkTags";
import {NoFlags} from "./ReactFiberFlags";
import {NoLanes} from './ReactFiberLane';
import {REACT_PROVIDER_TYPE} from 'shared/ReactSymbols';

export function FiberNode(tag, pendingProps, key) {
    this.tag = tag;
    this.key = key;
    this.type = null;
    this.stateNode = null;

    this.return = null;
    this.child = null;
    this.sibling = null;

    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;

    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
    this.alternate = null;
    this.index = 0;
    this.deletions = null;
    this.ref = null;
    this.lanes = NoLanes;
    this.childLanes = NoLanes;
}
function createFiber(tag, pendingProps, key) {
    return new FiberNode(tag, pendingProps, key);
}
export function createHostRootFiber() {
    return createFiber(HostRoot, null, null);
}

export function createWorkInProgress(current, pendingProps) {
    let workInProgress = current.alternate;
    if (workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = NoFlags;
        workInProgress.subtreeFlags = NoFlags;
        workInProgress.deletions = null;
    }
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;
    workInProgress.flags = current.flags;
    workInProgress.childLanes = current.childLanes;
    workInProgress.lanes = current.lanes;
    return workInProgress;
}

export function createFiberFromTypeAndProps(type, key, pendingProps) {
    let fiberTag = IndeterminateComponent;
    if (typeof type === "string") {
        fiberTag = HostComponent;
    } else {
        getTag:switch (type) {
            default: {
                if (typeof type === "object" && type !== null) {
                    switch (type.$$typeof) {
                        case REACT_PROVIDER_TYPE:
                            fiberTag = ContextProvider;
                            break getTag;
                        default:
                            break getTag;
                    }
                }
            }
        }
    }
    const fiber = createFiber(fiberTag, pendingProps, key);
    fiber.type = type;
    return fiber;
}
export function createFiberFromElement(element) {
    const { type, key, props: pendingProps } = element;
    return createFiberFromTypeAndProps(type, key, pendingProps);
}

export function createFiberFromText(content) {
    return createFiber(HostText, content, null);
}
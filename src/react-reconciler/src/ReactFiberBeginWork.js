import { HostRoot, HostComponent, HostText } from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import logger,{indent} from "shared/logger";


function reconcileChildren(current, workInProgress, nextChildren) {
    if (current === null) {
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
    } else {
        workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
    }
}
function updateHostRoot(current, workInProgress) {
    processUpdateQueue(workInProgress);
    const nextState = workInProgress.memoizedState;
    const nextChildren = nextState.element;
    
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}
function updateHostComponent(current, workInProgress) {
    const { type } = workInProgress;
    const nextProps = workInProgress.pendingProps;
  
    let nextChildren = nextProps.children;
    const isDirectTextChild = shouldSetTextContent(type, nextProps);
    if (isDirectTextChild) {
        nextChildren = null;
    }
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}

export function beginWork(current, workInProgress) {
    indent.number += 2;
    logger(" ".repeat(indent.number) + "beginWork", workInProgress);
    switch (workInProgress.tag) {
        case HostRoot:
            return updateHostRoot(current, workInProgress);
        case HostComponent:
            return updateHostComponent(current, workInProgress);
        case HostText:
            return null;
        default:
            return null;
    }
}
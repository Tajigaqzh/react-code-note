// import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates";
import assign from "shared/assign";
import {enqueueConcurrentClassUpdate} from './ReactFiberConcurrentUpdates'
import {isSubsetOfLanes, mergeLanes, NoLane, NoLanes} from './ReactFiberLane';


export const UpdateState = 0;

export function initializeUpdateQueue(fiber) {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
  };
}

export function createUpdate(lane) {
  return {tag: UpdateState, lane, next: null};
}

export function enqueueUpdate(fiber, update, lane) {
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  // const pending = sharedQueue.pending;
  // if (pending === null) {
  //   update.next = update;
  // } else {
  //   update.next = pending.next;
  //   pending.next = update;
  // }
  // updateQueue.shared.pending = update;
  // return markUpdateLaneFromFiberToRoot(fiber);
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

function getStateFromUpdate(update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState: {
      const {payload} = update;
      let partialState;
      if (typeof payload === 'function') {
        // Updater function
        partialState = payload.call(null, prevState, nextProps);
      } else {
        partialState = payload;
      }
      // const partialState = payload;
      return assign({}, prevState, partialState);
    }
    default:
      return prevState;
  }
}

export const processUpdateQueue = (workInProgress, props, workInProgressRootRenderLanes) => {
  // 获取新的更新队列
  const queue = workInProgress.updateQueue
  // 第一个跳过的更新
  let firstBaseUpdate = queue.firstBaseUpdate;
  // 最后一个跳过的更新
  let lastBaseUpdate = queue.lastBaseUpdate;
  // 获取待生效的队列
  const pendingQueue = queue.shared.pending
  /**   如果有新链表合并新旧链表开始  */
  // 如果有新的待生效的队列
  if (pendingQueue !== null) {
    // 先清空待生效的队列
    queue.shared.pending = null
    // 最后一个待生效的更新
    const lastPendingUpdate = pendingQueue
    // 第一个待生效的更新
    const firstPendingUpdate = lastPendingUpdate.next
    // 把环状链表剪开
    lastPendingUpdate.next = null
    // 如果没有老的更新队列
    if (lastBaseUpdate === null) {
      // 第一个基本更新就是待生效队列的第一个更新
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 否则把待生效更新队列添加到基本更新的尾部
      lastBaseUpdate.next = firstPendingUpdate;
    }
    // 最后一个基本更新肯定就是最后一个待生效的更新
    lastBaseUpdate = lastPendingUpdate;
    /**  合并新旧链表结束  */
  }

  // 如果有更新
  if (firstBaseUpdate !== null) {
    // 基本状态
    let newState = queue.baseState;
    // 新的车道
    let newLanes = NoLanes;
    // 新的基本状态
    let newBaseState = null;
    // 新的第一个基本更新
    let newFirstBaseUpdate = null;
    // 新的最后一个基本更新
    let newLastBaseUpdate = null;
    // 第一个更新
    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      const shouldSkipUpdate = !isSubsetOfLanes(workInProgressRootRenderLanes, updateLane);
      // 判断优先级是否足够,如果不够就跳过此更新
      if (shouldSkipUpdate) {
        // 复制一个新的更新并添加新的基本链表中
        const clone = {
          lane: updateLane,
          tag: update.tag,
          payload: update.payload,
          next: null
        };
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        // 保存此fiber上还剩下的更新车道
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        // 如果已经有跳过的更新了，即使优先级足够也需要添到新的基本链表中
        if (newLastBaseUpdate !== null) {
          const clone = {
            lane: NoLane,
            tag: update.tag,
            payload: update.payload,
            next: null
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        // 根据更新计算新状态
        newState = getStateFromUpdate(update, newState, props);
        update = update.next;
      }
    } while (update);
    // 如果没有跳过的更新
    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}
// export function processUpdateQueue(workInProgress) {
//   const queue = workInProgress.updateQueue;
//   const pendingQueue = queue.shared.pending;
//   if (pendingQueue !== null) {
//     queue.shared.pending = null;
//     const lastPendingUpdate = pendingQueue;
//     const firstPendingUpdate = lastPendingUpdate.next;
//     lastPendingUpdate.next = null;
//     let newState = workInProgress.memoizedState;
//     let update = firstPendingUpdate;
//     while (update) {
//       newState = getStateFromUpdate(update, newState);
//       update = update.next;
//     }
//
//     workInProgress.memoizedState = newState;
//   }
// }
export function cloneUpdateQueue(current, workInProgress) {
  const queue = workInProgress.updateQueue;
  const currentQueue = current.updateQueue;
  if (queue === currentQueue) {
    workInProgress.updateQueue = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared,
    };
  }
}
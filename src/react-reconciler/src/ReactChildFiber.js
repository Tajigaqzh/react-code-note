import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import isArray from "shared/isArray";
import { createFiberFromElement, FiberNode, createFiberFromText } from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { HostText } from "./ReactWorkTags";
import { createWorkInProgress } from "./ReactFiber";


/**
 * 创建子节点协调器，用于协调子节点，比如说删除、更新、插入等
 * @param shouldTrackSideEffects 是否跟踪副作用
 * @returns {(function(*, *, *): (*|null))|*}
 */
function createChildReconciler(shouldTrackSideEffects) {
    function useFiber(fiber, pendingProps) {
        const clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibling = null;
        return clone;
    }

    /**
     * 删除儿子节点
     * @param returnFiber 父亲节点
     * @param childToDelete 将要删除的儿子
     */
    function deleteChild(returnFiber, childToDelete) {
        //不跟踪副作用，直接返回
        if (!shouldTrackSideEffects) {
            return;
        }
        //删除的节点的flags
        const deletions = returnFiber.deletions;
        if (deletions === null) {

            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion;
        } else {
            deletions.push(childToDelete);
        }
    }

    /**
     * 借助deleteChild实现
     * 删除从currentFirstChild之后所有的弟弟fiber节点
     * @param returnFiber 父fiber
     * @param currentFirstChild 当前的第一个儿子fiber
     * @returns {null}
     */
    function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) {
            return null;
        }
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }
        return null;
    }
    /**
     * 把剩余节点放到map中
     * @param {*} returnFiber 
     * @param {*} currentFirstChild 
     * @returns 
     */
    function mapRemainingChildren(returnFiber, currentFirstChild) {
        // 存放旧节点的map
        const existingChildren = new Map();
        let existingChild = currentFirstChild;
        while (existingChild !== null) {
            // 如果key不为空，就用key作为索引，否则用index作为索引
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
            } else {
                existingChildren.set(existingChild.index, existingChild);
            }
            // 获取弟弟
            existingChild = existingChild.sibling;
        }
        return existingChildren;
    }
    /**
     * 更新文本节点
     * @param {*} returnFiber 
     * @param {*} current 
     * @param {*} textContent 
     * @returns 
     */
    function updateTextNode(returnFiber, current, textContent) {
        // 如果老的fiber是null或者当前节点不是文本节点，那么就创建一个新的文本节点
        if (current === null || current.tag !== HostText) {
            const created = createFiberFromText(textContent);
            created.return = returnFiber;
            return created;
        } else {
            const existing = useFiber(current, textContent);
            existing.return = returnFiber;
            return existing;
        }
    }
    /**
     * 
     * @param {*} existingChildren 
     * @param {*} returnFiber 
     * @param {*} newIdx 
     * @param {*} newChild 
     * @returns 
     */
    function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
        // 是string或者number
        if ((typeof newChild === "string" && newChild !== "") || typeof newChild === "number") {
            const matchedFiber = existingChildren.get(newIdx) || null;
            return updateTextNode(returnFiber, matchedFiber, "" + newChild);
        }
        // 是对象
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    // 用key或者index去找
                    const matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                    return updateElement(returnFiber, matchedFiber, newChild);
                }
            }
        }
        return null;
    }


    function reconcileSingleElement(returnFiber, currentFirstChild, element) {
        const key = element.key;
        let child = currentFirstChild;

        while (child !== null) {
            if (child.key === key) {
                const elementType = element.type;
                //判断老fiber对应的类型和新虚拟dom的类型是否一致
                if (child.type === elementType) {
                    //类型一样，也要删除多余的老的子fiber
                    deleteRemainingChildren(returnFiber, child.sibling);
                    const existing = useFiber(child, element.props);
                    existing.ref = element.ref;
                    existing.return = returnFiber;
                    return existing;
                } else {
                    // 如果找到了key一致但是类型不一致的fiber，那么就删除老fiber及其兄弟fiber
                    deleteRemainingChildren(returnFiber, child);
                    break;
                }
            } else {
                //key不一致
                deleteChild(returnFiber, child);
            }
            child = child.sibling;
        }
        const created = createFiberFromElement(element);
        created.ref = element.ref;
        created.return = returnFiber;
        return created;
    }
    function placeSingleChild(newFiber) {
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags |= Placement;
        }
        return newFiber;
    }
    function reconcileSingleTextNode(returnFiber, currentFirstChild, content) {
        const created = new FiberNode(HostText, { content }, null);
        created.return = returnFiber;
        return created;
    }
    function createChild(returnFiber, newChild) {
        if ((typeof newChild === "string" && newChild !== "") || typeof newChild === "number") {
            const created = createFiberFromText(`${newChild}`);
            created.return = returnFiber;
            return created;
        }

        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const created = createFiberFromElement(newChild);
                    created.ref = newChild.ref;
                    created.return = returnFiber;
                    return created;
                }
                default:
                    break;
            }
        }
        return null;
    }
    /**
     * 
     * @param {FiberNode} newFiber 
     * @param {Number} lastPlacedIndex
     * @param {Number} newIndex 
     * @returns 
     */
    function placeChild(newFiber, lastPlacedIndex, newIndex) {
        // 指定新的fiber在新的挂载顺序中的位置
        newFiber.index = newIndex;
        // 如果不需要跟踪副作用
        if (!shouldTrackSideEffects) {
            return lastPlacedIndex;
        }
        // 获取老的fiber
        const current = newFiber.alternate;
        // 有老fiber，这次是更新
        if (current !== null) {
            const oldIndex = current.index;
            // 如果找到的老的fiber的位置小于上一个不需要移动的fiber的位置，那么就需要移动老fiber
            if (oldIndex < lastPlacedIndex) {
                newFiber.flags |= Placement;
                return lastPlacedIndex;
            } else {
                return oldIndex;
            }
        } else {
            // 没有老的fiber，这次是新增需要插入
            newFiber.flags |= Placement;
            return lastPlacedIndex;
        }
    }
    function updateElement(returnFiber, current, element) {
        const elementType = element.type;
        if (current !== null) {
            if (current.type === elementType) {
                const existing = useFiber(current, element.props);
                existing.ref = element.ref;
                existing.return = returnFiber;
                return existing;
            }
        }
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        created.ref = element.ref;
        return created;
    }

    function updateSlot(returnFiber, oldFiber, newChild) {
        const key = oldFiber !== null ? oldFiber.key : null;
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    if (newChild.key === key) {
                        return updateElement(returnFiber, oldFiber, newChild);
                    }
                }
                default:
                    return null;
            }
            return null
        }
    }
    /**
     * 子fiber为数组，协调多个子fiber
     * @param {*} returnFiber 
     * @param {*} currentFirstChild 
     * @param {*} newChildren 
     * @returns 
     */
    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
        let resultingFirstChild = null;//返回的第一个新儿子
        let previousNewFiber = null;//上一个的一个新的儿子fiber
        let newIdx = 0;//用来遍历续保的虚拟dom的索引
        let oldFiber = currentFirstChild;//第一个老fiber
        let nextOldFiber = null;//下一个老fiber？
        let lastPlacedIndex = 0;//上一个不需要移动的fiber的索引
        //开启第一轮循环，如果老fiber有值新的虚拟dom也有值，就更新老fiber
        //STUB - 第一次循环
        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            // 存一下老的fiber的下一个兄弟fiber
            nextOldFiber = oldFiber.sibling;
            // 尝试复用老的fiber
            const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
            if (newFiber === null) {
                break;
            }
            if (shouldTrackSideEffects) {
                if (oldFiber && newFiber.alternate === null) {
                    //如果有老fiber，但是新的fiber并没有成功复用老fiber和老的真实dom蛮久删除老fiber
                    deleteChild(returnFiber, oldFiber);
                }
            }
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
            // 放置新的fiber的位置
            // placeChild(newFiber, newIdx);

            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
            } else {
                previousNewFiber.sibling = newFiber;
            }
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }
        //新的虚拟dom遍历完了
        if (newIdx === newChildren.length) {
            //删除剩余的老的fiber
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultingFirstChild;
        }
        // 如果老的fiber已经遍历完了，但是新的虚拟dom还有剩余，那么就把剩余的虚拟dom都创建成fiber
        //STUB - 第二次循环
        if (oldFiber === null) {
            for (; newIdx < newChildren.length; newIdx++) {
                const newFiber = createChild(returnFiber, newChildren[newIdx]);
                if (newFiber === null) {
                    continue;
                }
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                // placeChild(newFiber, newIdx);
                //如果previousNewFiber为空，说明这是第一个fiber
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    // 否则说明不是大儿子，把newFiber挂载到上一个儿子的sibling上
                    previousNewFiber.sibling = newFiber;
                }
                // 把previousNewFiber指针指向最后一个子fiber，就是newFiber
                previousNewFiber = newFiber;
            }
        }

        //STUB - 移动节点
        //第一轮比较完，后获取剩下的节点，进行映射
        const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
        //遍历剩余的新的虚拟dom子节点
        for (; newIdx < newChildren.length; newIdx++) {
            // 从map中进行更新
            const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx]);
            if (newFiber !== null) {//new有值
                if (shouldTrackSideEffects) {
                    if (newFiber.alternate !== null) {//有老fiber
                        // 删掉
                        existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
                    }
                }
                // 存放新fiber的存放位置，给lastPlacedIndex赋值
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;//newFiber是第一个儿子
                } else {
                    previousNewFiber.sibling = newFiber;//挂到之前的儿子的sibling上
                }
                previousNewFiber = newFiber;
            }
        }
        if (shouldTrackSideEffects) {
            // 全部遍历完了，删除剩下的老的fiber
            existingChildren.forEach((child) => deleteChild(returnFiber, child));
        }


        return resultingFirstChild;
    }

    /**
     * 比较子fiber的DOM-DIFF
     * @param {*} returnFiber 
     * @param {*} currentFirstChild 
     * @param {*} newChild 
     * @returns 
     */
    function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                //是元素
                case REACT_ELEMENT_TYPE: {
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
                }
                default:
                    break;
            }
            //newChild【hello,span虚拟dom】
            if (isArray(newChild)) {
                return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
            }
        }
        if (typeof newChild === "string") {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, newChild));
        }
        return null;
    }

    return reconcileChildFibers;
}
export const reconcileChildFibers = createChildReconciler(true);
export const mountChildFibers = createChildReconciler(false);
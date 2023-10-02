/**
 * 向堆中放入元素
 * @param heap
 * @param node
 */
export function push(heap, node) {
    const index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
}

/**
 * 从堆中取出堆顶元素
 * @param heap
 * @returns {null|*}
 */
export function peek(heap) {
    return heap.length === 0 ? null : heap[0];
}

/**
 * 向上调整元素
 * @param heap
 * @param node
 * @param i
 */
function siftUp(heap, node, i) {
    let index = i;
    while (index > 0) {
        const parentIndex = (index - 1) >>> 1;
        //位移运算自动取小数
        // const parentIndex = Math.floor((index - 1) / 2);
        const parent = heap[parentIndex];
        if (compare(parent, node) > 0) {
            //如果父节点比当前节点大，那么交换位置
            heap[parentIndex] = node;
            heap[index] = parent;
            index = parentIndex;
        } else {
            return;
        }
    }
}

/**
 * 向下调整元素
 * @param heap
 * @param node
 * @param i
 */
function siftDown(heap, node, i) {
    let index = i;
    const length = heap.length;
    const halfLength = length >>> 1;
    while (index < halfLength) {
        const leftIndex = (index + 1) * 2 - 1;
        const left = heap[leftIndex];
        const rightIndex = leftIndex + 1;
        const right = heap[rightIndex];
        if (compare(left, node) < 0) {
            if (rightIndex < length && compare(right, left) < 0) {
                heap[index] = right;
                heap[rightIndex] = node;
                index = rightIndex;
            } else {
                heap[index] = left;
                heap[leftIndex] = node;
                index = leftIndex;
            }
        } else if (rightIndex < length && compare(right, node) < 0) {
            heap[index] = right;
            heap[rightIndex] = node;
            index = rightIndex;
        } else {
            return;
        }
    }
}

/**
 * 比较两个元素,优先使用sortIndex排序，相同的使用id排序
 * @param a
 * @param b
 */
function compare(a, b) {
    const diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
}

export function pop(heap) {
    if (heap.length === 0) {
        return null;
    }
    const first = heap[0];
    const last = heap.pop();
    if (last !== first) {
        heap[0] = last;
        siftDown(heap, last, 0);
    }
    return first;
}

// let heap = [];
// let id = 1;
// push(heap, {sortIndex: 3, id: id++});
// push(heap, {sortIndex: 2, id: id++});
// push(heap, {sortIndex: 1, id: id++});
// // let min = peek(heap);
// // console.log(min);
// siftDown(heap, {sortIndex: 4, id: id++}, 0);
// console.log(peek(heap))


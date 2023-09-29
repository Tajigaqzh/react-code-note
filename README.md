### diff对比

DOM DIFF 的三个规则
只对同级元素进行比较，不同层级不对比
不同的类型对应不同的元素
可以通过 key 来标识同一个节点
第 1 轮遍历
如果 key 不同则直接结束本轮循环
newChildren 或 oldFiber 遍历完，结束本轮循环
key 相同而 type 不同，标记老的 oldFiber 为删除，继续循环
key 相同而 type 也相同，则可以复用老节 oldFiber 节点，继续循环
第 2 轮遍历
newChildren 遍历完而 oldFiber 还有，遍历剩下所有的 oldFiber 标记为删除，DIFF 结束
oldFiber 遍历完了，而 newChildren 还有，将剩下的 newChildren 标记为插入，DIFF 结束
newChildren 和 oldFiber 都同时遍历完成，diff 结束
newChildren 和 oldFiber 都没有完成，则进行节点移动的逻辑
第 3 轮遍历
处理节点移动的情况


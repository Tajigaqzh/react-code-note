//每种虚拟DOM都会对应自己的fiber tag类型

export const FunctionComponent = 0;//函数式组件
export const ClassComponent = 1;//类组件
export const IndeterminateComponent = 2;//不确定是函数式还是类式组件
export const HostRoot = 3;//根节点，多个可以互相嵌套
export const HostComponent = 5;//元素节点 div span等
export const HostText = 6;//文本节点


export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;
export const TracingMarkerComponent = 25;
export const HostHoistable = 26;
export const HostSingleton = 27;


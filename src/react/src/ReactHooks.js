import ReactCurrentDispatcher from "./ReactCurrentDispatcher.js";

function resolveDispatcher() {
    return ReactCurrentDispatcher.current;
}

/**
 * useReducer
 * @param reducer 处理函数
 * @param initialArg 初始值
 */
export function useReducer(reducer, initialArg) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useReducer(reducer, initialArg);

}
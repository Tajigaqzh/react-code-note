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

/**
 * useState
 * @param reducer
 * @param initialState
 * @returns {*}
 */
export function useState(reducer, initialState) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useState(reducer, initialState);
}
/**
 * useEffect
 * @param {*} create 
 * @param {*} deps 
 */
export function useEffect(create, deps) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useEffect(create, deps);
}

/**
 * useLayoutEffect
 * @param create
 * @param deps
 * @returns {void|*}
 */
export function useLayoutEffect(create, deps) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useLayoutEffect(create, deps);
}

/**
 * useRef
 * @param initialValue
 * @returns {{current: *}|*}
 */
export function useRef(initialValue) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useRef(initialValue);
}

export function useContext(Context){
    const dispatcher = resolveDispatcher();
    return dispatcher.useContext(Context);
}
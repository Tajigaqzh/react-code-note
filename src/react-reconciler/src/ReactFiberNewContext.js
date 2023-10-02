/**
 * 跟新context内容
 * @param context
 * @param nextValue
 */
export function pushProvider(context, nextValue) {
    context._currentValue = nextValue;
}

/**
 * 读取context
 * @param context
 * @returns {*}
 */
export function readContext(context) {
    return context._currentValue;
}
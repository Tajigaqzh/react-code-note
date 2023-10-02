import * as React from "react";

//更新渲染
export default function FunctionComponent() {
    const [number, setNumber] = React.useState(0);
    return <button onClick={() => {
        setNumber(number + 1)
    }}>{number}</button>
}
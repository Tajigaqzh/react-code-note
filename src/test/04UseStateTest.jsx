import * as React from "react";

export default function FunctionComponent() {
    const [number, setNumber] = React.useState(0);
    return <button onClick={() => {
        setNumber(number+1)
    }}>{number}</button>
}

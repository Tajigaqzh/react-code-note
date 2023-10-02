import * as React from "react";

export default function FunctionComponent() {
    const [numbers, setNumbers] = React.useState(new Array(10).fill('A'));
    const divRef = React.useRef();
    React.useEffect(() => {
        setTimeout(() => {
            divRef.current.click();
        }, 10);
        setNumbers(numbers => numbers.map(item => item + 'B'))
    }, []);
    return (<div ref={divRef} onClick={() => {
        setNumbers(numbers => numbers.map(item => item + 'C'))
    }}>{numbers.map((number, index) => <span key={index}>{number}</span>)}</div>)
}
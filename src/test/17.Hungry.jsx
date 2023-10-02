import * as React from "react";

let counter = 0;
let timer;
let bCounter = 0;
let cCounter = 0;
export default function FunctionComponent() {
    const [numbers, setNumbers] = React.useState(new Array(100).fill('A'));
    const divRef = React.useRef();
    const updateB = (numbers) => new Array(100).fill(numbers[0] + 'B')
    updateB.id = 'updateB' + (bCounter++);
    const updateC = (numbers) => new Array(100).fill(numbers[0] + 'C')
    updateC.id = 'updateC' + (cCounter++);
    React.useEffect(() => {
        timer = setInterval(() => {
            console.log(divRef);
            divRef.current.click();
            if (counter++ === 0) {
                setNumbers(updateB)
            }
            divRef.current.click();
            if (counter++ > 10) {
                clearInterval(timer);
            }
        });
    }, []);
    return (<div ref={divRef} onClick={() => setNumbers(updateC)}>
        {numbers.map((number, index) => <span key={index}>{number}</span>)}</ div>)
}

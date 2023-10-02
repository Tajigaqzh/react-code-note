import * as React from "react";

//并发渲染
export default function FunctionComponent() {
    console.log('FunctionComponent');
      const [number, setNumber] = React.useState(0);
      React.useEffect(() => {
            setNumber(number => number + 1)
         }, []);
    return (<button onClick={() => setNumber(number + 1)}>{number}</button>)
}
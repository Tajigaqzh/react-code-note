import * as React from 'react';

export default function UseEffectTest() {

    const [number, setNumber] = React.useState(0);
    React.useEffect(() => {
        console.log('useEffect');
        // let timer = setInterval(() => setNumber(number => number + 1))
        return () => {
            // clearInterval(timer)
            console.log('useEffect return');
        }
    },[]);


    React.useEffect(() => {
        console.log('useEffect2');
        return () => {
            console.log('useEffect2 return');
        }
    })

    React.useEffect(() => {
        console.log('useEffect3');
        return () => {
            console.log('useEffect3 return');
        }
    })

    return (
        <button onClick={() => setNumber(number + 1)}>{number}</button>
    )
}
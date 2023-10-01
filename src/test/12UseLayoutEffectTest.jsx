import * as React from 'react';

export default function UseEffectTest() {

    const [number, setNumber] = React.useState(0);
    React.useEffect(() => {
        console.log('useEffect');
        return () => {
            console.log('useEffect return');
        }
    },[]);


    React.useLayoutEffect(() => {
        console.log('useLayoutEffect2');
        return () => {
            console.log('destroy useLayoutEffect2');
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
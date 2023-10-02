import * as React from "react";

const NameContext = React.createContext('');
const AgeContext = React.createContext(0);

function Child() {
    console.log('Child render')
    const name = React.useContext(NameContext);
    const age = React.useContext(AgeContext);
    return <button>{name + age}</button>
}

export default function UseContextTest() {
    const [name, setName] = React.useState('1');
    const [age, setAge] = React.useState(18);

    return (
        <div>
            <button onclick={() => setName(name + 'a')}>
                setName
            </button>
            <button onclick={() => setAge(age + 10)}>setAge</button>
            <NameContext.Provider value={name}>
                <AgeContext.Provider value={age}>
                    <Child/>
                </AgeContext.Provider>
            </NameContext.Provider>
        </div>)
}
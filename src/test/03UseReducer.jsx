import * as React from "react";


const reducer = (state, action) => {
	if (action.type === "add") return state + 1;
	return state;
};
export default function useReducerTest() {
    
    const [number, setNumber] = React.useReducer(reducer, 0);
    return (
        <button
            onClick={() => {
                setNumber({ type: "add" });
            }}
        >
            {number}
        </button>
    );
}

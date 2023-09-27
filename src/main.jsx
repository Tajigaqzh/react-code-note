import { createRoot } from "react-dom/client";
import * as React from "react";

// let element = (
//     <h1 id="container">
//         你好111
//         <span style={{ color: "red" }}>world
//         <p>111</p>
//         </span>
//         111
//     </h1>
// )
// function Fun1() {
//     return (
// 					<div>
// 						<h1>1111</h1>
// 						<h2>hello</h2>
// 						<span
// 							style={{ color: "red" }}
// 							onClick={() => {
// 								console.log("aaa");
// 							}}
// 						>
// 							{" "}
// 							world
// 						</span>
// 					</div>
// 				);
// }
// let element = <Fun1 />

const reducer = (state, action) => {
  if (action.type === "add") return state + 1;
  return state;
};
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(reducer, 0);
  return <button onClick={() => setNumber({ type: "add" })}>{number}</button>;
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById("root"));

root.render(element);

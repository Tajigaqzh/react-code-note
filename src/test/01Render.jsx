import { createRoot } from "react-dom/client";
import * as React from "react";
//渲染
let element = (
    <h1 id="container">
        你好111
        <span style={{ color: "red" }}>world
        <p>111</p>
        </span>
        111
    </h1>
)

export default function Render() {
return (
	<h1 id="container">
		你好111
		<span style={{ color: "red" }}>
			world
			<p>111</p>
		</span>
		111
	</h1>
);
}
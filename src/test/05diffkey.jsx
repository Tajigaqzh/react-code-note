import * as React from "react";

// diff,key相同复用
export default function FunctionComponent() {
	const [number, setNumber] = React.useState(0);
	return number === 0 ? (
		<div onClick={() => setNumber(number + 1)} key="title" id="title">
			title1
		</div>
	) : (
		<div
			onclick={() => {
				setNumber(number + 1);
			}}
			key="title"
			id="title2"
		>
			title2
		</div>
	);
}

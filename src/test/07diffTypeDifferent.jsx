import * as React from "react";

export default function FunctionComponent() {
	const [number, setNumber] = React.useState(0);
	return number === 0 ? (
		<div
			onClick={() => {
				setNumber(number + 1);
				console.log(222);
			}}
			key="title"
			id="title"
		>
			title1
		</div>
	) : (
		<p
			onclick={() => {
				setNumber(number + 1);
				console.log(111);
			}}
			key="title"
			id="title"
		>
			title2
		</p>
	);
}

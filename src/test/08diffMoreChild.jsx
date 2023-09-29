
import * as React from 'react';


export default function FunctionComponent() {
	const [number, setNumber] = React.useState(0);
	return number === 0 ? (
		<ul
			onClick={() => {
				setNumber(number + 1);
			}}
			key="uls"
		>
			<li key="A">A</li>
			<li key="B">B</li>
			<li key="C">C</li>
		</ul>
	) : (
		<ul
			onClick={() => {
				setNumber(number + 1);
			}}
			key="uls"
		>
			<li key="B">B</li>

		</ul>
	);
}
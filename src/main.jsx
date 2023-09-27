import { createRoot } from "react-dom/client";

let element = (
    <h1 id="container">
        你好111
        <span style={{ color: "red" }}>world
        <p>111</p>
        </span>
        111
    </h1>
)

const root = createRoot(document.getElementById("root"));

root.render(element);

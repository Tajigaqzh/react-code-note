export default function Event() {
    return (
        <div>
            <h1>1111</h1>
            <h2>hello</h2>
            <span
                style={{ color: "red" }}
                onClick={() => {
                    console.log("aaa");
                }}
            >

                world
            </span>
        </div>
    );
}

// function FunctionComponent() {
//     return (
//         <h1
//             onClick={() => console.log("父节点冒泡")}
//             onClickCapture={() => console.log("父节点捕获")}
//         >
//             hello
//             <span
//                 style={{color: "red"}}
//                 onClick={() => console.log("子节点冒泡")}
//                 onClickCapture={(e) => {
//                     console.log("子节点捕获")
//                 }}
//             >
//            world
//          </span>
//         </h1>
//     );
// }
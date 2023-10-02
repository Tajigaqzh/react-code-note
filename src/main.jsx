import { createRoot } from "react-dom/client";
import * as React from "react";


//渲染
import Render from "./test/01Render";

//事件
import Event from "./test/02Event";

//useReducer
import UseReducer from "./test/03UseReducer";

//useState
import UseStateTest from "./test/04UseStateTest";

// diff,key相同复用
import DiffKey from "./test/05diffkey";


// 单节点diff,key不同，类型相同，删旧创新
import DiffKeyDifferent from "./test/06diffKeyDifferent";

//单节点key相同，类型不同
import DiffTypeDifferent from "./test/07diffTypeDifferent";

//原来有多个子节点
import DiffMoreChild from "./test/08diffMoreChild";

//多节点比对
// 多个节点的数量和 key 相同，有的 type 不同，则更新属性，type 不同的删除老节点，删除新节点
import MoreDiffPart from "./test/09moreDiffPart";


//多个节点数量不同、key 不同
import MoreDiff from "./test/10moreDiff";

//useEffect
import UseEffectTest from "./test/11UseEffectTest";

//useLayoutEffect
import UseLayoutEffectTest from "./test/12UseLayoutEffectTest";

//任务调度
// import Scheduler from "./test/13Scheduler";

//更新渲染
// import FunctionComponent  from "./test/14UpdateRender.jsx";

//useRef
// import FunctionComponent  from "./test/16UseRef.jsx";

//饥饿问题
// import FunctionComponent from "./test/17.Hungry.jsx";

//useContext
import UseContextTest from "./test/18UseContext.jsx";

// let element = <Render />;
// let element = <Event />;
// let element = <UseReducer />;
// let element = <UseStateTest />;
// let element = <DiffKey/>
// let element = <DiffKeyDifferent/>
// let element = <DiffTypeDifferent/>
// let element = <DiffMoreChild/>
// let element = <MoreDiffPart/>
// let element = <MoreDiff/>
// let element = <UseEffectTest/>
// let element = <UseLayoutEffectTest/>

// let element = <Scheduler/>
// let element = <FunctionComponent/>

let element = <UseContextTest/>
const root = createRoot(document.getElementById("root"));

root.render(element);

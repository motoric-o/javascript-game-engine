// 2472041 - Rico Dharmawan

import { PhysicsEngine } from "../lib/engine/physicsEngine.js";
import { graphicsLib } from "../lib/graphics/graphicsLib.js";
import { GameObject } from "../lib/engine/object.js";

let canvas_handler = document.querySelector("#mycanvas");
let context = canvas_handler.getContext("2d", { willReadFrequently: true });

const GrafLib = new graphicsLib(context, canvas_handler);
const engine = new PhysicsEngine(1 / 60, GrafLib);

engine.start();

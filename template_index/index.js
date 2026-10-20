// 2472041 - Rico Dharmawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { createFillInfo } from "./lib/util/graphics.js";

const engine = new GameEngine(500, 500, 2);

engine.start();


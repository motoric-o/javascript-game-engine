// 2472041 - Rico Dharmawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { createFillInfo } from "./lib/util/graphics.js";

const engine = new GameEngine(1280, 720, 2);

engine.start();

const road = new GameObject()
    .setName('Road')
    .setVertices([
        Vector2(0, 600),
        Vector2(1280, 600)
    ])
    .setColor(Color(0, 0, 0))

const carBody = new GameObject()
    .setName('CarBody')
    .setVertices([
        Vector2(-150, -37),
        Vector2(-100, -37),
        Vector2(-75, -90),
        Vector2(75, -90),
        Vector2(100, -37),
        Vector2(150, -37),
        Vector2(150, 37),
        Vector2(-150, 37)
    ])
    .setColor(Color(0, 0, 0))
    .setFill(createFillInfo("BF", [Color(0, 100, 200), Color(0, 0, 0)], Vector2(0, 0)))
    .setPosition(Vector2(200, 500))
    .isActive(true);

const window = new GameObject()
    .setName('CarWindow')
    .setVertices([
        Vector2(-95, -37),
        Vector2(-70, -85),
        Vector2(70, -85),
        Vector2(95, -37),
    ])
    .setColor(Color(0, 0, 0))
    .setFill(createFillInfo("BF", [Color(100, 150, 250), Color(0, 0, 0)], Vector2(0, 0)))
    .setPosition(Vector2(200, 500))

carBody.addChild(window)
    
engine.addStaticObject(road, 0);
engine.addObject(carBody, 1);

// engine.addObject(window, 1);
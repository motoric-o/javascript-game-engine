// 2472041 - Rico Dharmawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { createFillInfo } from "./lib/util/graphics.js";
import { toRad } from "./lib/util/math.js";

const engine = new GameEngine(1280, 720, 4);

engine.start();

const road = new GameObject()
    .setName('Road')
    .setVertices([
        Vector2(0, 600),
        Vector2(1280, 600)
    ])
    .setColor(Color(0, 0, 0))
    .setLayer(0);

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
    .setPosition(Vector2(200, 525))
    .isActive(true)
    .setLayer(1);

const window = new GameObject()
    .setName('CarWindow')
    .setVertices([
        Vector2(-90, 24),
        Vector2(-70, -24),
        Vector2(70, -24),
        Vector2(90, 24),
    ])
    .setLocalPosition(Vector2(0, -60))
    .setColor(Color(0, 0, 0))
    .setFill(createFillInfo("BF", [Color(100, 150, 250), Color(0, 0, 0)], Vector2(0, 0)))
    .setLayer(1);

carBody.addChild(window)

const rearTire = new GameObject()
    .setName('rearTire')
    .setVertices(Vector2(0, 0))
    .setRadius(40)
    .setAngVelocity(5)
    .setColor(Color(0, 0, 0))
    .setLocalPosition(Vector2(-85, 35))
    .setFill(createFillInfo("BF", [Color(150, 150, 150), Color(0, 0, 0)], Vector2(0, 0)))
    .setLayer(2);

const frontTire = new GameObject()
    .setName('frontTire')
    .setVertices(Vector2(0, 0))
    .setRadius(40)
    .setAngVelocity(5)
    .setColor(Color(0, 0, 0))
    .setLocalPosition(Vector2(85, 35))
    .setFill(createFillInfo("BF", [Color(150, 150, 150), Color(0, 0, 0)], Vector2(0, 0)))
    .setLayer(2);

const rearRim = new GameObject()
    .setName('rearRim')
    .setVertices([
        Vector2(0, 0),
        Vector2(0, -20),
        Vector2(0, 20),
        Vector2(0, 0),
        Vector2(-20, 0),
        Vector2(20, 0)
    ])
    .setColor(Color(0, 0, 0))
    .setLayer(3)
    .setLocalPosition(Vector2(0, 0));

const frontRim = new GameObject()
    .setName('frontRim')
    .setVertices([
        Vector2(0, 0),
        Vector2(0, -20),
        Vector2(0, 20),
        Vector2(0, 0),
        Vector2(-20, 0),
        Vector2(20, 0),
    ])
    .setColor(Color(0, 0, 0))
    .setLayer(3)
    .setLocalPosition(Vector2(0, 0));

rearTire.addChild(rearRim);
frontTire.addChild(frontRim);

carBody.addChild(rearTire);
carBody.addChild(frontTire);
    
engine.addStaticObject(road);
engine.addObject(carBody);

// carBody.setAngVelocity(1)
// carBody.setScale(Vector2(2, 2))
// window.setAngVelocity();
// carBody.setVelocity(Vector2(25, 0));

// engine.addObject(window, 1);

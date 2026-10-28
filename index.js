// 2472042 - Gavin Malik Setiawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { toRad } from "../lib/util/math.js";
import { createFillInfo } from "./lib/util/graphics.js";


const engine = new GameEngine(500, 500, 2);

const circle = new GameObject()
    .setName("circle")
    .setPosition(Vector2(850, 360))
    .setRadius(20)
    .setColor(Color(0, 0, 255));

const polygon = new GameObject()
    .setName("polygon")
    .setPosition(Vector2(250, 250))
    .setVertices([
        Vector2(-60, -40),
        Vector2(50, -60),
        Vector2(70, 50),
        Vector2(-40, 60)
    ])
    .setColor(Color(0, 255, 0))
    .setAngVelocity(toRad(20));

circle.bindToUpdate((self) => {
    self.setPosition(engine.input.getMousePosition())
    if (engine.input.isMousePressed(0))
    {
        self.setColor(Color(255, 0, 0))
    }

    if (engine.input.isMouseReleased(0))
    {
        self.setColor(Color(0, 0, 255))
    }

    let delta = engine.input.getWheelDelta()
    if (delta !== 0)
    {
        self.setRadius(self.radius + delta/10)
    }

})

polygon.bindToUpdate((self) => {

    let moveSpeed = 5

    if (engine.input.isKeyDown("D"))
    {
        self.setPosition(Vector2(self.position.x + moveSpeed, self.position.y));
    }
    if (engine.input.isKeyDown("A"))
    {
        self.setPosition(Vector2(self.position.x - moveSpeed, self.position.y));
    }
    if (engine.input.isKeyDown("w"))
    {
        self.setPosition(Vector2(self.position.x, self.position.y - moveSpeed));
    }
    if (engine.input.isKeyDown("s")){
        self.setPosition(Vector2(self.position.x, self.position.y + moveSpeed));
    }
    if (engine.input.isKeyPressed(" "))
    {
        self.setPosition(Vector2(250,250));
    }


})

engine.addObject(circle);
engine.addObject(polygon)

engine.start();
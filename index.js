// 2472042 - Gavin Malik Setiawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { toRad } from "../lib/util/math.js";
import { createAsset, createFillInfo, getFrame } from "./lib/util/graphics.js";


const engine = new GameEngine(1280, 720, 2);

const circle = new GameObject()
    .setName("circle")
    .setPosition(Vector2(850, 360))
    .setRadius(20)
    .setColor(Color(0, 0, 255));

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


engine.addObject(circle);

engine.start();

const asset = await createAsset('./assets/player/player-red-sprite-sheet.png')
console.log(asset)

const test = new GameObject()
    .setName("test")
    .setSprite(asset, Vector2(17, 24))
    .setColor(Color(0, 0, 0))
    .setPosition(Vector2(640, 360))
    .setScale(Vector2(5, 5));

engine.addObject(test);

test.bindToUpdate((self) => {

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


let frame = 0;

setInterval(() => {
    test.sprite.setSequence([frame, 0])
    
    frame += 1;

    if (frame > 2) {
        frame = 0;
    }
}, 100);

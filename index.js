// 2472042 - Gavin Malik Setiawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { toRad } from "../lib/util/math.js";
import { createFillInfo } from "./lib/util/graphics.js";
import { toRad } from "./lib/util/math.js";
import { createAsset, createFillInfo, getFrame } from "./lib/util/graphics.js";


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
// const polygon = new GameObject()
//     .setName("polygon")
//     .setPosition(Vector2(450, 360))
//     .setVertices([
//         Vector2(-60, -40),
//         Vector2(50, -60),
//         Vector2(70, 50),
//         Vector2(-40, 60)
//     ])
//     .setColor(Color(0, 255, 0))
//     .setAngVelocity(toRad(20));

// const circle = new GameObject()
//     .setName("circle")
//     .setPosition(Vector2(850, 360))
//     .setRadius(70)
//     .setColor(Color(0, 0, 255));

// const contactPoint = new GameObject()
//     .setName("circle")
//     .setPosition(Vector2(-25, -25))
//     .setRadius(10)
//     .setLayer(1)
//     .setColor(Color(255, 0, 0))
//     .isActive(true)
//     .setFills([createFillInfo("BF", [Color(255, 0, 0), Color(255, 0, 0)], Vector2(0, 0))]);
    
// const follow = new GameObject()
//     .setName("follow")
//     .setPosition(Vector2(640, 360))
//     .setVertices([
//         Vector2(0, -45),
//         Vector2(40, 35),
//         Vector2(-40, 35)
//     ])
//     .addToCollisionBlacklist(contactPoint)
//     .setColor(Color(200, 200, 200));

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
// let mousePos = Vector2(640, 360);

// engine.mainCanvas.addEventListener("mousemove", (e) => {
//     mousePos.x = e.offsetX;
//     mousePos.y = e.offsetY;
// });

// window.addEventListener("wheel", (e) => {
//     follow.setRotation(follow.rotation + Math.sign(e.deltaY) * 0.15);
// });

// follow.bindToUpdate((self) => {
//     self.setPosition(mousePos);
    
//     const isHitPoly = self.checkCollision(polygon);
//     const isHitCircle = self.checkCollision(circle);

//     if (isHitPoly) {
//         polygon.setColor(Color(255, 0, 0));
//     } else {
//         polygon.setColor(Color(0, 255, 0));
//     }

//     if (isHitCircle) {
//         circle.setColor(Color(255, 0, 0));
//     } else {
//         circle.setColor(Color(0, 0, 255));
//     }

//     if (isHitPoly || isHitCircle) {
//         self.setColor(Color(255, 0, 0));
//     } else {
//         self.setColor(Color(200, 200, 200));
//     }
// });

// follow.bindOnCollision((self, hit) => {
//     const contact = self.getContactPoints(hit);
    
//     contactPoint.updatePosition(contact);
// });

// engine.addObject(polygon);
// engine.addObject(circle);
// engine.addObject(follow);
// engine.addObject(contactPoint);

engine.start();

const asset = await createAsset('./assets/player/player-red-sprite-sheet.png')
console.log(asset)

const test = new GameObject()
    .setName("test")
    .setSprite(asset, Vector2(17, 24))
    .setColor(Color(0, 0, 0))
    .setPosition(Vector2(640, 360))
    // .setAngVelocity(toRad(90));
    .setScale(Vector2(5, 5));

engine.addObject(test);

let frame = 0;

setInterval(() => {
    test.sprite.setSequence([frame, 0])
    
    frame += 1;

    if (frame > 9) {
        frame = 0;
        test.sprite.setFlipY()
    }
}, 100);

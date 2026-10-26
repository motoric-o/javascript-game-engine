// 2472041 - Rico Dharmawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { toRad } from "./lib/util/math.js";

const engine = new GameEngine(1280, 720, 2);

const polygon = new GameObject()
    .setName("polygon")
    .setPosition(Vector2(450, 360))
    .setVertices([
        Vector2(-60, -40),
        Vector2(50, -60),
        Vector2(70, 50),
        Vector2(-40, 60)
    ])
    .setColor(Color(0, 255, 0))
    .setAngVelocity(toRad(20));

const circle = new GameObject()
    .setName("circle")
    .setPosition(Vector2(850, 360))
    .setRadius(70)
    .setColor(Color(0, 0, 255));

const follow = new GameObject()
    .setName("follow")
    .setPosition(Vector2(640, 360))
    .setVertices([
        Vector2(0, -45),
        Vector2(40, 35),
        Vector2(-40, 35)
    ])
    .setColor(Color(200, 200, 200));


let mousePos = Vector2(640, 360);

engine.mainCanvas.addEventListener("mousemove", (e) => {
    mousePos.x = e.offsetX;
    mousePos.y = e.offsetY;
});

window.addEventListener("wheel", (e) => {
    follow.setRotation(follow.rotation + Math.sign(e.deltaY) * 0.15);
});

follow.bindToUpdate((self) => {
    self.setPosition(mousePos);

    const hitPoly = self.getCollision(polygon);
    const hitCircle = self.getCollision(circle);
    const isHitPoly = self.checkCollision(hitPoly);
    const isHitCircle = self.checkCollision(hitCircle);

    if (isHitPoly) {
        polygon.setColor(Color(255, 0, 0));
    } else {
        polygon.setColor(Color(0, 255, 0));
    }

    if (isHitCircle) {
        circle.setColor(Color(255, 0, 0));
    } else {
        circle.setColor(Color(0, 0, 255));
    }

    if (isHitPoly || isHitCircle) {
        self.setColor(Color(255, 0, 0));
    } else {
        self.setColor(Color(200, 200, 200));
    }
});

engine.addObject(polygon);
engine.addObject(circle);
engine.addObject(follow);

engine.start();

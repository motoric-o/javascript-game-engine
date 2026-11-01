// 2472042 - Gavin Malik Setiawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { toRad } from "../lib/util/math.js";
import { createAnimation, createAsset, createFillInfo, createShake, getFrame } from "./lib/util/graphics.js";


const engine = new GameEngine(1280, 720, 3);

engine.sound.loadSound("bgm1", "./assets/sound/map.wav")
engine.sound.loadSound("bgm2", "./assets/sound/battle.mp3")
engine.sound.loadSound("hit", "./assets/sound/tackleHit.wav")
engine.sound.loadSound("encounter", "./assets/sound/initBattle.wav")

let musicStarted = false

const circle = new GameObject()
    .setName("circle")
    .setPosition(Vector2(850, 360))
    .setRadius(20)
    .setUseCamera(true)
    .setLayer(2)
    .setColor(Color(0, 0, 255));



engine.addObject(circle);

engine.start();

const asset = await createAsset('./assets/player/player-red-sprite-sheet.png')
console.log(asset)

const test = new GameObject()
    .setName("test")
    .setSprite(asset, Vector2(17, 24))
    .setColor(Color(0, 0, 0))
    .setPosition(Vector2(0, 0))
    .setUseCamera(true)
    // .addToCollisionLayerBlacklist(2)
    .setScale(Vector2(5, 5));

const test2 = new GameObject()
    .setName("test")
    .setSprite(asset, Vector2(17, 24))
    .setColor(Color(0, 0, 0))
    .setPosition(Vector2(640, 360))
    .setLayer(1)
    .setScale(Vector2(5, 5));

engine.addObject(test);
engine.addObject(test2);

test.bindToUpdate((self) => {

    let x = 0;
    let y = 0;

    let moveSpeed = 400;

    if (engine.input.isKeyDown("D")) {
        x = 1;
    }
    if (engine.input.isKeyDown("A")) {
        x = -1;
    }
    if (engine.input.isKeyDown("w")) {
        y = -1;
    }
    if (engine.input.isKeyDown("s")) {
        y = 1;
    }
    if (engine.input.isKeyPressed(" ")) {
        self.setPosition(Vector2(250, 250));
        engine.sound.stopMusic()
        let sound = engine.sound.playSFX("encounter");

        if (sound != null) {
            sound.addEventListener("ended", () => {
                engine.sound.playMusic("bgm2")
            })
        }
    }

    self.setVelocity(Vector2(x * moveSpeed, y * moveSpeed));

    if (self.graphics.Transform.magnitude(self.velocity) == 0) {
        if (self.sprite.currentAnimation == "idle") {
            return;
        }
        self.sprite.setAnimation("idle");
    } else {
        if (self.sprite.currentAnimation == "run") {
            return;
        }
        self.sprite.setAnimation("run");
    }
})

const sequenceWalk = [0, 1, 2, 1, -1];
const sequenceIdle = [1, -1];

const run = createAnimation("run", sequenceWalk, "C", 10);
const idle = createAnimation("idle", sequenceIdle, "C", 60);

test.sprite.addAnimation(idle);
test.sprite.addAnimation(run);

engine.camera.setTarget(test);
engine.camera.setSmoothness(0.1);

engine.camera.setShake(createShake(Vector2(5, 5), 10))

test.bindOnCollision((self, hit) => {
    console.log(hit.name);
})

const cursor = new GameObject()
    .setColor(Color(0, 0, 0))
    .setVertices([
        Vector2(0, 0),
        Vector2(25, 10),
        Vector2(12, 12),
        Vector2(8, 25)
    ])
    .setLayer(2)
    .setFills([
        createFillInfo("BF", [Color(0, 255, 255), Color(0, 0, 0)], Vector2(5, 5))
    ]);

cursor.bindToUpdate((self) => {
    self.setPosition(engine.camera.screenToWorld(engine.input.getMousePosition()))
    if (engine.input.isMousePressed(0)) {
        self.setColor(Color(255, 0, 0))
        engine.sound.playSFX("hit")

        if (!musicStarted) {
            engine.sound.playMusic("bgm1")
            musicStarted = true
        }
    }

    if (engine.input.isMouseReleased(0)) {
        self.setColor(Color(0, 0, 0))
    }

    // let delta = engine.input.getWheelDelta()
    // if (delta !== 0) {
    //     self.setRadius(self.radius + delta / 10)
    // }

})
engine.addObject(cursor)

setInterval(() => {
    // console.log(test.sprite.sequence)
    // console.log(test.sprite.animations[test.sprite.currentAnimation].sequence[test.sprite.sequence])
}, 1 / 240);


// 2472041 - Rico Dharmawan
import GameObject from "./lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import { createFillInfo } from "./lib/util/graphics.js";
import { toRad } from "./lib/util/math.js";

const engine = new GameEngine(1280, 720, 2);
const waveDetail = 55;
const waveCount = 0.025;
const amplitude = 10;

engine.start();

function wave(self, delta, time) {
    const start = -engine.width / 2;
    const end = engine.width / 2;
    const gap = engine.width / waveDetail;

    let vertices = [];

    for (let x = start; x <= end; x+=gap) {
        let y = amplitude * Math.sin(waveCount * x - 2 * time) - 20;

        vertices.push(Vector2(x, y));
    }

    vertices.push(Vector2(end, 120))
    vertices.push(Vector2(start, 120))
    
    self.setVertices(vertices)
}

function raft_rotate(self, delta, time) {
    let rot = Math.atan(0.25 * Math.cos(waveCount * 300 - 2 * time));
    self.rotation = rot;
}

const ocean = new GameObject()
    .setName("ocean")
    .setVertices([
        Vector2(-640, -20),
        Vector2(640, -20)
    ])
    .setColor(Color(0, 0, 0))
    .setFills([
        createFillInfo("BF", [Color(200, 255, 255), Color(0, 0, 0)], Vector2(0, 20))
    ])
    .setLayer(0)
    .setPosition(Vector2(640, 600))
    .bindToUpdate(wave);

const raft = new GameObject()
    .setName("raft")
    .setVertices([
        Vector2(-150, -15),
        Vector2(150, -15),
        Vector2(150, 15),
        Vector2(-150, 15)
    ])
    .setColor(Color(0, 0, 0))
    .setFills([
        createFillInfo("BF", [Color(150, 100, 25), Color(0, 0, 0)], Vector2(0, 0))
    ])
    .setLayer(1)
    .bindToUpdate(raft_rotate)
    .setPosition(Vector2(640, 575));

const pole = new GameObject()
    .setName("pole")
    .setVertices([
        Vector2(-10, 125),
        Vector2(10, 125),
        Vector2(10, -125),
        Vector2(-10, -125)
    ])
    .setColor(Color(0, 0, 0))
    .setFills([
        createFillInfo("BF", [Color(100, 50, 30), Color(0, 0, 0)], Vector2(0, 0))
    ])
    .setLocalPosition(Vector2(0, -140))
    .setLayer(1);

const flag = new GameObject()
    .setName("flag")
    .setVertices([
        Vector2(-50, -20),
        Vector2(-50, 20),
        Vector2(50, 0)
    ])
    .setColor(Color(0, 0, 0))
    .setFills([
        createFillInfo("BF", [Color(255, 0, 0), Color(0, 0, 0)], Vector2(0, 0))
    ])
    .setLocalPosition(Vector2(60, -90))
    .setLayer(1);

pole.addChild(flag);
raft.addChild(pole);

engine.addObject(ocean);
engine.addObject(raft);
// 2472041 - Rico Dharmawan

import { PhysicsEngine } from "../lib/engine/physicsEngine.js";
import { graphicsLib } from "../lib/graphics/graphicsLib.js";
import { GameObject } from "../lib/engine/object.js";

let canvas_handler = document.querySelector("#mycanvas");
let context = canvas_handler.getContext("2d", { willReadFrequently: true });
let angle = 0;

const GrafLib = new graphicsLib(context, canvas_handler);
const engine = new PhysicsEngine(1 / 60, GrafLib);

const gun_center = GrafLib.getCentroid([
    GrafLib.Util.Vector2(30, 475),
    GrafLib.Util.Vector2(80, 475),
    GrafLib.Util.Vector2(80, 455),
    GrafLib.Util.Vector2(30, 455)
]);
const gun = new GameObject(GrafLib)
    .setName("Gun")
    .setVertices([
        GrafLib.Util.Vector2(-25, 10),
        GrafLib.Util.Vector2(25, 10),
        GrafLib.Util.Vector2(25, -10),
        GrafLib.Util.Vector2(-25, -10)
    ])
    .setPosition(gun_center)
    .setFill(GrafLib.Coloring.createFillInfo("BF", [GrafLib.Util.Color(150, 150, 150), GrafLib.Util.Color(0, 0, 0)], GrafLib.Util.Vector2(0, 0)));

engine.addObject(gun, 1);

engine.start();

function rotasi_fp(e) {
    let mouseX = e.offsetX;
    let mouseY = e.offsetY;

    const gun_anchor = gun.position;

    angle = Math.atan2(gun_anchor.y - mouseY, gun_anchor.x - mouseX) + Math.PI - (2 * Math.PI);

    gun.updateRotation(angle);
}

function ricochet(obj, delta) {
    const collision = obj.getCollision()
    const collided = obj.checkCollision(collision);
    if (collided) {
        let vx = obj.velocity.x;
        let vy = obj.velocity.y;
        
        if (collision.right || collision.left) {
            vx *= -1;
        }

        if (collision.top || collision.bottom) {
            vy *= -1;
        }

        if (obj.custom_attributes.ricochet_count < 2) {
            obj.setVelocity(GrafLib.Util.Vector2(vx, vy));
            obj.custom_attributes.ricochet_count += 1;
        } else {
            if (obj.custom_attributes.accumulated == 0) {
                obj.setVelocity(GrafLib.Util.Vector2(vx * 0.3, vy * 0.3));
                obj.custom_attributes.ricochet_count += 1;
                obj.custom_attributes.accumulated += delta;
            }
        }
    }

    if (obj.custom_attributes.ricochet_count > 2) {
        if (obj.custom_attributes.accumulated > 0.1) {
            obj.destroy();
        }

        obj.custom_attributes.accumulated += delta;
    }
}

function tembak(e) {
    let x = gun.position.x + 25 * Math.cos(angle);
    let y = gun.position.y + 25 * Math.sin(angle);

    let vx = 750 * Math.cos(angle);
    let vy = 750 * Math.sin(angle);

    const bullet = new GameObject(GrafLib)
        .setName("bullet")
        .setVertices([
            GrafLib.Util.Vector2(0, 0)
        ])
        .setRadius(5)
        .setColor(GrafLib.Util.Color(255, 0, 0))
        .setPosition(GrafLib.Util.Vector2(x, y))
        .setVelocity(GrafLib.Util.Vector2(vx, vy))
        .setFill(GrafLib.Coloring.createFillInfo("BF", [GrafLib.Util.Color(255, 0, 0), GrafLib.Util.Color(255, 0, 0)], GrafLib.Util.Vector2(0, 0)))
        .addAttribute("ricochet_count", 0)
        .addAttribute("accumulated", 0)
        .bindToUpdate(ricochet);

    engine.addDebris(bullet, 0, 10);
}

canvas_handler.addEventListener('mousemove', rotasi_fp);

canvas_handler.addEventListener('click', tembak);

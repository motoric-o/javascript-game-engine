// 2472041 - Rico Dharmawan
import GameObject from "../lib/engine/object.js";
import GameEngine from "./lib/engine/GameEngine.js";
import { Color, Vector2 } from "./lib/graphics/primitive/index.js";
import createFillInfo from "./lib/util/createFillInfo.js";

let angle = 0;

const engine = new GameEngine(500, 500, 2);

const gun = new GameObject()
    .setName("Gun")
    .setVertices([
        Vector2(-25, 10),
        Vector2(25, 10),
        Vector2(25, -10),
        Vector2(-25, -10)
    ])
    .setPosition(Vector2(55, 465))
    .setFill(createFillInfo("BF", [Color(150, 150, 150), Color(0, 0, 0)], Vector2(0, 0)));

engine.addObject(gun, 1);

engine.start();

// console.log(engine.Layer.getStack())

function rotasi_fp(e) {
    let mouseX = e.offsetX;
    let mouseY = e.offsetY;

    const gun_anchor = gun.position;

    angle = Math.atan2(gun_anchor.y - mouseY, gun_anchor.x - mouseX) + Math.PI - (2 * Math.PI);

    gun.updateRotation(angle);
}

// function ricochet(obj, delta) {
//     const collision = obj.getCollision()
//     const collided = obj.checkCollision(collision);
//     if (collided) {
//         let vx = obj.velocity.x;
//         let vy = obj.velocity.y;

//         if (collision.right || collision.left) {
//             vx *= -1;
//         }

//         if (collision.top || collision.bottom) {
//             vy *= -1;
//         }

//         if (obj.custom_attributes.ricochet_count < 2) {
//             obj.setVelocity(GrafLib.Util.Vector2(vx, vy));
//             obj.custom_attributes.ricochet_count += 1;
//         } else {
//             if (obj.custom_attributes.accumulated == 0) {
//                 obj.setVelocity(GrafLib.Util.Vector2(vx * 0.3, vy * 0.3));
//                 obj.custom_attributes.ricochet_count += 1;
//                 obj.custom_attributes.accumulated += delta;
//             }
//         }
//     }

//     if (obj.custom_attributes.ricochet_count > 2) {
//         if (obj.custom_attributes.accumulated > 0.1) {
//             obj.destroy();
//         }

//         obj.custom_attributes.accumulated += delta;
//     }
// }

// function tembak(e) {
//     let x = gun.position.x + 25 * Math.cos(angle);
//     let y = gun.position.y + 25 * Math.sin(angle);

//     let vx = 750 * Math.cos(angle);
//     let vy = 750 * Math.sin(angle);

//     const bullet = new GameObject(GrafLib)
//         .setName("bullet")
//         .setVertices([
//             GrafLib.Util.Vector2(0, 0)
//         ])
//         .setRadius(5)
//         .setColor(GrafLib.Util.Color(255, 0, 0))
//         .setPosition(GrafLib.Util.Vector2(x, y))
//         .setVelocity(GrafLib.Util.Vector2(vx, vy))
//         .setFill(GrafLib.Coloring.createFillInfo("BF", [GrafLib.Util.Color(255, 0, 0), GrafLib.Util.Color(255, 0, 0)], GrafLib.Util.Vector2(0, 0)))
//         .addAttribute("ricochet_count", 0)
//         .addAttribute("accumulated", 0)
//         .bindToUpdate(ricochet);

//     engine.addDebris(bullet, 0, 10);
// }

engine.mainCanvas.addEventListener('mousemove', rotasi_fp);

// canvas_handler.addEventListener('click', tembak);
/** AIGEN
 * prompt: can you generate me a new test scenario for the new features? (InputManager + onResize interactive playground)
 */
import * as THREE from "three";
import Game from "./engine/Game.js";
import GameScene from "./engine/GameObjects/Scene/GameScene.js";
import GameCamera from "./engine/GameObjects/3D/GameCamera.js";
import PhysicalObject from "./engine/GameObjects/3D/PhysicalObject.js";
import Debris from "./engine/GameObjects/3D/Debris.js";
import { Vector3, clamp } from "./engine/Util/Math.js";

const game = new Game({
    clearColor: 0x16162a,
    startScene: "input-test"
});
await game.init();

const camera = new GameCamera();
const scene = new GameScene("input-test", camera);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(8, 15, 10);
dirLight.castShadow = true;
scene.root.add(ambient, dirLight);

function createBox({ size = [1, 1, 1], pos = [0, 0, 0], color = 0x4cc9f0, restitution = 0.25, mass = 1, debrisTimeout = null }) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const obj = debrisTimeout != null ? new Debris(mesh, debrisTimeout) : new PhysicalObject(mesh);
    obj.setRestitution(restitution);
    obj.mass = mass;
    return obj;
}

// Static Floor
const floor = createBox({ size: [24, 0.5, 24], pos: [0, -0.25, 0], color: 0x2b2d42, restitution: 0.4 });
scene.addStaticObject(floor);

// Player Cube (non-tumbling character controller)
const player = createBox({ size: [1.0, 1.4, 1.0], pos: [0, 0.8, 3], color: 0x38bdf8, mass: 2.0, restitution: 0.05 })
    .setCanTumble(false)
    .setFriction(0.6);
scene.addObject(player);

let groundContacts = 0;
player.bindOnCollision((self, other, contact) => {
    if (contact.normal.y > 0.5) {
        groundContacts++;
    }
});
player.bindOnCollisionEnded((self, other) => {
    groundContacts = Math.max(0, groundContacts - 1);
});

// Interactive Crates to push, jump onto, or click-kick via NDC raycast
const crates = [];
const crateColors = [0xf59e0b, 0xef4444, 0x10b981, 0xa855f7, 0xec4899];
for (let i = 0; i < 5; i++) {
    const crate = createBox({
        size: [1.1, 1.1, 1.1],
        pos: [-3 + i * 1.5, 0.55 + (i % 2) * 1.2, -2.5],
        color: crateColors[i],
        mass: 1.2,
        restitution: 0.4
    });
    crates.push(crate);
    scene.addObject(crate);
}

// Orbit Camera State
let yaw = 0;
let pitch = 0.38;
let zoom = 10;
const raycaster = new THREE.Raycaster();

console.log(
    "[InputManager Test Controls]\n" +
    "  WASD         : Move player relative to camera\n" +
    "  Shift        : Sprint\n" +
    "  Space        : Jump\n" +
    "  Right-Drag   : Orbit camera (uses mouseDelta)\n" +
    "  L            : Toggle Pointer Lock (free mouse-look)\n" +
    "  Scroll Wheel : Zoom camera\n" +
    "  Left-Click   : NDC Raycast (kick crate or spawn Debris on floor)"
);

game.bindToUpdate((dt) => {
    const input = game.inputManager;

    // 1. Pointer Lock toggle ('L' key)
    if (input.isKeyPressed("l")) {
        if (input.isPointerLocked()) {
            input.unlockPointer();
            console.log("Pointer unlocked");
        } else {
            input.lockPointer();
            console.log("Pointer locked (press L or Esc to unlock)");
        }
    }

    // 2. Camera Orbit via mouseDelta (when Pointer Locked OR Right-Mouse held)
    if (input.isPointerLocked() || input.isMouseDown(2)) {
        const delta = input.getMouseDelta();
        yaw -= delta.x * 0.004;
        pitch = clamp(pitch + delta.y * 0.004, 0.08, 1.35);
    }

    // 3. Camera Zoom via wheelDelta
    const wheel = input.getWheelDelta();
    if (wheel !== 0) {
        zoom = clamp(zoom + wheel * 0.005, 4, 22);
    }

    // 4. WASD Movement + Shift Sprint
    const forward = Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const moveDir = Vector3(0, 0, 0);

    if (input.isKeyDown("w")) moveDir.add(forward);
    if (input.isKeyDown("s")) moveDir.sub(forward);
    if (input.isKeyDown("d")) moveDir.add(right);
    if (input.isKeyDown("a")) moveDir.sub(right);

    if (input.isKeyPressed("shift")) console.log("Sprint ON");
    if (input.isKeyReleased("shift")) console.log("Sprint OFF");

    const speed = input.isKeyDown("shift") ? 9.5 : 5.5;
    if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        player.velocity.x = moveDir.x * speed;
        player.velocity.z = moveDir.z * speed;
    } else {
        player.velocity.x *= Math.max(0, 1 - 10 * dt);
        player.velocity.z *= Math.max(0, 1 - 10 * dt);
    }

    // 5. Spacebar Jump (isKeyPressed)
    if (input.isKeyPressed(" ") && groundContacts > 0) {
        player.velocity.y = 7.5;
        console.log("Jump!");
    }

    // 6. Left-Click NDC Raycast (kick crate or spawn Debris at clicked floor point)
    if (input.isMousePressed(0)) {
        const ndc = input.isPointerLocked() ? new THREE.Vector2(0, 0) : input.getMouseNDC();
        raycaster.setFromCamera(ndc, camera.root);

        const targets = [floor.root, ...crates.map(c => c.root)];
        const hits = raycaster.intersectObjects(targets, false);

        if (hits.length > 0) {
            const hit = hits[0];
            const hitObj = hit.object.userData?.gameObject;

            if (hitObj && hitObj !== floor) {
                const kickDir = raycaster.ray.direction.clone().normalize();
                hitObj.velocity.addScaledVector(kickDir, 7.0);
                hitObj.velocity.y += 3.0;
                hitObj.angularVelocity.set(2, 3, -2);
                console.log("Kicked crate via NDC raycast!");
            } else {
                const p = hit.point;
                const spawned = createBox({
                    size: [0.65, 0.65, 0.65],
                    pos: [p.x, p.y + 3.0, p.z],
                    color: 0xfacc15,
                    mass: 1.0,
                    restitution: 0.55,
                    debrisTimeout: 5.0
                });
                spawned.angularVelocity.set(1.5, 2.0, 1.0);
                game.addObject(spawned);
                console.log(`Spawned Debris at (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) via NDC raycast`);
            }
        }
    }

    // 7. Position Orbit Camera around Player
    const target = player.root.position;
    camera.root.position.set(
        target.x + Math.sin(yaw) * Math.cos(pitch) * zoom,
        target.y + Math.sin(pitch) * zoom + 0.8,
        target.z + Math.cos(yaw) * Math.cos(pitch) * zoom
    );
    camera.lookAt(Vector3(target.x, target.y + 0.4, target.z));
});

game.sceneManager.addScene(scene);
game.start();

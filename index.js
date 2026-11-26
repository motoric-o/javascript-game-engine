/** AIGEN
 * prompt 1: make a branch to test these new features. Make a scenario like the current index.js, but now adjusted for the new version of the engine (Rapier3D, CharacterController child GameObject, GameCamera.raycast(), sensors, slopes/stairs)
 * prompt 2: Before committing, update index js to test these new features (EventManager, Environment, DebugManager)
 */
import * as THREE from "three";
import Game from "./engine/Game.js";
import GameScene from "./engine/GameObjects/Scene/GameScene.js";
import Environment from "./engine/GameObjects/Scene/Environment.js";
import GameCamera from "./engine/GameObjects/3D/GameCamera.js";
import PhysicalObject from "./engine/GameObjects/3D/PhysicalObject.js";
import CharacterController from "./engine/GameObjects/Physics/CharacterController.js";
import Debris from "./engine/GameObjects/3D/Debris.js";
import UIElement from "./engine/GameObjects/UI/UIElement.js";
import { Vector3, clamp } from "./engine/Util/Math.js";

const game = new Game({
    clearColor: 0x16162a,
    startScene: "rapier-test",
    debug: true
});
await game.init();

const camera = new GameCamera();

// Environment (Lighting + Fog + Background)
const env = new Environment()
    .setBackground(new THREE.Color(0x16162a))
    .setFog(0x16162a, 14, 42);

env.addAmbientLight(0x9ca3af, 0.45);
const sunLight = env.addDirectionalLight(0xfff1e0, 1.25, Vector3(10, 18, 12), {
    castShadow: true,
    mapSize: 2048,
    extent: 20
});
// Warm bonfire-style PointLight at the checkpoint sensor zone
env.addPointLight(0xff7b29, 3.0, Vector3(0, 1.4, -7), 12, 2, true);

// DebugManager helpers
game.Debug.addGrid(28, 28);
game.Debug.addAxes(3);
game.Debug.addShadowHelper(sunLight);

const scene = new GameScene("rapier-test", camera, env);

function createBox({ size = [1, 1, 1], pos = [0, 0, 0], rot = [0, 0, 0], color = 0x4cc9f0, restitution = 0.25, mass = 1, debrisTimeout = null }) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const obj = debrisTimeout != null ? new Debris(mesh, debrisTimeout) : new PhysicalObject(mesh);
    obj.setRestitution(restitution);
    obj.setMass(mass);
    return obj;
}

// Static Floor
const floor = createBox({ size: [28, 0.5, 28], pos: [0, -0.25, 0], color: 0x2b2d42, restitution: 0.3 });
scene.addStaticObject(floor);

// Stairs to test CharacterController auto-step
for (let i = 0; i < 5; i++) {
    const step = createBox({
        size: [4, 0.3, 1.0],
        pos: [-6, 0.15 + i * 0.3, -4 - i * 1.0],
        color: 0x475569
    });
    scene.addStaticObject(step);
}

// Ramp to test CharacterController slope climb & ground snap
const ramp = createBox({
    size: [4, 0.3, 7],
    pos: [6, 1.0, -5],
    rot: [0.32, 0, 0],
    color: 0x64748b
});
scene.addStaticObject(ramp);

/** AIMOD
 * prompt: the world doesn't have the checkpoint zone yet, can you add that so I can test it as well?
 */
// Sensor Trigger Zone (Souls-like Bonfire / Checkpoint Zone at z = -7)
const sensorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.6, 3),
    new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.45
    })
);
sensorMesh.position.set(0, 0.8, -7);

// Visual bonfire marker inside the checkpoint zone so it's easy to spot
const bonfireCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.1, 6),
    new THREE.MeshStandardMaterial({
        color: 0xff7b29,
        emissive: 0xff5500,
        emissiveIntensity: 1.5
    })
);
bonfireCore.position.set(0, -0.2, 0);
sensorMesh.add(bonfireCore);

const sensorZone = new PhysicalObject(sensorMesh).setCanCollide(false);
scene.addStaticObject(sensorZone);

// Player Capsule with Unity-style CharacterController child (auto-switches bodyType to "kinematicPosition")
const playerMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.0, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
);
playerMesh.position.set(0, 1.5, 4);
playerMesh.castShadow = true;
playerMesh.receiveShadow = true;

const player = new PhysicalObject(playerMesh)
    .setColliderShape("capsule", { halfHeight: 0.5, radius: 0.4 });

const playerCC = new CharacterController("PlayerCC")
    .setOffset(0.02)
    .setMaxSlopeClimbAngle(45 * Math.PI / 180)
    .setMinSlopeSlideAngle(30 * Math.PI / 180)
    .setAutoStep(0.4, 0.25, true)
    .setSnapToGround(0.35)
    .setApplyImpulsesToDynamicBodies(true);

player.addChild(playerCC);
scene.addObject(player);

/** AIGEN
 * prompt: I got one more feature to test, the UIManager and elements, that was my teammate's work and I just merged and wired it, generate codes to test the new UIManager and UIElement feature
 */
// UIManager & UIElement test (HUD, Bonfire Banner, Interactive Button)
const hudStatus = new UIElement("hudStatus", {
    tag: "div",
    text: "Crates Kicked: 0",
    interactive: false,
    style: {
        top: "12px",
        right: "14px",
        padding: "8px 12px",
        background: "rgba(15, 23, 42, 0.75)",
        color: "#f8fafc",
        fontFamily: "monospace",
        fontSize: "13px",
        borderRadius: "6px",
        border: "1px solid rgba(148, 163, 184, 0.3)"
    }
});

const bonfireBanner = new UIElement("bonfireBanner", {
    tag: "div",
    text: "BONFIRE ZONE ACTIVE",
    interactive: false,
    visible: false,
    style: {
        bottom: "48px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 24px",
        background: "rgba(0, 0, 0, 0.72)",
        color: "#facc15",
        fontFamily: "serif",
        fontSize: "20px",
        letterSpacing: "3px",
        borderTop: "1px solid #facc15",
        borderBottom: "1px solid #facc15"
    }
});

const debugToggleBtn = new UIElement("debugToggleBtn", {
    tag: "button",
    text: "Toggle Debug (H)",
    interactive: true,
    style: {
        bottom: "14px",
        right: "14px",
        padding: "8px 14px",
        background: "#1e293b",
        color: "#e2e8f0",
        fontFamily: "monospace",
        fontSize: "12px",
        border: "1px solid #475569",
        borderRadius: "6px",
        cursor: "pointer"
    }
})
    .bindClick(() => {
        game.Debug.toggle();
    })
    .bindHover((el) => {
        el.setStyle("background", "#334155");
    })
    .bindHoverEnd((el) => {
        el.setStyle("background", "#1e293b");
    });

game.UIManager
    .addElement(hudStatus)
    .addElement(bonfireBanner)
    .addElement(debugToggleBtn);

// EventManager listeners (test on / once / emit + UIManager updates)
let kickCount = 0;
game.Event.on("checkpoint:entered", () => {
    console.log("[EventManager] checkpoint:entered -> Bonfire zone active!");
    sensorMesh.material.color.setHex(0xfacc15);
    game.UIManager.show("bonfireBanner");
});
game.Event.on("checkpoint:exited", () => {
    console.log("[EventManager] checkpoint:exited -> Left bonfire zone.");
    sensorMesh.material.color.setHex(0x22c55e);
    game.UIManager.hide("bonfireBanner");
});
game.Event.once("checkpoint:firstVisit", () => {
    console.log("[EventManager.once] First time reaching the bonfire! (Will not fire again)");
});
game.Event.on("crate:kicked", (count) => {
    console.log(`[EventManager] crate:kicked -> Total kicks: ${count}`);
    hudStatus.setText(`Crates Kicked: ${count}`);
});

player.bindOnCollision((self, other) => {
    if (other === sensorZone) {
        game.Event.fire("checkpoint:entered");
        game.Event.fire("checkpoint:firstVisit");
    }
});
player.bindOnCollisionEnded((self, other) => {
    if (other === sensorZone) {
        game.Event.fire("checkpoint:exited");
    }
});

// Interactive Dynamic Crates (pushable by CharacterController or kickable via camera.raycast)
const crates = [];
const crateColors = [0xf59e0b, 0xef4444, 0x10b981, 0xa855f7, 0xec4899];
for (let i = 0; i < 5; i++) {
    const crate = createBox({
        size: [1.1, 1.1, 1.1],
        pos: [-3 + i * 1.5, 0.55 + (i % 2) * 1.2, -1.5],
        color: crateColors[i],
        mass: 1.2,
        restitution: 0.4
    });
    crates.push(crate);
    scene.addObject(crate);
}

// Orbit Camera & Custom Player Movement State
let yaw = 0;
let pitch = 0.38;
let zoom = 10;
let verticalVelocity = 0;
const GRAVITY = -22;
const JUMP_SPEED = 8.5;

console.log(
    "[Rapier3D + EventManager + Environment + DebugManager Test Controls]\n" +
    "  WASD         : Move capsule (custom CharacterController physics)\n" +
    "  Shift        : Sprint\n" +
    "  Space        : Jump (uses playerCC.grounded)\n" +
    "  Right-Drag   : Orbit camera\n" +
    "  L            : Toggle Pointer Lock\n" +
    "  H            : Toggle DebugManager (overlay, Rapier wireframes, grid/axes/shadow helpers)\n" +
    "  Scroll Wheel : Zoom camera\n" +
    "  Left-Click   : camera.raycast() (kick crate via applyImpulse + emit event, or spawn Debris)\n" +
    "  Try walking up the stairs (left), ramp (right), and lit bonfire sensor zone (back)!"
);

game.bindToUpdate((dt) => {
    const input = game.Input;

    // 0. DebugManager toggle ('H' key)
    if (input.isKeyPressed("h")) {
        game.Debug.toggle();
        console.log(`[DebugManager] enabled = ${game.Debug.enabled}`);
    }

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

    // 2. Camera Orbit via mouseDelta
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

    // 4. Custom CharacterController Movement (Option B: driven directly in game script)
    if (playerCC.controller && player.collider && player.rigidBody) {
        const forward = Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const moveDir = Vector3(0, 0, 0);

        if (input.isKeyDown("w")) moveDir.add(forward);
        if (input.isKeyDown("s")) moveDir.sub(forward);
        if (input.isKeyDown("d")) moveDir.add(right);
        if (input.isKeyDown("a")) moveDir.sub(right);

        const speed = input.isKeyDown("shift") ? 9.5 : 5.5;
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize().multiplyScalar(speed);
        }

        if (playerCC.grounded && verticalVelocity < 0) {
            verticalVelocity = -0.5; // small downward bias to keep ground snap engaged
        }

        if (input.isKeyPressed(" ") && playerCC.grounded) {
            verticalVelocity = JUMP_SPEED;
            console.log("Jump!");
        }

        verticalVelocity += GRAVITY * dt;

        const desiredTranslation = {
            x: moveDir.x * dt,
            y: verticalVelocity * dt,
            z: moveDir.z * dt
        };

        playerCC.controller.computeColliderMovement(player.collider, desiredTranslation, 8);
        const corrected = playerCC.controller.computedMovement();
        const pos = player.rigidBody.translation();
        player.setPosition(pos.x + corrected.x, pos.y + corrected.y, pos.z + corrected.z);
    }

    // 5. Left-Click camera.raycast() (kick crate via applyImpulse or spawn Debris)
    if (input.isMousePressed(0)) {
        const ndc = input.isPointerLocked() ? new THREE.Vector2(0, 0) : input.getMouseNDC();
        const hit = camera.raycast(ndc, 80, player);

        if (hit && hit.object) {
            if (crates.includes(hit.object)) {
                const kickDir = hit.point.clone().sub(camera.root.position).normalize();
                hit.object.applyImpulse(Vector3(kickDir.x * 9, 4.5, kickDir.z * 9));
                hit.object.setAngularVelocity(2, 3, -2);
                kickCount += 1;
                game.Event.fire("crate:kicked", kickCount);
            } else if (hit.object.static) {
                const p = hit.point;
                const spawned = createBox({
                    size: [0.65, 0.65, 0.65],
                    pos: [p.x, p.y + 3.0, p.z],
                    color: 0xfacc15,
                    mass: 1.0,
                    restitution: 0.55,
                    debrisTimeout: 5.0
                });
                spawned.setAngularVelocity(1.5, 2.0, 1.0);
                game.addObject(spawned);
                console.log(`Spawned Debris at (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) via camera.raycast()`);
            }
        }
    }

    // 6. Position Orbit Camera around Player
    const target = player.getPosition();
    camera.root.position.set(
        target.x + Math.sin(yaw) * Math.cos(pitch) * zoom,
        target.y + Math.sin(pitch) * zoom + 0.8,
        target.z + Math.cos(yaw) * Math.cos(pitch) * zoom
    );
    camera.lookAt(Vector3(target.x, target.y + 0.4, target.z));
});

game.Scene.addScene(scene);
game.start();

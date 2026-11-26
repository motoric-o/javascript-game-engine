/** AIGEN
 * prompt 1: oh smoke test would be best I agree, lets do that. For testing purposes I'll allow you to generate the codes as it's for testing purposes. 
 * Also name a good branch just for this one time smoke test, like a checkpoint kind of name
 * 
 * prompt 2: help me rewrite the index.js to test several different physics scenarios, like dynamic vs static, 
 * dynamic vs dynamic, angled bounce, etc. each separated by interval. You may edit directly in the files
 * 
 * prompt 3: alright update the scenarios to add new test scenarios for the new features
 * 
 * prompt 4: alright one more tumble scenario, make a dynamic vs dynamic object tumble!
 * 
 * prompt 5: generate 3 more scenarios to check if this code is fool proof
 * 
 * prompt 6: lets try generating a few more test scenarios to proove the fool proofness of the code. Also update index with the latest AIGEN prompts
 * 
 * prompt 7: try generate another few tests, I really want to see this code very-very solid and adjusted for a lot of scenarios.
 * 
 * prompt 8: remove/merge redundant scenarios (1+6, 7+11, and 12+14)
 * 
 * prompt 9: test tags blacklisting along with scenario 11
 */
import * as THREE from "three";
import Game from "./engine/Game.js";
import GameScene from "./engine/GameObjects/Scene/GameScene.js";
import GameCamera from "./engine/GameObjects/3D/GameCamera.js";
import PhysicalObject from "./engine/GameObjects/3D/PhysicalObject.js";
import Debris from "./engine/GameObjects/3D/Debris.js";
import AngularVelocity from "./engine/GameObjects/Physics/AngularVelocity.js";
import TargetPosition from "./engine/GameObjects/Physics/TargetPosition.js";
import { Vector3 } from "./engine/Util/Math.js";

const game = new Game({
    clearColor: 0x1a1a2e,
    startScene: "smoke-test"
});

const camera = new GameCamera();
camera.root.position.set(0, 5, 13);
camera.lookAt(Vector3(0, 1.5, 0));

const scene = new GameScene("smoke-test", camera);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(6, 12, 8);
dirLight.castShadow = true;
scene.root.add(ambient, dirLight);

// Helper to build a box PhysicalObject or Debris
function createBox({ size = [1, 1, 1], pos = [0, 0, 0], rot = [0, 0, 0], color = 0x4cc9f0, restitution = 0, mass = 1, debrisTimeout = null }) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const obj = debrisTimeout != null ? new Debris(mesh, debrisTimeout) : new PhysicalObject(mesh);
    obj.restitution = restitution;
    obj.mass = mass;
    return obj;
}

// Persistent static floor
const floor = createBox({ size: [16, 0.5, 12], pos: [0, -0.25, 0], color: 0x3a3a5c, restitution: 0.6 });
scene.addStaticObject(floor);

let scenarioObjects = [];

function clearScenario() {
    for (const obj of scenarioObjects) {
        obj.destroy();
    }
    scenarioObjects = [];
}

function spawnDynamic(obj) {
    scenarioObjects.push(obj);
    game.addObject(obj);
    return obj;
}

function spawnStatic(obj) {
    scenarioObjects.push(obj);
    game.addStaticObject(obj);
    return obj;
}

const scenarios = [
    {
        name: "1. Dynamic vs Static Tumble Bounce + Debris + AngularVelocity",
        duration: 5.5,
        run() {
            const box = createBox({ size: [1.2, 1.2, 1.2], pos: [1.5, 5.5, -2.5], rot: [0.35, 0.2, 0.55], color: 0x4cc9f0, restitution: 0.55 });
            box.angularVelocity.set(0.8, 1.2, 0.5);
            box.bindOnCollision((self, other, contact) => {
                console.log(`  -> Tumble impact at (${contact.point.x.toFixed(2)}, ${contact.point.y.toFixed(2)}, ${contact.point.z.toFixed(2)})`);
            });
            spawnDynamic(box);

            const spinner = createBox({ size: [0.7, 0.7, 0.7], pos: [-4.5, 3.5, -2], color: 0x818cf8 }).setUseGravity(false);
            spinner.addChild(new AngularVelocity("spin").setVelocity(Vector3(1.5, 2, 0.8)));
            spawnDynamic(spinner);

            const debris = createBox({ size: [0.6, 0.6, 0.6], pos: [2.5, 5, 0], color: 0xf72585, restitution: 0.5, debrisTimeout: 2.5 });
            debris.bindOnDestroy(() => console.log("  -> Debris auto-destroyed after 2.5s"));
            spawnDynamic(debris);
        }
    },
    {
        name: "2. Angled Static Ramp Bounce (Rotated OBB SAT)",
        duration: 5.0,
        run() {
            const ramp = createBox({ size: [7, 0.4, 4], pos: [-1, 2.2, 0], rot: [0, 0, -0.38], color: 0x7209b7, restitution: 0.7 });
            spawnStatic(ramp);

            const ballBox = createBox({ size: [0.9, 0.9, 0.9], pos: [-2.5, 6.5, 0], color: 0x4ade80, restitution: 0.75 });
            spawnDynamic(ballBox);
        }
    },
    {
        name: "3. Dynamic vs Dynamic Mass-Weighted Collision",
        duration: 5.0,
        run() {
            const heavy = createBox({ size: [1.5, 1.5, 1.5], pos: [-4, 0.75, 0], color: 0xf59e0b, mass: 5, restitution: 0.85 }).setUseGravity(false);
            heavy.velocity.set(4, 0, 0);
            spawnDynamic(heavy);

            const light = createBox({ size: [0.9, 0.9, 0.9], pos: [4, 0.45, 0], color: 0x38bdf8, mass: 1, restitution: 0.85 }).setUseGravity(true);
            light.velocity.set(-2.5, 0, 0);
            spawnDynamic(light);
        }
    },
    {
        name: "4. Dynamic Stack + TargetPosition Platform",
        duration: 5.0,
        run() {
            const bottom = createBox({ size: [1.4, 1.4, 1.4], pos: [0, 2.5, 0], color: 0xfb7185, mass: 3, restitution: 0.4 });
            const top = createBox({ size: [0.9, 0.9, 0.9], pos: [0.1, 6.0, 0], color: 0xa78bfa, mass: 1, restitution: 0.6 });
            spawnDynamic(bottom);
            spawnDynamic(top);

            const mover = createBox({ size: [2, 0.4, 2], pos: [-4, 3.5, -2], color: 0x2dd4bf }).setUseGravity(false);
            const target = new TargetPosition("glide").setTargetPosition(Vector3(4, 3.5, -2)).setDuration(3.5);
            mover.addChild(target);
            spawnDynamic(mover);
        }
    },
    {
        name: "5. Sensor Trigger (canCollide=false + onCollision / onCollisionEnded)",
        duration: 4.5,
        run() {
            const sensorMesh = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 2.5, 2.5),
                new THREE.MeshStandardMaterial({ color: 0xfacc15, transparent: true, opacity: 0.35 })
            );
            sensorMesh.position.set(0, 1.5, 0);
            const sensor = new PhysicalObject(sensorMesh).setCanCollide(false);
            spawnStatic(sensor);

            const traveler = createBox({ size: [0.9, 0.9, 0.9], pos: [-5, 1.5, 0], color: 0x38bdf8 }).setUseGravity(false);
            traveler.velocity.set(3.5, 0, 0);

            traveler.bindOnCollision((self, other) => {
                if (other === sensor) {
                    console.log("  -> Entered sensor trigger!");
                    self.root.material.color.setHex(0x4ade80);
                }
            });
            traveler.bindOnCollisionEnded((self, other) => {
                if (other === sensor) {
                    console.log("  -> Exited sensor trigger!");
                    self.root.material.color.setHex(0x38bdf8);
                }
            });

            spawnDynamic(traveler);
        }
    },
    {
        name: "6. Dynamic vs Dynamic Off-Center Pillar & Mid-Air Skewed Tumble",
        duration: 5.5,
        run() {
            // Foreground: off-center pillar knockdown
            const pillar = createBox({ size: [1.0, 2.2, 1.0], pos: [1.5, 1.1, 1.8], color: 0x34d399, mass: 2, restitution: 0.35 });
            spawnDynamic(pillar);

            const striker = createBox({ size: [0.9, 0.9, 0.9], pos: [-4.5, 2.1, 2.08], color: 0xf97316, mass: 1.5, restitution: 0.5 });
            striker.velocity.set(8.5, 1.5, 0);
            spawnDynamic(striker);

            // Background: mid-air 3D skewed edge/corner collision
            const boxA = createBox({ size: [1.1, 1.1, 1.1], pos: [-3.5, 3.8, -1.85], rot: [0.6, 0.5, 0.4], color: 0x38bdf8, mass: 1.5, restitution: 0.65 });
            boxA.velocity.set(5.5, 2.2, 0);
            spawnDynamic(boxA);

            const boxB = createBox({ size: [1.1, 1.1, 1.1], pos: [3.5, 3.8, -2.15], rot: [-0.5, 0.7, -0.3], color: 0xfb7185, mass: 1.5, restitution: 0.65 });
            boxB.velocity.set(-5.5, 2.2, 0);
            spawnDynamic(boxB);
        }
    },
    {
        name: "7. Domino Chain Reaction (Multi-Body Dynamic Cascade)",
        duration: 5.5,
        run() {
            const colors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6];
            for (let i = 0; i < 4; i++) {
                const domino = createBox({
                    size: [0.35, 2.0, 1.1],
                    pos: [-1.5 + i * 1.25, 1.0, 0],
                    color: colors[i],
                    mass: 1.2,
                    restitution: 0.25
                });
                spawnDynamic(domino);
            }

            const striker = createBox({ size: [0.7, 0.7, 0.7], pos: [-5.0, 1.65, 0], color: 0xe879f9, mass: 1.5, restitution: 0.3 });
            striker.velocity.set(7.5, 1.0, 0);
            spawnDynamic(striker);
        }
    },
    {
        name: "8. Ledge Overhang Tip-Off vs canTumble=false Comparison",
        duration: 5.0,
        run() {
            const ledgeA = createBox({ size: [3.5, 2.0, 2.0], pos: [-2.5, 1.0, -2.0], color: 0x475569 });
            const ledgeB = createBox({ size: [3.5, 2.0, 2.0], pos: [-2.5, 1.0,  2.0], color: 0x475569 });
            spawnStatic(ledgeA);
            spawnStatic(ledgeB);

            const tumbleBox = createBox({ size: [1.6, 0.9, 1.0], pos: [-0.55, 2.55, -2.0], color: 0x22d3ee, mass: 1.5, restitution: 0.3 }).setCanTumble(true);
            const lockedBox = createBox({ size: [1.6, 0.9, 1.0], pos: [-0.55, 2.55,  2.0], color: 0xfb923c, mass: 1.5, restitution: 0.3 }).setCanTumble(false);
            spawnDynamic(tumbleBox);
            spawnDynamic(lockedBox);
        }
    },
    {
        name: "9. 3-Box Pyramid Knockdown + Unstable Edge-Balance Recovery",
        duration: 5.5,
        run() {
            const baseL = createBox({ size: [1.1, 1.1, 1.1], pos: [1.0, 0.55, -0.75], color: 0x60a5fa, mass: 1.5, restitution: 0.25 });
            const baseR = createBox({ size: [1.1, 1.1, 1.1], pos: [1.0, 0.55,  0.75], color: 0x60a5fa, mass: 1.5, restitution: 0.25 });
            const cap   = createBox({ size: [1.0, 0.9, 2.2], pos: [1.0, 1.6,   0.0 ], color: 0xf43f5e, mass: 1.2, restitution: 0.25 });
            spawnDynamic(baseL);
            spawnDynamic(baseR);
            spawnDynamic(cap);

            const wrecker = createBox({ size: [1.0, 1.0, 1.0], pos: [-2.8, 1.5, 0.25], color: 0xfacc15, mass: 3.0, restitution: 0.4 });
            wrecker.velocity.set(9.5, 1.5, 0);
            spawnDynamic(wrecker);

            const edgeCube = createBox({ size: [1.0, 1.0, 1.0], pos: [-3.5, Math.SQRT1_2 + 0.01, 3.0], rot: [0, 0, 0.70], color: 0xa3e635, mass: 1.0, restitution: 0.3 });
            spawnDynamic(edgeCube);
        }
    },
    {
        name: "10. 5-High Vertical Tower with 10:1 Heavy Slab on Top",
        duration: 5.0,
        run() {
            const colors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6];
            for (let i = 0; i < 5; i++) {
                const block = createBox({
                    size: [1.0, 1.0, 1.0],
                    pos: [0, 0.5 + i * 1.0, 0],
                    color: colors[i],
                    mass: 1.0,
                    restitution: 0.1
                });
                spawnDynamic(block);
            }

            const heavyCap = createBox({
                size: [2.2, 0.45, 1.2],
                pos: [0, 5.8, 0],
                color: 0xf59e0b,
                mass: 10.0,
                restitution: 0.1
            });
            spawnDynamic(heavyCap);
        }
    },
    {
        name: "11. Pinball Walls + Object & Tag Collision Blacklist Ghosts",
        duration: 8.0,
        run() {
            const wallL = createBox({ size: [0.4, 2.4, 5.0], pos: [-3.2, 1.2, 0], rot: [0, 0.25, 0], color: 0x64748b, restitution: 0.8 }).setTag("wall");
            const wallR = createBox({ size: [0.4, 2.4, 5.0], pos: [ 3.2, 1.2, 0], rot: [0, -0.25, 0], color: 0x64748b, restitution: 0.8 }).setTag("wall");
            spawnStatic(wallL);
            spawnStatic(wallR);

            const pinball = createBox({ size: [0.8, 0.8, 0.8], pos: [0, 0.8, 1.5], color: 0x4ade80, mass: 1.0, restitution: 0.85 });
            pinball.velocity.set(8.5, 0.5, -1.2);
            spawnDynamic(pinball);

            // Purple ghost: blacklists walls by object reference
            const objGhostMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 0.8),
                new THREE.MeshStandardMaterial({ color: 0xc084fc, transparent: true, opacity: 0.5 })
            );
            objGhostMesh.position.set(-4.5, 1.2, -1.2);
            const objGhost = new PhysicalObject(objGhostMesh).setRestitution(0.5);
            objGhost.velocity.set(4.5, 0, 0);
            objGhost.collisionBlacklistObjects.push(wallL, wallR);
            spawnDynamic(objGhost);

            // Cyan ghost: blacklists walls by "wall" tag
            const tagGhostMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.5 })
            );
            tagGhostMesh.position.set(4.5, 1.2, 0.0);
            const tagGhost = new PhysicalObject(tagGhostMesh).setRestitution(0.5);
            tagGhost.velocity.set(-4.5, 0, 0);
            tagGhost.collisionBlacklistTags.push("wall");
            spawnDynamic(tagGhost);
        }
    },
    {
        name: "12. Friction Slope Test (Slippery μ=0.05 vs Sticky μ=0.85)",
        duration: 5.0,
        run() {
            const rampIce    = createBox({ size: [7.5, 0.35, 2.0], pos: [0, 1.8, -2.0], rot: [0, 0, -0.32], color: 0x38bdf8 });
            const rampRubber = createBox({ size: [7.5, 0.35, 2.0], pos: [0, 1.8,  2.0], rot: [0, 0, -0.32], color: 0x475569 });
            spawnStatic(rampIce);
            spawnStatic(rampRubber);

            const iceBox = createBox({ size: [1.0, 0.6, 1.0], pos: [-2.0, 3.05, -2.0], rot: [0, 0, -0.32], color: 0xe0f2fe, mass: 1.0, restitution: 0.05 }).setFriction(0.05);
            spawnDynamic(iceBox);

            const stickyBox = createBox({ size: [1.0, 0.6, 1.0], pos: [-2.0, 3.05, 2.0], rot: [0, 0, -0.32], color: 0xf43f5e, mass: 1.0, restitution: 0.05 }).setFriction(0.85);
            spawnDynamic(stickyBox);
        }
    },
    {
        name: "13. Seesaw Lever Fulcrum (Torque Launch)",
        duration: 5.0,
        run() {
            const fulcrum = createBox({ size: [0.45, 0.9, 1.4], pos: [0, 0.45, 0], color: 0x64748b });
            spawnStatic(fulcrum);

            const plank = createBox({ size: [5.4, 0.25, 1.2], pos: [0, 1.05, 0], color: 0xf59e0b, mass: 2.0, restitution: 0.2 });
            spawnDynamic(plank);

            const payload = createBox({ size: [0.7, 0.7, 0.7], pos: [-2.2, 1.55, 0], color: 0x38bdf8, mass: 0.6, restitution: 0.3 });
            spawnDynamic(payload);

            const weight = createBox({ size: [1.0, 1.0, 1.0], pos: [2.2, 4.8, 0], color: 0xef4444, mass: 4.5, restitution: 0.2 });
            spawnDynamic(weight);
        }
    },
    {
        name: "14. 12-Box Chaos Avalanche in Walled Arena",
        duration: 6.0,
        run() {
            const wallN = createBox({ size: [8.0, 1.6, 0.4], pos: [0, 0.8, -3.5], color: 0x475569 });
            const wallS = createBox({ size: [8.0, 1.6, 0.4], pos: [0, 0.8,  3.5], color: 0x475569 });
            const wallW = createBox({ size: [0.4, 1.6, 7.4], pos: [-4.0, 0.8, 0], color: 0x475569 });
            const wallE = createBox({ size: [0.4, 1.6, 7.4], pos: [ 4.0, 0.8, 0], color: 0x475569 });
            spawnStatic(wallN);
            spawnStatic(wallS);
            spawnStatic(wallW);
            spawnStatic(wallE);

            const palette = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];
            for (let i = 0; i < 12; i++) {
                const col = i % 3;
                const row = Math.floor(i / 3) % 2;
                const layer = Math.floor(i / 6);
                const s = 0.75 + (i % 3) * 0.15;
                const box = createBox({
                    size: [s, s, s],
                    pos: [-1.4 + col * 1.4 + (layer * 0.2), 2.2 + layer * 1.8 + (i % 3) * 0.3, -1.0 + row * 2.0],
                    rot: [0.2 * i, 0.35 * i, 0.15 * i],
                    color: palette[i % palette.length],
                    mass: 0.8 + (i % 4) * 0.5,
                    restitution: 0.35
                });
                spawnDynamic(box);
            }
        }
    }
];

let currentIndex = 0;
let elapsed = 0;

function startScenario(idx) {
    clearScenario();
    const s = scenarios[idx];
    console.log(`[Smoke Test] Starting: ${s.name}`);
    s.run();
}

game.bindToUpdate((dt) => {
    elapsed += dt;
    if (elapsed >= scenarios[currentIndex].duration) {
        elapsed = 0;
        currentIndex = (currentIndex + 1) % scenarios.length;
        // currentIndex = 10;
        startScenario(currentIndex);
    }
});

game.Scene.addScene(scene);
game.start();
startScenario(0);

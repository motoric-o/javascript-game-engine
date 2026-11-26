// USER
import * as THREE from "three";
import Physics from "./Core/Physics.js";
import Debris from "./GameObjects/3D/Debris.js";
import SceneManager from "./Core/SceneManager.js";
import InputManager from "./Core/InputManager.js";
import EventManager from "./Core/EventManager.js";
import DebugManager from "./Core/DebugManager.js";
import UIManager from "./Core/UIManager.js";
import SaveManager from "./Core/SaveManager.js";

export default class Game {
    constructor(params) {
        this.defaultSettings = {
            container: document.body,
            width: window.innerWidth,
            height: window.innerHeight,

            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            shadowMap: true,
            shadowMapType: THREE.PCFShadowMap,
            clearColor: 0x000000,

            tickRate: 1/60,
            maxDt: 0.25,

            startScene: null,

            savePrefix: "game_",

            debug: false
        }

        this.settings = { ...this.defaultSettings, ...params };

        this.renderer = new THREE.WebGLRenderer({ antialias: this.settings.antialias });
        this.renderer.setSize(this.settings.width, this.settings.height);
        this.renderer.setPixelRatio(this.settings.pixelRatio);
        this.renderer.setClearColor(this.settings.clearColor);
        this.renderer.shadowMap.enabled = this.settings.shadowMap;
        this.renderer.shadowMap.type = this.settings.shadowMapType;
        this.settings.container.appendChild(this.renderer.domElement);

        this.Scene = new SceneManager();
        this.Input = new InputManager(this.renderer.domElement);
        this.Physics = new Physics();
        this.Event = new EventManager();
        this.Debug = new DebugManager(this.settings.debug);
        this.Saves = new SaveManager(this.settings.savePrefix);
        this.UIManager = new UIManager();
        this.camera = null;
        
        this.clock = 0;
        this.previous = 0;
        this.accumulated = 0;
        
        this.state = "";
        this.isRunning = false;
        this.animationFrameId = null;
        
        this.dynamicObjects = [];
        this.staticObjects = [];
        
        this.stepped = [];
        
        window.addEventListener("resize", () => this.onResize());
    }

    async init() {
        await this.Physics.init();
    }

    start() {
        if (!this.Physics.isReady) {
            console.error("ERROR: Physics engine is not initialized. Call await game.init() before calling game.start().");
            return;
        }

        if (this.settings.startScene != null && this.Scene.currentScene == null) {
            this.Scene.enterScene(this.settings.startScene, this);
        }

        if (this.Scene.currentScene == null) {
            console.error("ERROR: No scenes are set to start.");
            return;
        }

        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.clock = 0;
        this.previous = performance.now();
        this.accumulated = 0;
        
        this.tick(this.previous);
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    tick(timestamp) {
        if (!this.isRunning || !this.Scene.currentScene || !this.camera) {
            return;
        }

        let delta = Math.min((timestamp - this.previous) / 1000, this.settings.maxDt);
        this.previous = timestamp;

        this.accumulated += delta;

        while (this.accumulated >= this.settings.tickRate) {
            // Check if object is destroyed and update objects
            for (let i = this.dynamicObjects.length - 1; i >= 0; i--) {
                const object = this.dynamicObjects[i];

                if (object instanceof Debris) {
                    if (object.accumulated >= object.timeout && !object.destroyed) {
                        object.destroy();
                    } else {
                        object.accumulated += this.settings.tickRate;
                    }
                }

                if (object.destroyed) {
                    this.Physics.unregisterBody(object);
                    this.dynamicObjects.splice(i, 1);
                    this.Scene.currentScene.root.remove(object.root);
                }

                for (let bind of object.stepped) {
                    bind(object, this.settings.tickRate);
                }
            }

            for (let i = this.staticObjects.length - 1; i >= 0; i--) {
                const object = this.staticObjects[i];

                if (object instanceof Debris) {
                    if (object.accumulated >= object.timeout && !object.destroyed) {
                        object.destroy();
                    } else {
                        object.accumulated += this.settings.tickRate;
                    }
                }

                if (object.destroyed) {
                    this.Physics.unregisterBody(object);
                    this.staticObjects.splice(i, 1);
                    this.Scene.currentScene.root.remove(object.root);
                }
            }

            for (let bind of this.stepped) {
                bind(this.settings.tickRate, this.clock);
            }

            this.Physics.update(this.settings.tickRate, this.dynamicObjects, this.staticObjects);

            /** AIMOD
             * prompt: lets modify the recursive children for game class first before committing, don't forget the AIMOD tag
             */
            for (let object of this.dynamicObjects) {
                this.stepObjectTree(object, this.settings.tickRate);
            }

            // USER
            this.Input.update();

            this.accumulated -= this.settings.tickRate;
            this.clock += this.settings.tickRate;
        }

        this.Debug.update(delta, this);

        this.renderer.render(this.Scene.currentScene.root, this.camera.root)

        this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));

    }

    /** AIMOD
     * prompt: lets modify the recursive children for game class first before committing, don't forget the AIMOD tag
     */
    stepObjectTree(obj, dt) {
        if (!obj || obj.destroyed || !obj.enabled) {
            return;
        }

        if (obj.stepped?.length > 0) {
            for (let bind of obj.stepped) {
                bind(obj, dt);
            }
        }

        if (obj.children?.length > 0) {
            for (let child of obj.children) {
                this.stepObjectTree(child, dt);
            }
        }
    }

    // USER
    setState(state) {
        this.state = state;
    }

    /** AIMOD
     * prompt: migrate physics engine to Rapier3D (register bodies on addObject / addStaticObject)
     */
    addObject(obj) {
        obj.setStatic(false);
        this.dynamicObjects.push(obj);

        if (this.Scene.currentScene != null && obj.root?.isObject3D) {
            this.Scene.currentScene.root.add(obj.root);
        }

        if (this.Physics.isReady) {
            this.Physics.registerBody(obj);
        }

        for (let bind of obj.onSpawn) {
            bind(obj);
        }
    }

    addStaticObject(obj) {
        obj.setStatic(true);
        this.staticObjects.push(obj);

        if (this.Scene.currentScene != null && obj.root?.isObject3D) {
            this.Scene.currentScene.root.add(obj.root);
        }

        if (this.Physics.isReady) {
            this.Physics.registerBody(obj);
        }

        for (let bind of obj.onSpawn) {
            bind(obj);
        }
    }

    // USER

    bindToUpdate(func) {
        this.stepped.push(func);
    }

    unbindFromUpdate(func) {
        const idx = this.stepped.indexOf(func);
        if (idx != -1) {
            this.stepped.splice(idx, 1);
        }
    }

    onResize() {
        let width = this.settings.container.clientWidth;
        let height = this.settings.container.clientHeight;

        if (this.settings.container == document.body) {
            width = window.innerWidth;
            height = window.innerHeight;
        }

        this.settings.width = width;
        this.settings.height = height;

        this.renderer.setSize(this.settings.width, this.settings.height);
        this.camera?.onResize(width, height);
    }
}
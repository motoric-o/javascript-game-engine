// USER
import * as THREE from "three";
import Physics from "./Core/Physics.js";
import Debris from "./GameObjects/3D/Debris.js";
import SceneManager from "./Core/SceneManager.js";
import InputManager from "./Core/InputManager.js";

export default class Game {
    constructor(params) {
        this.defaultSettings = {
            container: document.body,
            width: window.innerWidth,
            height: window.innerHeight,

            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            shadowMap: true,
            shadowMapType: THREE.VSMShadowMap,
            clearColor: 0x000000,

            tickRate: 1/60,
            maxDt: 0.25,

            startScene: null,

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

        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager(this.renderer.domElement);
        this.physics = new Physics();
        this.camera = null;
        this.uiManager = null;
        
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

    start() {
        if (this.settings.startScene != null && this.sceneManager.currentScene == null) {
            this.sceneManager.enterScene(this.settings.startScene, this);
        }

        if (this.sceneManager.currentScene == null) {
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
        if (!this.isRunning || !this.sceneManager.currentScene || !this.camera) {
            return;
        }

        let delta = Math.min((timestamp - this.previous) / 1000, this.settings.maxDt);
        this.previous = timestamp;

        this.accumulated += delta;

        while (this.accumulated >= this.settings.tickRate) {
            // Check if object is destroyed
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
                    this.dynamicObjects.splice(i, 1);
                    this.sceneManager.currentScene.root.remove(object.root);
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
                    this.staticObjects.splice(i, 1);
                    this.sceneManager.currentScene.root.remove(object.root);
                }
            }

            this.physics.update(this.settings.tickRate, this.dynamicObjects, this.staticObjects);

            for (let bind of this.stepped) {
                bind(this.settings.tickRate, this.clock);
            }

            this.inputManager.update();

            this.accumulated -= this.settings.tickRate;
            this.clock += this.settings.tickRate;
        }

        this.renderer.render(this.sceneManager.currentScene.root, this.camera.root)

        this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));

    }

    setState(state) {
        this.state = state;
    }

    addObject(obj) {
        obj.setStatic(false);
        this.dynamicObjects.push(obj); 

        if (this.sceneManager.currentScene != null && obj.root?.isObject3D) {
            this.sceneManager.currentScene.root.add(obj.root);
        }

        for (let bind of obj.onSpawn) {
            bind(obj);
        }
    }

    addStaticObject(obj) {
        obj.setStatic(true);
        this.staticObjects.push(obj);

        if (this.sceneManager.currentScene != null && obj.root?.isObject3D) {
            this.sceneManager.currentScene.root.add(obj.root);
        }

        for (let bind of obj.onSpawn) {
            bind(obj);
        }
    }

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
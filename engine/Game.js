// USER
import * as THREE from "three";
import Physics from "./Core/Physics.js";

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

        this.sceneManager = null;
        this.inputManager = null;
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
        if (!this.isRunning) {
            return;
        }

        let delta = Math.min((timestamp - this.previous) / 1000, this.settings.maxDt);
        this.previous = timestamp;

        this.accumulated += delta;

        while (this.accumulated >= this.settings.tickRate) {
            this.physics.update(this.settings.tickRate, this.dynamicObjects, this.staticObjects);

            for (let bind of this.stepped) {
                bind(this.settings.tickRate, this.clock);
            }

            this.accumulated -= this.settings.tickRate;
            this.clock += this.settings.tickRate;
        }

        // rendering updates go here
        // this.renderer.render(this.sceneManager.currentScene, this.camera.cameraObject)

        this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));

    }

    setState(state) {
        this.state = state;
    }

    addObject(obj) {

    }

    addStaticObject(obj) {

    }

    removeObject(obj) {

    }

    removeStaticObject(obj) {

    }

    bindToUpdate(func) {
        this.stepped.push(func);
    }

    unbindFromUpdate(func) {
        const idx = this.stepped.indexOf(func);
        this.stepped.splice(idx, 1);
    }

    onResize() {
        this.settings.width = this.settings.container.clientWidth;
        this.settings.height = this.settings.container.clientHeight;

        this.renderer.setSize(this.settings.width, this.settings.height);
        // camera onResize
    }
}
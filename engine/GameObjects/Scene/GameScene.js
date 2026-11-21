import * as THREE from "three";
import GameCamera from "../3D/GameCamera.js";

export default class GameScene {
    constructor(name, camera) {
        this.name = name;

        this.root = new THREE.Scene();
        this.camera = camera || new GameCamera();

        
        this.data = new Map();
        
        this.dynamicObjects = [];
        this.staticObjects = [];
        
        this.onEnter = [];
        this.stepped = [];
        this.onExit = [];
        
        this.addObject(this.camera);
    }

    setCamera(camera) {
        this.camera.destroy();
        this.camera = camera;
        this.addObject(this.camera);

        return this;
    }

    addObject(obj) {
        obj.setStatic(false);
        this.dynamicObjects.push(obj);

        if (obj.root?.isObject3D) {
            this.root.add(obj.root);
        }
    }

    addStaticObject(obj) {
        obj.setStatic(true);
        this.staticObjects.push(obj);

        if (obj.root?.isObject3D) {
            this.root.add(obj.root);
        }
    }

    bindOnEnter(fn) {
        this.onEnter.push(fn);
        return this;
    }

    unbindOnEnter(fn) {
        const idx = this.onEnter.indexOf(fn);
        if (idx != -1) {
            this.onEnter.splice(idx, 1);
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

    bindOnExit(fn) {
        this.onExit.push(fn);
        return this;
    }

    unbindOnExit(fn) {
        const idx = this.onExit.indexOf(fn);
        if (idx != -1) {
            this.onExit.splice(idx, 1);
        }
    }
}
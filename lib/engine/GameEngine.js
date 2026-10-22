import Debris from "./debris.js";
import Layer from "./layer.js";
import PhysicsEngine from "./physicsEngine.js";

export default class GameEngine {
    constructor(width, height, layer_count = 2, tickRate = 1/60) {
        this.height = height;
        this.width = width;
        this.mainCanvas = null;
        this.Layer = new Layer(layer_count, width, height);
        this.Debris = new Debris();
        this.physics = new PhysicsEngine(tickRate, this.Layer, this.Debris)
        this.mainCanvas = document.querySelector(`#layer-${this.Layer.getStack().length-1}`)
    }

    addDebris(obj, timeout) {
        this.addObject(obj);
        this.Debris.addObject(obj, timeout);
    }

    addChild(children) {
        for (let child of children) {
            child.setGraphics(this.Layer.graphics[child.layer]);
            this.Layer.addObject(child);
            if (child.children) {
                this.addChild(child.children);
            }
        }
    }

    addObject(obj) {
        this.physics.objects.push(obj);
        const layer = obj.layer;
        this.Layer.addObject(obj, layer);
        obj.setGraphics(this.Layer.graphics[layer]);
        if (obj.children) {
            this.addChild(obj.children)
        }
    }

    addStaticObject(obj) {
        this.Layer.addObject(obj);
        const layer = obj.layer;
        obj.setGraphics(this.Layer.graphics[layer]);
    }

    getTime() {
        return this.physics.time;
    }
    
    start() {
        this.physics.start();
    }

    stop() {
        this.physics.stop();
    }
}

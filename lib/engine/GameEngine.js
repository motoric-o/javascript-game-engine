import GraphicsLib from "../graphics/graphicsLib.js";
import Debris from "./debris.js";
import Layer from "./layer.js";
import PhysicsEngine from "./physicsEngine.js";

export default class GameEngine {
    constructor(width, height, layer_count = 2, tickRate = 1/60) {
        this.height = height;
        this.width = width;
        this.mainCanvas = null;
        this.Layer = new Layer();
        this.Debris = new Debris();
        
        this.physics = new PhysicsEngine(tickRate, [], this.Layer, this.Debris)

        for (let i = 0; i < layer_count; i++) {
            const canvas = document.createElement("canvas");
            canvas.height = this.height;
            canvas.width = this.width;
            canvas.className = "canvas";
            canvas.id = `layer-${i}`;

            document.body.querySelector('.centered').appendChild(canvas)
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            this.physics.addGraphics(new GraphicsLib(ctx, canvas));
        }

        this.mainCanvas = document.querySelector(`#layer-${this.Layer.getStack().length-1}`)
    }

    addDebris(obj, layer = 0, timeout) {
        this.addObject(obj, layer);
        this.Debris.addObject(obj, timeout);
    }

    addObject(obj, layer = 0) {
        this.physics.objects.push(obj);
        this.Layer.addObject(obj, layer);
        obj.setId(layer, this.Layer.getLayerObjectCount(layer));
        obj.setGraphics(this.physics.graphics[layer]);
    }

    addStaticObject(obj, layer) {
        this.Layer.addObject(obj, layer);
        obj.setId(layer);
    }
    
    start() {
        this.physics.start();
    }

    stop() {
        this.physics.stop();
    }
}
import { Debris } from "./debris.js";
import { Layer } from "./layer.js";

export class PhysicsEngine {
    constructor(tickRate = 1/60, graphics) {
        this.isRunning = false;
        this.previous = 0;
        this.accumulation = 0;
        this.tickRate = tickRate;
        this.animationFrameId = null;
        this.objects = [];
        this.graphics = graphics;
        this.layer = new Layer();
        this.debris = new Debris();
    }

    start() {
        if (this.isRunning) { return }

        this.isRunning = true;
        this.previous = performance.now();
        this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));
    }

    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }

    tick(timestamp) {
        let delta = (timestamp - this.previous) / 1000;
        this.previous = timestamp;
        
        if (delta > 0.25) { delta = 0.25 };

        this.accumulation += delta;

        while (this.accumulation >= this.tickRate) {
            this.update(this.tickRate);
            this.accumulation -= this.tickRate;
        }

        this.render();

        if (this.isRunning) {
            this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));
        }
    }

    update() {
        this.debris.update(this.tickRate);
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const object = this.objects[i];
            if (object.destroyed) {
                const index = this.layer.parseId(object.id);
                this.layer.remove(index[0], index[1]);
                this.objects.splice(i, 1);
            } else {
                object.update(this.tickRate);
            }
        }
    }

    render() {
        if (!this.graphics) return;

        this.graphics.refreshScreen();
        
        for (let layer of this.layer.getStack()) {
            for (let obj of layer) {
                if (obj) {
                    obj.draw();
                }
            }
        }

        this.graphics.putImageData();
    }

    addObject(obj, layer = 0) {
        this.objects.push(obj);
        this.layer.addObject(obj, layer);
        obj.setId(layer, this.layer.getLayerObjectCount(layer));
    }

    addDebris(obj, layer = 0, timeout) {
        this.addObject(obj, layer);
        this.debris.addObject(obj, timeout);
    }

    addStaticObject(obj, layer) {
        this.layer.addObject(obj, layer);
        obj.setId(layer);
    }
}
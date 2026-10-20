export default class PhysicsEngine {
    constructor(tickRate = 1/60, graphics, layer, debris) {
        this.isRunning = false;
        this.previous = 0;
        this.accumulation = 0;
        this.tickRate = tickRate;
        this.animationFrameId = null;
        this.objects = [];
        this.graphics = graphics;
        this.layer = layer;
        this.debris = debris;
    }

    start() {
        if (this.isRunning) { return }

        console.log("PHYSICS ENGINE: START")

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
                i--;
            } else {
                object.update(this.tickRate);
            }
        }
    }

    render() {
        if (!this.graphics) return;

        for (let i = this.graphics.length - 1; i >= 0; i--) {
            this.graphics[i].refreshScreen();
            
            const layer = this.layer.getStack();

            for (let obj of layer[i]) {
                obj.draw();
            }
    
            this.graphics[i].putImageData();
        }

    }

    addGraphics(graphic) {
        this.graphics.push(graphic);
    }
}
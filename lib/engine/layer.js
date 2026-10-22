import GraphicsLib from "../graphics/graphicsLib.js";

export default class Layer {
    constructor(layers = 2, width, height) {
        this.layerStack = [];
        this.layerCount = [];
        this.graphics = [];
        this.height = height;
        this.width = width;

        for (let i = 0; i < layers; i++) {
            this.layerStack.push([]);
            this.layerCount.push(0);

            const canvas = document.createElement("canvas");
            canvas.height = this.height;
            canvas.width = this.width;
            canvas.className = "canvas";
            canvas.id = `layer-${i}`;

            document.body.querySelector('#canvasDiv').appendChild(canvas);
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            this.graphics.push(new GraphicsLib(ctx, canvas));
        }
    }

    getStack() {
        return this.layerStack;
    }

    newLayer() {
        this.layerStack.push([]);
        this.layerCount.push(0);

        const canvas = document.createElement("canvas");
        canvas.height = this.height;
        canvas.width = this.width;
        canvas.className = "canvas";
        canvas.id = `layer-${this.layerStack.length - 1}`;

        document.body.querySelector('.centered').appendChild(canvas);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        this.graphics.push(new GraphicsLib(ctx, canvas))
    }

    addObject(item) {
        const layer = item.layer;

        while (layer >= this.layerStack.length) {
            this.newLayer();
        }

        this.layerStack[layer].push(item);
        item.setId(layer, this.layerCount[layer]);
        this.layerCount[layer] += 1;
    }

    remove(layer, index) {
        this.layerStack[layer].splice(index, 1);
        this.layerCount[layer] -= 1;

        for (let i = 0; i < this.layerStack[layer].length; i++) {
            this.layerStack[layer][i].setId(layer, i);
        }
    }

    getLayerObjectCount(layer) {
        return this.layerCount[layer];
    }

    parseId(id) {
        const split = id.split("-");
        return [parseInt(split[0]), parseInt(split[1])];
    }
}

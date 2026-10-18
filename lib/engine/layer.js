import { layerStack } from "./stacks/layerStack.js";

export class Layer {
    constructor() {
        this.layerStack = layerStack;
        this.layerCount = this.layerStack.length;
    }

    getStack() {
        return this.layerStack;
    }

    newLayer() {
        this.layersStack.push([]);
        this.layerCount++;
    }

    addObject(item, layer) {
        if (layer > this.layerCount-1) {
            this.newLayer();
        }

        for (let i = 0; i < this.layerStack[layer].length; i++) {
            if (this.layerStack[layer][i] == null) {
                this.layerStack[layer][i] = item;
                return;
            }
        }
        
        this.layerStack[layer].push(item);
    }

    remove(layer, index) {
        this.layerStack[layer][index] = null;
    }

    getLayerObjectCount(layer) {
        let count = 0;
        
        for (let i = 0; i < this.layerStack[layer].length; i++) {
            if (this.layerStack[layer][i]) {
                count++;
            }
        }

        return count;
    }

    parseId(id) {
        return [parseInt(id.substring(0, 1)), parseInt(id.substring(2, 3))-1];
    }
}
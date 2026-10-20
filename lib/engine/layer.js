export default class Layer {
    constructor() {
        this.layerStack = [[], []];
        this.layerCount = [0, 0];
    }

    getStack() {
        return this.layerStack;
    }

    newLayer() {
        this.layerStack.push([]);
        this.layerCount.push(0);
        this.layerCount++;
    }

    addObject(item, layer) {
        if (layer > this.layerCount-1) {
            this.newLayer();
        }

        this.layerStack[layer].push(item);
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
        return [parseInt(id.substring(0, 1)), parseInt(id.substring(2, 3))-1];
    }
}
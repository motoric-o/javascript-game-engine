export default class Layer {
    constructor(layers = 2) {
        this.layerStack = [];
        this.layerCount = [];

        for (let i = 0; i < layers; i++) {
            this.layerStack.push([]);
            this.layerCount.push(0);
        }
    }

    getStack() {
        return this.layerStack;
    }

    newLayer() {
        this.layerStack.push([]);
        this.layerCount.push(0);
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
        return [parseInt(id.substring(0, 1)), parseInt(id.substring(2, 3))-1];
    }
}

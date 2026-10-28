import { Vector2 } from "../graphics/primitive";


export default class Blit {
    constructor(asset, height, width) {
        this.height = height;
        this.width = width;

        this.flipX = false;
        this.flipY = false;
        this.scale = Vector2(1, 1);
        this.alpha = 255;
    }

    importOptions(options) {
        for (let [key, value] of Object.entries(options)) {
            this[key] = value;
        }

        return this;
    }
}
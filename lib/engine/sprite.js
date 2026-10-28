import { Vector2 } from "../graphics/primitive/index.js";
import { getFrame } from "../util/graphics.js";


export default class Sprite {
    constructor(asset, frame) {
        this.asset = asset;
        this.frame = frame || getFrame(0, 0, asset.width, asset.height);

        this.width = frame.width;
        this.height = frame.height;

        this.sequence = [0, 0];

        this.flipX = false;
        this.flipY = false;
        this.scale = Vector2(1, 1);
        this.alpha = 255;
    }

    setSequence(seq) {
        this.sequence = seq;

        const frame = this.getFrameFromSequence();

        this.setFrame(frame);

        return this;
    }

    setFrame(frame) {
        this.frame = frame;
        return this;
    }

    getFrameFromSequence() {
        const x = this.sequence[0] * this.width;
        const y = this.sequence[1] * this.height;
        
        return getFrame(x, y, this.width, this.height);
    }

    importOptions(options) {
        for (let [key, value] of Object.entries(options)) {
            this[key] = value;
        }

        return this;
    }
}
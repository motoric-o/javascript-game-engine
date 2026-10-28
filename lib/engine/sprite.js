import { Vector2 } from "../graphics/primitive/index.js";
import { getFrame } from "../util/graphics.js";
import { clamp } from "../util/math.js";
import MatrixClass from "../util/matrix.js";

const matrix = MatrixClass;

export default class Sprite {
    constructor(asset, frame, graphics) {

        this.asset = asset;
        this.frame = frame || getFrame(0, 0, asset.width, asset.height);

        this.width = frame.width;
        this.height = frame.height;

        this.sequence = [0, 0];

        this.flipX = false;
        this.flipY = false;
        this.alpha = 255;
        
        if (graphics) {
            this.graphics = graphics;
            this.image_data = graphics.image_data;
        }
    }

    setGraphics(graphics) {
        this.graphics = graphics;
        this.image_data = graphics.image_data;
    }

    setFlipX(state) {
        if (state) {
            this.flipX = state;
        } else {
            this.flipX = !this.flipX;
        }
    }

    setFlipY(state) {
        if (state) {
            this.flipY = state;
        } else {
            this.flipY = !this.flipY;
        }
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

    draw(asset, frame, vertices, transformation) {
        if (!this.graphics) {
            return;
        }

        const inverted = matrix.invert3x3(transformation);

        const a = inverted[0][0];
        const b = inverted[1][0];
        const c = inverted[0][1];
        const d = inverted[1][1];

        const tx = inverted[0][2];
        const ty = inverted[1][2];

        let minX = clamp(Math.round(vertices[0].x), 0, this.graphics.width - 1);
        let maxX = clamp(Math.round(vertices[0].x), 0, this.graphics.width - 1);
        let minY = clamp(Math.round(vertices[0].y), 0, this.graphics.height - 1);
        let maxY = clamp(Math.round(vertices[0].y), 0, this.graphics.height - 1);

        for (let vertex of vertices) {
            if (vertex.x < minX) {
                minX = clamp(Math.floor(vertex.x), 0, this.graphics.width - 1);
            }

            if (vertex.x > maxX) {
                maxX = clamp(Math.ceil(vertex.x), 0, this.graphics.width - 1);
            }

            if (vertex.y < minY) {
                minY = clamp(Math.floor(vertex.y), 0, this.graphics.height - 1);
            }

            if (vertex.y > maxY) {
                maxY = clamp(Math.ceil(vertex.y), 0, this.graphics.height - 1);
            }
        }

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                let isInside = false;

                for (let i = 0; i < vertices.length; i++) {
                    const v1 = vertices[i];
                    const v2 = vertices[(i + 1) % vertices.length];

                    if ((v1.y >= y && v2.y <= y) || (v1.y <= y && v2.y >= y)) {
                        const intersect = v1.x + ((y - v1.y) / (v2.y - v1.y)) * (v2.x - v1.x);
                        if (intersect > x) {
                            isInside = !isInside;
                        }
                    }
                }

                if (!isInside) {
                    continue;
                }

                const u = a * x + c * y + tx;
                const v = b * x + d * y + ty;

                let uframe = Math.round(u + frame.width / 2);
                let vframe = Math.round(v + frame.height / 2);

                if (this.flipX) {
                    uframe = (frame.width - 1) - uframe;
                }

                if (this.flipY) {
                    vframe = (frame.height - 1) - vframe;
                }

                if (uframe < 0 || uframe >= frame.width) {
                    continue;
                }

                if (vframe < 0 || vframe >= frame.height) {
                    continue;
                }

                const sheetX = frame.x + uframe;
                const sheetY = frame.y + vframe;

                const srcIdx = 4 * (sheetX + sheetY * asset.width);
                const thisIdx = 4 * (x + y * this.graphics.width);

                if (asset.data[srcIdx + 3] > 0) {
                    this.image_data.data[thisIdx] = asset.data[srcIdx];
                    this.image_data.data[thisIdx + 1] = asset.data[srcIdx + 1];
                    this.image_data.data[thisIdx + 2] = asset.data[srcIdx + 2];
                    this.image_data.data[thisIdx + 3] = asset.data[srcIdx + 3];

                    if (this.alpha < 255) {
                        this.image_data.data[thisIdx + 3] = this.alpha;
                    }
                }
            }
        }
    }
}
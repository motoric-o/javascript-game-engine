import { Vector2 } from "../graphics/primitive/index.js";
import { createShake } from "../util/graphics.js";
import MatrixClass from "../util/matrix.js";

const matrix = MatrixClass;

export default class Camera {
    constructor(width, height, graphics) {
        this.position = Vector2(0, 0);
        this.rotation = 0;
        this.zoom = 1.0;
        this.viewport = Vector2(width, height);
        this.target = null;
        this.smoothness = 0;
        this.shake = createShake();
        this.bounds = this.getBounds();
    }

    setTarget(target) {
        this.target = target;
        return this;
    }

    setZoom(zoom) {
        this.zoom = zoom;
        return this;
    }

    setSmoothness(smoothness) {
        this.smoothness = smoothness;
        return this;
    }

    setShake(shake) {
        this.shake = shake;
        return this;
    }

    update(deltaTime) {
        if (this.target) {
            this.position.x += (this.target.position.x - this.position.x) * this.smoothness;
            this.position.y += (this.target.position.y - this.position.y) * this.smoothness;
        }

        this.bounds = this.getBounds();

        if (this.shake.timer > 0) {
            this.shake.timer -= deltaTime;

            const offsetX = Math.random() * this.shake.intensity.x * 2 - this.shake.intensity.x;
            const offsetY = Math.random() * this.shake.intensity.y * 2 - this.shake.intensity.y;

            this.shake.offset = Vector2(offsetX, offsetY);
        } else {
            this.shake.offset = Vector2(0, 0);
        }
    }

    getBounds() {
        return {
            minX: this.position.x - this.viewport.x / 2,
            maxX: this.position.x + this.viewport.x / 2,
            minY: this.position.y - this.viewport.y / 2,
            maxY: this.position.y + this.viewport.y / 2
        }
    }

    getViewMatrix() {
        const T1 = matrix.create_translation(-(this.position.x + this.shake.offset.x), -(this.position.y + this.shake.offset.y));
        const R = matrix.create_rotation(-this.rotation);
        const S = matrix.create_scale(this.zoom, this.zoom);

        const T2 = matrix.create_translation(this.viewport.x / 2, this.viewport.y / 2);

        const transformed1 = matrix.multiply(S, matrix.multiply(R, T1));

        return matrix.multiply(T2, transformed1);
    }

    worldToScreen(point) {
        const viewMatrix = this.getViewMatrix();

        const x = viewMatrix[0][0] * point.x + viewMatrix[0][1] * point.y + viewMatrix[0][2];
        const y = viewMatrix[1][0] * point.x + viewMatrix[1][1] * point.y + viewMatrix[1][2];

        return Vector2(x, y);
    }

    screenToWorld(point) {
        const worldMatrix = matrix.invert3x3(this.getViewMatrix());
        
        const x = worldMatrix[0][0] * point.x + worldMatrix[0][1] * point.y + worldMatrix[0][2];
        const y = worldMatrix[1][0] * point.x + worldMatrix[1][1] * point.y + worldMatrix[1][2];

        return Vector2(x, y);
    }
}
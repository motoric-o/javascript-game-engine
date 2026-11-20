import * as THREE from "three";
import Object from "../Object.js";

export default class GameCamera extends Object {
    constructor(aspect = 16/9, fov = 70, near = 0.1, far = 1000) {
        const root = new THREE.PerspectiveCamera(fov, aspect, near, far);
        super(root);

        this.usePhysics = true;
        this.useGravity = false;
        this.canCollide = false;
    }

    setFov(fov) {
        this.root.fov = fov;
        this.root.updateProjectionMatrix();

        return this;
    }

    setViewDistances(near, far) {
        this.root.near = near;
        this.root.far = far;

        this.root.updateProjectionMatrix();

        return this;
    }

    onResize(width, height) {
        this.root.aspect = width/height;

        this.root.updateProjectionMatrix();
    }

    lookAt(target) {
        this.root.lookAt(target);
    }
}
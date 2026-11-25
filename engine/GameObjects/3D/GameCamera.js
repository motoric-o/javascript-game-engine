// USER
import * as THREE from "three";
import PhysicalObject from "./PhysicalObject.js";
/** AIGEN
 * prompt: move raycastFromCamera into GameCamera with setPhysics()
 */
import { Raycaster } from "../../Util/index.js";

// USER
export default class GameCamera extends PhysicalObject {
    constructor(aspect = 16/9, fov = 70, near = 0.1, far = 1000) {
        const root = new THREE.PerspectiveCamera(fov, aspect, near, far);
        super(root);

        this.canCollide = false;

        /** AIGEN
         * prompt: move raycastFromCamera into GameCamera with setPhysics()
         */
        this.physics = null;
        this.raycaster = Raycaster();
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

    // USER
    lookAt(target) {
        this.root.lookAt(target);
    }

    /** AIGEN
     * prompt: add setPhysics() and raycast() to GameCamera so camera raycasting can be called directly from the camera object
     */
    setPhysics(physics) {
        this.physics = physics;
        return this;
    }

    raycast(ndc, maxDistance = 100, excludeObj = null) {
        if (!this.physics || !this.physics.isReady) {
            return null;
        }

        this.root.updateMatrixWorld();
        this.raycaster.setFromCamera(ndc, this.root);
        return this.physics.raycast(
            this.raycaster.ray.origin,
            this.raycaster.ray.direction,
            maxDistance,
            excludeObj
        );
    }
}
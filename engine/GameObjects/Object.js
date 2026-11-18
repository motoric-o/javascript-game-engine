import { Vector3 } from "../Util/Math.js";
import AngularVelocity from "./AngularVelocity.js";
import GameObject from "./GameObject.js";
import TargetAngle from "./TargetAngle.js";
import TargetPosition from "./TargetPosition.js";
import Velocity from "./Velocity.js";

export default class Object extends GameObject {
    constructor(root) {
        super();

        this.root = root;
        
        this.velocity = Vector3(0, 0, 0);
        this.velocities = [];
        this.angularVelocity = Vector3(0, 0, 0);
        this.angularVelocities = [];
        this.targetPosition = null;
        this.targetAngle = null;

        this.hitbox = null;
        this.useHitbox = false;
        this.canCollide = true;
        this.collisionBlacklistObjects = [];
        this.collisionBlacklistTags = [];

        // Collision Event Binds
        this.onCollision = [];
        this.onCollisionEnded = [];

        this.usePhysics = true;
        this.useGravity = true;

        this.attributes = {};
    }

    addChild(obj) {
        if (!obj instanceof GameObject || root == null) {
            console.error("ERROR: Child must be a Game Object!");
            return this;
        }

        this.root.add(obj);
        this.children.push(obj);

        if (obj instanceof Velocity) {
            this.velocities.push(obj);
        }

        if (obj instanceof AngularVelocity) {
            this.angularVelocities.push(obj);
        }

        if (obj instanceof TargetPosition) {
            this.targetPosition = obj;
        }

        if (obj instanceof TargetAngle) {
            this.targetAngle = obj;
        }
        
        return this;
    }

    removeChild(obj) {
        this.root.remove(obj);
        const idx = this.children.indexOf(obj);
        this.children.splice(idx, 1);

        if (this.velocities.includes(obj)) {
            const index = this.velocities.indexOf(obj);
            this.velocities.splice(index, 1);
        }

        if (this.angularVelocities.includes(obj)) {
            const index = this.angularVelocities.indexOf(obj);
            this.angularVelocities.splice(index, 1);
        }

        if (obj instanceof TargetPosition) {
            this.targetPosition = null;
        }

        if (obj instanceof TargetAngle) {
            this.targetAngle = null;
        }
    }

    bindOnCollision(fn) {
        if (this.static) {
            console.error("ERROR: Update binds are not supported for static objects!")
            return this;
        }
        this.onCollision.push(fn);
        return this;
    }

    unbindOnCollision(fn) {
        const idx = this.onCollision.indexOf(fn);
        this.onCollision.splice(idx, 1);
    }

    bindOnCollisionEnded(fn) {
        if (this.static) {
            console.error("ERROR: Update binds are not supported for static objects!")
            return this;
        }
        this.onCollisionEnded.push(fn);
        return this;
    }

    unbindOnCollisionEnded(fn) {
        const idx = this.onCollisionEnded.indexOf(fn);
        this.onCollisionEnded.splice(idx, 1);
    }
}
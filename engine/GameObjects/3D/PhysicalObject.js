import { Vector3 } from "../../Util/Math.js";
import AngularVelocity from "../Physics/AngularVelocity.js";
import GameObject from "../GameObject.js";
import TargetAngle from "../Physics/TargetAngle.js";
import TargetPosition from "../Physics/TargetPosition.js";
import Velocity from "../Physics/Velocity.js";

export default class PhysicalObject extends GameObject {
    constructor(root) {
        super();

        this.root = root;

        if (this.root?.userData) {
            this.root.userData.gameObject = this;
        }

        this.mass = 1;
        this.restitution = 0;
        this.friction = 0.5;
        this.angularDamping = 0.8;
        this.rollingResistance = 0.05;

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
        this.canTumble = true;
    }

    addChild(obj) {
        if (!(obj instanceof GameObject) || this.root == null) {
            console.error("ERROR: Child must be a Game Object!");
            return this;
        }

        if (obj.root?.isObject3D) {
            this.root.add(obj.root);
        }

        this.children.push(obj);
        obj.parent = this;

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
        if (obj.root?.isObject3D) {
            this.root.remove(obj.root);
        }

        const idx = this.children.indexOf(obj);
        if (idx != -1) {
            this.children.splice(idx, 1);
        }

        if (this.velocities.includes(obj)) {
            const index = this.velocities.indexOf(obj);
            if (index != -1) {
                this.velocities.splice(index, 1);
            }
        }

        if (this.angularVelocities.includes(obj)) {
            const index = this.angularVelocities.indexOf(obj);
            if (index != -1) {
                this.angularVelocities.splice(index, 1);
            }
        }

        if (obj instanceof TargetPosition) {
            this.targetPosition = null;
        }

        if (obj instanceof TargetAngle) {
            this.targetAngle = null;
        }
    }

    setMass(mass) {
        this.mass = mass;
        return this;
    }

    setRestitution(restitution) {
        this.restitution = restitution;
        return this;
    }

    setFriction(friction) {
        this.friction = friction;
        return this;
    }

    setAngularDamping(damping) {
        this.angularDamping = damping;
        return this;
    }

    setRollingResistance(resistance) {
        this.rollingResistance = resistance;
        return this;
    }

    setCanCollide(canCollide) {
        this.canCollide = canCollide;
        return this;
    }

    setCanTumble(canTumble) {
        this.canTumble = canTumble;
        return this;
    }

    setHitbox(obj) {
        this.hitbox = obj;
        return this;
    }

    setUseHitbox(useHitbox) {
        this.useHitbox = useHitbox;
        return this;
    }

    setUsePhysics(usePhysics) {
        this.usePhysics = usePhysics;
        return this;
    }

    setUseGravity(useGravity) {
        this.useGravity = useGravity;
        if (useGravity) {
            this.usePhysics = useGravity;
        }
        return this;
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
        if (idx != -1) {
            this.onCollision.splice(idx, 1);
        }
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
        if (idx != -1) {
            this.onCollisionEnded.splice(idx, 1);
        }
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        for (let bind of this.onDestroy) {
            bind(this);
        }

        if (this.children.length > 0) {
            for (let child of this.children) {
                child.destroy();
            }
        }

        this.onCollision = [];
        this.onCollisionEnded = [];
    }
}
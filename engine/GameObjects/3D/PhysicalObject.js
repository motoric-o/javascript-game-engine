import { Vector3 } from "../../Util/Math.js";
import AngularVelocity from "../Physics/AngularVelocity.js";
import CharacterController from "../Physics/CharacterController.js";
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
        this.linearDamping = 0;
        this.angularDamping = 0.8;
        this.rollingResistance = 0.05;

        /** AIGEN
         * prompt: migrate physics engine to Rapier3D (handles & body/collider configuration) + make CharacterController a child GameObject of PhysicalObject
         */
        this.rigidBody = null;
        this.collider = null;
        this.characterController = null;
        this.bodyType = "dynamic"; // "dynamic" | "fixed" | "kinematicPosition" | "kinematicVelocity"
        this.colliderShape = "box"; // "box" | "sphere" | "capsule" | "trimesh" | "convexHull"
        this.colliderParams = null;

        // USER
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

        /** AIMOD
         * prompt: make CharacterController a child GameObject of PhysicalObject and auto-switch bodyType from dynamic to kinematicPosition
         */
        if (obj instanceof CharacterController) {
            this.characterController = obj;
            if (this.bodyType === "dynamic") {
                this.bodyType = "kinematicPosition";
            }
        }

        // USER
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

        /** AIMOD
         * prompt: detach CharacterController child from PhysicalObject
         */
        if (obj instanceof CharacterController && this.characterController === obj) {
            this.characterController = null;
        }
    }

    /** AIMOD
     * prompt: migrate physics engine to Rapier3D (live-sync setters with Rapier rigidBody/collider)
     */
    setStatic(isStatic) {
        this.static = isStatic;
        if (isStatic) {
            this.bodyType = "fixed";
        }
        return this;
    }

    setMass(mass) {
        this.mass = mass;
        if (this.collider) {
            this.collider.setMass(mass);
        }
        return this;
    }

    setRestitution(restitution) {
        this.restitution = restitution;
        if (this.collider) {
            this.collider.setRestitution(restitution);
        }
        return this;
    }

    setFriction(friction) {
        this.friction = friction;
        if (this.collider) {
            this.collider.setFriction(friction);
        }
        return this;
    }

    setAngularDamping(damping) {
        this.angularDamping = damping;
        if (this.rigidBody) {
            this.rigidBody.setAngularDamping(damping);
        }
        return this;
    }

    setRollingResistance(resistance) {
        this.rollingResistance = resistance;
        return this;
    }

    setCanCollide(canCollide) {
        this.canCollide = canCollide;
        if (this.collider) {
            this.collider.setSensor(!canCollide);
        }
        return this;
    }

    setCanTumble(canTumble) {
        this.canTumble = canTumble;
        if (this.rigidBody) {
            this.rigidBody.lockRotations(!canTumble, true);
        }
        return this;
    }

    // USER
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

    /** AIMOD
     * prompt: migrate physics engine to Rapier3D (sync gravityScale)
     */
    setUseGravity(useGravity) {
        this.useGravity = useGravity;
        if (useGravity) {
            this.usePhysics = useGravity;
        }
        if (this.rigidBody) {
            this.rigidBody.setGravityScale(useGravity ? 1 : 0, true);
        }
        return this;
    }

    /** AIGEN
     * prompt: migrate physics engine to Rapier3D (shape, bodyType, transform, velocity, and impulse helpers)
     */
    setBodyType(type) {
        this.bodyType = type;
        return this;
    }

    setColliderShape(shape, params = null) {
        this.colliderShape = shape;
        this.colliderParams = params;
        return this;
    }

    setLinearDamping(damping) {
        this.linearDamping = damping;
        if (this.rigidBody) {
            this.rigidBody.setLinearDamping(damping);
        }
        return this;
    }

    setPosition(x, y, z) {
        this.root.position.set(x, y, z);
        if (this.rigidBody) {
            if (this.bodyType === "kinematicPosition") {
                this.rigidBody.setNextKinematicTranslation({ x, y, z });
            } else {
                this.rigidBody.setTranslation({ x, y, z }, true);
            }
        }
        return this;
    }

    getPosition() {
        return this.root.position;
    }

    setRotation(x, y, z) {
        this.root.rotation.set(x, y, z);
        if (this.rigidBody) {
            const q = this.root.quaternion;
            const rot = { x: q.x, y: q.y, z: q.z, w: q.w };
            if (this.bodyType === "kinematicPosition") {
                this.rigidBody.setNextKinematicRotation(rot);
            } else {
                this.rigidBody.setRotation(rot, true);
            }
        }
        return this;
    }

    setVelocity(x, y, z) {
        this.velocity.set(x, y, z);
        if (this.rigidBody) {
            this.rigidBody.setLinvel({ x, y, z }, true);
        }
        return this;
    }

    setAngularVelocity(x, y, z) {
        this.angularVelocity.set(x, y, z);
        if (this.rigidBody) {
            this.rigidBody.setAngvel({ x, y, z }, true);
        }
        return this;
    }

    applyImpulse(vec) {
        if (this.rigidBody) {
            this.rigidBody.applyImpulse({ x: vec.x, y: vec.y, z: vec.z }, true);
        }
        return this;
    }

    // USER

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
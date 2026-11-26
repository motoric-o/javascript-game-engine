// USER
import RAPIER from "@dimforge/rapier3d-compat";
/** AIMOD
 * prompt: move raycastFromCamera to GameCamera and CharacterController to a child GameObject
 */
import { Box3, Quaternion, Vector3 } from "../Util/index.js";

// USER
export default class Physics {
    constructor() {
        this.gravity = Vector3(0, -9.81, 0);
        this.world = null;
        this.eventQueue = null;

        this.colliderMap = new Map();

        this.isReady = false;
    }

    async init() {
        if (this.isReady) {
            return;
        }

        await RAPIER.init();
        this.world = new RAPIER.World({ x: this.gravity.x, y: this.gravity.y, z: this.gravity.z });
        this.eventQueue = new RAPIER.EventQueue(true);
        this.isReady = true;
    }

    /** AIGEN
     * prompt: migrate the current physics engine to using rapier3d (for Souls-like RPG: dynamic/fixed/kinematic bodies,
     * box/sphere/capsule/trimesh/convexHull colliders, KinematicCharacterController, collision events, blacklists, and raycasting)
     */
    registerBody(obj) {
        if (!this.isReady || obj == null || obj.rigidBody != null || obj.root == null) {
            return null;
        }

        obj.root.updateMatrixWorld(true);

        const target = obj.root;
        const hasCustomCollider = obj.colliderDesc != null;
        const colliderDesc = hasCustomCollider ? obj.colliderDesc : this.buildColliderDesc(obj, target);
        if (!colliderDesc) {
            // Objects without geometry (e.g. GameCamera) skip Rapier body creation while still running stepped/targets
            return null;
        }

        const worldPos = target.getWorldPosition(Vector3());
        const worldQuat = target.getWorldQuaternion(Quaternion());
        const bodyType = obj.static ? "fixed" : (obj.bodyType ?? "dynamic");

        let bodyDesc = obj.rigidBodyDesc;
        if (!bodyDesc) {
            if (bodyType === "fixed") {
                bodyDesc = RAPIER.RigidBodyDesc.fixed();
            } else if (bodyType === "kinematicPosition") {
                bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
            } else if (bodyType === "kinematicVelocity") {
                bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
            } else {
                bodyDesc = RAPIER.RigidBodyDesc.dynamic();
                bodyDesc.setLinearDamping(obj.linearDamping ?? 0);
                bodyDesc.setAngularDamping(obj.angularDamping ?? 0.8);
            }
        }

        bodyDesc.setTranslation(worldPos.x, worldPos.y, worldPos.z);
        bodyDesc.setRotation({ x: worldQuat.x, y: worldQuat.y, z: worldQuat.z, w: worldQuat.w });

        const rigidBody = this.world.createRigidBody(bodyDesc);

        if (bodyType === "dynamic") {
            if (obj.velocity && obj.velocity.lengthSq() > 0) {
                rigidBody.setLinvel({ x: obj.velocity.x, y: obj.velocity.y, z: obj.velocity.z }, true);
            }
            if (obj.angularVelocity && obj.angularVelocity.lengthSq() > 0) {
                rigidBody.setAngvel({ x: obj.angularVelocity.x, y: obj.angularVelocity.y, z: obj.angularVelocity.z }, true);
            }
        }

        if (!hasCustomCollider) {
            colliderDesc.setRestitution(obj.restitution ?? 0);
            colliderDesc.setFriction(obj.friction ?? 0.5);
            if (bodyType === "dynamic" && obj.mass > 0) {
                colliderDesc.setMass(obj.mass);
            }
            colliderDesc.setSensor(!obj.canCollide);
        }
        colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        colliderDesc.setActiveCollisionTypes(
            RAPIER.ActiveCollisionTypes.DEFAULT |
            RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED |
            RAPIER.ActiveCollisionTypes.KINEMATIC_KINEMATIC
        );

        const collider = this.world.createCollider(colliderDesc, rigidBody);

        obj.rigidBody = rigidBody;
        obj.collider = collider;
        this.colliderMap.set(collider.handle, obj);

        if (obj.characterController) {
            this.initCharacterController(obj);
        }

        return rigidBody;
    }

    initCharacterController(obj) {
        const cc = obj?.characterController;
        if (!this.isReady || !cc || cc.controller != null || cc.destroyed) {
            return null;
        }

        const controller = this.world.createCharacterController(cc.offset);
        controller.setMaxSlopeClimbAngle(cc.maxSlopeClimbAngle);
        controller.setMinSlopeSlideAngle(cc.minSlopeSlideAngle);
        controller.enableAutostep(cc.autoStepHeight, cc.autoStepMinWidth, cc.autoStepIncludeDynamic);
        controller.enableSnapToGround(cc.snapToGroundDist);
        controller.setApplyImpulsesToDynamicBodies(cc.applyImpulsesToDynamicBodies);

        cc.controller = controller;
        return controller;
    }

    unregisterCharacterController(cc) {
        if (!this.isReady || !cc || cc.controller == null) {
            return;
        }

        this.world.removeCharacterController(cc.controller);
        cc.controller = null;
    }

    unregisterBody(obj) {
        if (!this.isReady || obj == null) {
            return;
        }

        if (obj.characterController) {
            this.unregisterCharacterController(obj.characterController);
        }

        if (obj.collider != null) {
            this.colliderMap.delete(obj.collider.handle);
        }

        if (obj.rigidBody != null) {
            this.world.removeRigidBody(obj.rigidBody);
        }

        obj.rigidBody = null;
        obj.collider = null;
    }

    buildColliderDesc(obj, target) {
        const shape = obj.colliderShape ?? "box";
        const params = obj.colliderParams;

        if (shape === "sphere") {
            const radius = params?.radius ?? this.getHalfExtents(target)?.x ?? 0.5;
            return RAPIER.ColliderDesc.ball(Math.max(radius, 1e-4));
        }

        if (shape === "capsule") {
            let halfHeight = params?.halfHeight;
            let radius = params?.radius;
            if (halfHeight == null || radius == null) {
                const he = this.getHalfExtents(target);
                if (!he) return null;
                radius = radius ?? Math.max(he.x, he.z);
                halfHeight = halfHeight ?? Math.max(he.y - radius, 0.01);
            }
            return RAPIER.ColliderDesc.capsule(Math.max(halfHeight, 1e-4), Math.max(radius, 1e-4));
        }

        if (shape === "trimesh" || shape === "convexHull") {
            const geomData = this.extractGeometryData(target);
            if (!geomData) return null;
            return shape === "trimesh"
                ? RAPIER.ColliderDesc.trimesh(geomData.vertices, geomData.indices)
                : RAPIER.ColliderDesc.convexHull(geomData.vertices);
        }

        // Default: "box" (cuboid)
        let hx, hy, hz;
        if (params?.halfExtents) {
            hx = params.halfExtents.x;
            hy = params.halfExtents.y;
            hz = params.halfExtents.z;
        } else {
            const he = this.getHalfExtents(target);
            if (!he) return null;
            hx = he.x;
            hy = he.y;
            hz = he.z;
        }

        return RAPIER.ColliderDesc.cuboid(Math.max(hx, 1e-4), Math.max(hy, 1e-4), Math.max(hz, 1e-4));
    }

    getHalfExtents(target) {
        const localBox = this.getLocalBoundingBox(target);
        if (localBox.isEmpty()) {
            return null;
        }
        const size = localBox.getSize(Vector3());
        const scale = target.getWorldScale(Vector3());
        return Vector3(
            size.x * 0.5 * Math.abs(scale.x),
            size.y * 0.5 * Math.abs(scale.y),
            size.z * 0.5 * Math.abs(scale.z)
        );
    }

    getLocalBoundingBox(target) {
        if (target.geometry != null) {
            if (!target.geometry.boundingBox) {
                target.geometry.computeBoundingBox();
            }
            return target.geometry.boundingBox.clone();
        }

        const localBox = Box3();
        const invRootMatrix = target.matrixWorld.clone().invert();

        target.traverse((child) => {
            if (child.geometry != null) {
                if (!child.geometry.boundingBox) {
                    child.geometry.computeBoundingBox();
                }
                const childBox = child.geometry.boundingBox.clone();
                const relMatrix = invRootMatrix.clone().multiply(child.matrixWorld);
                childBox.applyMatrix4(relMatrix);
                localBox.union(childBox);
            }
        });

        return localBox;
    }

    extractGeometryData(target) {
        const vertices = [];
        const indices = [];
        let vertexOffset = 0;
        const scale = target.getWorldScale(Vector3());
        const invRoot = target.matrixWorld.clone().invert();
        const v = Vector3();

        target.traverse((child) => {
            if (!child.geometry) return;
            const posAttr = child.geometry.attributes?.position;
            if (!posAttr) return;

            const relMatrix = invRoot.clone().multiply(child.matrixWorld);
            for (let i = 0; i < posAttr.count; i++) {
                v.fromBufferAttribute(posAttr, i).applyMatrix4(relMatrix);
                vertices.push(v.x * scale.x, v.y * scale.y, v.z * scale.z);
            }

            const idxAttr = child.geometry.index;
            if (idxAttr) {
                for (let i = 0; i < idxAttr.count; i++) {
                    indices.push(idxAttr.getX(i) + vertexOffset);
                }
            } else {
                for (let i = 0; i < posAttr.count; i++) {
                    indices.push(i + vertexOffset);
                }
            }
            vertexOffset += posAttr.count;
        });

        if (vertices.length === 0) return null;
        return {
            vertices: new Float32Array(vertices),
            indices: new Uint32Array(indices)
        };
    }

    update(dt, dynamicObjects, staticObjects) {
        if (!this.isReady) {
            return;
        }

        // Auto-register any objects added before init()
        for (const statObj of staticObjects) {
            if (!statObj.rigidBody && !statObj.destroyed) {
                this.registerBody(statObj);
            }
        }

        // 1. Pre-step: register new dynamic objects, run stepped callbacks, apply targets & kinematic transforms
        for (const obj of dynamicObjects) {
            if (!obj.rigidBody && !obj.destroyed) {
                this.registerBody(obj);
            }

            if (obj.characterController) {
                if (obj.characterController.destroyed) {
                    this.unregisterCharacterController(obj.characterController);
                } else if (!obj.characterController.controller) {
                    this.initCharacterController(obj);
                }
            }

            for (const bind of obj.stepped) {
                bind(obj, dt);
            }

            // TargetPosition / TargetAngle interpolation (works for cameras, kinematic platforms, etc.)
            if (obj.targetPosition?.enabled) {
                const task = obj.targetPosition;
                const remaining = Math.max(task.duration - task.elapsed, dt);
                const alpha = Math.min(dt / remaining, 1);
                task.elapsed = Math.min(task.elapsed + dt, task.duration);
                obj.root.position.lerp(task.targetPosition, alpha);
            }

            if (obj.targetAngle?.enabled) {
                const task = obj.targetAngle;
                const remaining = Math.max(task.duration - task.elapsed, dt);
                const alpha = Math.min(dt / remaining, 1);
                task.elapsed = Math.min(task.elapsed + dt, task.duration);
                obj.root.quaternion.slerp(task.targetAngle, alpha);
            }

            if (obj.rigidBody) {
                const bodyType = obj.static ? "fixed" : (obj.bodyType ?? "dynamic");

                if (bodyType === "kinematicPosition") {
                    const p = obj.root.position;
                    const q = obj.root.quaternion;
                    obj.rigidBody.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
                    obj.rigidBody.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
                } else if (bodyType === "dynamic") {
                    // Apply stackable Velocity / AngularVelocity child components if present
                    if (obj.velocities.length > 0) {
                        const lv = obj.rigidBody.linvel();
                        let vx = lv.x, vy = lv.y, vz = lv.z;
                        for (const vel of obj.velocities) {
                            vx += vel.velocity.x * dt;
                            vy += vel.velocity.y * dt;
                            vz += vel.velocity.z * dt;
                        }
                        obj.rigidBody.setLinvel({ x: vx, y: vy, z: vz }, true);
                    }

                    if (obj.angularVelocities.length > 0) {
                        let wx = 0, wy = 0, wz = 0;
                        for (const vel of obj.angularVelocities) {
                            wx += vel.velocity.x;
                            wy += vel.velocity.y;
                            wz += vel.velocity.z;
                        }
                        obj.rigidBody.setAngvel({ x: wx, y: wy, z: wz }, true);
                    }
                }
            } else {
                // Non-Rapier dynamic objects (e.g. GameCamera without collider)
                if (!obj.targetPosition?.enabled && (obj.velocity.lengthSq() > 0 || obj.velocities.length > 0)) {
                    const totalV = obj.velocity.clone();
                    for (const vel of obj.velocities) {
                        totalV.add(vel.velocity);
                    }
                    obj.root.position.addScaledVector(totalV, dt);
                }
                obj.root.updateMatrixWorld();
            }
        }

        // 2. Step Rapier world
        this.world.timestep = dt;
        this.world.step(this.eventQueue);

        // 3. Post-step: sync Rapier transforms & velocities back to Three.js
        for (const obj of dynamicObjects) {
            if (!obj.rigidBody || obj.static) {
                continue;
            }

            const t = obj.rigidBody.translation();
            const r = obj.rigidBody.rotation();
            obj.root.position.set(t.x, t.y, t.z);
            obj.root.quaternion.set(r.x, r.y, r.z, r.w);

            if (obj.bodyType === "dynamic") {
                const lv = obj.rigidBody.linvel();
                const av = obj.rigidBody.angvel();
                obj.velocity.set(lv.x, lv.y, lv.z);
                obj.angularVelocity.set(av.x, av.y, av.z);
            }

            obj.root.updateMatrixWorld();
        }

        // 4. Drain Rapier collision events & dispatch onCollision / onCollisionEnded
        this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
            const objA = this.colliderMap.get(handle1);
            const objB = this.colliderMap.get(handle2);

            if (!objA || !objB || objA.destroyed || objB.destroyed) {
                return;
            }

            if (this.isBlacklisted(objA, objB)) {
                return;
            }

            if (started) {
                const contact = this.getContactInfo(objA, objB);
                for (const bind of objA.onCollision) {
                    bind(objA, objB, contact);
                }
                const flipped = {
                    normal: contact.normal.clone().negate(),
                    penetration: contact.penetration,
                    point: contact.point
                };
                for (const bind of objB.onCollision) {
                    bind(objB, objA, flipped);
                }
            } else {
                for (const bind of objA.onCollisionEnded) {
                    bind(objA, objB);
                }
                for (const bind of objB.onCollisionEnded) {
                    bind(objB, objA);
                }
            }
        });
    }

    isBlacklisted(objA, objB) {
        if (objA.collisionBlacklistObjects.includes(objB) || objB.collisionBlacklistObjects.includes(objA)) {
            return true;
        }
        if (objA.collisionBlacklistTags.some(tag => objB.tags.includes(tag))) {
            return true;
        }
        if (objB.collisionBlacklistTags.some(tag => objA.tags.includes(tag))) {
            return true;
        }
        return false;
    }

    getContactInfo(objA, objB) {
        let normal = Vector3(0, 1, 0);
        let point = objA.root.position.clone().lerp(objB.root.position, 0.5);
        let penetration = 0;

        if (objA.collider && objB.collider) {
            this.world.contactPair(objA.collider, objB.collider, (manifold, flipped) => {
                const n = manifold.normal();
                normal.set(flipped ? -n.x : n.x, flipped ? -n.y : n.y, flipped ? -n.z : n.z);
                if (manifold.numContacts() > 0) {
                    penetration = Math.max(0, -manifold.contactDist(0));
                }
            });
        }

        return { normal, penetration, point };
    }

    raycast(origin, direction, maxDistance = 100, excludeObj = null) {
        if (!this.isReady) {
            return null;
        }

        const dir = direction.clone().normalize();
        const ray = new RAPIER.Ray(
            { x: origin.x, y: origin.y, z: origin.z },
            { x: dir.x, y: dir.y, z: dir.z }
        );

        const excludeCollider = excludeObj?.collider ?? undefined;
        const hit = this.world.castRayAndGetNormal(ray, maxDistance, true, undefined, undefined, excludeCollider);

        if (!hit) {
            return null;
        }

        const hitPoint = ray.pointAt(hit.timeOfImpact);
        return {
            object: this.colliderMap.get(hit.collider.handle) ?? null,
            point: Vector3(hitPoint.x, hitPoint.y, hitPoint.z),
            normal: Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
            distance: hit.timeOfImpact
        };
    }
}

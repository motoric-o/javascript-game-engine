// USER
import * as THREE from "three";
import { Box3, Box3FromObject, Quaternion, Raycaster, Vector3 } from "../Util/index.js";

export default class Physics {
    constructor() {
        this.gravity = Vector3(0, -9.81, 0);
        this.raycaster = Raycaster();
    }

    update(dt, dynamicObjects, staticObjects) {
        // Integrated Physics
        for (let obj of dynamicObjects) {
            if (obj.useGravity || obj.velocities.length > 0 || obj.velocity.lengthSq() > 0 || obj.angularVelocities.length > 0 || obj.angularVelocity.lengthSq() > 0 || obj.targetPosition.enabled || obj.targetAngle.enabled) {
                this.updateObj(dt, obj);
            }
        }

        // Dynamic vs Static object collision checks
        for (let obj of dynamicObjects) {
            if (!obj.canCollide) {
                continue;
            }

            for (let statObj of staticObjects) {
                if (!statObj.canCollide) {
                    continue;
                }

                const contact = this.checkCollision(obj, statObj);

                if (contact != null) {
                    this.resolveStatic(obj, contact);
                }
            }
        }

        // Dynamic vs Dynamic objects collision checks
        for (let i = 0; i < dynamicObjects.length - 1; i++) {
            const objA = dynamicObjects[i];

            if (!objA.canCollide) {
                continue;
            }

            for (let j = i + 1; j < dynamicObjects.length; j++) {
                const objB = dynamicObjects[j];

                if (!objB.canCollide) {
                    continue;
                }

                const contact = this.checkCollision(objA, objB);

                if (contact != null) {
                    this.resolveDynamic(objA, objB, contact);
                }
            }
        }
    }

    updateObj(dt, obj) {
        if (obj.targetPosition.enabled) {
            this.updateObjPosition(dt, obj, obj.targetPosition);
        } else {
            this.updateObjPosition(dt, obj);
        }

        if (obj.targetAngle.enabled) {
            this.updateObjAngle(dt, obj, obj.targetAngle);
        } else {
            this.updateObjAngle(dt, obj);
        }

        obj.root.updateMatrixWorld();
    }

    updateObjPosition(dt, obj, task) {
        if (task) {
            const remaining = Math.max(task.duration - task.elapsed, dt);
            const alpha = Math.min(dt / remaining, 1);

            task.elapsed = Math.min(task.elapsed + dt, task.duration);

            obj.root.position.lerp(task.targetPosition, alpha);
            return;
        }

        if (obj.useGravity) {
            obj.velocity.addScaledVector(this.gravity, dt);
        }

        let totalVelocity = obj.velocity.clone();

        for (let vel of obj.velocities) {
            totalVelocity.x += vel.x;
            totalVelocity.y += vel.y;
            totalVelocity.z += vel.z;
        }

        obj.root.position.x += totalVelocity.x * dt;
        obj.root.position.y += totalVelocity.y * dt;
        obj.root.position.z += totalVelocity.z * dt;
    }

    updateObjAngle(dt, obj, task) {
        if (task) {
            const remaining = Math.max(task.duration - task.elapsed, dt);
            const alpha = Math.min(dt / remaining, 1);

            task.elapsed = Math.min(task.elapsed + dt, task.duration);

            obj.root.quaternion.slerp(task.targetAngle, alpha);
            return;
        }

        let totalVel = obj.angularVelocity.clone();

        for (let vel of obj.angularVelocities) {
            totalVel.x += vel.x;
            totalVel.y += vel.y;
            totalVel.z += vel.z;
        }

        const speed = totalVel.length();

        if (speed == 0) {
            return;
        }

        const axis = totalVel.divideScalar(speed);
        const angle = speed * dt;

        const deltaQuat = Quaternion().setFromAxisAngle(axis, angle);
        obj.root.quaternion.premultiply(deltaQuat).normalize();
    }

    getWorldBox(obj) {
        return Box3FromObject(obj.hitbox);
    }

    /** AIGEN
     * prompt 1: okay I might need your help to generate for me on this one. 
     * Generate for parts checkCollision, getWorldOBB, checkOBBvsOBB_SAT (maybe name this with something else), and getContactPoint.
     * 
     * prompt 2: you may generate for me for this part of the fix, above my second // USER comment and under docstring that starts with AIGEN
     */
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

    getWorldOBB(obj) {
        const target = this.getColliderTarget(obj);
        const localBox = this.getLocalBoundingBox(target);

        if (localBox.isEmpty()) {
            return null;
        }

        const localSize = localBox.getSize(Vector3());
        const scale = target.getWorldScale(Vector3());

        const halfExtents = Vector3(
            localSize.x * 0.5 * Math.abs(scale.x),
            localSize.y * 0.5 * Math.abs(scale.y),
            localSize.z * 0.5 * Math.abs(scale.z)
        );

        const center = localBox.getCenter(Vector3()).applyMatrix4(target.matrixWorld);
        const u0 = Vector3();
        const u1 = Vector3();
        const u2 = Vector3();

        target.matrixWorld.extractBasis(u0, u1, u2);
        u0.normalize();
        u1.normalize();
        u2.normalize();

        return { center, axes: [u0, u1, u2], halfExtents };
    }

    checkCollision(objA, objB) {
        const boxA = Box3FromObject(this.getColliderTarget(objA));
        const boxB = Box3FromObject(this.getColliderTarget(objB));

        if (!boxA.intersectsBox(boxB)) {
            return null;
        }

        const obbA = this.getWorldOBB(objA);
        const obbB = this.getWorldOBB(objB);

        if (!obbA || !obbB) {
            return null;
        }

        return this.intersectOBB(obbA, obbB);
    }

    intersectOBB(obbA, obbB) {
        const t = obbA.center.clone().sub(obbB.center);
        let minOverlap = Infinity;
        let bestAxis = null;

        const axes = [
            obbA.axes[0], obbA.axes[1], obbA.axes[2],
            obbB.axes[0], obbB.axes[1], obbB.axes[2]
        ];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cross = obbA.axes[i].clone().cross(obbB.axes[j]);
                if (cross.lengthSq() > 1e-6) {
                    axes.push(cross.normalize());
                }
            }
        }

        for (const axis of axes) {
            const rA =
                obbA.halfExtents.x * Math.abs(obbA.axes[0].dot(axis)) +
                obbA.halfExtents.y * Math.abs(obbA.axes[1].dot(axis)) +
                obbA.halfExtents.z * Math.abs(obbA.axes[2].dot(axis));

            const rB =
                obbB.halfExtents.x * Math.abs(obbB.axes[0].dot(axis)) +
                obbB.halfExtents.y * Math.abs(obbB.axes[1].dot(axis)) +
                obbB.halfExtents.z * Math.abs(obbB.axes[2].dot(axis));

            const overlap = (rA + rB) - Math.abs(t.dot(axis));

            if (overlap <= 0) {
                return null;
            }

            if (overlap < minOverlap) {
                minOverlap = overlap;
                bestAxis = axis.clone();
            }
        }

        if (t.dot(bestAxis) < 0) {
            bestAxis.negate();
        }

        const point = this.getContactPoint(obbA, obbB, bestAxis);

        return { normal: bestAxis, penetration: minOverlap, point };
    }

    getContactPoint(obbA, obbB, normal) {
        const pA = obbA.center.clone();
        const pB = obbB.center.clone();

        const hA = [obbA.halfExtents.x, obbA.halfExtents.y, obbA.halfExtents.z];
        const hB = [obbB.halfExtents.x, obbB.halfExtents.y, obbB.halfExtents.z];

        for (let i = 0; i < 3; i++) {
            const signA = obbA.axes[i].dot(normal) >= 0 ? 1 : -1;
            pA.addScaledVector(obbA.axes[i], -signA * hA[i]);

            const signB = obbB.axes[i].dot(normal) >= 0 ? 1 : -1;
            pB.addScaledVector(obbB.axes[i], signB * hB[i]);
        }

        return pA.add(pB).multiplyScalar(0.5);
    }

    // USER
    resolveStatic(obj, contact) {
        obj.root.position.addScaledVector(contact.normal, contact.penetration);
        obj.root.updateMatrixWorld();

        const velIntoSurface = obj.velocity.dot(contact.normal);

        if (velIntoSurface < 0) {
            obj.velocity.addScaledVector(contact.normal, -velIntoSurface);
        }
    }

    resolveDynamic(objA, objB, contact) {
        const invMassA = 1 / objA.mass;
        const invMassB = 1 / objB.mass;

        const totalInvMass = invMassA + invMassB;

        objA.root.position.addScaledVector(contact.normal, contact.penetration * (invMassA / totalInvMass));
        objB.root.position.addScaledVector(contact.normal, -contact.penetration * (invMassB / totalInvMass));
        objA.root.updateMatrixWorld();
        objB.root.updateMatrixWorld();

        const relVel = objA.velocity.clone().sub(objB.velocity);
        const velAlongNormal = relVel.dot(contact.normal);

        if (velAlongNormal > 0) {
            return;
        }

        const e = Math.min(objA.restitution ?? 0, objB.restitution ?? 0);
        const j = -(1 + e) * velAlongNormal / totalInvMass;

        objA.velocity.addScaledVector(contact.normal, j * invMassA);
        objB.velocity.addScaledVector(contact.normal, -j * invMassB);
    }

    getColliderTarget(obj) {
        if (obj.useHitbox && obj.hitbox != null) {
            return obj.hitbox;
        }

        return obj.root;
    }

    raycast(origin, direction, maxDistance, targets) {
        this.raycaster.set(origin, direction);
        this.raycaster.far = maxDistance;

        return this.raycaster.intersectObjects(targets);
    }
}
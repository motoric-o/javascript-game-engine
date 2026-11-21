// USER
import * as THREE from "three";
import { Box3, Box3FromObject, Quaternion, Raycaster, Vector3 } from "../Util/index.js";

export default class Physics {
    constructor() {
        this.gravity = Vector3(0, -9.81, 0);
        this.raycaster = Raycaster();

        this.currentCollisions = new Map();
        this.activeCollisions = this.currentCollisions;
    }

    /** AIMOD
     * prompt 1: the tumble still messes up across scenarios 1-4, and scenario 8 dominoes jitter and walk apart -> semi-implicit Euler order + unified constraint solver
     * prompt 2: Everything else tumbles normally except scenario 1 (double-bounce with same orientation) -> leading-corner filtering + adaptive Jacobi relaxation
     */
    update(dt, dynamicObjects, staticObjects) {
        this.currentCollisions = new Map();

        // Step 1: Integrate velocities (gravity, angular damping) & run per-object stepped callbacks
        for (let obj of dynamicObjects) {
            if (obj.usePhysics || obj.velocities.length > 0 || obj.velocity.lengthSq() > 0 || obj.angularVelocities.length > 0 || obj.angularVelocity.lengthSq() > 0 || obj.targetPosition?.enabled || obj.targetAngle?.enabled || obj.stepped.length > 0) {
                this.integrateVelocities(dt, obj);
            }
            obj.root.updateMatrixWorld();
        }

        for (let statObj of staticObjects) {
            statObj.root.updateMatrixWorld();
        }

        const constraints = [];

        // Step 2: Detect collisions (Dynamic vs Static & Dynamic vs Dynamic)
        for (let obj of dynamicObjects) {
            for (let statObj of staticObjects) {
                if (obj.collisionBlacklistObjects.includes(statObj)) {
                    continue;
                }

                const contact = this.checkCollision(obj, statObj);

                if (contact != null) {
                    if (obj.canCollide && statObj.canCollide) {
                        constraints.push(this.prepareStaticConstraint(obj, contact));
                    }
                    this.recordCollision(obj, statObj, contact);
                }
            }
        }

        for (let i = 0; i < dynamicObjects.length - 1; i++) {
            const objA = dynamicObjects[i];

            for (let j = i + 1; j < dynamicObjects.length; j++) {
                const objB = dynamicObjects[j];

                if (objA.collisionBlacklistObjects.includes(objB) || objB.collisionBlacklistObjects.includes(objA)) {
                    continue;
                }

                const contact = this.checkCollision(objA, objB);

                if (contact != null) {
                    if (objA.canCollide && objB.canCollide) {
                        constraints.push(this.prepareDynamicConstraint(objA, objB, contact));
                    }
                    this.recordCollision(objA, objB, contact);
                }
            }
        }

        // Step 3: Solve all velocity & positional constraints together
        if (constraints.length > 0) {
            this.solveConstraints(constraints);
        }

        // Step 4: Integrate positions & rotations using the solved velocities
        for (let obj of dynamicObjects) {
            if (obj.usePhysics || obj.velocities.length > 0 || obj.velocity.lengthSq() > 0 || obj.angularVelocities.length > 0 || obj.angularVelocity.lengthSq() > 0 || obj.targetPosition?.enabled || obj.targetAngle?.enabled) {
                this.integrateTransforms(dt, obj);
            }
        }

        // On Collision Ended Event checks
        for (let [objA, prevOthers] of this.activeCollisions) {
            const activeOthers = this.currentCollisions.get(objA);

            for (let objB of prevOthers) {
                if (activeOthers == null || !activeOthers.has(objB)) {
                    if (!objA.destroyed && !objA.static) {
                        for (let bind of objA.onCollisionEnded) {
                            bind(objA, objB);
                        }
                        
                    }

                    if (!objB.destroyed && !objB.static) {
                        for (let bind of objB.onCollisionEnded) {
                            bind(objB, objA);
                        }
                    }
                }
            }
        }

        this.activeCollisions = this.currentCollisions;
    }

    /** AIGEN
     * prompt: All passed except the domino, the domino objects are "walking" slowly, all of them do small jitters of movements slowly moving them apart. Apply fixes to this
     */
    integrateVelocities(dt, obj) {
        if (obj.usePhysics) {
            if (obj.useGravity && !obj.targetPosition?.enabled) {
                obj.velocity.addScaledVector(this.gravity, dt);
            }

            if (!obj.targetAngle?.enabled) {
                const angularDamping = obj.angularDamping ?? 0.8;
                obj.angularVelocity.multiplyScalar(Math.max(0, 1 - angularDamping * dt));
            }
        }

        for (let bind of obj.stepped) {
            bind(obj, dt);
        }
    }

    integrateTransforms(dt, obj) {
        if (!obj.usePhysics) {
            return;
        }

        if (obj.targetPosition?.enabled) {
            const task = obj.targetPosition;
            const remaining = Math.max(task.duration - task.elapsed, dt);
            const alpha = Math.min(dt / remaining, 1);
            task.elapsed = Math.min(task.elapsed + dt, task.duration);
            obj.root.position.lerp(task.targetPosition, alpha);
        } else {
            const totalVelocity = this.getTotalVelocity(obj);
            obj.root.position.x += totalVelocity.x * dt;
            obj.root.position.y += totalVelocity.y * dt;
            obj.root.position.z += totalVelocity.z * dt;
        }

        if (obj.targetAngle?.enabled) {
            const task = obj.targetAngle;
            const remaining = Math.max(task.duration - task.elapsed, dt);
            const alpha = Math.min(dt / remaining, 1);
            task.elapsed = Math.min(task.elapsed + dt, task.duration);
            obj.root.quaternion.slerp(task.targetAngle, alpha);
        } else {
            const totalVel = this.getTotalAngularVelocity(obj);
            const speed = totalVel.length();
            if (speed > 0) {
                const axis = totalVel.divideScalar(speed);
                const angle = speed * dt;
                const deltaQuat = Quaternion().setFromAxisAngle(axis, angle);
                obj.root.quaternion.premultiply(deltaQuat).normalize();
            }
        }

        obj.root.updateMatrixWorld();
    }

    // USER
    updateObj(dt, obj) {
        if (obj.targetPosition?.enabled) {
            this.updateObjPosition(dt, obj, obj.targetPosition);
        } else {
            this.updateObjPosition(dt, obj);
        }

        if (obj.targetAngle?.enabled) {
            this.updateObjAngle(dt, obj, obj.targetAngle);
        } else {
            this.updateObjAngle(dt, obj);
        }

        for (let bind of obj.stepped) {
            bind(obj, dt);
        }

        obj.root.updateMatrixWorld();
    }

    updateObjPosition(dt, obj, task) {
        if (!obj.usePhysics) {
            return;
        }

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
            totalVelocity.x += vel.velocity.x;
            totalVelocity.y += vel.velocity.y;
            totalVelocity.z += vel.velocity.z;
        }

        obj.root.position.x += totalVelocity.x * dt;
        obj.root.position.y += totalVelocity.y * dt;
        obj.root.position.z += totalVelocity.z * dt;
    }

    /** AIMOD
     * context: alright I've seen the tumbling, but the tumbling still feels unrealistic. It looks like it doesn't lose momentum while tumbling on flat surfaces while loses it on rotated surfaces like scenario 2
     * 
     * execution: Help me apply the fixes, and check the commenting format, cascading for AIMOD, AIGEN, and USER.
     */
    updateObjAngle(dt, obj, task) {
        if (!obj.usePhysics) {
            return;
        }

        if (task) {
            const remaining = Math.max(task.duration - task.elapsed, dt);
            const alpha = Math.min(dt / remaining, 1);

            task.elapsed = Math.min(task.elapsed + dt, task.duration);

            obj.root.quaternion.slerp(task.targetAngle, alpha);
            return;
        }

        const angularDamping = obj.angularDamping ?? 0.8;
        obj.angularVelocity.multiplyScalar(Math.max(0, 1 - angularDamping * dt));

        let totalVel = obj.angularVelocity.clone();

        for (let vel of obj.angularVelocities) {
            totalVel.x += vel.velocity.x;
            totalVel.y += vel.velocity.y;
            totalVel.z += vel.velocity.z;
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

    // USER
    getWorldBox(obj) {
        return Box3FromObject(obj.hitbox.root);
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

        let bestIndex = -1;

        for (let k = 0; k < axes.length; k++) {
            const axis = axes[k];
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

            // Prefer face axes (k < 6) over edge-edge cross axes (k >= 6) to avoid floating-point normal jitter
            const isBetter = k < 6
                ? overlap < minOverlap
                : overlap < minOverlap * 0.95 - 1e-4;

            if (isBetter) {
                minOverlap = overlap;
                bestAxis = axis.clone();
                bestIndex = k;
            }
        }

        if (t.dot(bestAxis) < 0) {
            bestAxis.negate();
        }

        const manifold = this.getContactPoints(obbA, obbB, bestAxis, bestIndex);
        const points = manifold.map(item => item.p);
        const depths = manifold.map(item => item.depth);
        const point = Vector3(0, 0, 0);
        for (const p of points) {
            point.add(p);
        }
        point.divideScalar(points.length);

        return { normal: bestAxis, penetration: minOverlap, point, points, depths };
    }

    /** AIGEN
     * prompt 1: it doesn't like an actual tumble, it bounces in the same axis and rotates one way on collide -> rigid-body rotational & friction impulse + inertia tensor
     * prompt 2: alright I've seen the tumbling, but the tumbling still feels unrealistic on flat surfaces -> angular damping + rolling resistance
     * prompt 3: we're close, but rotation goes wrong when momentum is near stopping -> multi-point contact manifold + face-axis bias + sequential impulse
     * prompt 4: wire the canTumble functionality to toggle this feature on and off -> zero inverse inertia when canTumble is false
     * prompt 5: Everything else tumbles normally except scenario 1 (same-orientation double bounce) -> per-vertex depth tracking + leading-corner filtering + adaptive Jacobi relaxation
     */
    getContactPoints(obbA, obbB, normal, bestIndex) {
        // Edge-edge collision: single clamped midpoint
        if (bestIndex >= 6 || bestIndex < 0) {
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

            const cA = this.clampPointToOBB(pA, obbB);
            const cB = this.clampPointToOBB(pB, obbA);
            return [{ p: cA.add(cB).multiplyScalar(0.5), depth: 0 }];
        }

        // Face collision: reference OBB owns the winning face axis, incident OBB supplies the clipped face vertices
        const aIsRef = bestIndex < 3;
        const refOBB = aIsRef ? obbA : obbB;
        const incOBB = aIsRef ? obbB : obbA;
        const refAxisIdx = aIsRef ? bestIndex : bestIndex - 3;
        // refNormal points outward from refOBB toward incOBB
        const refNormal = aIsRef ? normal.clone().negate() : normal.clone();

        const refExtents = [refOBB.halfExtents.x, refOBB.halfExtents.y, refOBB.halfExtents.z];
        const incExtents = [incOBB.halfExtents.x, incOBB.halfExtents.y, incOBB.halfExtents.z];

        // Find incident face on incOBB most anti-parallel to refNormal
        let incAxisIdx = 0;
        let maxAbsDot = -1;
        for (let i = 0; i < 3; i++) {
            const absDot = Math.abs(incOBB.axes[i].dot(refNormal));
            if (absDot > maxAbsDot) {
                maxAbsDot = absDot;
                incAxisIdx = i;
            }
        }

        const incSign = incOBB.axes[incAxisIdx].dot(refNormal) > 0 ? -1 : 1;
        const incFaceCenter = incOBB.center.clone().addScaledVector(
            incOBB.axes[incAxisIdx],
            incSign * incExtents[incAxisIdx]
        );

        const incTangentIdx = [0, 1, 2].filter(i => i !== incAxisIdx);
        const u1 = incOBB.axes[incTangentIdx[0]];
        const u2 = incOBB.axes[incTangentIdx[1]];
        const e1 = incExtents[incTangentIdx[0]];
        const e2 = incExtents[incTangentIdx[1]];

        let poly = [
            incFaceCenter.clone().addScaledVector(u1, -e1).addScaledVector(u2, -e2),
            incFaceCenter.clone().addScaledVector(u1,  e1).addScaledVector(u2, -e2),
            incFaceCenter.clone().addScaledVector(u1,  e1).addScaledVector(u2,  e2),
            incFaceCenter.clone().addScaledVector(u1, -e1).addScaledVector(u2,  e2)
        ];

        // Clip incident face polygon against the 4 side planes of refOBB
        const refTangentIdx = [0, 1, 2].filter(i => i !== refAxisIdx);
        for (const idx of refTangentIdx) {
            const sideAxis = refOBB.axes[idx];
            const limit = refExtents[idx];
            poly = this.clipPolygonByPlane(poly, refOBB.center, sideAxis, limit);
            poly = this.clipPolygonByPlane(poly, refOBB.center, sideAxis.clone().negate(), limit);
            if (poly.length === 0) {
                break;
            }
        }

        // Keep clipped vertices behind or within slop of refOBB's face plane, recording penetration depth per vertex
        const refFaceExtent = refExtents[refAxisIdx];
        const refPlaneLimit = refFaceExtent + 0.015;
        const kept = [];
        let deepestDist = Infinity;
        let deepestPoint = null;

        for (const p of poly) {
            const dist = p.clone().sub(refOBB.center).dot(refNormal);
            if (dist < deepestDist) {
                deepestDist = dist;
                deepestPoint = p;
            }
            if (dist <= refPlaneLimit) {
                kept.push({ p, dist, depth: refFaceExtent - dist });
            }
        }

        if (kept.length === 0) {
            return [{ p: deepestPoint ?? this.clampPointToOBB(incFaceCenter, refOBB), depth: Math.max(0, refFaceExtent - deepestDist) }];
        }

        if (kept.length > 4) {
            kept.sort((a, b) => a.dist - b.dist);
            kept.length = 4;
        }

        return kept;
    }

    clipPolygonByPlane(poly, origin, planeNormal, limit) {
        if (poly.length === 0) {
            return [];
        }

        const out = [];
        let prev = poly[poly.length - 1];
        let prevDist = prev.clone().sub(origin).dot(planeNormal) - limit;

        for (const curr of poly) {
            const currDist = curr.clone().sub(origin).dot(planeNormal) - limit;
            const prevInside = prevDist <= 0;
            const currInside = currDist <= 0;

            if (currInside) {
                if (!prevInside) {
                    const t = prevDist / (prevDist - currDist);
                    out.push(prev.clone().lerp(curr, t));
                }
                out.push(curr);
            } else if (prevInside) {
                const t = prevDist / (prevDist - currDist);
                out.push(prev.clone().lerp(curr, t));
            }

            prev = curr;
            prevDist = currDist;
        }

        return out;
    }

    clampPointToOBB(point, obb) {
        const d = point.clone().sub(obb.center);
        const result = obb.center.clone();
        const extents = [obb.halfExtents.x, obb.halfExtents.y, obb.halfExtents.z];

        for (let i = 0; i < 3; i++) {
            const dist = Math.max(-extents[i], Math.min(extents[i], d.dot(obb.axes[i])));
            result.addScaledVector(obb.axes[i], dist);
        }

        return result;
    }

    getWorldInvInertia(obj) {
        if (obj.canTumble === false || obj.mass <= 0) {
            return { axes: [Vector3(1, 0, 0), Vector3(0, 1, 0), Vector3(0, 0, 1)], invDiag: [0, 0, 0] };
        }

        const obb = this.getWorldOBB(obj);
        if (!obb) {
            return { axes: [Vector3(1, 0, 0), Vector3(0, 1, 0), Vector3(0, 0, 1)], invDiag: [0, 0, 0] };
        }

        const w = obb.halfExtents.x * 2;
        const h = obb.halfExtents.y * 2;
        const d = obb.halfExtents.z * 2;
        const factor = obj.mass / 12;

        return {
            axes: obb.axes,
            invDiag: [
                1 / Math.max(factor * (h * h + d * d), 1e-6),
                1 / Math.max(factor * (w * w + d * d), 1e-6),
                1 / Math.max(factor * (w * w + h * h), 1e-6)
            ]
        };
    }

    applyInvInertia(invI, vec) {
        const out = Vector3(0, 0, 0);
        for (let i = 0; i < 3; i++) {
            out.addScaledVector(invI.axes[i], vec.dot(invI.axes[i]) * invI.invDiag[i]);
        }
        return out;
    }

    getTotalVelocity(obj) {
        const total = obj.velocity.clone();
        for (const vel of obj.velocities) {
            total.x += vel.velocity.x;
            total.y += vel.velocity.y;
            total.z += vel.velocity.z;
        }
        return total;
    }

    getTotalAngularVelocity(obj) {
        const total = obj.angularVelocity.clone();
        for (const vel of obj.angularVelocities) {
            total.x += vel.velocity.x;
            total.y += vel.velocity.y;
            total.z += vel.velocity.z;
        }
        return total;
    }

    getTangentBasis(normal) {
        const ref = Math.abs(normal.x) < 0.9 ? Vector3(1, 0, 0) : Vector3(0, 1, 0);
        const t1 = normal.clone().cross(ref).normalize();
        const t2 = normal.clone().cross(t1).normalize();
        return [t1, t2];
    }

    prepareStaticConstraint(obj, contact) {
        const invMass = 1 / obj.mass;
        const invI = this.getWorldInvInertia(obj);
        const points = contact.points?.length > 0 ? contact.points : [contact.point];
        const depths = contact.depths?.length === points.length ? contact.depths : points.map(() => contact.penetration);
        const [t1, t2] = this.getTangentBasis(contact.normal);
        const e = obj.restitution ?? 0;
        const mu = obj.friction ?? 0.5;

        let contacts = points.map((p, idx) => {
            const r = p.clone().sub(obj.root.position);
            const vp = this.getTotalVelocity(obj).add(this.getTotalAngularVelocity(obj).cross(r));
            const vn0 = vp.dot(contact.normal);
            const bounceVel = vn0 < -0.4 ? -e * vn0 : 0;
            const rCrossN = r.clone().cross(contact.normal);
            const rCrossT1 = r.clone().cross(t1);
            const rCrossT2 = r.clone().cross(t2);
            return {
                r,
                depth: depths[idx],
                bounceVel,
                vn0,
                denomN: invMass + this.applyInvInertia(invI, rCrossN).cross(r).dot(contact.normal),
                denomT1: invMass + this.applyInvInertia(invI, rCrossT1).cross(r).dot(t1),
                denomT2: invMass + this.applyInvInertia(invI, rCrossT2).cross(r).dot(t2),
                accJn: 0,
                accJt1: 0,
                accJt2: 0
            };
        });

        // On active high-speed impacts, keep only the leading contact vertices within 0.015 of the deepest point
        // so discrete timestep penetration doesn't flatten corner impacts with trailing vertices
        if (contacts.length > 1 && contacts.some(c => c.vn0 < -0.4)) {
            const maxDepth = Math.max(...contacts.map(c => c.depth));
            const leading = contacts.filter(c => c.depth >= maxDepth - 0.015);
            if (leading.length > 0) {
                contacts = leading;
            }
        }

        return { type: "static", obj, contact, invMass, invI, t1, t2, mu, contacts };
    }

    prepareDynamicConstraint(objA, objB, contact) {
        const invMassA = 1 / objA.mass;
        const invMassB = 1 / objB.mass;
        const totalInvMass = invMassA + invMassB;
        const invIA = this.getWorldInvInertia(objA);
        const invIB = this.getWorldInvInertia(objB);
        const points = contact.points?.length > 0 ? contact.points : [contact.point];
        const depths = contact.depths?.length === points.length ? contact.depths : points.map(() => contact.penetration);
        const [t1, t2] = this.getTangentBasis(contact.normal);
        const e = Math.min(objA.restitution ?? 0, objB.restitution ?? 0);
        const mu = Math.min(objA.friction ?? 0.5, objB.friction ?? 0.5);

        let contacts = points.map((p, idx) => {
            const rA = p.clone().sub(objA.root.position);
            const rB = p.clone().sub(objB.root.position);
            const vpA = this.getTotalVelocity(objA).add(this.getTotalAngularVelocity(objA).cross(rA));
            const vpB = this.getTotalVelocity(objB).add(this.getTotalAngularVelocity(objB).cross(rB));
            const vn0 = vpA.sub(vpB).dot(contact.normal);
            const bounceVel = vn0 < -0.4 ? -e * vn0 : 0;

            const rACrossN = rA.clone().cross(contact.normal);
            const rBCrossN = rB.clone().cross(contact.normal);
            const rACrossT1 = rA.clone().cross(t1);
            const rBCrossT1 = rB.clone().cross(t1);
            const rACrossT2 = rA.clone().cross(t2);
            const rBCrossT2 = rB.clone().cross(t2);

            return {
                rA,
                rB,
                depth: depths[idx],
                bounceVel,
                vn0,
                denomN: totalInvMass
                    + this.applyInvInertia(invIA, rACrossN).cross(rA).dot(contact.normal)
                    + this.applyInvInertia(invIB, rBCrossN).cross(rB).dot(contact.normal),
                denomT1: totalInvMass
                    + this.applyInvInertia(invIA, rACrossT1).cross(rA).dot(t1)
                    + this.applyInvInertia(invIB, rBCrossT1).cross(rB).dot(t1),
                denomT2: totalInvMass
                    + this.applyInvInertia(invIA, rACrossT2).cross(rA).dot(t2)
                    + this.applyInvInertia(invIB, rBCrossT2).cross(rB).dot(t2),
                accJn: 0,
                accJt1: 0,
                accJt2: 0
            };
        });

        if (contacts.length > 1 && contacts.some(c => c.vn0 < -0.4)) {
            const maxDepth = Math.max(...contacts.map(c => c.depth));
            const leading = contacts.filter(c => c.depth >= maxDepth - 0.015);
            if (leading.length > 0) {
                contacts = leading;
            }
        }

        return { type: "dynamic", objA, objB, contact, invMassA, invMassB, totalInvMass, invIA, invIB, t1, t2, mu, contacts };
    }

    solveConstraints(constraints) {
        const normalWarmup = 8;
        const totalIterations = 20;

        // Unified iterative velocity solver: simultaneous (Jacobi) per-manifold passes eliminate contact-order bias
        for (let iter = 0; iter < totalIterations; iter++) {
            for (const item of constraints) {
                this.solveNormalPass(item);
            }

            if (iter >= normalWarmup) {
                for (const item of constraints) {
                    this.solveFrictionPass(item);
                }
            }
        }

        // Coupled iterative positional correction: tracks accumulated per-body shifts so stacked/leaning bodies
        // never push each other underground or ping-pong across ticks
        const posShifts = new Map();
        const getShift = (obj) => {
            let s = posShifts.get(obj);
            if (!s) {
                s = Vector3(0, 0, 0);
                posShifts.set(obj, s);
            }
            return s;
        };

        const posIterations = 6;
        const slop = 0.005;
        const dynamicPercent = 0.35;
        const staticPercent = 0.65;

        for (let pIter = 0; pIter < posIterations; pIter++) {
            for (const item of constraints) {
                const n = item.contact.normal;
                if (item.type === "dynamic") {
                    const sA = getShift(item.objA);
                    const sB = getShift(item.objB);
                    const remaining = item.contact.penetration - (sA.clone().sub(sB)).dot(n);
                    const corr = Math.max(remaining - slop, 0) * dynamicPercent;
                    if (corr > 0) {
                        sA.addScaledVector(n, corr * (item.invMassA / item.totalInvMass));
                        sB.addScaledVector(n, -corr * (item.invMassB / item.totalInvMass));
                    }
                } else {
                    const s = getShift(item.obj);
                    const remaining = item.contact.penetration - s.dot(n);
                    const corr = Math.max(remaining - slop, 0) * staticPercent;
                    if (corr > 0) {
                        s.addScaledVector(n, corr);
                    }
                }
            }
        }

        for (const [obj, shift] of posShifts) {
            if (shift.lengthSq() > 0) {
                obj.root.position.add(shift);
                obj.root.updateMatrixWorld();
            }
        }

        // Aggregate per-body support across ALL constraints:
        // >= 3 total contact points (either a flat face OR a leaning body supported by floor + neighbor) is stable;
        // 1-point corner or 2-point single-edge pivots stay awake so gravity can tip them flat.
        const bodyStats = new Map();
        const recordBodyStat = (obj, count, resting) => {
            let stat = bodyStats.get(obj);
            if (!stat) {
                stat = { points: 0, allResting: true };
                bodyStats.set(obj, stat);
            }
            stat.points += count;
            if (!resting) {
                stat.allResting = false;
            }
        };

        for (const item of constraints) {
            const resting = item.contacts.every(c => Math.abs(c.vn0) < 0.4);
            const count = item.contacts.length;
            if (item.type === "static") {
                recordBodyStat(item.obj, count, resting);
            } else {
                recordBodyStat(item.objA, count, resting);
                recordBodyStat(item.objB, count, resting);
            }
        }

        for (const [obj, stat] of bodyStats) {
            if (stat.points >= 3) {
                obj.angularVelocity.multiplyScalar(1 - (obj.rollingResistance ?? 0.05));

                if (stat.allResting) {
                    if (obj.angularVelocity.lengthSq() < 0.03) {
                        obj.angularVelocity.set(0, 0, 0);
                    }
                    if (obj.velocity.lengthSq() < 0.008) {
                        obj.velocity.set(0, 0, 0);
                    }
                }
            }
        }
    }

    solveNormalPass(item) {
        const normal = item.contact.normal;
        const { contacts } = item;
        const len = contacts.length;
        const linearMassSum = item.type === "static" ? item.invMass : item.totalInvMass;
        let linearRatioSum = 0;
        for (const c of contacts) {
            linearRatioSum += linearMassSum / c.denomN;
        }
        const relax = len === 1 ? 1 : Math.min(0.65, 0.9 / Math.max(linearRatioSum, 1e-6));

        if (item.type === "static") {
            const { obj, invMass, invI } = item;
            const totalV = this.getTotalVelocity(obj);
            const totalW = this.getTotalAngularVelocity(obj);
            const deltaV = Vector3(0, 0, 0);
            const deltaW = Vector3(0, 0, 0);

            for (const c of contacts) {
                const vp = totalV.clone().add(totalW.clone().cross(c.r));
                const vn = vp.dot(normal);

                const dJn = ((c.bounceVel - vn) / c.denomN) * relax;
                const prevJn = c.accJn;
                c.accJn = Math.max(0, prevJn + dJn);
                const applyJn = c.accJn - prevJn;

                if (applyJn !== 0) {
                    const impulseN = normal.clone().multiplyScalar(applyJn);
                    deltaV.addScaledVector(impulseN, invMass);
                    deltaW.add(this.applyInvInertia(invI, c.r.clone().cross(impulseN)));
                }
            }

            obj.velocity.add(deltaV);
            obj.angularVelocity.add(deltaW);
            return;
        }

        const { objA, objB, invMassA, invMassB, invIA, invIB } = item;
        const totalVA = this.getTotalVelocity(objA);
        const totalWA = this.getTotalAngularVelocity(objA);
        const totalVB = this.getTotalVelocity(objB);
        const totalWB = this.getTotalAngularVelocity(objB);
        const deltaVA = Vector3(0, 0, 0);
        const deltaVB = Vector3(0, 0, 0);
        const deltaWA = Vector3(0, 0, 0);
        const deltaWB = Vector3(0, 0, 0);

        for (const c of contacts) {
            const vpA = totalVA.clone().add(totalWA.clone().cross(c.rA));
            const vpB = totalVB.clone().add(totalWB.clone().cross(c.rB));
            const vn = vpA.sub(vpB).dot(normal);

            const dJn = ((c.bounceVel - vn) / c.denomN) * relax;
            const prevJn = c.accJn;
            c.accJn = Math.max(0, prevJn + dJn);
            const applyJn = c.accJn - prevJn;

            if (applyJn !== 0) {
                const impulseN = normal.clone().multiplyScalar(applyJn);
                deltaVA.addScaledVector(impulseN, invMassA);
                deltaVB.addScaledVector(impulseN, -invMassB);
                deltaWA.add(this.applyInvInertia(invIA, c.rA.clone().cross(impulseN)));
                deltaWB.add(this.applyInvInertia(invIB, c.rB.clone().cross(impulseN)).negate());
            }
        }

        objA.velocity.add(deltaVA);
        objB.velocity.add(deltaVB);
        objA.angularVelocity.add(deltaWA);
        objB.angularVelocity.add(deltaWB);
    }

    solveFrictionPass(item) {
        const { t1, t2, mu, contacts } = item;
        const len = contacts.length;
        const linearMassSum = item.type === "static" ? item.invMass : item.totalInvMass;
        let linearRatioSum = 0;
        for (const c of contacts) {
            linearRatioSum += linearMassSum / Math.min(c.denomT1, c.denomT2);
        }
        const relax = len === 1 ? 1 : Math.min(0.65, 0.9 / Math.max(linearRatioSum, 1e-6));

        if (item.type === "static") {
            const { obj, invMass, invI } = item;
            const totalV = this.getTotalVelocity(obj);
            const totalW = this.getTotalAngularVelocity(obj);
            const deltaV = Vector3(0, 0, 0);
            const deltaW = Vector3(0, 0, 0);

            for (const c of contacts) {
                if (c.accJn <= 0) {
                    continue;
                }

                const vp = totalV.clone().add(totalW.clone().cross(c.r));
                const dJt1 = (-vp.dot(t1) / c.denomT1) * relax;
                const dJt2 = (-vp.dot(t2) / c.denomT2) * relax;

                const oldJt1 = c.accJt1;
                const oldJt2 = c.accJt2;
                let newJt1 = oldJt1 + dJt1;
                let newJt2 = oldJt2 + dJt2;

                const maxF = mu * c.accJn;
                const magSq = newJt1 * newJt1 + newJt2 * newJt2;
                if (magSq > maxF * maxF) {
                    const scale = maxF / Math.sqrt(magSq);
                    newJt1 *= scale;
                    newJt2 *= scale;
                }

                const applyJt1 = newJt1 - oldJt1;
                const applyJt2 = newJt2 - oldJt2;
                c.accJt1 = newJt1;
                c.accJt2 = newJt2;

                if (applyJt1 !== 0 || applyJt2 !== 0) {
                    const impulseT = t1.clone().multiplyScalar(applyJt1).addScaledVector(t2, applyJt2);
                    deltaV.addScaledVector(impulseT, invMass);
                    deltaW.add(this.applyInvInertia(invI, c.r.clone().cross(impulseT)));
                }
            }

            obj.velocity.add(deltaV);
            obj.angularVelocity.add(deltaW);
            return;
        }

        const { objA, objB, invMassA, invMassB, invIA, invIB } = item;
        const totalVA = this.getTotalVelocity(objA);
        const totalWA = this.getTotalAngularVelocity(objA);
        const totalVB = this.getTotalVelocity(objB);
        const totalWB = this.getTotalAngularVelocity(objB);
        const deltaVA = Vector3(0, 0, 0);
        const deltaVB = Vector3(0, 0, 0);
        const deltaWA = Vector3(0, 0, 0);
        const deltaWB = Vector3(0, 0, 0);

        for (const c of contacts) {
            if (c.accJn <= 0) {
                continue;
            }

            const vpA = totalVA.clone().add(totalWA.clone().cross(c.rA));
            const vpB = totalVB.clone().add(totalWB.clone().cross(c.rB));
            const relVel = vpA.sub(vpB);

            const dJt1 = (-relVel.dot(t1) / c.denomT1) * relax;
            const dJt2 = (-relVel.dot(t2) / c.denomT2) * relax;

            const oldJt1 = c.accJt1;
            const oldJt2 = c.accJt2;
            let newJt1 = oldJt1 + dJt1;
            let newJt2 = oldJt2 + dJt2;

            const maxF = mu * c.accJn;
            const magSq = newJt1 * newJt1 + newJt2 * newJt2;
            if (magSq > maxF * maxF) {
                const scale = maxF / Math.sqrt(magSq);
                newJt1 *= scale;
                newJt2 *= scale;
            }

            const applyJt1 = newJt1 - oldJt1;
            const applyJt2 = newJt2 - oldJt2;
            c.accJt1 = newJt1;
            c.accJt2 = newJt2;

            if (applyJt1 !== 0 || applyJt2 !== 0) {
                const impulseT = t1.clone().multiplyScalar(applyJt1).addScaledVector(t2, applyJt2);
                deltaVA.addScaledVector(impulseT, invMassA);
                deltaVB.addScaledVector(impulseT, -invMassB);
                deltaWA.add(this.applyInvInertia(invIA, c.rA.clone().cross(impulseT)));
                deltaWB.add(this.applyInvInertia(invIB, c.rB.clone().cross(impulseT)).negate());
            }
        }

        objA.velocity.add(deltaVA);
        objB.velocity.add(deltaVB);
        objA.angularVelocity.add(deltaWA);
        objB.angularVelocity.add(deltaWB);
    }

    /** AIMOD
     * prompt 1: it doesn't look like an actual tumble, it bounces in the same axis and rotates one way on collide, how would the actual physics be coded and simulated? 
     * Like velocity changes depending on which point touches the ground first -> I'll let you generate the code for this one, do it for the dynamic vs dynamic resolve as well.
     * 
     * prompt 2: alright I've seen the tumbling, but the tumbling still feels unrealistic. It looks like it doesn't lose momentum while tumbling on flat surfaces -> Help me apply the fixes
     * 
     * prompt 3: we're close, but it has problems when it's about to lose momentum. The rotation goes wrong when momentum is near stopping -> yes (multi-point sequential impulse)
     * 
     * prompt 4: scenario 1-4 failures -> delegates to unified constraint solver
     */
    resolveStatic(obj, contact) {
        this.solveConstraints([this.prepareStaticConstraint(obj, contact)]);
    }

    resolveDynamic(objA, objB, contact) {
        this.solveConstraints([this.prepareDynamicConstraint(objA, objB, contact)]);
    }

    // USER
    getColliderTarget(obj) {
        if (obj.useHitbox && obj.hitbox != null) {
            return obj.hitbox.root;
        }

        return obj.root;
    }

    recordCollision(objA, objB, contact) {
        if (!this.currentCollisions.has(objA)) {
            this.currentCollisions.set(objA, new Set());
        }

        this.currentCollisions.get(objA).add(objB);

        const wasColliding = this.activeCollisions.get(objA)?.has(objB) ?? false;

        if (!wasColliding) {
            for (let bind of objA.onCollision) {
                bind(objA, objB, contact);
            }

            if (!objB.static) {
                const flippedContact = { normal: contact.normal.clone().negate(), penetration: contact.penetration, point: contact.point };

                for (let bind of objB.onCollision) {
                    bind(objB, objA, flippedContact);
                }
            }
        }
    }

    raycast(origin, direction, maxDistance, targets) {
        this.raycaster.set(origin, direction);
        this.raycaster.far = maxDistance;

        return this.raycaster.intersectObjects(targets);
    }
}
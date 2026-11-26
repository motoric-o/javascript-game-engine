/** AIGEN
 * prompt 1: alright lets continue to particle system / I'm going to need you to generate this one for me, lets do that
 * prompt 2: Add an attribute to make persistent lifetime as an option (keep spawned particles in world space when emitter moves)
 * prompt 3: add an option for particles able follow objects persistently
 */
import * as THREE from "three";
import GameObject from "../GameObject.js";
import { Color, Vector3, lerp, randomRange } from "../../Util/index.js";

export default class ParticleEmitter extends GameObject {
    constructor(options = {}) {
        super();

        this.maxParticles = options.maxParticles ?? 200;
        this.rate = options.rate ?? 20;
        this.lifetimeMin = options.lifetimeMin ?? 0.6;
        this.lifetimeMax = options.lifetimeMax ?? 1.4;
        this.speedMin = options.speedMin ?? 1.0;
        this.speedMax = options.speedMax ?? 3.0;
        this.spread = options.spread ?? 0.5;
        this.direction = (options.direction ?? Vector3(0, 1, 0)).clone().normalize();
        this.gravity = (options.gravity ?? Vector3(0, 0, 0)).clone();
        this.startColor = Color(options.startColor ?? 0xffaa33);
        this.endColor = Color(options.endColor ?? 0xff2200);
        this.emitting = options.emitting ?? true;
        this.spawnRadius = options.spawnRadius ?? 0;
        this.persistent = options.persistent ?? false;
        this.emitPosition = (options.position ?? Vector3(0, 0, 0)).clone();
        this.followTarget = options.followTarget ?? null;
        this.followOffset = (options.followOffset ?? Vector3(0, 0, 0)).clone();
        this._tempFollowPos = Vector3(0, 0, 0);

        this.positions = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.particles = [];

        for (let i = 0; i < this.maxParticles; i++) {
            this.positions[i * 3] = 0;
            this.positions[i * 3 + 1] = -99999;
            this.positions[i * 3 + 2] = 0;

            this.colors[i * 3] = this.startColor.r;
            this.colors[i * 3 + 1] = this.startColor.g;
            this.colors[i * 3 + 2] = this.startColor.b;

            this.particles.push({
                alive: false,
                age: 0,
                lifetime: 1,
                vx: 0,
                vy: 0,
                vz: 0
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));

        const material = new THREE.PointsMaterial({
            size: options.size ?? 0.15,
            vertexColors: true,
            transparent: true,
            opacity: options.opacity ?? 0.9,
            blending: options.blending ?? THREE.AdditiveBlending,
            depthWrite: false
        });

        this.root = new THREE.Points(geometry, material);
        this.root.frustumCulled = false;

        if (options.position && !this.persistent) {
            this.root.position.copy(options.position);
        }

        this.spawnAccumulator = 0;

        this.bindToStepped((self, dt) => self.update(dt));
    }

    setPosition(x, y, z) {
        if (this.persistent) {
            this.emitPosition.set(x, y, z);
        } else {
            this.root.position.set(x, y, z);
        }
        return this;
    }

    follow(target, offset = Vector3(0, 0, 0)) {
        this.followTarget = target;
        this.followOffset.copy(offset);
        return this;
    }

    unfollow() {
        this.followTarget = null;
        return this;
    }

    play() {
        this.emitting = true;
        return this;
    }

    stop() {
        this.emitting = false;
        return this;
    }

    spawnOne() {
        let index = -1;
        for (let i = 0; i < this.maxParticles; i++) {
            if (!this.particles[i].alive) {
                index = i;
                break;
            }
        }

        if (index === -1) {
            return;
        }

        const p = this.particles[index];
        p.alive = true;
        p.age = 0;
        p.lifetime = randomRange(this.lifetimeMin, this.lifetimeMax);

        const offsetX = this.spawnRadius > 0 ? randomRange(-this.spawnRadius, this.spawnRadius) : 0;
        const offsetY = this.spawnRadius > 0 ? randomRange(-this.spawnRadius, this.spawnRadius) : 0;
        const offsetZ = this.spawnRadius > 0 ? randomRange(-this.spawnRadius, this.spawnRadius) : 0;

        const baseX = this.persistent ? this.emitPosition.x : 0;
        const baseY = this.persistent ? this.emitPosition.y : 0;
        const baseZ = this.persistent ? this.emitPosition.z : 0;

        this.positions[index * 3] = baseX + offsetX;
        this.positions[index * 3 + 1] = baseY + offsetY;
        this.positions[index * 3 + 2] = baseZ + offsetZ;

        const dir = Vector3(
            this.direction.x + randomRange(-this.spread, this.spread),
            this.direction.y + randomRange(-this.spread, this.spread),
            this.direction.z + randomRange(-this.spread, this.spread)
        ).normalize();

        const speed = randomRange(this.speedMin, this.speedMax);
        p.vx = dir.x * speed;
        p.vy = dir.y * speed;
        p.vz = dir.z * speed;

        this.colors[index * 3] = this.startColor.r;
        this.colors[index * 3 + 1] = this.startColor.g;
        this.colors[index * 3 + 2] = this.startColor.b;
    }

    burst(count = 20) {
        for (let i = 0; i < count; i++) {
            this.spawnOne();
        }
        return this;
    }

    update(dt) {
        if (!this.enabled || this.destroyed) {
            return;
        }

        if (this.followTarget) {
            if (this.followTarget.destroyed) {
                this.followTarget = null;
            } else {
                const targetObj = this.followTarget.root ?? this.followTarget;
                if (targetObj?.getWorldPosition) {
                    targetObj.getWorldPosition(this._tempFollowPos);
                    this.setPosition(
                        this._tempFollowPos.x + this.followOffset.x,
                        this._tempFollowPos.y + this.followOffset.y,
                        this._tempFollowPos.z + this.followOffset.z
                    );
                }
            }
        }

        if (this.emitting && this.rate > 0) {
            this.spawnAccumulator += this.rate * dt;
            while (this.spawnAccumulator >= 1) {
                this.spawnOne();
                this.spawnAccumulator -= 1;
            }
        }

        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particles[i];
            if (!p.alive) {
                continue;
            }

            p.age += dt;
            if (p.age >= p.lifetime) {
                p.alive = false;
                this.positions[i * 3] = 0;
                this.positions[i * 3 + 1] = -99999;
                this.positions[i * 3 + 2] = 0;
                continue;
            }

            p.vx += this.gravity.x * dt;
            p.vy += this.gravity.y * dt;
            p.vz += this.gravity.z * dt;

            this.positions[i * 3] += p.vx * dt;
            this.positions[i * 3 + 1] += p.vy * dt;
            this.positions[i * 3 + 2] += p.vz * dt;

            const t = p.age / p.lifetime;
            this.colors[i * 3] = lerp(this.startColor.r, this.endColor.r, t);
            this.colors[i * 3 + 1] = lerp(this.startColor.g, this.endColor.g, t);
            this.colors[i * 3 + 2] = lerp(this.startColor.b, this.endColor.b, t);
        }

        this.root.geometry.attributes.position.needsUpdate = true;
        this.root.geometry.attributes.color.needsUpdate = true;
    }

    destroy() {
        super.destroy();
        this.root.geometry.dispose();
        this.root.material.dispose();
    }
}

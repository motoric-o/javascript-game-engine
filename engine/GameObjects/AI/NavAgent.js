import GameObject from "../GameObject.js";
import { Vector3 } from "../../Util/Math.js";

export default class NavAgent extends GameObject {
    constructor(name = "NavAgent") {
        super();

        this.name = name;
        this.root = this;
        
        this.zoneName = "default";
        this.target = null;
        this.path = [];
        this.currentIndex = 0;

        this.stoppingDistance = 1.5;
        this.waypointTolerance = 0.4;
        this.repathInterval = 0.25;
        this.repathTimer = 0;
    }

    setZone(zoneName) {
        this.zoneName = zoneName
        this.path = [];
        this.currentIndex = 0;
        if (this.target) {
            this.repathTimer = this.repathInterval
        }
        else {
            this.repathTimer = 0
        }
        return this;
    }

    setTarget(vec3) {
        if (!this.target && vec3) {
            this.repathTimer = this.repathInterval;
        }

        this.target = vec3;

        return this;
    }

    clearTarget() {
        this.target = null;
        this.path = [];
        this.currentIndex = 0;
        this.repathTimer = 0;

        return this;
    }

    setStoppingDistance(distance) {
        this.stoppingDistance = Math.max(0,distance);

        return this;
    }

    setRepathInterval(seconds) {
        this.repathInterval = Math.max(0.01,seconds);

        return this;
    }

    hasReachedTarget() {
        if (!this.parent || !this.target) {
            return false;
        }

        const distance = this.parent.getPosition().distanceTo(this.target);

        return distance <= this.stoppingDistance;
    }

    update(dt, navigation) {
        const noDirection = Vector3(0,0,0);

        if (
            !this.parent ||
            !this.target ||
            !navigation?.hasZone(this.zoneName)
        ) return noDirection;

        if (this.hasReachedTarget()) {
            this.path = [];
            this.currentIndex = 0;
            
            return noDirection
        }

        this.repathTimer += dt

        if (this.repathTimer >= this.repathInterval) {
            this.repathTimer = 0;

            this.path = navigation.findPath(
                this.parent.getPosition(),
                this.target,
                this.zoneName
            );

            this.currentIndex = 0
        }

        if (this.path.length === 0) {
            return noDirection;
        }

        while (this.currentIndex < this.path.length) {
            const waypoint = this.path[this.currentIndex];
            const position = this.parent.getPosition();

            const dx = waypoint.x - position.x;
            const dz = waypoint.z - position.z;
            const toleranceSq = Math.pow(this.waypointTolerance,2)

            if (Math.pow(dx,2) + Math.pow(dz,2) >= toleranceSq) {
                break;
            }

            this.currentIndex++;
        }

        if (this.currentIndex >= this.path.length) {
            return noDirection;
        }

        const waypoint = this.path[this.currentIndex];
        const direction = Vector3().subVectors(
            waypoint,
            this.parent.getPosition()
        );

        direction.y = 0

        if (direction.lengthSq() === 0) {
            return noDirection;
        }

        return direction.normalize()

    }
}

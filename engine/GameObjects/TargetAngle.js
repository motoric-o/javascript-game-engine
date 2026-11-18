import { Quaternion } from "../Util/Math.js";
import GameObject from "./GameObject.js";

export default class TargetAngle extends GameObject {
    constructor(name) {
        super();

        this.name = name;
        this.root = this;

        this.targetAngle = Quaternion(0, 0, 0);
        this.duration = 1;
        this.elapsed = 0;
    }

    setTargetAngle(angle) {
        this.targetAngle = angle;
        return this;
    }

    setDuration(time) {
        this.duration = time;
        return this;
    }
}
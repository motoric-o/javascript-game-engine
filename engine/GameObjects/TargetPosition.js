import { Vector3 } from "../Util/Math.js";
import GameObject from "./GameObject.js";

export default class TargetPosition extends GameObject {
    constructor(name) {
        super();

        this.name = name;
        this.root = this;

        this.targetPosition = Vector3(0, 0, 0);
        this.duration = 1;
        this.elapsed = 0;
    }

    setTargetPosition(position) {
        this.targetPosition = position;
        return this;
    }

    setDuration(time) {
        this.duration = time;
        return this;
    }
}
import { Vector3 } from "../../Util/Math.js";
import GameObject from "../GameObject.js";

export default class AngularVelocity extends GameObject {
    constructor(name) {
        super();

        this.name = name;
        this.root = this;

        this.velocity = Vector3(0, 0, 0);
    }

    setVelocity(velocity) {
        this.velocity = velocity;
        return this;
    }
}
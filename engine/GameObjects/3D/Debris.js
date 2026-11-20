import PhysicalObject from "./PhysicalObject.js";

export default class Debris extends PhysicalObject {
    constructor(root, timeout) {
        super(root);

        this.timeout = timeout;
        this.accumulated = 0;
    }
}
import Object from "./Object.js";

export default class Debris extends Object {
    constructor(root, timeout) {
        super(root);

        this.timeout = timeout;
        this.accumulated = 0;
    }
}
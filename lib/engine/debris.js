export default class Debris {
    constructor() {
        this.stack = [];
    }

    addObject(object, timeout) {
        this.stack.push({
            object: object,
            timeout: timeout,
            accumulated: 0
        });
    }

    update(delta) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const debris = this.stack[i];
            if (debris.accumulated >= debris.timeout) {
                this.stack[i].object.destroy();
                this.stack.splice(i, 1);
            } else {
                debris.accumulated += delta;
            }
        }
    }
}
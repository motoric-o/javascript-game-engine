export default class Scene {
    constructor() {
        this.data = {};

        this.dynamicObjects = [];
        this.staticObjects = [];

        this.stepped = [];
    }

    addObject(obj) {
        obj.setStatic(false);
        this.dynamicObjects.push(obj); 

        for (let bind of obj.onSpawn) {
            bind(obj);
        }
    }

    addStaticObject(obj) {
        obj.setStatic(true);
        this.staticObjects.push(obj);

        for (let bind of obj.onSpawn) {
            bind(obj);
        }
    }

    bindToUpdate(func) {
        this.stepped.push(func);
    }

    unbindFromUpdate(func) {
        const idx = this.stepped.indexOf(func);
        if (idx != -1) {
            this.stepped.splice(idx, 1);
        }
    }
}
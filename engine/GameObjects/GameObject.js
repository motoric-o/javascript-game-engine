import { Vector3 } from "../Util/index.js";

export default class GameObject {
    constructor() {
        this.tags = [];
        this.children = [];
        this.parent = null;

        // Events and Binds
        this.onSpawn = [];
        this.stepped = [];
        this.onDestroy = [];

        this.enabled = true;

        this.static = false;
        this.destroyed = false;
    }

    setTag(tag) {
        this.tags.push(tag);
        return this;
    }

    removeTag(tag) {
        const idx = this.tags.indexOf(tag);

        if (idx != -1) {
            this.tags.splice(idx, 1);
        }
    }

    addChild(obj) {
        if (!(obj instanceof GameObject)) {
            console.error("ERROR: Child must be a Game Object!");
            return this;
        }

        this.children.push(obj);
        obj.parent = this;
        
        return this;
    }

    removeChild(obj) {
        const idx = this.children.indexOf(obj);
        if (idx != -1) {
            this.children.splice(idx, 1);
        }
    }

    bindOnSpawn(fn) {
        this.onSpawn.push(fn);
        return this;
    }

    unbindOnSpawn(fn) {
        const idx = this.onSpawn.indexOf(fn);
        if (idx != -1) {
            this.onSpawn.splice(idx, 1);
        }
    }

    bindToStepped(fn) {
        if (this.static) {
            console.error("ERROR: Update binds are not supported for static objects!")
            return this;
        }
        this.stepped.push(fn);
        return this;
    }

    unbindStepped(fn) {
        const idx = this.stepped.indexOf(fn);
        if (idx != -1) {
            this.stepped.splice(idx, 1);
        }
    }

    bindOnDestroy(fn) {
        this.onDestroy.push(fn);
        return this;
    }

    unbindOnDestroy(fn) {
        const idx = this.onDestroy.indexOf(fn);
        if (idx != -1) {
            this.onDestroy.splice(idx, 1);
        }
    }

    setStatic(isStatic) {
        this.static = isStatic;
        return this;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        for (let bind of this.onDestroy) {
            bind(this);
        }

        if (this.children.length > 0) {
            for (let child of this.children) {
                child.destroy();
            }
        }
    }
}
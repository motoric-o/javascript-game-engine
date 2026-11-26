export default class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (!this.listeners.has(event)) {
            return;
        }

        const set = this.listeners.get(event);
        set.delete(callback);
        
        if (set.size == 0) {
            this.listeners.delete(event);
        }
    }

    once(event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        }
        return this.on(event, wrapper);
    }

    emit(event, ...args) {
        if (!this.listeners.has(event)) {
            return;
        }

        for (let callback of [...this.listeners.get(event)]) {
            callback(...args);
        }
    }

    clear(event = null) {
        if (event != null) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}
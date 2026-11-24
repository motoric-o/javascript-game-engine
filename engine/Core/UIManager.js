import UIElement from "../GameObjects/UI/UIElement.js";

export default class UIManager {
    constructor(parentContainer = document.body) {
        this.parentContainer = parentContainer;
        this.container = document.createElement("div");
        this.container.classList.add("ui-container");
        this.elements = new Map();

        this.parentContainer.appendChild(this.container);
    }

    addElement(el) {
        if (!(el instanceof UIElement)) {
            console.error("ERROR: UI element must be a UIElement instance!");
            return this;
        }

        if (this.elements.has(el.name)) {
            this.removeElement(el.name);
        }

        this.elements.set(el.name, el);
        el.mount(this.container);
        return this;
    }

    removeElement(nameOrEl) {
        const el = this.resolve(nameOrEl);
        if (!el) {
            return this;
        }

        el.destroy();
        this.elements.delete(el.name);
        return this;
    }

    getElement(name) {
        return this.elements.get(name) || null;
    }

    show(nameOrEl) {
        const el = this.resolve(nameOrEl);
        if (el) {
            el.show();
        }
        return this;
    }

    hide(nameOrEl) {
        const el = this.resolve(nameOrEl);
        if (el) {
            el.hide();
        }
        return this;
    }

    clear() {
        for (const el of this.elements.values()) {
            el.destroy();
        }
        this.elements.clear();
        return this;
    }

    mountSceneUI(scene) {
        if (!scene || !scene.uiElements) {
            return this;
        }

        for (const el of scene.uiElements) {
            this.addElement(el);
        }
        return this;
    }

    unmountSceneUI(scene) {
        if (!scene || !scene.uiElements) {
            return this;
        }

        for (const el of scene.uiElements) {
            this.removeElement(el);
        }
        return this;
    }

    resolve(nameOrEl) {
        if (nameOrEl instanceof UIElement) {
            return nameOrEl;
        }
        return this.elements.get(nameOrEl) || null;
    }
}

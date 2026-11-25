import { Vector2 } from "../Util/index.js";

export default class InputManager {
    constructor(targetElement) {
        this.element = targetElement;

        this.keysDowns = [];
        this.keysPressed = [];
        this.keysReleased = [];

        this.mouseButtonsDown = [];
        this.mouseButtonsPressed = [];
        this.mouseButtonReleased = [];

        this.mousePosition = Vector2(0, 0);
        this.mouseDelta = Vector2(0, 0);
        this.wheelDelta = 0;

        this.contexts = ["gameplay"];

        this.attachListeners();
    }

    getActiveContext() {
        return this.contexts[this.contexts.length - 1];
    }

    setContext(context) {
        this.contexts = [context];
    }

    pushContext(context) {
        this.contexts.push(context);
    }

    popContext() {
        if (this.contexts.length > 1) {
            this.contexts.pop();
        }
    }

    isActiveContext(context) {
        if (context == "any" || context == this.getActiveContext()) {
            return true;
        }

        return false;
    }

    attachListeners() {
        window.addEventListener("keydown", (event) => {
            let key = event.key.toLowerCase();
            if (!this.keysDowns.includes(key)) {
                this.keysPressed.push(key);
                this.keysDowns.push(key);
            }
        });

        window.addEventListener("keyup", (event) => {
            let key = event.key.toLowerCase();
            let found = this.keysDowns.indexOf(key);
            if (found !== -1) {
                this.keysDowns.splice(found, 1);
                this.keysReleased.push(key);
            }
        });

        this.element.addEventListener("mousemove", (event) => {
            this.mousePosition.x = event.offsetX;
            this.mousePosition.y = event.offsetY;

            this.mouseDelta.x += event.movementX;
            this.mouseDelta.y += event.movementY;
        })

        this.element.addEventListener("mousedown", (event) => {
            if (!this.mouseButtonsDown.includes(event.button)) {
                this.mouseButtonsPressed.push(event.button);
                this.mouseButtonsDown.push(event.button);
            }
        })

        window.addEventListener("mouseup", (event) => {
            let found = this.mouseButtonsDown.indexOf(event.button);
            if (found !== -1) {
                this.mouseButtonsDown.splice(found, 1);
                this.mouseButtonReleased.push(event.button);
            }
        })

        this.element.addEventListener("wheel", (event) => {
            this.wheelDelta += event.deltaY;
        })

        this.element.addEventListener("contextmenu", (e) => e.preventDefault());

        window.addEventListener("blur", () => {
            this.keysDowns = [];
            this.mouseButtonsDown = [];
        })
    }

    update() {
        this.mouseDelta.set(0, 0);
        this.keysPressed.length = 0;
        this.keysReleased.length = 0;
        this.mouseButtonsPressed.length = 0;
        this.mouseButtonReleased.length = 0;
        this.wheelDelta = 0;
    }

    isKeyDown(key, context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return false;
        }
        return this.keysDowns.includes(key.toLowerCase());
    }

    isKeyPressed(key, context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return false;
        }
        return this.keysPressed.includes(key.toLowerCase());
    }

    isKeyReleased(key, context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return false;
        }
        return this.keysReleased.includes(key.toLowerCase());
    }

    isMouseDown(button, context = "gameplay") {if (!this.isActiveContext(context)) {
            return false;
        }
        return this.mouseButtonsDown.includes(button);
    }

    isMousePressed(button, context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return false;
        }
        return this.mouseButtonsPressed.includes(button);
    }

    isMouseReleased(button, context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return false;
        }
        return this.mouseButtonReleased.includes(button);
    }

    getMousePosition() {
        return this.mousePosition;
    }

    getMouseDelta(context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return Vector2(0, 0);
        }
        return this.mouseDelta;
    }

    getWheelDelta(context = "gameplay") {
        if (!this.isActiveContext(context)) {
            return 0;
        }
        return this.wheelDelta;
    }

    lockPointer() {
        this.element.requestPointerLock();
    }

    unlockPointer() {
        document.exitPointerLock();
    }

    isPointerLocked() {
        return document.pointerLockElement == this.element;
    }

    getMouseNDC() {
        return Vector2(((2 * this.mousePosition.x) / this.element.clientWidth) - 1, -((2 * this.mousePosition.y) / this.element.clientHeight) + 1);
    }
}
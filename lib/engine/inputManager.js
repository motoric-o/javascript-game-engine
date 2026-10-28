import {Vector2} from "../graphics/primitive/vector2.js";

export default class InputManager {
    constructor(targetElement) {
        this.element = targetElement

        this.keysDowns = []
        this.keysPressed = []
        this.keysReleased = []

        this.mouseButtonsDown = []
        this.mouseButtonsPressed = []
        this.mouseButtonReleased = []

        this.mousePosition = Vector2(0,0)
        this.wheelDelta = 0

        this.attachListeners();

    }

    attachListeners(){
        window.addEventListener("keydown", (event) => {
            let key = event.key.toLowerCase();
            if (!this.keysDowns.includes(event.key))
            {
                this.keysPressed.push(event.key)
                this.keysDowns.push(event.key)
            }
        });

        window.addEventListener("keyup", (event) => {
            let key = event.key.toLowerCase();
            let found = this.keysDowns.indexOf(event.key)
            if (found !== -1)
            {
                this.keysDowns.splice(found, 1)
            }
            this.keysReleased.push(event.key)
        });

        this.element.addEventListener("mousemove", (event) => {
            this.mousePosition.x = event.offsetX
            this.mousePosition.y = event.offsetY
        })

        this.element.addEventListener("mousedown", (event) => {
            if (!this.mouseButtonsDown.includes(event.button))
            {
                this.mouseButtonsPressed.push(event.button)
                this.mouseButtonsDown.push(event.button)
            }
        })

        window.addEventListener("mouseup", (event) => {
            let found = this.mouseButtonsDown.indexOf(event.button)
            if (found !== -1)
            {
                this.mouseButtonsDown.splice(found, 1)
            }
            this.mouseButtonReleased.push(event.button)
        })

        this.element.addEventListener("wheel", (event) => {
            this.wheelDelta = event.deltaY
        })

    }

    update(){
        this.keysPressed.length = 0
        this.keysReleased.length = 0
        this.mouseButtonsPressed.length = 0
        this.mouseButtonReleased.length = 0
        this.wheelDelta = 0
    }

    isKeyDown(key){
        return this.keysDowns.includes(key.toLowerCase())
    }

    isKeyPressed(key){
        return this.keysPressed.includes(key.toLowerCase())
    }

    isKeyReleased(key){
        return this.keysReleased.includes(key.toLowerCase())
    }

    isMouseDown(button){
        return this.mouseButtonsDown.includes(button)
    }

    isMousePressed(button){
        return this.mouseButtonsPressed.includes(button)
    }

    isMouseReleased(button){
        return this.mouseButtonReleased.includes(button)
    }

    getMousePosition(){
        return this.mousePosition
    }

    getWheelDelta(){
        return this.wheelDelta
    }
}
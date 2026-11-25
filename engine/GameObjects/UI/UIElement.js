import GameObject from "../GameObject.js";
export default class UIElement extends GameObject {
    constructor(name, options = {}) {
        super();

        const {
            tag = "span",
            text = "",
            interactive = true,
            visible = true,
            layer = "",
            style = null
        } = options;

        this.name = name;
        this.root = document.createElement(tag);
        this.root.style.position = "absolute";

        this.visible = true;
        this.interactive = true;
        this.layer = layer;
        this.listeners = [];

        this.setInteractive(interactive);
        this.setVisible(visible);
        this.setText(text);

        if (style != null) {
            this.setStyle(style);
        }
    }

    mount(container) {
        container.appendChild(this.root);
        return this;
    }

    unmount() {
        if (this.root.parentNode) {
            this.root.remove();
        }
        return this;
    }

    getElement() {
        return this.root;
    }

    setText(text) {
        this.root.textContent = text;
        return this;
    }

    getText() {
        return this.root.textContent;
    }

    setHTML(html) {
        this.root.innerHTML = html;
        return this;
    }

    setStyle(style, value) {
        if (typeof style === "object" && style !== null) {
            Object.assign(this.root.style, style);
        } else if (value !== undefined) {
            this.root.style[style] = value;
        }
        return this;
    }

    addClass(name) {
        this.root.classList.add(name);
        return this;
    }

    removeClass(name) {
        this.root.classList.remove(name);
        return this;
    }

    toggleClass(name) {
        this.root.classList.toggle(name);
        return this;
    }

    hasClass(name) {
        return this.root.classList.contains(name);
    }

    setVisible(visible) {
        this.visible = Boolean(visible);
        this.root.style.display = this.visible ? "" : "none";
        return this;
    }

    show() {
        return this.setVisible(true);
    }

    hide() {
        return this.setVisible(false);
    }

    setInteractive(interactive) {
        this.interactive = Boolean(interactive);
        this.root.classList.toggle("ui", this.interactive);
        return this;
    }

    bindEvent(eventName, fn) {
        const handler = (event) => fn(this, event);
        this.root.addEventListener(eventName, handler);
        this.listeners.push({ event: eventName, handler, fn });
        return this;
    }

    unbindEvent(eventName, fn) {
        for (let i = this.listeners.length - 1; i >= 0; i--) {
            const listener = this.listeners[i];
            if (listener.event === eventName && listener.fn === fn) {
                this.root.removeEventListener(eventName, listener.handler);
                this.listeners.splice(i, 1);
            }
        }
        return this;
    }

    bindOnClick(fn) {
        return this.bindEvent("click", fn);
    }

    bindClick(fn) {
        return this.bindEvent("click", fn);
    }

    unbindClick(fn) {
        return this.unbindEvent("click", fn);
    }

    bindHover(fn) {
        return this.bindEvent("mouseenter", fn);
    }

    unbindHover(fn) {
        return this.unbindEvent("mouseenter", fn);
    }

    bindHoverEnd(fn) {
        return this.bindEvent("mouseleave", fn);
    }

    unbindHoverEnd(fn) {
        return this.unbindEvent("mouseleave", fn);
    }

    animate(gsapVars) {
        const gsap = typeof window !== "undefined" ? window.gsap : undefined;
        if (!gsap) {
            console.warn("UIElement.animate: gsap is not loaded. Install gsap and expose it as window.gsap to tween UI.");
            return this;
        }
        gsap.to(this.root, gsapVars);
        return this;
    }

    setPosition(x, y) {
        return this.setX(x).setY(y);
    }

    setX(x) {
        this.root.style.left = `${x}px`;
        return this;
    }

    setY(y) {
        this.root.style.top = `${y}px`;
        return this;
    }

    setSize(width, height) {
        return this.setWidth(width).setHeight(height);
    }

    setWidth(width) {
        this.root.style.width = `${width}px`;
        return this;
    }

    setHeight(height) {
        this.root.style.height = `${height}px`;
        return this;
    }

    setZIndex(z) {
        this.root.style.zIndex = z;
        return this;
    }

    setColor(color) {
        this.root.style.color = color;
        return this;
    }

    setFontSize(size) {
        this.root.style.fontSize = `${size}px`;
        return this;
    }

    setBackground(color) {
        this.root.style.backgroundColor = color;
        return this;
    }

    setPadding(value) {
        this.root.style.padding = typeof value === "number" ? `${value}px` : value;
        return this;
    }

    setOpacity(value) {
        this.root.style.opacity = value;
        return this;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        for (const { event, handler } of this.listeners) {
            this.root.removeEventListener(event, handler);
        }
        this.listeners = [];

        this.unmount();
        super.destroy();
    }
}

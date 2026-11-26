// USER
import * as THREE from "three";

export default class DebugManager {
    constructor(enabled = false) {
        this.enabled = enabled;
        this.helpers = [];
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.fps = 0;

        this.overlayDiv = document.createElement("div");
        /** AIGEN
         * prompt: I've written the codes for them, but I need your help on making the overlay div, also review the rest of the code
         */
        Object.assign(this.overlayDiv.style, {
            position: "fixed",
            top: "10px",
            left: "10px",
            padding: "6px 10px",
            background: "rgba(0, 0, 0, 0.65)",
            color: "#00ff88",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.4",
            whiteSpace: "pre",
            borderRadius: "4px",
            pointerEvents: "none",
            zIndex: "9999"
        });
        document.body.appendChild(this.overlayDiv);

        // USER
        this.colliderLines = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ vertexColors: true })
        );
       
        this.colliderLines.frustumCulled = false;

        this.setEnabled(enabled);
    }

    // USER
    setEnabled(value) {
        this.enabled = value;
        this.overlayDiv.style.display = value ? "block" : "none";
        this.colliderLines.visible = value;

        for (let help of this.helpers) {
            help.visible = value;
        }
    }

    toggle() {
        this.setEnabled(!this.enabled);
    }

    attachToScene(scene) {
        scene.root.add(this.colliderLines);
        for (let help of this.helpers) {
            scene.root.add(help);
        }
    }

    detachFromScene(scene) {
        scene.root.remove(this.colliderLines);
        for (let help of this.helpers) {
            scene.root.remove(help);
        }
    }

    addGrid(size = 50, divisions = 50) {
        const grid = new THREE.GridHelper(size, divisions);
        grid.visible = this.enabled;
        this.helpers.push(grid);

        return grid;
    }

    addAxes(size = 5) {
        const axes = new THREE.AxesHelper(size);
        axes.visible = this.enabled;
        this.helpers.push(axes);

        return axes;
    }

    addShadowHelper(directionalLight) {
        const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
        helper.visible = this.enabled;
        this.helpers.push(helper);

        return helper;
    }

    update(dt, game) {
        if (!this.enabled) {
            return;
        }

        this.frameCount += 1;
        this.fpsTimer += dt;

        if (this.fpsTimer >= 0.5) {
            this.fps = Math.round(this.frameCount / this.fpsTimer);
            /** AIGEN
             * prompt: I've written the codes for them, but I need your help on making the overlay div, also review the rest of the code
             */
            const ms = (this.fpsTimer / this.frameCount * 1000).toFixed(1);
            // USER
            this.frameCount = 0;
            this.fpsTimer = 0;

            /** AIGEN
             * prompt: I've written the codes for them, but I need your help on making the overlay div, also review the rest of the code
             */
            this.overlayDiv.textContent =
                `FPS: ${this.fps} (${ms} ms)\n` +
                `Dyn: ${game.dynamicObjects.length} | Stat: ${game.staticObjects.length}`;
            // USER
        }

        if (game.Physics.isReady && game.Physics.world) {
            const { vertices, colors } = game.Physics.world.debugRender();
            this.colliderLines.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
            this.colliderLines.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
        }
    }
}
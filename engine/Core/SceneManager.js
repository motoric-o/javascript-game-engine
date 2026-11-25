import GameScene from "../GameObjects/Scene/GameScene.js";

export default class SceneManager {
    constructor() {
        this.scenes = new Map();

        this.currentScene = null;
    }

    addScene(scene) {
        if (!(scene instanceof GameScene)) {
            console.error("ERROR: Object must be a GameScene class object!")
            return;
        }

        this.scenes.set(scene.name, scene);
    }

    removeScene(name) {
        if (!this.scenes.has(name)) {
            console.warn("WARNING: Scene was not found.")
            return;
        }

        this.scenes.delete(name);
    }

    enterScene(next, game) {
        if (next == null) {
            console.error("ERROR: No scene was passed.");
            return;
        }

        if (game == null) {
            console.error("ERROR: Missing argument game to switch scenes.");
            return;
        }

        const nextScene = this.scenes.get(next);

        if (nextScene == null) {
            console.error("ERROR: Scene name doesn't exist.");
            return;
        }

        /** AIMOD
         * prompt: migrate physics engine to Rapier3D (unregister exiting scene bodies, filter destroyed, register entering scene bodies)
         */
        if (this.currentScene != null) {
            for (let bind of this.currentScene.onExit) {
                bind(this.currentScene);
            }
            for (let obj of this.currentScene.dynamicObjects) {
                game.physics.unregisterBody(obj);
            }
            for (let obj of this.currentScene.staticObjects) {
                game.physics.unregisterBody(obj);
            }
            game.stepped = game.stepped.filter(item => !this.currentScene.stepped.includes(item));
            game.dynamicObjects = game.dynamicObjects.filter(item => !this.currentScene.dynamicObjects.includes(item));
            game.staticObjects = game.staticObjects.filter(item => !this.currentScene.staticObjects.includes(item));
        }

        this.currentScene = nextScene;

        game.camera = this.currentScene.camera;
        game.camera.onResize(game.settings.width, game.settings.height);

        for (let object of game.dynamicObjects) {
            if (object.root?.isObject3D) {
                this.currentScene.root.add(object.root);
            }
            if (game.physics.isReady && !object.rigidBody) {
                game.physics.registerBody(object);
            }
        }

        for (let object of game.staticObjects) {
            if (object.root?.isObject3D) {
                this.currentScene.root.add(object.root);
            }
            if (game.physics.isReady && !object.rigidBody) {
                game.physics.registerBody(object);
            }
        }

        const activeDyn = this.currentScene.dynamicObjects.filter(o => !o.destroyed);
        const activeStat = this.currentScene.staticObjects.filter(o => !o.destroyed);

        if (game.physics.isReady) {
            for (let obj of activeDyn) {
                game.physics.registerBody(obj);
            }
            for (let obj of activeStat) {
                game.physics.registerBody(obj);
            }
        }

        game.dynamicObjects = [...game.dynamicObjects, ...activeDyn];
        game.staticObjects = [...game.staticObjects, ...activeStat];
        game.stepped = [...game.stepped, ...this.currentScene.stepped];

        // USER

        for (let bind of this.currentScene.onEnter) {
            bind(this.currentScene);
        }
    }
}
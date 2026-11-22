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

        if (this.currentScene != null) {
            for (let bind of this.currentScene.onExit) {
                bind(this.currentScene);
            }
            game.stepped = game.stepped.filter(item => !this.currentScene.stepped.includes(item));
            game.dynamicObjects = game.dynamicObjects.filter(item => !this.currentScene.dynamicObjects.includes(item));
            game.staticObjects = game.staticObjects.filter(item => !this.currentScene.staticObjects.includes(item));

            game.physics.currentCollisions.clear();
            game.physics.activeCollisions.clear();
        }

        this.currentScene = nextScene;

        game.camera = this.currentScene.camera;
        game.camera.onResize(game.settings.width, game.settings.height);

        for (let object of game.dynamicObjects) {
            if (object.root?.isObject3D) {
                this.currentScene.root.add(object.root);
            }
        }

        for (let object of game.staticObjects) {
            if (object.root?.isObject3D) {
                this.currentScene.root.add(object.root);
            }
        }

        game.dynamicObjects = [...game.dynamicObjects, ...this.currentScene.dynamicObjects];
        game.staticObjects = [...game.staticObjects, ...this.currentScene.staticObjects];
        game.stepped = [...game.stepped, ...this.currentScene.stepped];

        for (let bind of this.currentScene.onEnter) {
            bind(this.currentScene);
        }
    }
}
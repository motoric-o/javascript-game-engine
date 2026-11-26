import * as THREE from "three";
import { Vector3 } from "../../Util/index.js";

export default class Environment {
    constructor() {
        this.lights = [];
        this.background = null;
        this.environmentMap = null;
        this.fog = null;
    }

    addAmbientLight(color, intensity) {
        const light = new THREE.AmbientLight(color, intensity);
        this.lights.push(light);

        return light;
    }

    addHemisphereLight(skyColor, groundColor, intensity) {
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        this.lights.push(light);

        return light;
    }

    addDirectionalLight(color, intensity, position, shadowConfig = {}) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.copy(position)

        if (shadowConfig.castShadow) {
            light.castShadow = true;
            const size = shadowConfig.mapSize ?? 2048;
            const extent = shadowConfig.extent ?? 30;

            light.shadow.mapSize.set(size, size);
            light.shadow.camera.left = -extent;
            light.shadow.camera.right = extent;
            light.shadow.camera.top = extent;
            light.shadow.camera.bottom = -extent;
            light.shadow.camera.near = shadowConfig.near ?? 0.5;
            light.shadow.camera.far = shadowConfig.far ?? 100;
            light.shadow.bias = shadowConfig.bias ?? -0.0005;
        }
        this.lights.push(light);
        
        return light;
    }

    addPointLight(color = new THREE.Color(0xffffff), intensity = 1, position = Vector3(0, 0, 0), distance = 0, decay = 2, castShadow = true) {
        const light = new THREE.PointLight(color, intensity, distance, decay);
        light.position.copy(position);
        light.castShadow = castShadow;
        this.lights.push(light);

        return light;
    }

    addSpotLight(color = new THREE.Color(0xffffff), intensity = 1, position = Vector3(0, 0, 0), targetPos = Vector3(0, 0, 0), angle = Math.PI / 4, penumbra = 0, distance = 0, decay = 2, castShadow = true) {
        const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
        light.position.copy(position);
        light.target.position.copy(targetPos);
        light.castShadow = castShadow;
        this.lights.push(light);
        
        return light;
    }

    setBackground(texture) {
        this.background = texture;
        return this;
    }

    setEnvironmentMap(texture) {
        this.environmentMap = texture;
        return this;
    }

    setFog(color, near, far) {
        this.fog = new THREE.Fog(color, near, far);
        return this;
    }

    setExpFog(color, density) {
        this.fog = new THREE.FogExp2(color, density);
        return this;
    }

    apply(scene) {
        for (let light of this.lights) {
            scene.root.add(light);

            if (light.target) {
                scene.root.add(light.target)
            }
        }

        scene.root.background = this.background;
        scene.root.environment = this.environmentMap;
        scene.root.fog = this.fog;
    }

    clear(scene) {
        for (let light of this.lights) {
            scene.root.remove(light);

            if (light.target) {
                scene.root.remove(light.target);
            }
        }
        scene.root.background = null;
        scene.root.environment = null;
        scene.root.fog = null;
    }
}
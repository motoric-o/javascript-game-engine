import * as THREE from "three";

export function Group() {
    return new THREE.Group();
}

export function disposeObject(obj) {
    THREE.disposeObject(obj);
}

export function getGameObjectFromChild(obj) {
    let current = obj;

    while (current) {
        if (current.userData.gameObject) {
            return current.userData.gameObject;
        }

        current = current.parent;
    }

    return null;
}

export function worldToScreen(worldPos, camera, width, height) {
    return THREE.worldToScreen(worldPos, camera, width, height);
}

export function screenToWorld(screenPos, camera, width, height) {
    return THREE.screenToWorld(screenPos, camera, width, height);
}
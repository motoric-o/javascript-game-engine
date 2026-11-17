import * as THREE from "three";

export function Box3(min, max) {
    return new THREE.Box3(min, max);
}

export function Box3FromObject(obj) {
    return new THREE.Box3().setFromObject(obj);
}

export function Sphere(center, radius) {
    return new THREE.Sphere(center, radius);
}

export function Raycaster(origin, direction, near, far) {
    return new THREE.Raycaster(origin, direction, near, far);
}
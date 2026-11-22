import * as THREE from "three";

export function Vector2(x, y) {
    return new THREE.Vector2(x, y);
}

export function Vector3(x, y, z) {
    return new THREE.Vector3(x, y, z);
}

export function Vector4(x, y, z, w) {
    return new THREE.Vector4(x, y, z, w);
}

export function Euler(x, y, z, order) {
    return new THREE.Euler(x, y, z, order);
}

export function Quaternion(x, y, z, w) {
    return new THREE.Quaternion(x, y, z, w);
}

export function Matrix4() {
    return new THREE.Matrix4();
}

export function Color(value) {
    return new THREE.Color(value);
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

export function lerp(a, b, t) {
    return a + t * (b - a);
}

export function damp(a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export function degToRad(deg) {
    return deg * (Math.PI / 180);
}

export function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

export function randomRange(min, max) {
    return (Math.random() * (max - min) + min);
}

export function randomRangeInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
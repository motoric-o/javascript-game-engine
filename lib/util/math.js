export function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

export function toRad(degree) {
    return degree * Math.PI/180;
}

export function toDeg(rad) {
    return rad * 180/Math.PI;
}
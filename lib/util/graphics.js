import * as primitive from "../graphics/primitive/index.js";

export function createFillInfo(fillType, colors, coordinate) {
    if (fillType != "FF" && fillType != "BF") {
        return { fillType: "FF", colors: colors, coords: coordinate };
    }
    return { fillType: fillType, colors: colors, coords: coordinate };
}

export function getCentroid(points) {
    let x = 0;
    let y = 0;

    for (let point of points) {
        x += point.x;
        y += point.y;
    }

    return primitive.Vector2(Math.round(x / points.length), Math.round(y / points.length));
}

export function getScreenCentroid(w, h) {
    const points = [
        primitive.Vector2(0, 0),
        primitive.Vector2(w, 0),
        primitive.Vector2(w, h),
        primitive.Vector2(0, h)
    ];

    return getCentroid(points);
}
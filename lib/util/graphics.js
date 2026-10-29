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

export function getFrame(x = 0, y = 0, w = 0, h = 0) {
    return {
        x: x,
        y: y,
        height: h,
        width: w
    }
}

// Use -1 at the end to loop the animation, use none to not make it loop
export function createAnimation(name, sequence, sequenceDirection = "C", framerate = 60) {
    return {
        name: name,
        sequence: sequence,
        sequenceDirection: sequenceDirection,
        framerate: framerate
    }
}

export function createShake(intensity = primitive.Vector2(0, 0), duration = 0, offset = primitive.Vector2(0, 0)) {
    return {
        intensity: intensity,
        timer: duration,
        offset: offset
    }
}

export async function createAsset(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;

        img.onload = function (e) {
            const h = img.naturalHeight;
            const w = img.naturalWidth;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.height = h;
            tempCanvas.width = w;
            
            const ctx = tempCanvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const asset = {
                height: h,
                width: w,
                data: ctx.getImageData(0, 0, w, h).data
            };

            resolve(asset);
        }

        img.onerror = function (e) {
            reject(new Error("Failed to load asset."));
        }
    })
}
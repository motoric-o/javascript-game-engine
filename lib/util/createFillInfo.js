export default function createFillInfo(fillType, colors, coordinate) {
    if (fillType != "FF" && fillType != "BF") {
        return { fillType: "FF", colors: colors, coords: coordinate };
    }
    return { fillType: fillType, colors: colors, coords: coordinate };
}
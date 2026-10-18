// Rico Dharmawan - 2472041

import * as primitive from './index.js';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export class Pixel {
    constructor(image_data) {
        this.image_data = image_data;
        this.width = image_data.width;
        this.height = image_data.height;
    }

    in_bounds(x, y) {
        return (Math.round(x) >= 0 && Math.round(x) < this.width) && (Math.round(y) >= 0 && Math.round(y) < this.height);
    }

    get_pixel_index(x, y) {
        x = Math.round(x);
        y = Math.round(y);

        let index = 4 * (x + (y * this.width));
        return {
            r: index,
            g: index + 1,
            b: index + 2,
            a: index + 3
        }
    }

    get_pixel_color(x, y) {
        let pixel = this.get_pixel_index(x, y);
        return primitive.Color(
            this.image_data.data[pixel.r],
            this.image_data.data[pixel.g],
            this.image_data.data[pixel.b],
            this.image_data.data[pixel.a]
        );
    }

    compareColor(color1, color2) {
        if (!color1 || !color2) return false;
        return (
            color1.r === color2.r &&
            color1.g === color2.g &&
            color1.b === color2.b &&
            color1.a === color2.a
        );
    }

    draw_pixel(x, y, color) {
        let processedX = Math.round(x);
        let processedY = Math.round(y);
        let pixel = this.get_pixel_index(processedX, processedY);
        let colorObj = primitive.Color(color.r, color.g, color.b, color.a);
        if (this.in_bounds(x, y)) {
            this.image_data.data[pixel.r] = colorObj.r;
            this.image_data.data[pixel.g] = colorObj.g;
            this.image_data.data[pixel.b] = colorObj.b;
            this.image_data.data[pixel.a] = colorObj.a;
        }
    }

    clearCanvas() {
        for (let i = 0; i < this.image_data.data.length; i++) {
            this.image_data.data[i] = 0;
        }
    }
}
// Rico Dharmawan - 2472041

import * as primitive from './index.js';

export class Line {
    constructor(image_data) {
        this.image_data = image_data;
        this.pixel = new primitive.Pixel(image_data);
    }

    draw(start, end, color) {
        let delta_x = Math.abs(end.x - start.x);
        let delta_y = Math.abs(end.y - start.y);

        let grad = Math.abs(delta_y) / delta_x;
        if (delta_x >= delta_y) {
            if (end.x < start.x) {
                let y = start.y;
                for (let x = start.x; x >= end.x; x--) {
                    this.pixel.draw_pixel(x, y, color);
                    if (end.y > start.y) {
                        y = y + grad;
                    } else {
                        y = y - grad;
                    }
                }
            } else {
                let y = start.y;
                for (let x = start.x; x <= end.x; x++) {
                    this.pixel.draw_pixel(x, y, color);
                    if (end.y > start.y) {
                        y = y + grad;
                    } else {
                        y = y - grad;
                    }
                }
            }
        } else {
            if (end.y < start.y) {
                let x = start.x
                for (let y = start.y; y >= end.y; y--) {
                    this.pixel.draw_pixel(x, y, color)
                    if (end.x > start.x) {
                        x = x + 1 / grad;
                    } else {
                        x = x - 1 / grad;
                    }
                }
            } else {
                let x = start.x
                for (let y = start.y; y <= end.y; y++) {
                    this.pixel.draw_pixel(x, y, color)
                    if (end.x > start.x) {
                        x = x + 1 / grad;
                    } else {
                        x = x - 1 / grad;
                    }
                }
            }
        }
    }
}
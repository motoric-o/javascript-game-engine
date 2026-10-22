// Rico Dharmawan - 2472041

import { clamp } from '../util/math.js';
import * as primitive from './primitive/index.js';

export default class Coloring {
    constructor(image_data, pixel, width, height) {
        this.image_data = image_data;
        this.width = width;
        this.height = height;
        this.pixel = pixel || new primitive.Pixel(image_data);
    }

    floodFill(coordinate, color) {
        let start_color = this.pixel.get_pixel_color(coordinate.x, coordinate.y);
        if (this.pixel.compareColor(start_color, color)) {
            return;
        }

        let stack = [coordinate];
        let visited = [];

        while (stack.length > 0) {
            let dot = stack.pop();
            visited.push(dot);

            if (!this.pixel.in_bounds(dot.x, dot.y)) {
                continue;
            }

            let current_color = this.pixel.get_pixel_color(dot.x, dot.y);
            if (!this.pixel.compareColor(current_color, start_color)) {
                continue;
            }

            this.pixel.draw_pixel(dot.x, dot.y, color);

            stack.push(primitive.Vector2(dot.x + 1, dot.y));
            stack.push(primitive.Vector2(dot.x - 1, dot.y));
            stack.push(primitive.Vector2(dot.x, dot.y + 1));
            stack.push(primitive.Vector2(dot.x, dot.y - 1));
        }

        // Gap Filler
        for (let dot of visited) {
            let dot_color = this.pixel.get_pixel_color(dot.x, dot.y);
            
            if (dot_color.a != color.a) {
                this.pixel.draw_pixel(dot.x, dot.y, color);
            }
        }
    }

    boundaryFill(coordinate, color, boundary_color) {
        let stack = [coordinate];

        while (stack.length > 0) {
            let dot = stack.pop();

            if (!this.pixel.in_bounds(dot.x, dot.y)) {
                continue;
            }

            let current_color = this.pixel.get_pixel_color(dot.x, dot.y);

            if (this.pixel.compareColor(current_color, color)) {
                continue;
            }

            if (typeof boundary_color[Symbol.iterator] == "function") {
                let cont = false;

                for (let color of boundary_color) {
                    if (this.pixel.compareColor(current_color, color)) {
                        cont = true;
                        break;
                    }
                }

                if (cont) {
                    continue;
                }
            } else {
                if (this.pixel.compareColor(current_color, boundary_color)) {
                    continue;
                }
            }

            this.pixel.draw_pixel(dot.x, dot.y, color);

            stack.push(primitive.Vector2(dot.x + 1, dot.y));
            stack.push(primitive.Vector2(dot.x - 1, dot.y));
            stack.push(primitive.Vector2(dot.x, dot.y + 1));
            stack.push(primitive.Vector2(dot.x, dot.y - 1));
        }
    }

    fillFromInfo(fillInfo, localAnchor) {
        let x = localAnchor.x + fillInfo.coords.x;
        let y = localAnchor.y + fillInfo.coords.y;

        x = clamp(Math.round(x), 0, this.width - 1);
        y = clamp(Math.round(y), 0, this.height - 1)

        if (fillInfo.fillType == "FF") {
            this.floodFill(primitive.Vector2(x, y), fillInfo.colors[0]);
        } else if (fillInfo.fillType == "BF") {
            this.boundaryFill(primitive.Vector2(x, y), fillInfo.colors[0], fillInfo.colors[1]);
        }
    }
}

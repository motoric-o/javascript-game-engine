// Rico Dharmawan - 2472041

import * as primitive from './primitive/index.js';
import { Coloring } from './coloring.js';
import { Shapes } from './shapes.js';
import { Transform } from './transform.js';

export class graphicsLib {
    constructor(context, canvas) {
        this.context = context;
        this.canvas = canvas
        this.height = canvas.height;
        this.width = canvas.width;
        this.image_data = context.getImageData(0, 0, this.width, this.height);
        this.Pixel = new primitive.Pixel(this.image_data);
        this.Line = new primitive.Line(this.image_data);
        this.Coloring = new Coloring(this.image_data, this.Pixel, this.width, this.height);
        this.Shapes = new Shapes(this.image_data, this.Pixel, this.Line);
        this.Transform = new Transform(this.image_data, this.Pixel, this.Line)
        this.Util = {
            Vector2: primitive.Vector2,
            Color: primitive.Color
        }
    }

    // clearScreen() {
    //     this.context.clearRect(0, 0, this.height, this.width);
    //     this.image_data = this.context.getImageData(0, 0, this.width, this.height);
    // }

    getCentroid(points) {
        let x = 0;
        let y = 0;

        for (let point of points) {
            x += point.x;
            y += point.y;
        }

        return primitive.Vector2(Math.round(x / points.length), Math.round(y / points.length));
    }

    putImageData() {
        this.context.putImageData(this.image_data, 0, 0);
    }

    refreshScreen() {
        for (let i = 0; i <= this.height; i++) {
            this.Line.draw(primitive.Vector2(0, i), primitive.Vector2(this.width, i), primitive.Color(0, 0, 0, 0));
        }

        this.context.putImageData(this.image_data, 0, 0);
    }
}

// Rico Dharmawan - 2472041

import * as primitive from './primitive/index.js';

export default class Shapes {
    constructor(image_data, pixel, line) {
        this.image_data = image_data;
        this.pixel = pixel || new primitive.Pixel(image_data);
        this.line = line || new primitive.Line(image_data);
    }

    naive_circle(coordinate, radius, color) {
        for (let x = coordinate.x - radius; x <= coordinate.x + radius; x++) {
            let y = Math.sqrt(radius**2 - (x - coordinate.x)**2) + coordinate.y;
            let min_y = -Math.sqrt(radius**2 - (x - coordinate.x)**2) + coordinate.y;
            this.pixel.draw_pixel(x, y, color);
            this.pixel.draw_pixel(x, min_y, color);
            this.pixel.draw_pixel(y, x, color);
            this.pixel.draw_pixel(min_y, x, color);
        }
    }

    polar_circle(coordinate, radius, color) {
        for (let theta = 0; theta <= Math.PI*2; theta += 1/radius) {
            let x = coordinate.x + radius * Math.cos(theta);
            let y = coordinate.y + radius * Math.sin(theta);
            this.pixel.draw_pixel(x, y, color);
        }
    }

    ellipse(coordinate, rx, ry, color) {
        let radius = rx;
        if (ry > rx) {
            radius = ry;
        }
        for (let theta = 0; theta <= Math.PI*2; theta += 1/radius) {
            let x = coordinate.x + rx * Math.cos(theta);
            let y = coordinate.y + ry * Math.sin(theta);
            this.pixel.draw_pixel(x, y, color);
        }
    }

    sun(coordinate, radius, rays, color) {
        this.naive_circle(coordinate, radius, color);

        for (let theta = 0; theta <= Math.PI*2; theta += Math.PI*2 / rays) {
            let x = coordinate.x + radius * Math.cos(theta);
            let y = coordinate.y + radius * Math.sin(theta);
            
            let length = Math.random() * 40 + 20;
    
            let end_x = x + length * Math.cos(theta);
            let end_y = y + length * Math.sin(theta);
    
            this.line.draw({x: x, y: y}, {x: end_x, y: end_y}, color);
        }
    }

    spiral(coordinate, count, color) {
        for (let theta = 0; theta <= Math.PI*count; theta += 0.001) {
            let radius = theta * 5;
            let x = coordinate.x + radius * Math.cos(theta);
            let y = coordinate.y + radius * Math.sin(theta);
            this.pixel.draw_pixel(x, y, color);
        }   
    }

    flower_wave(coordinate, radius, n, amplitude, color) {
        let inc = 0.001;
        if (1/radius <= 0.001) {
            inc = 1/radius;
        }
    
        for (let theta = 0; theta <= Math.PI*2; theta += inc) {
            let r_theta = radius + amplitude * Math.sin(n * theta);
            let x = coordinate.x + r_theta * Math.cos(theta);
            let y = coordinate.y + r_theta * Math.sin(theta);
            this.pixel.draw_pixel(x, y, color);
        }
    }

    polygon(array_titik, color) {
        for (let i = 0; i < array_titik.length; i++) {
            let next = i+1;
            if (next >= array_titik.length) {
                next = 0;
            }
            this.line.draw(array_titik[i], array_titik[next], color);
        }
    }
}
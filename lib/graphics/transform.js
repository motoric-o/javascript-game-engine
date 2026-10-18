// Rico Dharmawan - 2472041

import * as primitive from './primitive/index.js';

export class Transform {
    constructor(image_data, pixel, line) {
        this.image_data = image_data;
        this.pixel = pixel || new primitive.Pixel(image_data);
        this.line = line || new primitive.Line(image_data);
    }

    distance(point1, point2) {
        return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y, point2.x) ** 2);
    }

    findNearestToZero(points) {
        let nearest = points[0];
        let nearest_dist = this.distance(points[0], primitive.Vector2(0, 0));
        for (let point of points) {
            if (this.distance(point, primitive.Vector2(0, 0)) < nearest_dist) {
                nearest = point;
            }
        }

        return nearest;
    }

    translate(point, translation) {
        return primitive.Vector2(point.x + translation.x, point.y + translation.y);
    }

    translate_multiple(points, translation) {
        let results = [];
        for (let point of points) {
            results.push(this.translate(point, translation));
        }
        return results;
    }

    scale(point, multiplier) {
        return primitive.Vector2(point.x * multiplier, point.y * multiplier)
    }

    scale_multiple(points, multiplier, anchor) {
        let offset = anchor || primitive.Vector2(0, 0);

        let anchored = this.translate_multiple(points, primitive.Vector2(-offset.x, -offset.y));
        let scaled = []

        for (let point of anchored) {
            scaled.push(this.scale(point, multiplier));
        }

        return this.translate_multiple(scaled, offset);
    }

    rotate(point, theta) {
        return primitive.Vector2(point.x * Math.cos(theta) - point.y * Math.sin(theta), point.y * Math.cos(theta) + point.x * Math.sin(theta));
    }

    rotate_multiple(points, theta, anchor) {
        let offset = anchor || primitive.Vector2(0, 0);
        let anchored = this.translate_multiple(points, primitive.Vector2(-offset.x, -offset.y));
        let rotated = []

        for (let point of anchored) {
            rotated.push(this.rotate(point, theta));
        }

        return this.translate_multiple(rotated, offset);
    }
}
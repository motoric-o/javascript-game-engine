// Rico Dharmawan - 2472041

import MatrixClass from '../util/matrix.js';
import * as primitive from './primitive/index.js';

const matrix = MatrixClass;

export default class Transform {
    constructor(image_data, pixel, line) {
        this.image_data = image_data;
        this.pixel = pixel || new primitive.Pixel(image_data);
        this.line = line || new primitive.Line(image_data);
    }

    magnitude(point1, point2) {
        if (!point2) {
            return Math.sqrt(point1.x ** 2 + point1.y ** 2);
        }
        return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
    }

    magnitude2(point1, point2) {
        return (point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2;
    }

    findNearest(points, target) {
        let nearest = points[0];
        let t = target || primitive.Vector2(0, 0);
        let nearest_dist = this.magnitude(points[0], t);
        for (let point of points) {
            if (this.magnitude(point, t) < nearest_dist) {
                nearest = point;
            }
        }

        return nearest;
    }

    findNearestByMagnitude2(points, target) {
        let nearest = points[0];
        let t = target || primitive.Vector2(0, 0);
        let nearest_dist = this.magnitude2(points[0], t);
        for (let point of points) {
            if (this.magnitude2(point, t) < nearest_dist) {
                nearest = point;
            }
        }

        return nearest;
    }

    create_transform(tx = 0, ty = 0, theta = 0, sx = 1, sy = 1) {
        const translation = matrix.create_translation(tx, ty);
        const rotation = matrix.create_rotation(theta);
        const scale = matrix.create_scale(sx, sy);

        return matrix.multiply(matrix.multiply(translation, rotation), scale);
    }

    create_transform_from_point(tx = 0, ty = 0, theta = 0, sx = 1, sy = 1) {
        const rotation = matrix.create_fixedp_rotation(tx, ty, theta);
        const scale = matrix.create_fixedp_scale(tx, ty, sx, sy);

        return matrix.multiply(rotation, scale);
    }

    combine_transform(matrix1, matrix2) {
        return matrix.multiply(matrix1, matrix2);
    }

    transform(point, tMatrix) {
        const pMatrix = matrix.create_empty_matrix(3, 1);
        pMatrix[0][0] = point.x;
        pMatrix[1][0] = point.y;
        pMatrix[2][0] = 1;

        const transformed = matrix.multiply(tMatrix, pMatrix);

        return primitive.Vector2(transformed[0][0], transformed[1][0]);
    }

    transform_multiple(points, tMatrix) {
        let transformed = [];
        for (let point of points) {
            transformed.push(this.transform(point, tMatrix));
        }

        return transformed;
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

    normal(vector) {
        let magnitude = this.magnitude(vector)
        if (magnitude == 0) {
            return primitive.Vector2(0, 0);
        }
        return primitive.Vector2(-vector.y / magnitude, vector.x / magnitude);
    }

    unit(vector) {
        let magnitude = this.magnitude(vector);
        if (magnitude == 0) {
            return primitive.Vector2(0, 0);
        }
        return primitive.Vector2(vector.x / magnitude, vector.y / magnitude);
    }

    project(point, axis) {
        return point.x * axis.x + point.y * axis.y;
    }

    projectPolygon(polygon, axis) {
        const first = this.project(polygon[0], axis);
        let min = first;
        let max = first;

        for (let i = 0; i < polygon.length; i++) {
            const proj = this.project(polygon[i], axis);
            if (proj < min) {
                min = proj;
            }

            if (proj > max) {
                max = proj;
            }
        }

        return { min: min, max: max };
    }

    projectCircle(center, radius, axis) {
        const proj = this.project(center, axis);

        return { min: proj - radius, max: proj + radius };
    }

    checkOverlap(projA, projB) {
        return !(projA.max < projB.min || projB.max < projA.min);
    }

    // scale(point, multiplier) {
    //     return primitive.Vector2(point.x * multiplier, point.y * multiplier)
    // }

    // scale_multiple(points, multiplier, anchor) {
    //     let offset = anchor || primitive.Vector2(0, 0);

    //     let anchored = this.translate_multiple(points, primitive.Vector2(-offset.x, -offset.y));
    //     let scaled = []

    //     for (let point of anchored) {
    //         scaled.push(this.scale(point, multiplier));
    //     }

    //     return this.translate_multiple(scaled, offset);
    // }

    // rotate(point, theta) {
    //     return primitive.Vector2(point.x * Math.cos(theta) - point.y * Math.sin(theta), point.y * Math.cos(theta) + point.x * Math.sin(theta));
    // }

    // rotate_multiple(points, theta, anchor) {
    //     let offset = anchor || primitive.Vector2(0, 0);
    //     let anchored = this.translate_multiple(points, primitive.Vector2(-offset.x, -offset.y));
    //     let rotated = []

    //     for (let point of anchored) {
    //         rotated.push(this.rotate(point, theta));
    //     }

    //     return this.translate_multiple(rotated, offset);
    // }
}
export default class MatrixClass {
    constructor() {

    }

    static multiply(A, B) {
        let result = this.create_empty_matrix(A.length, B[0].length);

        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < B[0].length; j++) {
                for (let k = 0; k < A[0].length; k++) {
                    result[i][j] += (A[i][k] * B[k][j]);
                }
            }
        }

        return result;
    }

    static invert3x3(matrix) {
        const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

        if (det == 0) {
            return this.identity()
        } else {
            const a = matrix[1][1] / det;
            const b = -matrix[1][0] / det;
            const c = -matrix[0][1] / det;
            const d = matrix[0][0] / det;

            const tx = (matrix[0][1] * matrix[1][2] - matrix[1][1] * matrix[0][2]) / det;
            const ty = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) / det;

            return [
                [a, c, tx],
                [b, d, ty],
                [0, 0, 1]
            ];
        }
    }

    static create_empty_matrix(dimR, dimC) {
        let matrix = [];
        for (let r = 0; r < dimR; r++) {
            matrix.push([]);
            for (let c = 0; c < dimC; c++) {
                matrix[r].push(0);
            }
        }

        return matrix;
    }

    static identity() {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    static create_translation(tx, ty) {
        return [
            [1, 0, tx],
            [0, 1, ty],
            [0, 0, 1]
        ]
    }

    static create_scale(sx, sy) {
        return [
            [sx, 0, 0],
            [0, sy, 0],
            [0, 0, 1]
        ]
    }

    static create_rotation(theta) {
        return [
            [Math.cos(theta), -Math.sin(theta), 0],
            [Math.sin(theta), Math.cos(theta), 0],
            [0, 0, 1]
        ]
    }

    static create_fixedp_rotation(xc, yc, theta) {
        return this.multiply(this.multiply(this.create_translation(xc, yc), this.create_rotation(theta)), this.create_translation(-xc, -yc));
    }

    static create_fixedp_scale(xc, yc, sx, sy) {
        return this.multiply(this.multiply(this.create_translation(xc, yc), this.create_scale(sx, sy)), this.create_translation(-xc, -yc));
    }
}
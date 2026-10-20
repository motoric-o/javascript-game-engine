import { Color, Vector2 } from "../graphics/primitive/index.js";
import createFillInfo from "../util/createFillInfo.js";
import { clamp } from "../util/math.js"

export default class GameObject {
    constructor() {
        this.name = "";
        this.id = "";
        this.position = Vector2(0, 0);
        this.velocity = Vector2(0, 0);
        this.angVelocity = 0;
        this.fill = null;
        this.localVertices = [];
        this.hitbox = null;
        this.radius = 0;
        this.color = Color(0, 0, 0);
        this.rotation = 0;
        this.scale = Vector2(1, 1);
        this.visible = true;
        this.parent = null;
        this.children = [];
        this.binds = [];
        this.custom_attributes = {};
        this.graphics = null;
        this.active = false;
        this.destroyed = false;
    }
    
    setName(name) {
        this.name = name;
        return this;
    }
    
    setFill(fill) {
        this.fill = fill;
        return this;
    }

    setPosition(coord) {
        this.position = Vector2(coord.x, coord.y);
        return this;
    }

    setVelocity(vec) {
        this.velocity = vec;
        return this;
    }

    setAngVelocity(velocity) {
        this.angVelocity = velocity;
        return this;
    }

    setVertices(vertices) {
        this.localVertices = vertices;
        return this;
    }

    setRadius(radius) {
        this.radius = radius;
        return this;
    }

    setColor(color) {
        this.color = color;
        return this;
    }

    setRotation(theta) {
        this.rotation = theta;
        return this;
    }

    setScale(scale) {
        this.scale = scale;
        return this;
    }

    setVisible(visible) {
        this.visible = visible;
        return this;
    }

    setId(layer, index) {
        this.id = `${layer}-${index}`;
        if (this.name != "") {
            this.id += `-${this.name}`
        }
        return this;
    }

    setGraphics(graphics) {
        this.graphics = graphics;
        return this;
    }

    isActive(active) {
        this.active = active;
        return this;
    }

    bindToUpdate(fn) {
        this.binds.push(fn);
        return this;
    }

    addAttribute(key, value) {
        this.custom_attributes[key] = value;
        return this;
    }
    
    getShapeType() {
        if (this.radius > 0) {
            return "circle";
        }

        if (this.localVertices.length > 2) {
            return "polygon";
        } else if (this.localVertices.length == 2) {
            return "line";
        }

        if (this.localVertices.length == 1 && this.radius == 0) {
            return "pixel";
        }

        return "empty";
    }

    updatePosition(coord) {
        this.position = Vector2(coord.x, coord.y);
    }

    updateRotation(theta) {
        this.rotation = theta;
    }

    updateScale(scale) {
        this.scale = scale;
    }

    addChild(child) {
        this.children.push(child);
        if (child.parent != null) {
            child.parent.removeChild(this.id);
        }
        child.setParent(this);
    }

    removeChild(id) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].id == id) {
                this.children.splice(i, 1);
            }
        }
    }

    setParent(parent) {
        if (this.parent != null) {
            this.parent.removeChild(this.id);
        }
        this.parent = parent;
        parent.addChild(this);
    }

    getUpdatedVertices(transform) {
        if (!this.localVertices.length) return [];
        const transformation = transform.create_transform(this.position.x, this.position.y, this.rotation, this.scale.x, this.scale.y);
        let vertices = transform.transform_multiple(this.localVertices, transformation);
        return vertices;
    }

    update(deltaTime) {
        for (let fn of this.binds) {
            fn(this, deltaTime);
        }
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.rotation += this.angVelocity * deltaTime;
    }

    getMinMaxCoords() {
        let minX;
        let maxX;
        let minY;
        let maxY;


        if (this.getShapeType() == 'circle') {
            minX = this.position.x - this.radius;
            maxX = this.position.x + this.radius;
            minY = this.position.y - this.radius;
            maxY = this.position.y + this.radius;
        } else if (this.getShapeType() == 'polygon') {
            const vertices = this.getUpdatedVertices(this.graphics.Transform);
            for (let i = 0; i < vertices.length; i++) {
                let vertex = vertices[i];
                if (i == 0) {
                    minX = vertex.x;
                    maxX = vertex.x;
                    minY = vertex.y;
                    maxY = vertex.y;
                }

                minX = Math.min(minX, vertex.x);
                maxX = Math.max(maxX, vertex.x);
                minY = Math.min(minY, vertex.y);
                maxY = Math.max(maxY, vertex.y); 
            }
        }

        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        }
    }

    checkInBound(coordinate) {
        const x = coordinate.x;
        const y = coordinate.y;
        
        if (this.getShapeType() == "circle") {
            if ((x - this.position.x)**2 + (y - this.position.y)**2 >= (this.radius)**2) {
                return false;
            } else {
                return true;
            }
        }
        
        if (this.getShapeType() == "polygon") {
            const vertices = this.getUpdatedVertices(this.graphics.Transform);
            const bounds = this.getMinMaxCoords();

            if (bounds.maxX < this.graphics.width && bounds.minX >= 0 && bounds.maxY < this.graphics.height && bounds.minY >= 0) {
                return true;
            } else {
                let isInside = false;
    
                for (let i = 0; i < vertices.length; i++) {
                    const v1 = vertices[i];
                    const v2 = vertices[i+1] || vertices[0];
    
                    if ((v1.y >= y && v2.y <= y) || (v1.y <= y && v2.y >= y)) {
                        const intersect = v1.x + ((y - v1.y)/(v2.y - v1.y)) * (v2.x - v1.x);
                        if (intersect > x) {
                            isInside = !isInside;
                        }
                    }
                }
    
                return isInside;
            }
            

        }
    }

    checkVisibility(coords) {
        const bounds = coords || this.getMinMaxCoords();
        if (coords) {
            if (coords.x >= this.graphics.width || coords.x < 0 || coords.y >= this.graphics.height || coords.y < 0) {
                return false;
            }
        } else {
            if (((bounds.maxX >= this.graphics.width && bounds.minX >= this.graphics.width) || (bounds.maxX < 0 && bounds.minX < 0) || (bounds.maxY >= this.graphics.height && bounds.minY >= this.graphics.height) || (bounds.maxY < 0 && bounds.minY < 0))) {
                return false;
            }
        }
        return true;
    }

    getCollision(object) {
        const bounds = this.getMinMaxCoords();
        
        let hit = {
            top: false,
            bottom: false,
            left: false,
            right: false
        }

        if (object) {
            const objBounds = object.getBounds();

            const objMinX = objBounds.minX;
            const objMaxX = objBounds.maxX;
            const objMinY = objBounds.minY;
            const objMaxY = objBounds.maxY;
    
    
            if (objMinX >= maxX) {
                hit.right = true;
            }
    
            if (objMaxX >= minX) {
                hit.left = true;
            }
    
            if (objMinY >= maxY) {
                hit.top = true;
            }
    
            if (objMaxY <= minY) {
                hit.bottom = true;
            }
        } else {
            if (this.getShapeType() == "circle") {
                if (this.graphics.width - this.position.x <= this.radius) {
                    hit.right = true;
                }

                if (this.position.x <= this.radius) {
                    hit.left = true;
                }

                if (this.graphics.height - this.position.y <= this.radius) {
                    hit.bottom = true;
                }

                if (this.position.y <= this.radius) {
                    hit.top = true;
                }
            } else {
                const minX = bounds.minX;
                const maxX = bounds.maxX;
                const minY = bounds.minY;
                const maxY = bounds.maxY;

                if (maxX >= this.graphics.width) {
                    hit.right = true;
                }

                if (minX <= 0) {
                    hit.left = true;
                }

                if (maxY >= this.graphics.height) {
                    hit.bottom = true;
                }

                if (minY <= 0) {
                    hit.top = true;
                }
            }
        }

        return hit;
    }

    checkCollision(hits) {
        for(let [key, value] of Object.entries(hits)) {
            if (value) {
                return true;
            }
        }

        return false;
    }

    draw() {
        if (!this.visible) return;
        
        let x = 0;
        let y = 0;
        let rotOffset = 0;
        let newFill = null;

        if (this.fill) {
            newFill = createFillInfo(this.fill.fillType, this.fill.colors, this.fill.coords);
        }

        if (this.checkVisibility() && !this.isActive) {
            this.visible = false;
            return;
        }

        if (!this.graphics.Pixel.in_bounds(this.position.x - newFill.coords.x, this.position.y - newFill.coords.y) && newFill) {
            if (this.position.x > this.graphics.width) {
                x = this.position.x - this.graphics.width + 1;
                rotOffset = Math.PI - (2 * Math.PI)
            }
    
            if (this.position.x < 0) {
                x = this.position.x;
            }
    
            if (this.position.y > this.graphics.height) {
                y = this.position.y - this.graphics.height + 1;
                rotOffset = Math.PI / 2;
            }
    
            if (this.position.y < 0) {
                y = this.position.y;
                rotOffset = -Math.PI / 2;
            }
    
            if (this.getShapeType() == "polygon") {
                const rotated = this.graphics.Transform.rotate_multiple([Vector2(x, y)], this.rotation + rotOffset);
                x = rotated[0].x;
                y = rotated[0].y;
    
                if (this.position.x > this.graphics.width) {
                    if (this.position.y - y < this.position.y) {
                        y += Math.ceil(((this.position.x - x) - this.graphics.width) / 2);
                    } else {
                        y -= Math.ceil(((this.position.x - x) - this.graphics.width) / 2);
                    }
                }
    
                if (this.position.x < 0) {
                    if (this.position.y - y < this.position.y) {
                        y -= Math.floor((this.position.x - x) / 2);
                    } else {
                        y += Math.floor((this.position.x - x) / 2);
                    }
                }
    
                if (this.position.y > this.graphics.height) {
                    
                    if (this.position.x - x < this.position.x) {
                        x += Math.ceil(((this.position.y - y) - this.graphics.height) / 2);
                    } else {
                        x -= Math.ceil(((this.position.y - y) - this.graphics.height) / 2);
                    }
                }
    
                if (this.position.y < 0) {
                    if (this.position.x - x < this.position.x) {
                        x -= Math.floor(((this.position.y - y)) / 2);
                    } else {
                        x += Math.floor(((this.position.y - y)) / 2);
                    }
                }
            }

            newFill.coords = Vector2(x, y);
        }

        if (this.getShapeType() == "circle") {
            this.graphics.Shapes.polar_circle(this.position, this.radius, this.color);

            const inBoundCheck = this.checkInBound(Vector2(clamp(this.position.x - x, 0, this.graphics.width - 1), clamp(this.position.y - y, 0, this.graphics.height - 1)))
            
            if (newFill && inBoundCheck) {
                this.graphics.Coloring.fillFromInfo(newFill, this.position);
            }
        } else if (this.getShapeType() == "polygon" || this.getShapeType() == "line") {
            const vertices = this.getUpdatedVertices(this.graphics.Transform);
            this.graphics.Shapes.polygon(vertices, this.color);
            
            const inBoundCheck = this.checkInBound(Vector2(clamp(this.position.x - x, 0, this.graphics.width - 1), clamp(this.position.y - y, 0, this.graphics.height - 1)))

            if (newFill && inBoundCheck) {
                this.graphics.Coloring.fillFromInfo(newFill, this.position);
            }
        } else {
            this.graphics.Pixel.draw_pixel(this.position.x, this.position.y, this.color);
        }
    }

    destroy() {
        this.visible = false;
        this.active = false;
        this.destroyed = true;
        
        for (let child of this.children) {
            child.destroy();
        }
    }
}
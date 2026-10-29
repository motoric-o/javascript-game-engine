import { Color, Vector2 } from "../graphics/primitive/index.js";
import { createFillInfo, getFrame } from "../util/graphics.js";
import { clamp } from "../util/math.js"
import MatrixClass from "../util/matrix.js";
import Sprite from "./sprite.js";

const matrix = MatrixClass;

export default class GameObject {
    constructor() {
        this.name = "";
        this.id = "";
        this.position = Vector2(0, 0);
        this.localPosition = Vector2(0, 0);
        this.velocity = Vector2(0, 0);
        this.angVelocity = 0;
        this.fills = [];
        this.localVertices = [];
        this.hitbox = null;
        this.radius = 0;
        this.color = Color(0, 0, 0);
        this.rotation = 0;
        this.localRotation = 0;
        this.scale = Vector2(1, 1);
        this.localScale = Vector2(1, 1);
        this.visible = true;
        this.parent = null;
        this.children = [];
        this.binds = [];
        this.onCollisionBinds = [];
        this.collisionBlacklist = [];
        this.collisionLayerBlacklist = [];
        this.custom_attributes = {};
        this.graphics = null;
        this.active = false;
        this.destroyed = false;
        this.layer = 0;
        this.sprite = null;
        this.useCamera = true;
    }

    setName(name) {
        this.name = name;
        return this;
    }

    setFills(fills) {
        this.fills = fills;
        return this;
    }

    setPosition(coord) {
        this.position = Vector2(coord.x, coord.y);
        return this;
    }

    setLocalPosition(coord) {
        this.localPosition = Vector2(coord.x, coord.y);
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

    setLocalRotation(theta) {
        this.localRotation = theta;
        return this;
    }

    setScale(scale) {
        this.scale = scale;

        return this;
    }

    setLocalScale(scale) {
        this.localScale = scale;
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

    isActive(active) {
        this.active = active;
        return this;
    }

    setLayer(layer) {
        this.layer = layer;
        return this;
    }

    setGraphics(graphics) {
        this.graphics = graphics;
        if (this.sprite) {
            this.sprite.setGraphics(graphics);
        }
        return this;
    }

    bindToUpdate(fn) {
        this.binds.push(fn);
        return this;
    }

    bindOnCollision(fn) {
        this.onCollisionBinds.push(fn);
        return this;
    }

    addToCollisionBlacklist(item) {
        if (!this.collisionBlacklist.includes(item)) {
            this.collisionBlacklist.push(item);
        }
        
        return this;
    }

    removeFromCollisionBlacklist(item) {
        const index = this.collisionBlacklist.indexOf(item);

        if (index == -1) {
            return;
        }

        this.collisionBlacklist.splice(index, 1);
    }

    addToCollisionLayerBlacklist(layer) {
        if (!this.collisionLayerBlacklist.includes(layer)) {
            this.collisionLayerBlacklist.push(layer);
        }

        return this;
    }

    removeFromCollisionLayerBlacklist(layer) {
        const index = this.collisionLayerBlacklist.indexOf(layer);

        if (index == -1) {
            return;
        }

        this.collisionLayerBlacklist.splice(index, 1);
    }

    addAttribute(key, value) {
        this.custom_attributes[key] = value;
        return this;
    }

    setSprite(asset, frameDim) {
        let f;

        if (frameDim) {
            f = getFrame(0, 0, frameDim.x, frameDim.y);
        } else {
            f = getFrame(0, 0, asset.width, asset.height);
        }

        this.sprite = new Sprite(asset, f, this.graphics);

        const hh = f.height / 2;
        const hw = f.width / 2;

        this.setVertices([
            Vector2(-hw, -hh),
            Vector2(hw, -hh),
            Vector2(hw, hh),
            Vector2(-hw, hh)
        ]);
        return this;
    }

    setUseCamera(use) {
        this.useCamera = use;
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
        child.setGraphics(this.graphics);
        this.children.push(child);
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
        this.parent = parent;
    }

    getTransformation() {
        return this.graphics.Transform.create_transform(this.position.x, this.position.y, this.rotation, this.scale.x, this.scale.y);
    }

    getUpdatedVertices() {
        if (!this.localVertices.length) return [];
        const transformation = this.getTransformation();
        return this.graphics.Transform.transform_multiple(this.localVertices, transformation);
    }

    update(deltaTime, time) {
        for (let fn of this.binds) {
            fn(this, deltaTime, time);
        }

        if (this.parent) {
            this.localRotation += this.angVelocity * deltaTime;
            this.rotation = this.localRotation + this.parent.rotation;
            this.scale = Vector2(this.localScale.x * this.parent.scale.x, this.localScale.y * this.parent.scale.y);

            const transformation = this.graphics.Transform.create_transform(0, 0, this.parent.rotation, this.parent.scale.x, this.parent.scale.y);
            const newCoord = this.graphics.Transform.transform(this.localPosition, transformation);
            this.position.x = this.parent.position.x + newCoord.x;
            this.position.y = this.parent.position.y + newCoord.y;
        } else {
            this.position.x += this.velocity.x * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            this.rotation += this.angVelocity * deltaTime;
        }

        for (let child of this.children) {
            child.update(deltaTime, time);
        }
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
            if ((x - this.position.x) ** 2 + (y - this.position.y) ** 2 >= (this.radius) ** 2) {
                return false;
            } else {
                return true;
            }
        } else if (this.getShapeType() == "polygon") {
            const vertices = this.getUpdatedVertices(this.graphics.Transform);
            const bounds = this.getMinMaxCoords();

            if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
                return false;
            } else {
                let isInside = false;

                for (let i = 0; i < vertices.length; i++) {
                    const v1 = vertices[i];
                    const v2 = vertices[(i + 1) % vertices.length];

                    if ((v1.y >= y && v2.y <= y) || (v1.y <= y && v2.y >= y)) {
                        const intersect = v1.x + ((y - v1.y) / (v2.y - v1.y)) * (v2.x - v1.x);
                        if (intersect > x) {
                            isInside = !isInside;
                        }
                    }
                }

                return isInside;
            }
        } else {
            const bounds = this.getMinMaxCoords();
            if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
                return false;
            } else {
                return true;
            }
        }


    }

    checkVisibility(camera) {
        const bounds = this.getMinMaxCoords();
        if (camera) {
            const camBounds = camera.getBounds();

            if (((bounds.maxX >= camBounds.maxX && bounds.minX >= camBounds.maxX) || (bounds.maxX < camBounds.minX && bounds.minX < camBounds.minX) || (bounds.maxY >= camBounds.maxY && bounds.minY >= camBounds.maxY) || (bounds.maxY < camBounds.minY && bounds.minY < camBounds.minY))) {
                return false;
            }
        } else {
            if (((bounds.maxX >= this.graphics.width && bounds.minX >= this.graphics.width) || (bounds.maxX < 0 && bounds.minX < 0) || (bounds.maxY >= this.graphics.height && bounds.minY >= this.graphics.height) || (bounds.maxY < 0 && bounds.minY < 0))) {
                return false;
            }
        }
        return true;
    }

    checkCollision(object, fromHitbox) {
        let thisHit = (this.hitbox && fromHitbox) ? this.hitbox : this;
        const bounds = thisHit.getMinMaxCoords();

        const maxX = bounds.maxX;
        const maxY = bounds.maxY;
        const minX = bounds.minX;
        const minY = bounds.minY;

        if (object) {
            let objHit = (object.hitbox && fromHitbox) ? object.hitbox : object;
            const objBounds = objHit.getMinMaxCoords();

            const objMinX = objBounds.minX;
            const objMaxX = objBounds.maxX;
            const objMinY = objBounds.minY;
            const objMaxY = objBounds.maxY;

            if (minX <= objMaxX && maxX >= objMinX && minY <= objMaxY && maxY >= objMinY) {
                let axes;
                const thisType = thisHit.getShapeType();
                const objType = objHit.getShapeType();

                if (thisType == "circle" && objType == "circle")  {
                    if (thisHit.graphics.Transform.magnitude2(thisHit.position, objHit.position) <= (thisHit.radius + objHit.radius)**2) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (thisType == "polygon" && objType == "polygon") {
                    axes = thisHit.getAxes().concat(objHit.getAxes());
                } else {
                    const circle = (thisType == "circle") ? thisHit : objHit;
                    const polygon = (thisType == "polygon") ? thisHit : objHit;

                    const nearest = thisHit.graphics.Transform.findNearest(polygon.getUpdatedVertices(), circle.position);
                    const edge = Vector2(circle.position.x - nearest.x, circle.position.y - nearest.y);
                    axes  = polygon.getAxes();
                    axes.push(thisHit.graphics.Transform.unit(edge));
                }

                let projA;
                let projB;

                for (let axis of axes) {
                    if (thisType == "circle") {
                        projA  = thisHit.graphics.Transform.projectCircle(thisHit.position, thisHit.radius, axis);
                    } else {
                        projA = thisHit.graphics.Transform.projectPolygon(thisHit.getUpdatedVertices(), axis);
                    }

                    if (objType == "circle") {
                        projB = thisHit.graphics.Transform.projectCircle(objHit.position, objHit.radius, axis);
                    } else {
                        projB = thisHit.graphics.Transform.projectPolygon(objHit.getUpdatedVertices(), axis);
                    }

                    const overlaps = thisHit.graphics.Transform.checkOverlap(projA, projB);
    
                    if (!overlaps) {
                        return false;
                    }
                }

                return true;
            } else {
                return false;
            }
        } else {
            if (this.getShapeType() == "circle") {
                if (this.graphics.width - this.position.x <= this.radius) {
                    return true;
                }

                if (this.position.x <= this.radius) {
                    return true;
                }

                if (this.graphics.height - this.position.y <= this.radius) {
                    return true;
                }

                if (this.position.y <= this.radius) {
                    return true;
                }
            } else {
                const minX = bounds.minX;
                const maxX = bounds.maxX;
                const minY = bounds.minY;
                const maxY = bounds.maxY;

                if (maxX >= this.graphics.width) {
                    return true;
                }

                if (minX <= 0) {
                    return true;
                }

                if (maxY >= this.graphics.height) {
                    return true;
                }

                if (minY <= 0) {
                    return true;
                }
            }
        }

        return false;
    }

    getAxes(checkHitbox) {
        let object = (checkHitbox && this.hitbox) ? this.hitbox : this;

        let axes = [];
        const vertices = object.getUpdatedVertices();

        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2  = vertices[(i + 1) % vertices.length];
            const edge = Vector2(p2.x - p1.x, p2.y - p1.y);

            axes.push(object.graphics.Transform.normal(edge));
        }

        return axes;
    }

    getContactPoints(object) {
        if (!this.checkCollision(object)) {
            return;
        }

        const thisObj = (this.hitbox) ? this.hitbox : this;
        const otherObj = (object.hitbox) ? object.hitbox : object;

        const thisType = thisObj.getShapeType();
        const otherType = otherObj.getShapeType();

        if (thisType == "circle" && otherType == "circle") {
            const direction = Vector2(otherObj.position.x - thisObj.position.x, otherObj.position.y - thisObj.position.y);
            const unit = this.graphics.Transform.unit(direction);
            const penetration = (thisObj.radius + otherObj.radius) - this.graphics.Transform.magnitude(direction)
            const distance = thisObj.radius - (penetration) / 2;
            const offset = Vector2(unit.x * distance, unit.y * distance);
            
            return Vector2(thisObj.position.x + offset.x, thisObj.position.y + offset.y);
        } else if (thisType == "polygon" && otherType == "polygon") {
            const thisVertices = thisObj.getUpdatedVertices();
            const otherVertices = otherObj.getUpdatedVertices();

            let penetratingPoints = [];

            for (let vertex of thisVertices) {
                if (otherObj.checkInBound(vertex)) {
                    penetratingPoints.push(vertex);
                }
            }

            for (let vertex of otherVertices) {
                if (thisObj.checkInBound(vertex)) {
                    penetratingPoints.push(vertex);
                }
            }

            if (penetratingPoints.length > 0) {
                let sumX = 0;
                let sumY = 0;

                for (let vertex of penetratingPoints) {
                    sumX += vertex.x;
                    sumY += vertex.y;
                }

                return Vector2(sumX / penetratingPoints.length, sumY / penetratingPoints.length);
            } else {
                const boundsA = thisObj.getMinMaxCoords();
                const boundsB = otherObj.getMinMaxCoords();

                const centerX = (Math.max(boundsA.minX, boundsB.minX) + Math.min(boundsA.maxX, boundsB.maxX)) / 2;
                const centerY = (Math.max(boundsA.minY, boundsB.minY) + Math.min(boundsA.maxY, boundsB.maxY)) / 2;

                return Vector2(centerX, centerY);
            }
        } else {
            const polygon = (thisType == "polygon") ? thisObj : otherObj;
            const circle = (thisType == "circle") ? thisObj : otherObj;
            let points = [];

            const vertices = polygon.getUpdatedVertices();

            for (let i = 0; i < vertices.length; i++) {
                const A = vertices[i];
                const B  = vertices[(i + 1) % vertices.length];
                const AB = Vector2(B.x - A.x, B.y - A.y);

                const t = ((circle.position.x - A.x) * (B.x - A.x) + (circle.position.y - A.y) * (B.y - A.y)) / ((B.x - A.x)**2 + (B.y - A.y)**2);
                const clampedT = clamp(t, 0, 1);

                const point = Vector2(A.x + clampedT * AB.x, A.y + clampedT * AB.y);

                points.push(point);
            }

            return this.graphics.Transform.findNearestByMagnitude2(points, circle.position);
        }
    }

    onCollision(hit) {
        for (let bind of this.onCollisionBinds) {
            bind(this, hit);
        }
    }

    draw(camera) {
        if (!this.visible) return;

        let x = 0;
        let y = 0;

        let renderMatrix = this.getTransformation();
        let vertices = this.getUpdatedVertices();
        let screenPos = this.position;
        let screenRadius = this.radius;

        if (this.checkVisibility(camera) && !this.isActive) {
            this.visible = false;
            return;
        }

        if (camera && this.useCamera != false) {
            renderMatrix = matrix.multiply(camera.getViewMatrix(), this.getTransformation());
            vertices = this.graphics.Transform.transform_multiple(this.localVertices, renderMatrix);
            screenPos = camera.worldToScreen(this.position);
            screenRadius = this.radius * camera.zoom;
        }

        if (this.sprite) {
            this.sprite.draw(this.sprite.asset, this.sprite.frame, vertices, renderMatrix);

            return;
        }

        if (this.getShapeType() == "circle") {
            this.graphics.Shapes.polar_circle(screenPos, screenRadius, this.color);
            
            if (this.fills.length > 0) {
                let newFill = createFillInfo(this.fills[0].fillType, this.fills[0].colors, this.fills[0].coords);
                
                if (!this.graphics.Pixel.in_bounds(this.position.x - newFill.coords.x, this.position.y - newFill.coords.y)) {
                    if (this.position.x > this.graphics.width) {
                        x = this.position.x - this.graphics.width + 1;
                    }
                    
                    if (this.position.x < 0) {
                        x = this.position.x;
                    }
                    
                    if (this.position.y > this.graphics.height) {
                        y = this.position.y - this.graphics.height + 1;
                    }
                    
                    if (this.position.y < 0) {
                        y = this.position.y;
                    }
                    
                    newFill.coords = Vector2(x, y);
                }
                
                const inBoundCheck = this.checkInBound(Vector2(clamp(this.position.x - x, 0, this.graphics.width - 1), clamp(this.position.y - y, 0, this.graphics.height - 1)))

                if (inBoundCheck) {
                    this.graphics.Coloring.fillFromInfo(newFill, this.position);
                }
            }
        } else if (this.getShapeType() == "polygon" || this.getShapeType() == "line") {
            this.graphics.Shapes.polygon(vertices, this.color);

            const bounds = this.checkCollision();

            if (bounds) {
                if (this.fills.length > 0) {
                    for (let fill of this.fills) {
                        let newFill = createFillInfo(fill.fillType, fill.colors, fill.coords);
                        const transformation = this.graphics.Transform.create_transform(0, 0, this.rotation, this.scale.x, this.scale.y);
                        const seed = this.graphics.Transform.transform(newFill.coords, transformation);
                        
                        const x = seed.x;
                        const y = seed.y;
                        const inBoundCheck = this.checkInBound(Vector2(clamp(this.position.x + x, 0, this.graphics.width - 1), clamp(this.position.y + y, 0, this.graphics.height - 1)))
                        
                        if (inBoundCheck) {
                            newFill.coords = Vector2(x, y);
                            this.graphics.Coloring.fillFromInfo(newFill, this.position);
                        }
                    }
                }
            } else {
                if (this.fills.length > 0) {
                    let newFill = createFillInfo(this.fills[0].fillType, this.fills[0].colors, this.fills[0].coords);
                    const transformation = this.graphics.Transform.create_transform(0, 0, this.rotation, this.scale.x, this.scale.y);
                    const seed = this.graphics.Transform.transform(newFill.coords, transformation);
                    
                    const x = seed.x;
                    const y = seed.y;
    
                    newFill.coords = Vector2(x, y);
                    this.graphics.Coloring.fillFromInfo(newFill, this.position);
                }
            }


        } else {
            this.graphics.Pixel.draw_pixel(screenPos.x, screenPos.y, this.color);
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
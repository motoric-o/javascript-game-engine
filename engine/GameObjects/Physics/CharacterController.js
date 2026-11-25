/** AIGEN
 * prompt: make CharacterController as a child GameObject of PhysicalObject (Option B: pure config/handle holder for custom player movement physics)
 */
import { degToRad } from "../../Util/Math.js";
import GameObject from "../GameObject.js";

export default class CharacterController extends GameObject {
    constructor(name = "CharacterController") {
        super();

        this.name = name;
        this.root = this;

        this.controller = null;

        this.offset = 0.02;
        this.maxSlopeClimbAngle = degToRad(45);
        this.minSlopeSlideAngle = degToRad(30);
        this.autoStepHeight = 0.4;
        this.autoStepMinWidth = 0.25;
        this.autoStepIncludeDynamic = true;
        this.snapToGroundDist = 0.3;
        this.applyImpulsesToDynamicBodies = true;
    }

    get grounded() {
        return this.controller ? this.controller.computedGrounded() : false;
    }

    setOffset(offset) {
        this.offset = offset;
        if (this.controller) {
            this.controller.setOffset(offset);
        }
        return this;
    }

    setMaxSlopeClimbAngle(radians) {
        this.maxSlopeClimbAngle = radians;
        if (this.controller) {
            this.controller.setMaxSlopeClimbAngle(radians);
        }
        return this;
    }

    setMinSlopeSlideAngle(radians) {
        this.minSlopeSlideAngle = radians;
        if (this.controller) {
            this.controller.setMinSlopeSlideAngle(radians);
        }
        return this;
    }

    setAutoStep(maxHeight, minWidth, includeDynamic = true) {
        this.autoStepHeight = maxHeight;
        this.autoStepMinWidth = minWidth;
        this.autoStepIncludeDynamic = includeDynamic;
        if (this.controller) {
            this.controller.enableAutostep(maxHeight, minWidth, includeDynamic);
        }
        return this;
    }

    setSnapToGround(distance) {
        this.snapToGroundDist = distance;
        if (this.controller) {
            this.controller.enableSnapToGround(distance);
        }
        return this;
    }

    setApplyImpulsesToDynamicBodies(enabled) {
        this.applyImpulsesToDynamicBodies = enabled;
        if (this.controller) {
            this.controller.setApplyImpulsesToDynamicBodies(enabled);
        }
        return this;
    }
}

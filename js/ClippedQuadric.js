"use strict";
/* exported ClippedQuadric */
class ClippedQuadric extends UniformProvider {
    constructor(id, ...programs) {
      super(`clippedQuadrics[${id}]`);
      this.surface = new Mat4(); 
      this.clipper = new Mat4(); 
      this.T = new Mat4();
      this.clipT = new Mat4();
      this.scale = new Vec3(1, 1, 1); 
      this.position = new Vec3(0, 0, 0); 
      this.roll = 0; 
      this.pitch = 0; 
      this.yaw = 0; 
      this.clipScale = new Vec3(1, 1, 1); 
      this.clipPosition = new Vec3(0, 0, 0); 
      this.clipRoll = 0; 
      this.clipPitch = 0; 
      this.clipYaw = 0; 

      this.addComponentsAndGatherUniforms(...programs);
    }

    transformClipper() {
      this.clipT.set().
      scale(this.clipScale).
      rotate(this.clipRoll).
      rotate(this.clipPitch, 1, 0, 0).
      rotate(this.clipYaw, 0, 1, 0).
      translate(this.clipPosition);

      this.clipT.invert();          // T is now T-1
      this.clipper.premul(this.clipT);   // A is now T-1 * A
      this.clipT.transpose();       // T is now T-1T
      this.clipper.mul(this.clipT);      // A is now A'
    }

    transform() {
      this.T.set().
      scale(this.scale).
      rotate(this.roll).
      rotate(this.pitch, 1, 0, 0).
      rotate(this.yaw, 0, 1, 0).
      translate(this.position);

      this.T.invert();          // T is now T-1
      this.surface.premul(this.T);   // A is now T-1 * A
      this.clipper.premul(this.T);   // A is now T-1 * A
      this.clipT.premul(this.T);   // A is now T-1 * A
      this.T.transpose();       // T is now T-1T
      this.surface.mul(this.T);      // A is now A'
      this.clipper.mul(this.T);      // A is now A'
      this.clipT.mul(this.T);      // A is now A'
    }

    makeUnitCylinder() {
      this.surface.set(1,  0,  0,  0,
                       0,  0,  0,  0,
                       0,  0,  1,  0,
                       0,  0,  0, -1);
      this.clipper.set(0,  0,  0,  0,
                       0,  1,  0,  0,
                       0,  0,  0,  0,
                       0,  0,  0, -1);
      this.transform();
    }

    makeUnitSphere() {
      this.surface.set(1,  0,  0,  0,
                       0,  1,  0,  0,
                       0,  0,  1,  0,
                       0,  0,  0, -1);
      this.clipper.set(0,  0,  0,  0,
                       0,  0,  0,  0,
                       0,  0,  0,  0,
                       0,  0,  0, -1);
      this.transform();
    }

    makeUnitBishop() {
      this.surface.set(1,  0,  0,  0,
                       0,  1,  0,  0,
                       0,  0,  1,  0,
                       0,  0,  0, -1);
      this.clipper.set(-1,  0,  0,  0,
                       0,  -1,  0,  0,
                       0,  0,  0,  0,
                       0,  0,  0, 0.25);
      this.clipScale.set(0.5, 3, 0.5);
      this.clipPosition.set(0.75, 1.5, 0);
      this.clipRoll = -3.5;
      this.transformClipper();
      this.transform();
    }

    makeUnitCone() {
      this.surface.set(1,  0,  0,  0,
                       0,  -1,  0,  0,
                       0,  0,  1,  0,
                       0,  0,  0, 0);
      this.clipper.set(0,  0,  0,  0,
                       0,  1,  0,  0.5,
                       0,  0,  0,  0,
                       0,  0.5,  0, 0);
      this.transform();
    }

    makeParaboloid() {
      this.surface.set(1,  0,  0,  0,
                       0,  0,  0,  -0.5,
                       0,  0,  1,  0,
                       0,  -0.5,  0, 0);
      this.clipper.set(0,  0,  0,  0,
                       0,  1,  0,  -0.5,
                       0,  0,  0,  0,
                       0,  -0.5,  0, 0);
      this.transform();
    }
}

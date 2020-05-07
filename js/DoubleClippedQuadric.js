"use strict";
/* exported DoubleClippedQuadric */
class DoubleClippedQuadric extends UniformProvider {
    constructor(id, ...programs) {
      super(`doubleClippedQuadrics[${id}]`);
      this.surface = new Mat4(); 
      this.clipper1 = new Mat4(); 
      this.clipper2 = new Mat4(); 
      this.T = new Mat4();
      this.scale = new Vec3(1, 1, 1); 
      this.position = new Vec3(0, 0, 0); 
      this.roll = 0; 
      this.pitch = 0; 
      this.yaw = 0; 

      this.addComponentsAndGatherUniforms(...programs);
    }

    makePlane() {
      this.surface.set(0,  0,  0,  0,     // y = 0 plane
                       0,  0,  0,  -0.5,
                       0,  0,  0,  0,
                       0,  -0.5,  0, 0);
      this.clipper1.set(1,  0,  0,  0,    // parallel clipping planes in x dim
                       0,  0,  0,  0,
                       0,  0,  0,  0,
                       0,  0,  0, -1);
      this.clipper2.set(0,  0,  0,  0,    // parallel clipping planes in z dim
                       0,  0,  0,  0,
                       0,  0,  1,  0,
                       0,  0,  0, -1);
    }
}

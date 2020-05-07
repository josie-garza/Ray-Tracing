"use strict";
/* exported Scene */
class Scene extends UniformProvider {
  constructor(gl) {
    super("scene");
    this.programs = [];
    this.clippedQuadrics = [];
    this.doubleClippedQuadrics = [];
    this.gameObjects = [];
    this.lights = [];

    this.vsQuad = new Shader(gl, gl.VERTEX_SHADER, "quad-vs.glsl");    
    this.fsTrace = new Shader(gl, gl.FRAGMENT_SHADER, "trace-fs.glsl");
    this.traceProgram = new TexturedProgram(gl, this.vsQuad, this.fsTrace);
    this.programs.push(this.traceProgram);

    this.texturedQuadGeometry = new TexturedQuadGeometry(gl);

    this.timeAtFirstFrame = new Date().getTime();
    this.timeAtLastFrame = this.timeAtFirstFrame;

    this.traceMaterial = new Material(this.traceProgram);
    this.envTexture = new TextureCube(gl, [
      "media/posx512.jpg",
      "media/negx512.jpg",
      "media/posy512.jpg",
      "media/negy512.jpg",
      "media/posz512.jpg",
      "media/negz512.jpg",]
      );
    this.traceMaterial.envTexture.set(this.envTexture);
    this.traceMesh = new Mesh(this.traceMaterial, this.texturedQuadGeometry);
    this.traceQuad = new GameObject(this.traceMesh);
    this.gameObjects.push(this.traceQuad);

    this.light1 = new Light(this.lights.length, ...this.programs);
    this.light1.position.set(0.5, 0.5, 0.5, 0).normalize();
    this.light1.powerDensity.set(0.9, 0.9, 0.9);
    this.lights.push(this.light1);

    // Pawn
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[0].scale.set(0.5, 0.5, 0.5);
    this.clippedQuadrics[0].position.set(2, -1, 0);
    this.clippedQuadrics[0].makeUnitSphere();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[1].scale.set(1, 2, 1);
    this.clippedQuadrics[1].position.set(2, -1, 0);
    this.clippedQuadrics[1].makeUnitCone();

    // Bishop
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[2].scale.set(0.5, 0.5, 0.5);
    this.clippedQuadrics[2].makeUnitBishop();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[3].scale.set(1, 3, 1);
    this.clippedQuadrics[3].makeUnitCone();

    // King
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[4].scale.set(0.75, 1, 0.75);
    this.clippedQuadrics[4].position.set(-2, -0.5, 0);
    this.clippedQuadrics[4].makeParaboloid();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[5].scale.set(1, 3, 1);
    this.clippedQuadrics[5].position.set(-2, 0, 0);
    this.clippedQuadrics[5].makeUnitCone();

    this.doubleClippedQuadrics.push(new DoubleClippedQuadric(this.doubleClippedQuadrics.length, ...this.programs));
    this.doubleClippedQuadrics[0].makePlane();

    this.camera = new PerspectiveCamera(...this.programs); 
    this.camera.position.set(0, 5, 25);
    this.camera.update();
    this.addComponentsAndGatherUniforms(...this.programs);

    gl.enable(gl.DEPTH_TEST);
  }

  resize(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.camera.setAspectRatio(canvas.width / canvas.height);
  }

  update(gl, keysPressed) {
    //jshint bitwise:false
    //jshint unused:false
    const timeAtThisFrame = new Date().getTime();
    const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
    const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0; 
    this.timeAtLastFrame = timeAtThisFrame;
    //this.time.set(t);
    this.time = t;

    // clear the screen
    gl.clearColor(0.3, 0.0, 0.3, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.camera.move(dt, keysPressed);
    for(const gameObject of this.gameObjects) {
        gameObject.draw(this, this.camera, ...this.lights, ...this.clippedQuadrics, ...this.doubleClippedQuadrics);
    }

  }
}

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
    this.light1.position.set(5.0, 5.0, 17.0, 0);
    this.light1.powerDensity.set(0.9, 0.9, 0.9);
    this.lights.push(this.light1);

    // Table
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[0].position.set(9, -4.5, 9);
    this.clippedQuadrics[0].makeYPlane();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[1].position.set(9, -4.5, 9);
    this.clippedQuadrics[1].makeXPlane();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[2].position.set(9, -4.5, 9);
    this.clippedQuadrics[2].makeZPlane();

    // Pawn
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[3].scale.set(0.5, 0.5, 0.5);
    this.clippedQuadrics[3].position.set(13.5, -1.5, 16.5);
    this.clippedQuadrics[3].makeUnitSphere();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[4].scale.set(1, 2, 1);
    this.clippedQuadrics[4].position.set(13.5, -1.5, 16.5);
    this.clippedQuadrics[4].makeUnitCone();

    // Bishop
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[5].scale.set(0.5, 0.5, 0.5);
    this.clippedQuadrics[5].position.set(7.5, -0.5, 16.5);
    this.clippedQuadrics[5].makeUnitBishop();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[6].scale.set(1, 3, 1);
    this.clippedQuadrics[6].position.set(7.5, -0.5, 16.5);
    this.clippedQuadrics[6].makeUnitCone();

    // King
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[7].scale.set(0.75, 1, 0.75);
    this.clippedQuadrics[7].position.set(10.5, -1, 19.5);
    this.clippedQuadrics[7].makeParaboloid();
    this.clippedQuadrics.push(new ClippedQuadric(this.clippedQuadrics.length, ...this.programs));
    this.clippedQuadrics[8].scale.set(1, 3, 1);
    this.clippedQuadrics[8].position.set(10.5, -0.5, 19.5);
    this.clippedQuadrics[8].makeUnitCone();

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

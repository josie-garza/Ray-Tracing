Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es 
  precision highp float;

  out vec4 fragmentColor;
  in vec4 rayDir;

  uniform struct {
  	samplerCube envTexture;
  } material;

  uniform struct {
    mat4 viewProjMatrix;  
    mat4 rayDirMatrix;
    vec3 position;
  } camera;

  uniform struct {
    mat4 surface;
    mat4 clipper;
  } clippedQuadrics[16];

  uniform struct {
    mat4 surface;
    mat4 clipper1;
    mat4 clipper2;
  } doubleClippedQuadrics[16];

  uniform struct {
    vec4 position;
    vec3 powerDensity;
  } lights[8];

  vec3 shade(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 powerDensity,
    vec3 materialColor, vec3 specularColor, float shininess) {
      float cosa = clamp( dot(lightDir, normal),  0.0, 1.0);
      float cosb = clamp(dot(viewDir, normal), 0.0, 1.0);

      vec3 halfway = normalize(viewDir + lightDir);
      float cosDelta = clamp(dot(halfway, normal), 0.0, 1.0);
        return powerDensity * materialColor * cosa
          + powerDensity * specularColor * pow(cosDelta, shininess) * cosa / max(cosb, cosa);
  }

  float intersectDoubleClippedQuadric(mat4 A, mat4 B, mat4 C, vec4 e, vec4 d) {
    float a = dot(d * A, d);
    float b = dot(d * A, e) + dot(e * A, d);
    float c = dot(e * A, e);
    float discriminant = (b * b) - (4.0 * a * c);
    if (discriminant < 0.0) {
      return -1.0;
    } else {
      float t1 = (-b + sqrt(discriminant)) / (2.0 * a);
      float t2 = (-b - sqrt(discriminant)) / (2.0 * a);
      vec4 r1 = e + d * t1;
      vec4 r2 = e + d * t2;
      //B *= -1.0;
      if (dot(r1*B, r1) > 0.0) {
        t1 = -1.0;
      }
      if (dot(r2*B, r2) > 0.0) {
        t2 = -1.0;
      }
      if (dot(r1*C, r1) > 0.0) {
        t1 = -1.0;
      }
      if (dot(r2*C, r2) > 0.0) {
        t2 = -1.0;
      }
      return (t1<0.0)?t2:((t2<0.0)?t1:min(t1, t2));
    }
  }

  float intersectClippedQuadric(mat4 A, mat4 B, vec4 e, vec4 d) {
    float a = dot(d * A, d);
    float b = dot(d * A, e) + dot(e * A, d);
    float c = dot(e * A, e);
    float discriminant = (b * b) - (4.0 * a * c);
    if (discriminant < 0.0) {
      return -1.0;
    } else {
      float t1 = (-b + sqrt(discriminant)) / (2.0 * a);
      float t2 = (-b - sqrt(discriminant)) / (2.0 * a);
      vec4 r1 = e + d * t1;
      vec4 r2 = e + d * t2;
      //B *= -1.0;
      if (dot(r1*B, r1) > 0.0) {
        t1 = -1.0;
      }
      if (dot(r2*B, r2) > 0.0) {
        t2 = -1.0;
      }
      return (t1<0.0)?t2:((t2<0.0)?t1:min(t1, t2));
    }
  }

  bool findBestHit(in vec4 e, in vec4 d, out float bestT, out mat4 bestQuadric) {
    // clipped quadrics
    for (int i = 0; i < 16; i++) {
      float t = intersectClippedQuadric(clippedQuadrics[i].surface, clippedQuadrics[i].clipper, e, d);
      if (t != -1.0 && t < bestT) {
        bestT = t;
        bestQuadric = clippedQuadrics[i].surface;
      }
    }
    // double clipped quadrics
    for (int j = 0; j < 16; j++) {
      float t = intersectClippedQuadric(doubleClippedQuadrics[j].surface, doubleClippedQuadrics[j].clipper1, e, d);
      if (t != -1.0 && t < bestT) {
        bestT = t;
        bestQuadric = doubleClippedQuadrics[j].surface;
      }
    }
    if (bestT != 9000.0) {
      return true;
    } else {
      return false;
    }
  }

  void main(void) {
	  vec4 e = vec4(camera.position, 1);		 //< ray origin
  	vec4 d = vec4(normalize(rayDir).xyz, 0); //< ray direction
    float bestT = 9000.0;
    mat4 bestQuadric;
    if (findBestHit(e, d, bestT, bestQuadric) == true) {
      vec4 hit = e + d * bestT;
      vec3 normal = normalize( (hit * bestQuadric + bestQuadric * hit).xyz );
      if( dot(normal, d.xyz) > 0.0 ) normal = -normal;
      vec3 viewDir = normalize(camera.position - hit.xyz);
      
      for (int i = 0; i < 8; i++) {
        vec3 lightDiff = lights[i].position.xyz;
        vec3 lightDir = normalize(lightDiff);
        // float bestShadowT = 9000.0;
        // mat4 bestIndex;
        // bool shadowRayHitSomething = findBestHit(hit, vec4(-lightDir, 0), bestShadowT, bestIndex);
        // if( !shadowRayHitSomething ) {
        // }
        vec3 powerDensity = lights[i].powerDensity;
        fragmentColor.rgb += shade(normal, lightDir, viewDir, powerDensity, vec3(1, 0, 0),
          vec3(0.5, 0.5, 0.5), 7.0);
      }

    } else {
      fragmentColor = texture(material.envTexture, d.xyz );
    }
  }

`;
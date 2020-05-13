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
    mat4 clipper1;
    mat4 clipper2;
  } clippedQuadrics[16];

  uniform struct {
    vec4 position;
    vec3 powerDensity;
  } lights[8];

  float snoise(vec3 r) {
    vec3 s = vec3(7502, 22777, 4767);
    float f = 0.0;
    for(int i=0; i<16; i++) {
      f += sin( dot(s - vec3(32768, 32768, 32768), r) / 65536.0);
      s = mod(s, 32768.0) * 2.0 + floor(s / 32768.0);
    }
    return f / 32.0 + 0.5;
  }

  vec3 shade(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 powerDensity,
    vec3 materialColor, vec3 specularColor, float shininess) {
      float cosa = clamp( dot(lightDir, normal),  0.0, 1.0);
      float cosb = clamp(dot(viewDir, normal), 0.0, 1.0);

      vec3 halfway = normalize(viewDir + lightDir);
      float cosDelta = clamp(dot(halfway, normal), 0.0, 1.0);
        return powerDensity * materialColor * cosa
          + powerDensity * specularColor * pow(cosDelta, shininess) * cosa / max(cosb, cosa);
  }

  float intersectQueen(mat4 A, mat4 B, mat4 C, vec4 e, vec4 d) {
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
      if (fract(r1.y + r1.x * 3.0) < 0.2) {
        t1 = -1.0;
      }
      if (fract(r2.y + r2.x * 3.0) < 0.2) {
        t2 = -1.0;
      }
      if (fract(r1.y * 3.0 - r1.x) > 0.8) {
        t1 = -1.0;
      }
      if (fract(r2.y * 3.0 - r2.x) > 0.8) {
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

  float intersectClippedQuadric(mat4 A, mat4 B, mat4 C, vec4 e, vec4 d) {
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

  bool findBestHit(in vec4 e, in vec4 d, out float bestT, out int bestIndex) {
    // clipped quadrics
    bestT = 9000.0;
    for (int i = 0; i < 14; i++) {
      float t = intersectClippedQuadric(clippedQuadrics[i].surface, clippedQuadrics[i].clipper1, 
        clippedQuadrics[i].clipper2, e, d);
      if (t > 0.0 && t < bestT) {
        bestT = t;
        bestIndex = i;
      }
    }
    for (int i = 14; i < 16; i++) {
      float t = intersectQueen(clippedQuadrics[i].surface, clippedQuadrics[i].clipper1, 
        clippedQuadrics[i].clipper2, e, d);
      if (t > 0.0 && t < bestT) {
        bestT = t;
        bestIndex = i;
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
    float bestT;
    int bestIndex;
    if (findBestHit(e, d, bestT, bestIndex) == true) {
      vec4 hit = e + d * bestT;
      mat4 bestQuadric = clippedQuadrics[bestIndex].surface;
      vec3 normal = normalize( (hit * bestQuadric + bestQuadric * hit).xyz );
      if( dot(normal, d.xyz) > 0.0 ) normal = -normal;
      vec3 viewDir = -d.xyz;
      
      for (int i = 0; i < 2; i++) {
        vec3 lightDiff = lights[i].position.xyz - (hit.xyz * lights[i].position.w);
        vec3 lightDir = normalize(lightDiff);
        vec4 origin = vec4(hit.xyz + (normal * 0.05), 1); // hit offset along the normal
        vec4 direction = vec4(lightDir, 0); // from the hit position to the light
        float bestShadowT;
        int bestShadowIndex;
        bool shadowRayHitSomething = findBestHit(origin, direction, bestShadowT, bestShadowIndex);

        if( !shadowRayHitSomething || bestShadowT * lights[i].position.w > sqrt(dot(lightDir, lightDir))) {
          vec3 powerDensity = lights[i].powerDensity;
          if (bestIndex == 0) {
            if (mod(floor(hit.x), 6.0) < 3.0 && mod(floor(hit.z), 6.0) < 3.0) {
              fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, vec3(1, 1, 1),
                vec3(0.5, 0.5, 0.5), 7.0);
            }
            if (mod(floor(hit.x), 6.0) >= 3.0 && mod(floor(hit.z), 6.0) >= 3.0) {
              fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, vec3(1, 1, 1),
                vec3(0.5, 0.5, 0.5), 7.0);
            }
            if (mod(floor(hit.x), 6.0) < 3.0 && mod(floor(hit.z), 6.0) >= 3.0) {
              fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, vec3(0, 0, 0),
                vec3(0.5, 0.5, 0.5), 7.0);
            } 
            if (mod(floor(hit.x), 6.0) >= 3.0 && mod(floor(hit.z), 6.0) < 3.0) {
              fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, vec3(0, 0, 0),
                vec3(0.5, 0.5, 0.5), 7.0);
            }
          }
          if (bestIndex > 0 && bestIndex < 3) {
            vec3 colorA = vec3(0.3,0.15,0.05);
            vec3 colorB = vec3(1.000,0.533,0.1);
            float w = fract( hit.y * 1.5
             + pow(snoise(hit.xyz * 6.0), 1.5) * 5.0);
            vec3 color = mix(colorA, colorB, w);
            fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, color,
              vec3(0.6, 0.6, 0.6), 7.0);
          }
          if (bestIndex > 2 && bestIndex < 9) {
            fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, vec3(1, 0.2, 0),
              vec3(0.6, 0.6, 0.6), 7.0);
          }
          if (bestIndex > 8 && bestIndex < 15) {
            fragmentColor.rgb += shade(normal, lightDir.xyz, viewDir, powerDensity, vec3(0, 0.5, 0.8),
              vec3(0.6, 0.6, 0.6), 7.0);
          }
        }
      }

    } else {
      fragmentColor = texture(material.envTexture, d.xyz );
    }
  }

`;
export const lakeVertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform float uTime;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Olas mucho más pronunciadas para que no parezca un piso plano
    float w = noise(pos.xy*0.12 + vec2(uTime*0.08, uTime*0.06))*0.7
            + noise(pos.xy*0.35 - vec2(uTime*0.12, uTime*0.18))*0.3;
    pos.z += w;
    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const lakeFragmentShader = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform vec3  uBaseColor;
  uniform vec3  uLaserColor;
  uniform vec2  uRipplePos[20];
  uniform float uRippleTime[20];
  uniform float uRippleCount;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  float noise(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float fbm(vec2 p){
    float v=0.0,a=0.55;
    for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;}
    return v;
  }

  void main() {
    vec2 xz = vWorldPos.xz;

    // 1. Base del agua: Profundidad radial (Oscuro en el centro, un poco más claro en los bordes)
    vec2 centerUV = vUv - 0.5;
    float distCenter = length(centerUV);
    vec3 deepColor = vec3(0.0, 0.06, 0.12);
    vec3 midColor  = vec3(0.02, 0.20, 0.28);
    vec3 color = mix(deepColor, midColor, distCenter * 0.6);

    // Micro-textura de oleaje natural
    float micro = fbm(xz * 2.0 + uTime * 0.25) * 0.12;
    color += vec3(0.04, micro*0.6, micro*0.7);

    // 2. ¡BORDE NEÓN DE TIRA LED (Línea continua y gruesa)!
    float neonWidth = 0.06;
    // Calculamos el borde en forma de anillo circular sólido
    float neonRing = 1.0 - smoothstep(0.0, neonWidth, abs(0.85 - distCenter * 1.1));
    float pulse = 0.8 + 0.2 * sin(uTime * 1.5 + distCenter * 20.0);
    color += vec3(0.1, 1.0, 0.6) * neonRing * pulse * 12.0;

    // 3. Reflejos de luz de la luna/estrellas (Especular básico)
    float sp1 = pow(max(0.0, noise(xz*3.5 + uTime*0.5) - 0.75), 3.0);
    color += vec3(0.7, 0.8, 1.0) * sp1 * 4.0;

    // 4. 🌊 ONDAS EXPANSIVAS DE LA V1 (Traducidas a 3D) 🌊
    for (int i = 0; i < 20; i++) {
      if (float(i) >= uRippleCount) break;
      float age = uTime - uRippleTime[i];
      if (age <= 0.0 || age > 3.5) continue; // Vida útil de 3.5s

      float dist = length(xz - uRipplePos[i]);
      float radius = age * 2.2; // Velocidad de expansión
      float fade = 1.0 - (age / 3.5);

      // A. Gradiente Radial de relleno (Igual que ctx.createRadialGradient en V1)
      float gradFill = exp(-pow(dist / max(radius, 0.1), 2.0) * 1.5);
      color += uLaserColor * gradFill * fade * 2.5;

      // B. Anillos interiores blancos (Igual que ctx.stroke en V1)
      for (int ring = 0; ring < 3; ring++) {
        float ringRadius = radius - float(ring) * 0.6;
        if (ringRadius > 0.0) {
          float ringVal = exp(-pow(abs(dist - ringRadius) * 3.0, 2.0));
          color += vec3(1.0) * ringVal * fade * 1.2; // Anillos blancos
        }
      }
    }

    // Transparencia para fusionarse con el suelo
    float alpha = 1.0 - smoothstep(0.95, 1.0, distCenter);
    gl_FragColor = vec4(color, alpha * 0.98);
  }
`;
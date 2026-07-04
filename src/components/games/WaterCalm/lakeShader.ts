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
    float w = noise(pos.xy*0.12 + vec2(uTime*0.08, uTime*0.06))*0.15
            + noise(pos.xy*0.35 - vec2(uTime*0.12, uTime*0.18))*0.08;
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

    // ── 1. FORMA DE ÓVALO ESTIRADO A LOS LADOS ──────────────────────────────
    vec2 uvOffset = vec2(sin(vUv.y * 6.28) * 0.02, cos(vUv.x * 6.28) * 0.02);
    vec2 distortedUv = vUv + uvOffset;
    vec2 cuv = distortedUv - 0.5;

    // 🛑 LA CLAVE DEL ÓVALO ESTIRADO: Multiplicamos el Eje X por 3.2 en vez de 2.0.
    vec2 shiftedCuv = vec2(cuv.x, cuv.y + 0.05);
    float distNorm = length(shiftedCuv * vec2(3.2, 1.0));

    // Ruido sutil en los bordes
    float noiseShape = fbm(cuv * 3.0) * 0.06;
    
    // 🛑 Ajustamos el radio para que coincida exactamente con el nuevo estiramiento.
    float ellipseRadius = 0.48;
    float lakeShape = ellipseRadius - distNorm + noiseShape;

    float waterMask = smoothstep(-0.02, 0.15, lakeShape);
    float alpha = waterMask;

    // ── 2. PROFUNDIDAD Y COLOR DEL AGUA ──────────────────────────────────────
    float depthFactor = 1.0 - clamp(distNorm / ellipseRadius, 0.0, 1.0);
    vec3 deepColor   = vec3(0.0, 0.04, 0.12);
    vec3 midColor    = vec3(0.04, 0.25, 0.40);
    vec3 shallowColor = vec3(0.12, 0.55, 0.60);

    vec3 color = mix(deepColor, midColor, depthFactor);
    color = mix(color, shallowColor, smoothstep(0.4, 1.0, depthFactor));

    // ── 3. EFECTO CRISTALINO Y ESPEJO ──────────────────────────────────────
    float micro = fbm(xz * 2.0 + uTime * 0.25) * 0.001;
    color += vec3(0.0, micro * 0.05, micro * 0.1);
    float gloss = pow(max(0.0, noise(xz * 2.0 + uTime * 0.05) - 0.9), 4.0) * 0.6;
    color += vec3(0.8, 0.9, 1.0) * gloss;

    // ── 4. BORDE NEÓN (Sólido y fino, usando el nuevo radio de elipse) ──────
    float neonIntensity = 1.0 - smoothstep(0.0, 0.003, abs(ellipseRadius - distNorm));
    float pulse = 0.8 + 0.2 * sin(uTime * 1.5 + distNorm * 40.0);
    color += vec3(0.2, 1.0, 0.7) * neonIntensity * pulse * 12.0;

    // ── 5. ONDAS EXPANSIVAS (Con límite respetado gracias al alpha) ─────────
    for (int i = 0; i < 20; i++) {
      if (float(i) >= uRippleCount) break;
      float age = uTime - uRippleTime[i];
      if (age <= 0.0 || age > 3.5) continue;

      float dist = length(xz - uRipplePos[i]);
      float radius = age * 1.8; 
      float fade = 1.0 - (age / 3.5);

      float gradFill = exp(-pow(dist / max(radius, 0.1), 2.0) * 1.5);
      color += (uLaserColor * gradFill * fade * 0.5) * alpha;

      for (int ring = 0; ring < 3; ring++) {
        float ringRadius = radius - float(ring) * 0.4;
        if (ringRadius > 0.0) {
          float ringVal = exp(-pow(abs(dist - ringRadius) * 15.0, 2.0));
          color += (vec3(1.0) * ringVal * fade * 0.2) * alpha;
        }
      }
    }

    // ── 6. TRANSPARENCIA CRISTALINA ─────────────────────────────────────────
    gl_FragColor = vec4(color, alpha * 0.85);
  }
`;
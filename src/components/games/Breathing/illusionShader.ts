export const illusionVertex = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal    = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPos  = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const illusionFragment = /* glsl */`
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3  uColor1;
  uniform vec3  uColor2;

  #define PI 3.14159265359

  vec3 hsv2rgb(vec3 c) {
    vec4 K  = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p  = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 n       = normalize(vNormal);

    // r=0 en el centro visible, r=1 en el borde de la silueta
    float facing = clamp(dot(n, viewDir), 0.0, 1.0);
    float r      = sqrt(max(0.0, 1.0 - facing));

    // Ángulo tangencial alrededor del eje de visión
    vec3 nTan    = n - facing * viewDir;
    float nLen   = length(nTan);
    vec3  nN     = nLen > 1e-4 ? nTan / nLen : vec3(1.0, 0.0, 0.0);
    vec3  wUp    = vec3(0.0, 1.0, 0.0);
    vec3  right  = normalize(cross(wUp, viewDir));
    vec3  up2    = cross(viewDir, right);
    float phi    = atan(dot(nN, up2), dot(nN, right));

    // ── Anillos concéntricos con movimiento de respiración ────────────────
    float t    = uTime * uSpeed;
    float ring = fract(r * 8.0 - t);

    // Bordes zigzag (ilusión óptica)
    float zz1 = sin(phi * 13.0 + r * 5.5 + uTime * 0.22) * 0.5 + 0.5;
    float zz2 = cos(phi *  8.0 - r * 3.8 - uTime * 0.16) * 0.5 + 0.5;
    float rhi = 0.36 + zz1 * 0.11 + zz2 * 0.07;
    float band = step(0.04, ring) * (1.0 - step(rhi, ring));

    // Anillos de detalle finos (capa secundaria)
    float ring2 = fract(r * 22.0 + t * 0.55);
    float band2 = step(0.05, ring2) * (1.0 - step(0.42, ring2));

    // ── Color: arcoíris por radio + color de fase ─────────────────────────
    float hue     = fract(r * 0.88 - uTime * 0.038 + phi / (2.0 * PI) * 0.11);
    vec3  rainbow = hsv2rgb(vec3(hue, 0.94, 1.0));
    vec3  phaseC  = mix(uColor1 * 1.25, uColor2 * 0.90, r * 0.85);
    vec3  darkC   = phaseC * 0.055;

    // Frente brillante de cada anillo (blanco-caliente)
    float peak    = (1.0 - smoothstep(0.0, 0.13, ring)) * band;
    vec3  ringC   = mix(phaseC * 0.60, rainbow, 0.58);

    vec3 color = mix(darkC, ringC, band);
    color += vec3(0.90, 0.95, 1.00) * peak * 0.52;
    color += mix(darkC * 0.3, phaseC * 0.22, band2);

    // Radios sutiles (como imagen 5)
    float spoke = sin(phi * 7.0 + uTime * 0.07) * 0.5 + 0.5;
    color += phaseC * spoke * 0.048 * (1.0 - r);

    // Fade suave en los bordes de la esfera
    float edge = pow(facing, 0.44);
    color *= 0.52 + 0.48 * edge;

    gl_FragColor = vec4(color, edge * 0.97);
  }
`;
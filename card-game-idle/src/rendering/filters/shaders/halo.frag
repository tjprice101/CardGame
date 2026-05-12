// SDF ring halo around the Angel — pulsing glow
// Note: #version 300 es is prepended automatically by PIXI
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uRadius;        // normalized radius of the ring (e.g. 0.35)
uniform float uThickness;     // ring edge width (e.g. 0.04)
uniform vec3 uGlowColor;      // RGB 0-1
uniform float uPulseSpeed;    // animation speed
uniform float uPulseStrength; // 0-1 pulse intensity

out vec4 fragColor;

void main(void) {
  vec2 uv = vTextureCoord - 0.5; // center origin
  float dist = length(uv);

  // SDF: distance from the ring edge
  float ring = abs(dist - uRadius) - uThickness;
  float glow = smoothstep(0.0, uThickness * 2.0, -ring);

  // Pulse modulation
  float pulse = 1.0 + sin(uTime * uPulseSpeed) * uPulseStrength;
  glow *= pulse;

  vec4 texColor = texture(uTexture, vTextureCoord);
  vec4 haloColor = vec4(uGlowColor * glow, glow * 0.85);

  fragColor = texColor + haloColor;
}

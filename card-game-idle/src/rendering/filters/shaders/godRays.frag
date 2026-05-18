// Volumetric god rays emanating from the angel center
// Applied as a PixiJS Filter on a RenderTexture behind the Angel sprite
// Note: #version 300 es is prepended automatically by PIXI
precision mediump float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uCenter;       // normalized UV center of the angel
uniform vec3 uRayColor;     // RGB 0-1, gold for Light element
uniform float uIntensity;   // overall brightness

out vec4 fragColor;

#define NUM_SAMPLES 8
#define DECAY 0.96
#define WEIGHT 0.5

void main(void) {
  vec2 uv = vTextureCoord;
  vec2 dir = uv - uCenter;

  // Animated noise offset
  float noise = fract(sin(dot(uv, vec2(12.9898, 78.233)) + uTime * 0.3) * 43758.5453);
  dir += noise * 0.002;

  vec2 stepDir = dir / float(NUM_SAMPLES);
  vec2 sampleUV = uv;
  float illumination = 1.0;
  float light = 0.0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    sampleUV -= stepDir;
    float dist = 1.0 - clamp(length(sampleUV - uCenter) * 2.5, 0.0, 1.0);
    light += dist * illumination * WEIGHT;
    illumination *= DECAY;
  }

  float radial = max(0.0, 1.0 - length(dir) * 3.0);
  light *= radial;
  light *= uIntensity;

  vec4 texColor = texture(uTexture, vTextureCoord);
  fragColor = texColor + vec4(uRayColor * light, light * 0.6);
}

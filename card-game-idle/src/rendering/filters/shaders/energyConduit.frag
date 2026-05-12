// Energy conduit flowing along the Seraphim → Angel synergy path
// Rendered on a Graphics mask following the bezier curve
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform sampler2D uNoiseTex;    // tileable noise texture
uniform float uTime;
uniform float uFlowSpeed;       // default ~0.5
uniform vec3 uConduitColor;     // element color, e.g. gold for Light
uniform float uAlpha;           // master fade (0 when inactive)
uniform float uWidth;           // normalized beam width

void main(void) {
  vec2 uv = vTextureCoord;

  // Flow: scroll noise along the U axis
  vec2 noiseUV = vec2(uv.x - uTime * uFlowSpeed, uv.y);
  float noise = texture2D(uNoiseTex, noiseUV * vec2(2.0, 1.0)).r;

  // Beam shape: smooth falloff from V center
  float beam = smoothstep(uWidth, 0.0, abs(uv.y - 0.5));
  beam *= noise;

  // Edge fade along length
  float edgeFade = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);
  beam *= edgeFade;

  vec4 texColor = texture2D(uTexture, vTextureCoord);
  vec4 conduit = vec4(uConduitColor * beam, beam * uAlpha);

  gl_FragColor = texColor + conduit;
}

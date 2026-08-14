precision mediump float;
uniform sampler2D uMainSampler;
uniform sampler2D uNoise;
uniform float uTime;
uniform float uFocus;
varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;
  float noise = texture2D(uNoise, uv * vec2(3.0, 1.0) + vec2(uTime * 0.035, 0.0)).r;
  uv.y += (noise - 0.5) * 0.035 * uFocus;
  vec4 source = texture2D(uMainSampler, uv);
  float pulse = smoothstep(0.42, 0.50, sin((uv.x - uTime * 0.55) * 24.0) * 0.5 + 0.5);
  vec3 blood = mix(vec3(0.25, 0.01, 0.04), vec3(1.0, 0.18, 0.28), pulse * uFocus);
  gl_FragColor = vec4(blood, source.a * mix(0.25, 1.0, uFocus));
}

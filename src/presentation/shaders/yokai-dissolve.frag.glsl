precision mediump float;
uniform sampler2D uMainSampler;
uniform sampler2D uNoise;
uniform float uThreshold;
varying vec2 outTexCoord;

void main() {
  vec4 source = texture2D(uMainSampler, outTexCoord);
  float noise = texture2D(uNoise, outTexCoord * 2.5).r;
  float body = step(uThreshold, noise);
  float edge = smoothstep(uThreshold, uThreshold + 0.07, noise) - smoothstep(uThreshold + 0.07, uThreshold + 0.14, noise);
  vec3 ember = vec3(0.95, 0.12, 0.20) * edge;
  gl_FragColor = vec4(source.rgb * body + ember, source.a * max(body, edge));
}

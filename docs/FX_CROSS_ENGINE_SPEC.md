# 妖異鐵道 FX 跨引擎參數規格

現行 Demo 的唯一 runtime 是 Phaser/WebGL。GLSL 原型位於 `src/presentation/shaders/`；Python 可重現素材由 `tools/generate_yokai_fx.py` 產出。以下仅定义未来移植的等效参数，不引入其他引擎依赖。

## 杀生线能量流

- 主纹理：1×N 白色线段或运行时路径遮罩
- Noise：256×256 seamless grayscale
- `focus`: 0.25 默认，1.0 聚焦
- `flow_speed`: 0.55
- `distortion`: 0.035
- `pulse_frequency`: 24
- 混合：Additive 仅用于脉冲核心；外层杀意雾使用 Alpha Blend

### Effekseer `.efkefc` 对应

- Node 1 Ribbon: Alpha Blend, width 2, dark crimson
- Node 2 Ribbon: Alpha Blend, width 10, opacity 0.18
- Node 3 Sprite pulse: Additive, easing position 0→1, lifetime 36f
- Turbulence: Strength 0.035, Scale 3, Time 0.55

### Godot Particle／Shader 对应

- `Line2D`: width 2 主线；复制一层 width 10 作雾
- `ShaderMaterial`: `focus`, `flow_speed`, `distortion`, `noise_texture`
- `GPUParticles2D`: amount 1–3, lifetime 0.6, emission along path

### Unity VFX Graph／Shader Graph 对应

- VFX Graph Strip：Spawn 1 strip, 24 particles, lifetime 0.65
- Sample Curve position；Turbulence 0.035；Alpha 0.18
- Shader Graph：UV panner → Sample Noise → Distortion；Sine pulse → Smoothstep → Emission

## 崩势溶解

- `threshold`: 0→1，0.38 秒
- `edge_width`: 0.07
- `edge_color`: #F21F33
- 只溶解杀意线与行动图示；角色本体播放受挫姿态，不整个人消失。

## 烟雾 Flipbook

- 8 frames，单帧 64×64，整张 512×64
- 12–16 fps，Additive 或 Screen 视背景调整
- 杀生线聚焦：0.65 倍尺寸、alpha 0.35
- 崩势：1.4 倍尺寸、alpha 0.8、叠加破片

运行 `python tools/generate_yokai_fx.py` 可重新生成，不手工修改生成档。

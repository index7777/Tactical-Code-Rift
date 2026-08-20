# Route Map Runtime Assets — Split v1

此包把生成母版拆成單一可接遊戲的透明 PNG。

## 目錄
- battle-foreground/：12 個戰鬥前景、雨滴、霧、積水反光、碎石、燈籠
- node-frame/：normal / current / cleared / locked / elite / boss
- node-icon/：start / battle / elite / boss / event / rest / reward
- node-fx/：current halo / available pulse / cleared ring / elite aura / boss aura
- connection-primitives/：texture / glow / normal-current-danger dots / light-danger particles

## Runtime 原則
- Node Frame / Icon / FX 是三層獨立素材，不要再焙成同一張。
- connection geometry 應由程式決定；conn-texture / conn-glow 只作線段材質 overlay。
- 所有可疊加素材均保留真 RGBA alpha。
- `reference/` 只做 QA，不要直接作 runtime texture。

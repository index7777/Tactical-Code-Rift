# Momiji + Amamiya Rin SD Runtime Rebuild v1

此包提供兩個角色重新生成後、可直接接入遊戲的透明 PNG 資產。

## 角色
- `momiji/`：紅葉。重新生成 SD runtime 與 attack sequence，使比例更接近既有隊友（千景／朧）的場內視覺尺度。
- `amamiya-rin/`：雨宮凜。重新生成 SD runtime 與 attack sequence，保持與紅葉同一級別的 chibi 尺寸與清晰度。

## 內容
每個角色資料夾包含：
- `master/`：母版立繪
- `runtime/`：8 個 runtime pose 與一張 4×2 sprite sheet
- `attack/`：6 個 attack sequence frame 與一張 3×2 sequence sheet
- `portraits/`：UI portraits
- `fx/`：可用 FX PNG
- `reference/`：從生成大圖中抽出的原始物件，供 QA 對照

## Runtime Contract
- idle-a
- idle-b
- ready
- attack-a
- attack-b
- hit-a
- hit-b
- down

## 尺寸
- runtime: 128×128, bottom-center anchor
- attack frame: 192×160, transparent canvas

## 備註
- 這次重建的重點是 SD 視覺比例與戰鬥可讀性，不改變角色身份與主色語言。
- Momiji / Amamiya Rin 的 portraits 與 FX 直接沿用既有可用版本；重新生成的是 SD runtime 與 attack sequence。


## v2 修正
- 雨宮凜 attack sequence 已重做，修正多個動作中的刀位與握刀方向。
- 雨宮凜 attack frame 不再內嵌大型斬擊特效，角色與斬擊 FX 已分離。
- 雨宮凜新增獨立 FX：slash-light / slash-heavy / ring / dash-trail / vertical-slash / impact。
- 雨宮凜 runtime 的 attack-a / attack-b 也同步替換成新版角色-only pose。


## v3 修正
- 雨宮凜的斬擊 FX 已重做為純特效圖層。
- 移除烘進 FX 的配件、吊飾、武器裝飾等非特效元素。
- 新 FX 只保留冰藍／月白的斬擊、星屑、冰晶與衝擊語言，適合程式獨立疊加。

# Route Map UI Assets v1

此包是「雨暮山線」章節路線畫面的模組化 UI 美術資產。

## 原則
- 不把整個 UI 畫面烘成一張圖。
- 文字、進度數字、節點名稱、路線狀態由程式控制。
- 節點、節點狀態、路徑、圖示、面板框全部分離。
- `reference/` 只保存生成母版，runtime 不建議直接載入。

## 主要目錄
- `backgrounds/`：全畫面底圖
- `frames/`：面板框、分隔線、側邊 accent
- `nodes/`：normal / selected / completed / locked / boss / glow / pulse
- `paths/`：直線、斜線、節點接點效果
- `icons/`：start / encounter / elite / event / rest / shop / boss

## 程式接入建議
1. 背景單獨鋪滿。
2. Path 用線段圖片旋轉/縮放，或直接程式畫線；asset 可作為質感 overlay。
3. Node base 與 icon 分層。
4. Selected / glow / pulse 疊加，不要替換整個節點。
5. Panel frame 建議採 9-slice 或切片拉伸。

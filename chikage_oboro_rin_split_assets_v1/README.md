# Chikage / Oboro / Amamiya Rin Split Assets v1

這個壓縮包把多資產合成圖拆成可直接接入遊戲的單一透明 PNG。

## 包含內容
- `amamiya-rin/runtime/`：修正版 8 格 runtime pose（128x128, bottom-center anchor）
- `chikage/runtime/`：8 格 runtime pose（128x128）
- `chikage/portraits/`：normal / combat / hurt / current / timeline
- `chikage/fx/`：6 個獨立斬擊 FX
- `oboro/runtime/`：8 格 runtime pose（128x128）
- `oboro/portraits/`：normal / combat / hurt / current / timeline
- `oboro/fx/`：6 個獨立斬擊 FX
- `reference/`：原始大圖與逐一抽出的 source crop，方便 QA 對照
- `manifest.json`：拆分對應關係與來源 box

## Runtime Contract
idle-a / idle-b / ready / attack-a / attack-b / hit-a / hit-b / down

## 說明
- 本包重點是把「同一張裡的多個資產」拆成單一透明檔。
- runtime 已統一成 128×128 canvas，方便左右鏡像接入橫向戰鬥。
- portraits 與 FX 保留透明背景，方便 UI / 程式特效疊加。

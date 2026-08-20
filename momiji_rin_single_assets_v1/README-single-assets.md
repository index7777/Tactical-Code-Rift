# Momiji + Amamiya Rin — Single PNG Assets v1

這個版本把所有「一張圖裡有多個資產」的 sheet 再拆成獨立 PNG。

## 原則
- 遊戲實際使用目錄內只保留單一資產 PNG。
- 每張 PNG 都保留透明 alpha。
- runtime / attack / FX 各自獨立，不再要求程式從大 sheet 切格。
- 原本的大 sheet 只保留在 `reference/qa-sheets/` 作 QA 對照，不建議 runtime 載入。

## 角色
- `momiji/` 紅葉
- `amamiya-rin/` 雨宮凜

## 推薦實際使用
直接使用各角色下的：
- `runtime/*.png`
- `attack/*.png`
- `fx/*.png`
- `portraits/*.png`

另外 `singles-from-sheet/` 是從合併 sheet 再次分割出的單張 PNG，方便你檢查或替換。

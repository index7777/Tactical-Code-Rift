# PD・紅葉 Character Master

狀態：`VISUAL_MASTER_APPROVED_RUNTIME_INTEGRATION`

紅葉為人類女性隊員，代號 PD。使用者已指定本批視覺母版；舊槍／薙槍 runtime trial 全部退役，不再作為角色設計來源。

## Approved visual source

- 原始母版與衍生 runtime 素材封裝：`.artifacts/redleaf-runtime-bundle.zip`
- Build materializer：`scripts/materialize-redleaf.mjs`
- Runtime 生成目錄：`public/assets/battle/generated/characters/redleaf/`
- Production reference 目錄：`public/assets/battle/generated/characters/redleaf/production/`
- UI portraits：`public/assets/battle/portraits/redleaf-p11-4-current.svg`、`redleaf-p11-4-timeline.svg`

## 身分與輪廓

- 人類女性，PD，名稱「紅葉」。
- 黑色高馬尾，紅楓髮飾；紅眼。
- 黑／朱紅／白／少量金屬金為主色。
- 武器正式改為太刀／打刀系單刃長刀；禁止回到舊槍母版。
- 白色寬袖帶紅楓紋、黑紅束腰、黑色腿部裝甲／長靴是主要辨識點。
- 玩家位於左側，戰鬥 runtime 以朝右側視輪廓為準。

## Runtime asset contract

`npm run dev` 與 `npm run build` 會先執行 `npm run prepare:redleaf`，由 approved bundle deterministic 產生：

- `redleaf-idle-a.svg`
- `redleaf-idle-b.svg`
- `redleaf-ready.svg`
- `redleaf-attack-a.svg`
- `redleaf-attack-b.svg`
- `redleaf-hit-a.svg`
- `redleaf-hit-b.svg`
- `redleaf-down.svg`
- Current Actor／timeline UI portraits
- `production/redleaf-runtime-sprite-sheet.svg`
- `production/redleaf-attack-sequence.svg`
- `production/redleaf-slash-arc.svg`
- `production/redleaf-slash-impact.svg`
- `production/redleaf-master-approved-v1.svg`

現有 BootScene 已把 PD 映射到 `redleaf-*` pose prefix，因此上述生成檔會直接取代舊 placeholder；不修改戰鬥規則與卡牌語意。`redleaf-attack-b.svg` 同時疊入 approved slash arc，讓現有兩段 strike pipeline 直接使用紅葉專屬攻擊視覺。

## Runtime gate

1. PD 在 1280×720 4V4 站位不越界。
2. idle／ready／attack／hit／down 不得回到舊槍手造型。
3. Current Actor 菱形與 timeline 頭像使用同一母版臉型。
4. 攻擊段必須可看見紅葉專屬紅楓斬擊視覺。
5. build／Vercel 必須先成功執行 `prepare:redleaf`，缺少 bundle 時直接 fail，不可靜默 fallback。

## Physical production assets

- Runtime no longer depends on `.artifacts/redleaf-runtime-bundle.zip`.
- `prepare:redleaf` / `scripts/materialize-redleaf.mjs` have been retired.
- Approved user-provided art is checked in physically under `public/assets/battle/generated/characters/redleaf/production/`.
- Runtime contract: idle-a / idle-b / ready / attack-a / attack-b / hit-a / hit-b / down.
- `redleaf-runtime-sprite-sheet.png` and `redleaf-attack-sequence.png` are preserved as production references.
- Current Actor / timeline portraits and Redleaf slash / impact FX are loaded from the same physical production directory.

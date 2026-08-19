# Steam Demo Visual Polish P2

## 本批目標
- 移除舊式半圓弧斬擊。攻擊特效不得越過目標後繼續像投射物飛行。
- 所有斬擊改成「接觸點中心的巨大刀面光痕」：瞬間展開、原地消散，不沿 X 軸穿過敵人。
- 快斬/重斬/破甲/牽制/接力/堅守/掩護/整備各有可辨識 FX 語言。
- 保留 P1 千景（長兵器、較長蓄勢）與朧（高速切入、殘影）的角色節奏。
- Route -> Battle 增加短轉場；Boss 節點現在可進 battle-1 boss flow，並有 Boss intro title。

## 舊半圓弧來源
主要來源不是怪物 SVG，而是 `classic-slash-sheet.png`（texture key `slash-cc0`）及 presentation code 內的 `Graphics.arc()` 刀弧。它們在 attack/clash impact 後造成 crescent/半圓視覺，且因動畫與 tween 看起來像飛到敵人身後。

P2 處理：
1. BootScene 不再 preload / register `slash-cc0`。
2. ActionPresenter / ClashPresenter 不再建立 `slash-cc0` sprite。
3. 千景與 Clash 的攻擊用 arc 也改成 blade-plane slash。
4. `BootScene` 的 guard preview arc 保留，因為它是防禦提示，不是攻擊斬擊。

## 八張卡的 FX 規格
| 卡 | 核心讀感 | P2 Runtime FX | 後續正式素材 |
|---|---|---|---|
| 快斬 | 快、連續 | 雙斜斬，42ms 錯拍 | 2 張短刀光 texture + 快速 swish |
| 重斬 | 重、終結 | 1.42x 大斬 + 11 條爆線 + 地面衝擊 | 1 張巨大刀面 + impact debris |
| 破甲 | 打碎架勢 | 金色大斬 + 放射碎裂 + 橫向 crack | 碎甲 shards atlas |
| 堅守 | 原地承受 | 大型橢圓護符障壁 | 和紙/護符 shield texture |
| 掩護 | 截入殺意 | 大型向上 intercept glyph | 截刀 glyph + short rush trail |
| 接力 | 交棒補刀 | 金色斬擊 + 橫向 handoff streak | relay streak + partner entry cue |
| 整備 | 收束、復原 | 三層淡綠環由內向外消散 | 呼吸/護符 recovery motes |
| 牽制 | 壓低時序 | 三道水平制動條向目標方向收束 | blue restraint bars / time drag cue |

## 千景 / 朧
- 千景 PB：保留較長 anticipation、較遠 contact distance、較慢但更大的薙刀斬面；P2 移除原本半圓 `Graphics.arc`。
- 朧 PC：保留 92ms 高速切入、雙 afterimage、交叉切線；快斬會再疊雙刀光。
- 下一階段若有正式 pose asset：千景優先 `sweep`，朧優先 `dash-cut`。程式已可先靠節奏/FX 工作。

## 驗收
- 攻擊後不得出現半圓 crescent 飛到目標背後。
- 重斬在 1280x720 應跨約 250px 視覺寬度。
- 快斬應明顯是兩次切線，不是一個小光圈。
- 破甲應先讀成「碎裂」再讀成一般傷害。
- 所有 FX 以接觸點為中心，不改 gameplay position。

"""Generate simple, transparent, side-view Rainfall Ridgeline yokai assets."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/battle/generated/monsters/rainfall-ridgeline'
CAND=ROOT/'assets/candidates/monsters/rainfall-ridgeline'
OUT.mkdir(parents=True,exist_ok=True); CAND.mkdir(parents=True,exist_ok=True)

ART={
'wet-corpse':('<path d="M36 165q8-50 29-75l-10-31q8-24 31-27 25 4 31 27l-9 31q24 24 32 75z" fill="#b9b8ae" stroke="#242a2d" stroke-width="7"/><path d="M55 83 19 129M107 84l38 44M57 153l-13 38M107 153l15 38" stroke="#74553e" stroke-width="13" stroke-linecap="round"/><path d="M57 61q25-20 53 0l-7 48H64z" fill="#d5c7a9" stroke="#3b302d" stroke-width="6"/><path d="M65 68q17 9 36 0v34H65z" fill="#dfe3df"/><path d="M73 82h5M88 82h5" stroke="#3b2b2b" stroke-width="5"/><path d="M78 94q7 5 14 0" fill="none" stroke="#6b3032" stroke-width="4"/><path d="M74 110l30 8-16 43-28-10z" fill="#6b3032" stroke="#3e292d" stroke-width="5"/><path d="M112 116l35 21" stroke="#30292b" stroke-width="7"/><path d="M143 133l25 13-8 12-27-12z" fill="#7c4d38" stroke="#282426" stroke-width="5"/><path d="M151 143l25 12" stroke="#b1724b" stroke-width="4"/></svg>','#a07b63'),
'lantern-child':('<path d="M56 164q-5-42 16-61l-5-29 17-17 17 17-6 29q22 19 17 61z" fill="#b8a89a" stroke="#25232b" stroke-width="7"/><path d="M88 57v-25" stroke="#6e5943" stroke-width="6"/><path d="M69 28h38v31H69z" fill="#e0a83f" stroke="#33262b" stroke-width="6"/><path d="M79 40h18" stroke="#fff1a5" stroke-width="5"/><path d="M57 125 25 151M108 125l32 25" stroke="#4b3b3d" stroke-width="9"/></svg>','#d49b43'),
'mountain-hound':('<path d="M20 150q14-45 58-45 38 0 58 32l23-8-10 24-27 7q-30 20-70 6l-23 14z" fill="#20282c" stroke="#13181e" stroke-width="8"/><path d="M58 109 50 75l27 22 24-24 4 36" fill="#303b40" stroke="#13181e" stroke-width="7"/><path d="M119 126l25-15" stroke="#b65b54" stroke-width="6"/><circle cx="96" cy="111" r="4" fill="#e8b36b"/></svg>','#29363a'),
'wayfarer-umbrella':('<path d="M28 63q60-55 120 0z" fill="#6c4a55" stroke="#241e28" stroke-width="8"/><path d="M28 63q20 17 40 0t40 0 40 0" fill="none" stroke="#c08c68" stroke-width="5"/><path d="M88 65v99M88 164q0 20-14 20" stroke="#3a3037" stroke-width="8"/><path d="M66 78h44v54H66z" fill="#25252c" stroke="#16171c" stroke-width="6"/></svg>','#72515e'),
'noose-ghost':('<path d="M48 171q-9-51 14-79l-8-27 30-20 31 20-9 27q25 29 15 79z" fill="#9dabb0" fill-opacity=".82" stroke="#36434a" stroke-width="7"/><path d="M58 89q30 30 57 0M61 118q27 28 51 0M71 151q18 18 35 0" fill="none" stroke="#8d684f" stroke-width="8"/><path d="M84 44v-27q0-15 15-15" fill="none" stroke="#8d684f" stroke-width="8"/></svg>','#83979b'),
'lost-monk':('<path d="M41 165q2-55 27-78L55 58l33-25 34 25-13 29q25 23 26 78z" fill="#777d7d" stroke="#252d32" stroke-width="7"/><path d="M49 57h78l-15 30H62z" fill="#403d39" stroke="#202127" stroke-width="7"/><path d="M132 78v98M132 78l16 16" stroke="#936d45" stroke-width="7"/><path d="M64 113h53M65 137h48" stroke="#a7ada7" stroke-width="5"/></svg>','#6f7775'),
'rain-warrior':('<path d="M54 166q0-60 22-83l-8-34 27-22 28 22-9 34q24 25 23 83z" fill="#343d43" stroke="#1b2027" stroke-width="8"/><path d="M38 54h88l-20 27H58z" fill="#1d2429" stroke="#b28d57" stroke-width="5"/><path d="M65 104h56M65 130h56" stroke="#a14f4c" stroke-width="7"/><path d="M127 98l46 54" stroke="#b58b52" stroke-width="8"/><path d="M165 145l25 20" stroke="#d0b16b" stroke-width="5"/></svg>','#36444a'),
'rain-boss':('<path d="M26 174q0-85 35-111L50 25l39-20 40 20-12 38q36 29 39 111z" fill="#26313a" stroke="#151b23" stroke-width="9"/><path d="M25 57q63-60 129 0l-22 27H45z" fill="#18232c" stroke="#b28d57" stroke-width="6"/><path d="M64 106h65M61 133h72" stroke="#a64b4d" stroke-width="9"/><path d="M146 92l70 72" stroke="#b58b52" stroke-width="11"/><path d="M194 148l31 22" stroke="#e3bd78" stroke-width="7"/><circle cx="91" cy="82" r="7" fill="#d9a34f"/></svg>','#283741'),
}
for name,(body,_color) in ART.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200">{body}'
    (OUT/f'{name}-side-v1.svg').write_text(svg,encoding='utf-8')
    (CAND/f'{name}-side-v1.svg').write_text(svg,encoding='utf-8')
    print(name)

"""Create low-cost pose candidates from approved side-view Masters.

This is intentionally deterministic: no repainting, no new costume/weapon
content, and no baked FX. Runtime FX remains responsible for impact language.
"""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
PAIRS = {
    "chikage": ROOT / "public/assets/battle/chikage-sd-side-master-runtime-trial-v1.png",
    "oboro": ROOT / "public/assets/battle/oboro-sd-side-master-runtime-trial-v1.png",
}

def fit(im: Image.Image, scale: float, angle: float, tint=None) -> Image.Image:
    out = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    if tint:
        out = ImageEnhance.Color(out).enhance(0.72)
        overlay = Image.new("RGBA", out.size, tint + (0,))
        alpha = out.getchannel("A").point(lambda p: round(p * 0.22))
        overlay.putalpha(alpha)
        out = Image.alpha_composite(out, overlay)
    return out.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

for name, source in PAIRS.items():
    master = Image.open(source).convert("RGBA")
    out_dir = ROOT / f"assets/candidates/characters/{name}/poses"
    runtime_dir = ROOT / "public/assets/battle/generated/characters" / name
    out_dir.mkdir(parents=True, exist_ok=True); runtime_dir.mkdir(parents=True, exist_ok=True)
    poses = {
        "ready": (1.0, 0, None),
        "attack": (1.02, -8, None),
        "hit": (0.98, 8, (0x8d, 0x78, 0x88)),
        "down": (0.52, 78, (0x8d, 0x78, 0x88)),
    }
    for pose, (scale, angle, tint) in poses.items():
        image = fit(master, scale, angle, tint)
        # Keep a small, consistent transparent safety border; pivot is applied
        # by HeroinePose at runtime rather than baked into the image.
        canvas = Image.new("RGBA", (image.width + 20, image.height + 20), (0, 0, 0, 0))
        canvas.alpha_composite(image, (10, 10))
        candidate = out_dir / f"{name}-sd-{pose}-candidate-v1.png"
        runtime = runtime_dir / f"{name}-sd-{pose}-runtime-v1.png"
        canvas.save(candidate); canvas.save(runtime)
        print(candidate)

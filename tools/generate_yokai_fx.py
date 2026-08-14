"""Deterministic prototype FX textures for the Yokai Railway combat demo."""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "battle" / "generated"
OUT.mkdir(parents=True, exist_ok=True)
SEED = 7777


def noise_texture(size: int = 256) -> Image.Image:
    rng = random.Random(SEED)
    low = Image.new("L", (32, 32))
    low.putdata([rng.randrange(256) for _ in range(32 * 32)])
    broad = low.resize((size, size), Image.Resampling.BICUBIC)
    fine = Image.effect_noise((size, size), 18).filter(ImageFilter.GaussianBlur(0.7))
    return Image.blend(broad, fine, 0.38)


def smoke_frame(index: int, frames: int, size: int = 64) -> Image.Image:
    rng = random.Random(SEED + index)
    phase = index / frames
    alpha = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(alpha)
    for cloud in range(13):
        rise = phase * 24
        angle = cloud * 1.73 + phase * math.tau
        cx = size / 2 + math.sin(angle) * (5 + cloud * .65) + rng.uniform(-3, 3)
        cy = size * .70 - rise - cloud * 1.25 + rng.uniform(-3, 3)
        radius = 5 + cloud * .48 + math.sin(phase * math.pi) * 3
        strength = int(105 * math.sin(math.pi * min(.98, phase + .18)) * (1 - cloud / 20))
        draw.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), fill=max(0, strength))
    alpha = alpha.filter(ImageFilter.GaussianBlur(3.2))
    color = Image.new("RGBA", (size, size), (126, 18, 52, 0))
    color.putalpha(alpha)
    return color


def make_smoke_sheet(frames: int = 8, size: int = 64) -> Image.Image:
    sheet = Image.new("RGBA", (frames * size, size), (0, 0, 0, 0))
    for index in range(frames):
        sheet.alpha_composite(smoke_frame(index, frames, size), (index * size, 0))
    return sheet


if __name__ == "__main__":
    noise_texture().save(OUT / "yokai-noise.png", optimize=True)
    make_smoke_sheet().save(OUT / "intent-smoke-sheet.png", optimize=True)
    print(OUT)

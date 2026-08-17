#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageStat


def edge_density(image: Image.Image) -> float:
    return ImageStat.Stat(image.convert("L").filter(ImageFilter.FIND_EDGES)).mean[0] / 255.0


def main() -> int:
    parser = argparse.ArgumentParser(description="Deterministic Tactical Rift art checks")
    parser.add_argument("asset", type=Path)
    parser.add_argument("--kind", choices=("character", "background"), required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    image = Image.open(args.asset)
    width, height = image.size
    checks: list[dict[str, object]] = []

    def check(name: str, passed: bool, detail: str) -> None:
        checks.append({"name": name, "passed": passed, "detail": detail})

    check("readable", width > 0 and height > 0, f"{width}x{height} {image.mode}")
    if args.kind == "character":
        has_alpha = "A" in image.getbands()
        check("true-alpha", has_alpha, f"bands={image.getbands()}")
        alpha = image.convert("RGBA").getchannel("A")
        bbox = alpha.getbbox()
        check("non-empty-alpha-bbox", bbox is not None, f"bbox={bbox}")
        if bbox:
            bottom_gap = height - bbox[3]
            check("foot-baseline-margin", bottom_gap <= max(3, round(height * .03)), f"bottom_gap={bottom_gap}px")
            bbox_ratio = ((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])) / (width * height)
            check("usable-crop", bbox_ratio >= .18, f"bbox_area_ratio={bbox_ratio:.3f}")
        for target_height in (82, 100, 150):
            target_width = max(1, round(width * target_height / height))
            image.convert("RGBA").resize((target_width, target_height), Image.Resampling.LANCZOS).save(args.out_dir / f"{args.asset.stem}-{target_height}px.png")
    else:
        ratio = width / height
        check("landscape-16-9", abs(ratio - 16 / 9) <= .03, f"ratio={ratio:.4f}")
        check("minimum-runtime-size", width >= 1280 and height >= 720, f"{width}x{height}")
        rgb = image.convert("RGB")
        center = rgb.crop((round(width * .25), 0, round(width * .75), height))
        left = rgb.crop((0, 0, round(width * .25), height))
        right = rgb.crop((round(width * .75), 0, width, height))
        center_edges = edge_density(center)
        outer_edges = (edge_density(left) + edge_density(right)) / 2
        check("central-density-advisory", center_edges <= outer_edges * 1.15, f"center={center_edges:.4f}, outer={outer_edges:.4f}")
        overlay = rgb.copy()
        draw = ImageDraw.Draw(overlay, "RGBA")
        draw.rectangle((round(width * .25), round(height * .18), round(width * .75), round(height * .76)), outline=(90, 240, 255, 255), width=max(2, width // 640))
        overlay.save(args.out_dir / f"{args.asset.stem}-safe-zone.png")

    report = {"asset": str(args.asset), "kind": args.kind, "passed": all(bool(item["passed"]) for item in checks), "checks": checks, "manualReviewRequired": True}
    (args.out_dir / f"{args.asset.stem}-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

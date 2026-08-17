#!/usr/bin/env python3
"""Crop an RGBA candidate to its alpha bounds without repainting the asset."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--side-padding", type=int, default=16)
    parser.add_argument("--top-padding", type=int, default=16)
    parser.add_argument("--bottom-padding", type=int, default=10)
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit("source has no visible alpha pixels")

    left, top, right, bottom = bbox
    crop_box = (
        max(0, left - args.side_padding),
        max(0, top - args.top_padding),
        min(image.width, right + args.side_padding),
        min(image.height, bottom + args.bottom_padding),
    )
    cropped = image.crop(crop_box)
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(args.destination)
    print(
        f"saved {args.destination} {cropped.width}x{cropped.height} "
        f"source_bbox={bbox} crop={crop_box}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

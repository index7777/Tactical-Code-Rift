"""Extract selected cells from an evenly divided pose sheet.

Example:
  python tools/extract_pose_cells.py sheet.png out 3 2 ready=1 down=5
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from clean_character_candidate import clean


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("columns", type=int)
    parser.add_argument("rows", type=int)
    parser.add_argument("cells", nargs="+", help="name=index in reading order")
    args = parser.parse_args()

    sheet = Image.open(args.source).convert("RGBA")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for spec in args.cells:
        name, raw_index = spec.split("=", 1)
        index = int(raw_index)
        if not 0 <= index < args.columns * args.rows:
            raise ValueError(f"cell index out of range: {index}")
        column = index % args.columns
        row = index // args.columns
        # Rounded proportional boundaries retain the last pixels when a sheet
        # dimension is not evenly divisible by its row/column count.
        left = round(column * sheet.width / args.columns)
        right = round((column + 1) * sheet.width / args.columns)
        top = round(row * sheet.height / args.rows)
        bottom = round((row + 1) * sheet.height / args.rows)
        cell = sheet.crop((left, top, right, bottom))
        keyed = args.output_dir / f"{name}-green.png"
        output = args.output_dir / f"{name}.png"
        cell.save(keyed)
        clean(keyed, output, key_color=(0, 255, 0), tolerance=58)
        print(f"saved {output}")


if __name__ == "__main__":
    main()

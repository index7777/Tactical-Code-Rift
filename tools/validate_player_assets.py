from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


POSES = ("idle-a", "idle-b", "ready", "attack-a", "attack-b", "hit-a", "hit-b", "down")


def runtime_path(project_root: Path, relative_url: str) -> Path:
    return project_root / "public" / relative_url


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    manifest_path = project_root / "src/presentation/assets/player-assets.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    failures: list[str] = []
    warnings: list[str] = []
    keys: set[str] = set()

    for character in manifest["characters"]:
        prefix = character["assetPrefix"]
        dimensions: set[tuple[int, int]] = set()
        for pose in POSES:
            key = f"{prefix}-{pose}"
            if key in keys:
                failures.append(f"duplicate texture key: {key}")
            keys.add(key)
            path = runtime_path(
                project_root,
                f'{character["poseRoot"]}/{character["poseFilePrefix"]}-{pose}.png',
            )
            if not path.is_file():
                failures.append(f"missing pose: {path.relative_to(project_root)}")
                continue
            with Image.open(path) as image:
                dimensions.add(image.size)
                if image.format != "PNG":
                    failures.append(f"pose is not PNG: {path.relative_to(project_root)}")
                if "A" not in image.getbands():
                    failures.append(f"pose has no alpha: {path.relative_to(project_root)}")
                if image.width < 128 or image.height < 128:
                    failures.append(f"pose canvas below 128 px: {path.relative_to(project_root)}")
                alpha = image.getchannel("A")
                if alpha.getbbox() is None:
                    failures.append(f"pose is fully transparent: {path.relative_to(project_root)}")

        if len(dimensions) > 1:
            failures.append(f'{character["id"]} poses use mixed canvases: {sorted(dimensions)}')
        if dimensions == {(128, 128)}:
            warnings.append(f'{character["id"]}: 128x128 prototype source; production-resolution re-authoring remains open')

        for portrait_kind in ("currentPortrait", "timelinePortrait"):
            path = runtime_path(project_root, character[portrait_kind])
            if not path.is_file():
                failures.append(f"missing portrait: {path.relative_to(project_root)}")

    if failures:
        for message in failures:
            print(f"[FAIL] {message}")
        return 1
    for message in warnings:
        print(f"[WARN] {message}")
    print(f"[OK] {len(keys)} unique player pose keys and all manifest files validated")
    return 0


if __name__ == "__main__":
    sys.exit(main())

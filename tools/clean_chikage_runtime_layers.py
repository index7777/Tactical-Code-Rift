from pathlib import Path
import shutil

import cv2
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "chikage_oboro_rin_split_assets_v1/chikage/runtime"
CANDIDATE = ROOT / "assets/candidates/characters/chikage/runtime-cleanup-v1"
PUBLIC = ROOT / "public/assets/battle/characters/chikage/runtime"
POSES = ("idle-a", "idle-b", "ready", "attack-a", "attack-b", "hit-a", "hit-b", "down")


def keep_primary_layer(source: Path, target: Path) -> None:
    image = cv2.imread(str(source), cv2.IMREAD_UNCHANGED)
    if image is None or image.shape[2] != 4:
        raise ValueError(f"Expected RGBA PNG: {source}")

    opaque = (image[:, :, 3] > 8).astype("uint8")
    count, labels, stats, _ = cv2.connectedComponentsWithStats(opaque, 8)
    if count > 1:
        primary = 1 + stats[1:, cv2.CC_STAT_AREA].argmax()
        image[labels != primary] = 0

    target.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(target), image):
        raise OSError(f"Could not write {target}")


def build_sheet(directory: Path) -> None:
    sheet = Image.new("RGBA", (512, 256))
    for index, pose in enumerate(POSES):
        frame = Image.open(directory / f"chikage-{pose}.png").convert("RGBA")
        sheet.alpha_composite(frame, ((index % 4) * 128, (index // 4) * 128))
    sheet.save(directory / "chikage-runtime-sheet.png")


for pose in POSES:
    filename = f"chikage-{pose}.png"
    keep_primary_layer(SOURCE / filename, CANDIDATE / filename)

build_sheet(CANDIDATE)

for destination in (SOURCE, PUBLIC):
    for path in CANDIDATE.glob("*.png"):
        shutil.copy2(path, destination / path.name)

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Register a rejected Tactical Rift art candidate")
    parser.add_argument("asset", type=Path)
    parser.add_argument("--reason", required=True)
    parser.add_argument("--code", required=True)
    parser.add_argument("--category", choices=("characters", "backgrounds"), required=True)
    parser.add_argument("--spec", required=True)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    root, source = args.repo_root.resolve(), args.asset.resolve()
    destination_dir = root / "references" / "rejected" / args.category
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / source.name
    if source != destination.resolve():
        shutil.copy2(source, destination)
    index_path = root / "references" / "rejected" / "index.json"
    data = json.loads(index_path.read_text(encoding="utf-8"))
    relative = destination.relative_to(root).as_posix()
    item = {"asset": relative, "source": str(args.asset).replace("\\", "/"), "category": args.category, "code": args.code, "reason": args.reason, "spec": args.spec.replace("\\", "/"), "rejectedAt": datetime.now(timezone.utc).isoformat()}
    data["items"] = [entry for entry in data.get("items", []) if entry.get("asset") != relative]
    data["items"].append(item)
    index_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(item, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

import argparse
import json
from pathlib import Path

from jsonschema import Draft202012Validator


def validate(instance_path: Path, schema_path: Path) -> list[str]:
    instance = json.loads(instance_path.read_text(encoding="utf-8-sig"))
    schema = json.loads(schema_path.read_text(encoding="utf-8-sig"))
    validator = Draft202012Validator(schema)
    return [f"{'.'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}" for error in sorted(validator.iter_errors(instance), key=lambda e: list(e.absolute_path))]


parser = argparse.ArgumentParser(description="Validate Tactical Code Rift asset metadata.")
parser.add_argument("instance", type=Path)
parser.add_argument("--schema", type=Path, required=True)
args = parser.parse_args()
errors = validate(args.instance, args.schema)
if errors:
    for error in errors:
        print(f"[ERROR] {error}")
    raise SystemExit(1)
print(f"[OK] {args.instance} matches {args.schema}")

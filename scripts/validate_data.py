#!/usr/bin/env python3
"""Validate Passport Switch data files.

Checks:
- valid JSON, correct top-level shapes
- passports.json: required fields, unique codes
- rules.json: required fields, unique (passport, destination) keys,
  allowed status values, https source URLs, verified dates present
  and not in the future, no passport==destination entries.

Usage:
    python3 scripts/validate_data.py [--data-dir data]
Exits 0 and prints "All data files valid." on success, else prints
errors and exits 1.
"""
import argparse
import datetime
import json
import sys
from pathlib import Path

ALLOWED_STATUSES = {"visa_free", "visa_on_arrival", "evisa", "eta", "visa_required"}
ALLOWED_DESTINATIONS = {"TH", "VN", "ID", "PH", "MY", "SG", "KH", "LA", "MM", "BN", "JP", "KR"}
REQUIRED_RULE_FIELDS = {"passport", "destination", "destination_iso", "region", "status", "duration", "conditions", "source", "verified"}
REQUIRED_SOURCE_FIELDS = {"name", "url"}
REQUIRED_PASSPORT_FIELDS = {"code", "name", "henley_score", "henley_as_of"}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def validate_passports(data, errors):
    if not isinstance(data, list) or not data:
        errors.append("passports.json: must be a non-empty array")
        return set()
    codes = set()
    for i, p in enumerate(data):
        where = f"passports.json[{i}]"
        if not isinstance(p, dict):
            errors.append(f"{where}: must be an object")
            continue
        missing = REQUIRED_PASSPORT_FIELDS - set(p)
        if missing:
            errors.append(f"{where}: missing fields: {', '.join(sorted(missing))}")
        code = p.get("code")
        if code in codes:
            errors.append(f"{where}: duplicate passport code {code!r}")
        if isinstance(code, str) and code:
            codes.add(code)
        if "henley_score" in p and not isinstance(p["henley_score"], int):
            errors.append(f"{where}: henley_score must be an integer")
        if "henley_as_of" in p and not isinstance(p["henley_as_of"], str):
            errors.append(f"{where}: henley_as_of must be a string like YYYY-MM")
    return codes


def validate_rules(data, passport_codes, errors):
    if not isinstance(data, list):
        errors.append("rules.json: must be an array")
        return
    today = datetime.date.today()
    seen = set()
    for i, r in enumerate(data):
        where = f"rules.json[{i}]"
        if not isinstance(r, dict):
            errors.append(f"{where}: must be an object")
            continue
        missing = REQUIRED_RULE_FIELDS - set(r)
        if missing:
            errors.append(f"{where}: missing fields: {', '.join(sorted(missing))}")
        passport = r.get("passport")
        dest_iso = r.get("destination_iso")
        if passport is not None and dest_iso is not None:
            key = (passport, dest_iso)
            if key in seen:
                errors.append(f"{where}: duplicate rule for {passport}->{dest_iso}")
            seen.add(key)
            if passport == dest_iso:
                errors.append(f"{where}: self entry {passport}->{dest_iso} is not allowed")
        if passport is not None and passport_codes and passport not in passport_codes:
            errors.append(f"{where}: unknown passport {passport!r}")
        if dest_iso is not None and dest_iso not in ALLOWED_DESTINATIONS:
            errors.append(f"{where}: destination_iso {dest_iso!r} not in MVP scope")
        status = r.get("status")
        if status is not None and status not in ALLOWED_STATUSES:
            errors.append(f"{where}: invalid status {status!r}")
        conditions = r.get("conditions")
        if conditions is not None and (not isinstance(conditions, list) or not all(isinstance(c, str) and c.strip() for c in conditions)):
            errors.append(f"{where}: conditions must be a list of non-empty strings")
        for opt in ("fee", "extension", "notes"):
            if opt in r and r[opt] is not None and not isinstance(r[opt], str):
                errors.append(f"{where}: {opt} must be a string")
        source = r.get("source")
        if source is not None:
            if not isinstance(source, dict):
                errors.append(f"{where}: source must be an object")
            else:
                missing_src = REQUIRED_SOURCE_FIELDS - set(source)
                if missing_src:
                    errors.append(f"{where}: source missing fields: {', '.join(sorted(missing_src))}")
                url = source.get("url")
                if url is not None and (not isinstance(url, str) or not url.startswith("https://")):
                    errors.append(f"{where}: source url must start with https://")
                if "name" in source and (not isinstance(source["name"], str) or not source["name"].strip()):
                    errors.append(f"{where}: source name must be a non-empty string")
        verified = r.get("verified")
        if verified is not None:
            try:
                d = datetime.date.fromisoformat(verified)
                if d > today:
                    errors.append(f"{where}: verified date {verified} is in the future")
            except (ValueError, TypeError):
                errors.append(f"{where}: verified {verified!r} must be YYYY-MM-DD")


def validate_data(data_dir):
    errors = []
    passports_path = Path(data_dir) / "passports.json"
    rules_path = Path(data_dir) / "rules.json"
    try:
        passports = load_json(passports_path)
    except FileNotFoundError:
        return [f"missing file: {passports_path}"]
    except json.JSONDecodeError as e:
        return [f"passports.json: invalid JSON: {e}"]
    try:
        rules = load_json(rules_path)
    except FileNotFoundError:
        return [f"missing file: {rules_path}"]
    except json.JSONDecodeError as e:
        return [f"rules.json: invalid JSON: {e}"]
    codes = validate_passports(passports, errors)
    validate_rules(rules, codes, errors)
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate Passport Switch data files.")
    parser.add_argument("--data-dir", default="data", help="Directory containing passports.json and rules.json")
    args = parser.parse_args(argv)
    errors = validate_data(args.data_dir)
    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1
    print("All data files valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

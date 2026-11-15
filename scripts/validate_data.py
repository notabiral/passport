#!/usr/bin/env python3
"""Validate Passport Switch data files.

Checks:
- valid JSON, correct top-level shapes
- passports.json: required fields, unique codes
- rules.json: required fields, unique (passport, destination) keys,
  allowed status values, https source URLs, verified dates present
  and not in the future, no passport==destination entries
- substitute_visa.json ("With another visa") and transit.json
  ("Transit visa"): same shared checks, plus their own required
  fields, destination scopes, region vocabulary, and (transit only)
  allowed transit statuses.

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
ALLOWED_RULE_DESTINATIONS = {"TH", "VN", "ID", "PH", "MY", "SG", "KH", "LA", "MM", "BN", "JP", "KR"}
ALLOWED_RULE_REGIONS = {"Southeast Asia", "East Asia"}
REQUIRED_RULE_FIELDS = {"passport", "destination", "destination_iso", "region", "status", "duration", "conditions", "source", "verified"}

TRANSIT_STATUSES = {"transit_visa", "transit_visa_restricted"}
ALLOWED_SUBSTITUTE_DESTINATIONS = {"MX", "GE", "AL", "ME", "MD", "MA", "TR", "AR", "PA", "AG", "BH", "CR"}
ALLOWED_TRANSIT_DESTINATIONS = {"GB", "ES", "BE", "NL", "LU", "RO", "MX", "NZ", "US", "CA", "AU", "IE"}
# Region vocabulary for the two new files: five continental labels.
# Georgia, Türkiye and Bahrain file under Asia (Georgia follows the
# reference site's convention); all of the Americas — North, Central,
# South and the Caribbean — file under Americas; Morocco under Africa;
# Australia and New Zealand under Oceania. The main rules file keeps
# its own finer labels (Southeast Asia / East Asia) unchanged.
ALLOWED_EXTRA_REGIONS = {"Europe", "Asia", "Africa", "Americas", "Oceania"}
REQUIRED_EXTRA_FIELDS = {"passport", "destination", "destination_iso", "region", "requires", "benefit", "held_visas", "duration", "conditions", "source", "verified"}
REQUIRED_TRANSIT_FIELDS = REQUIRED_EXTRA_FIELDS | {"status"}

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


def _check_source(source, where, errors):
    if not isinstance(source, dict):
        errors.append(f"{where}: source must be an object")
        return
    missing_src = REQUIRED_SOURCE_FIELDS - set(source)
    if missing_src:
        errors.append(f"{where}: source missing fields: {', '.join(sorted(missing_src))}")
    url = source.get("url")
    if url is not None and (not isinstance(url, str) or not url.startswith("https://")):
        errors.append(f"{where}: source url must start with https://")
    if "name" in source and (not isinstance(source["name"], str) or not source["name"].strip()):
        errors.append(f"{where}: source name must be a non-empty string")


def _check_verified(verified, where, today, errors):
    try:
        d = datetime.date.fromisoformat(verified)
        if d > today:
            errors.append(f"{where}: verified date {verified} is in the future")
    except (ValueError, TypeError):
        errors.append(f"{where}: verified {verified!r} must be YYYY-MM-DD")


def _check_string_list(value, field, where, errors, allow_empty):
    if not isinstance(value, list) or not all(isinstance(c, str) and c.strip() for c in value):
        errors.append(f"{where}: {field} must be a list of non-empty strings")
    elif not allow_empty and not value:
        errors.append(f"{where}: {field} must not be empty")


def validate_entries(data, filename, passport_codes, errors, *, required_fields,
                     allowed_statuses, allowed_destinations, allowed_regions,
                     optional_string_fields, label):
    """Shared checks for rules.json, substitute_visa.json and transit.json.

    allowed_statuses is None for files with no status field
    (substitute_visa.json). held_visas is checked when present in
    required_fields; an empty list is allowed (restricted transit
    entries have no exempting document).
    """
    if not isinstance(data, list):
        errors.append(f"{filename}: must be an array")
        return
    today = datetime.date.today()
    seen = set()
    for i, r in enumerate(data):
        where = f"{filename}[{i}]"
        if not isinstance(r, dict):
            errors.append(f"{where}: must be an object")
            continue
        missing = required_fields - set(r)
        if missing:
            errors.append(f"{where}: missing fields: {', '.join(sorted(missing))}")
        passport = r.get("passport")
        dest_iso = r.get("destination_iso")
        if passport is not None and dest_iso is not None:
            key = (passport, dest_iso)
            if key in seen:
                errors.append(f"{where}: duplicate {label} for {passport}->{dest_iso}")
            seen.add(key)
            if passport == dest_iso:
                errors.append(f"{where}: self entry {passport}->{dest_iso} is not allowed")
        if passport is not None and passport_codes and passport not in passport_codes:
            errors.append(f"{where}: unknown passport {passport!r}")
        if dest_iso is not None and dest_iso not in allowed_destinations:
            errors.append(f"{where}: destination_iso {dest_iso!r} not in scope for {filename}")
        region = r.get("region")
        if region is not None and region not in allowed_regions:
            errors.append(f"{where}: region {region!r} not in the {filename} vocabulary")
        if allowed_statuses is not None:
            status = r.get("status")
            if status is not None and status not in allowed_statuses:
                errors.append(f"{where}: invalid status {status!r}")
        if "conditions" in r:
            _check_string_list(r["conditions"], "conditions", where, errors, allow_empty=True)
        if "held_visas" in required_fields and "held_visas" in r:
            _check_string_list(r["held_visas"], "held_visas", where, errors, allow_empty=True)
        for field in ("requires", "benefit", "duration", "destination"):
            if field in required_fields and field in r:
                if not isinstance(r[field], str) or not r[field].strip():
                    errors.append(f"{where}: {field} must be a non-empty string")
        for opt in optional_string_fields:
            if opt in r and r[opt] is not None and not isinstance(r[opt], str):
                errors.append(f"{where}: {opt} must be a string")
        if "source" in r:
            _check_source(r["source"], where, errors)
        if "verified" in r:
            _check_verified(r["verified"], where, today, errors)


def validate_rules(data, passport_codes, errors):
    validate_entries(
        data, "rules.json", passport_codes, errors,
        required_fields=REQUIRED_RULE_FIELDS,
        allowed_statuses=ALLOWED_STATUSES,
        allowed_destinations=ALLOWED_RULE_DESTINATIONS,
        allowed_regions=ALLOWED_RULE_REGIONS,
        optional_string_fields=("fee", "extension", "notes"),
        label="rule",
    )


def validate_substitute(data, passport_codes, errors):
    validate_entries(
        data, "substitute_visa.json", passport_codes, errors,
        required_fields=REQUIRED_EXTRA_FIELDS,
        allowed_statuses=None,
        allowed_destinations=ALLOWED_SUBSTITUTE_DESTINATIONS,
        allowed_regions=ALLOWED_EXTRA_REGIONS,
        optional_string_fields=("fee", "notes"),
        label="entry",
    )


def validate_transit(data, passport_codes, errors):
    validate_entries(
        data, "transit.json", passport_codes, errors,
        required_fields=REQUIRED_TRANSIT_FIELDS,
        allowed_statuses=TRANSIT_STATUSES,
        allowed_destinations=ALLOWED_TRANSIT_DESTINATIONS,
        allowed_regions=ALLOWED_EXTRA_REGIONS,
        optional_string_fields=("fee", "notes"),
        label="entry",
    )


def _load_or_error(path, errors):
    try:
        return load_json(path)
    except FileNotFoundError:
        errors.append(f"missing file: {path}")
    except json.JSONDecodeError as e:
        errors.append(f"{path.name}: invalid JSON: {e}")
    return None


def validate_data(data_dir):
    errors = []
    data_dir = Path(data_dir)
    passports = _load_or_error(data_dir / "passports.json", errors)
    rules = _load_or_error(data_dir / "rules.json", errors)
    substitute = _load_or_error(data_dir / "substitute_visa.json", errors)
    transit = _load_or_error(data_dir / "transit.json", errors)
    if errors:
        return errors
    codes = validate_passports(passports, errors)
    validate_rules(rules, codes, errors)
    validate_substitute(substitute, codes, errors)
    validate_transit(transit, codes, errors)
    return errors


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate Passport Switch data files.")
    parser.add_argument("--data-dir", default="data", help="Directory containing the JSON data files")
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

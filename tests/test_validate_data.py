import copy
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from validate_data import validate_data  # noqa: E402

VALID_PASSPORTS = [
    {"code": "VN", "name": "Vietnam", "henley_score": 48, "henley_as_of": "2026-07"},
    {"code": "TH", "name": "Thailand", "henley_score": 77, "henley_as_of": "2026-07"},
]

VALID_RULE = {
    "passport": "VN",
    "destination": "Thailand",
    "destination_iso": "TH",
    "region": "Southeast Asia",
    "status": "visa_free",
    "duration": "30 days",
    "conditions": ["Passport valid 6 months"],
    "source": {"name": "Example Immigration", "url": "https://example.gov/visas"},
    "verified": "2026-11-15",
}

VALID_SUBSTITUTE = {
    "passport": "VN",
    "destination": "Mexico",
    "destination_iso": "MX",
    "region": "Americas",
    "requires": "A valid US visa",
    "benefit": "Enter without a Mexican visa",
    "held_visas": ["US"],
    "duration": "Up to 180 days",
    "conditions": ["Passport valid for the stay"],
    "source": {"name": "Example Consulate", "url": "https://example.gov/mexico"},
    "verified": "2026-11-15",
}

VALID_TRANSIT = {
    "passport": "VN",
    "destination": "United States",
    "destination_iso": "US",
    "region": "Americas",
    "status": "transit_visa_restricted",
    "requires": "C-1 transit visa",
    "benefit": "No exemption available",
    "held_visas": [],
    "duration": "Immediate transit only",
    "conditions": ["Prearranged onward itinerary"],
    "source": {"name": "Example State Dept", "url": "https://example.gov/transit"},
    "verified": "2026-11-15",
}


@pytest.fixture
def data_dir(tmp_path):
    (tmp_path / "passports.json").write_text(json.dumps(VALID_PASSPORTS), encoding="utf-8")
    (tmp_path / "rules.json").write_text(json.dumps([VALID_RULE]), encoding="utf-8")
    (tmp_path / "substitute_visa.json").write_text(json.dumps([VALID_SUBSTITUTE]), encoding="utf-8")
    (tmp_path / "transit.json").write_text(json.dumps([VALID_TRANSIT]), encoding="utf-8")
    return tmp_path


def write_file(data_dir, name, data):
    (data_dir / name).write_text(json.dumps(data), encoding="utf-8")


def write_rules(data_dir, rules):
    write_file(data_dir, "rules.json", rules)


def test_valid_data_passes(data_dir):
    assert validate_data(str(data_dir)) == []


def test_duplicate_rule_rejected(data_dir):
    write_rules(data_dir, [VALID_RULE, copy.deepcopy(VALID_RULE)])
    errors = validate_data(str(data_dir))
    assert any("duplicate rule" in e for e in errors)


def test_self_entry_rejected(data_dir):
    bad = copy.deepcopy(VALID_RULE)
    bad["passport"] = "TH"
    bad["destination_iso"] = "TH"
    write_rules(data_dir, [bad])
    errors = validate_data(str(data_dir))
    assert any("Self entry" in e or "self entry" in e.lower() for e in errors)


def test_bad_status_rejected(data_dir):
    bad = copy.deepcopy(VALID_RULE)
    bad["status"] = "maybe"
    write_rules(data_dir, [bad])
    assert any("invalid status" in e for e in validate_data(str(data_dir)))


def test_non_https_source_rejected(data_dir):
    bad = copy.deepcopy(VALID_RULE)
    bad["source"] = {"name": "X", "url": "http://example.gov/visas"}
    write_rules(data_dir, [bad])
    assert any("https://" in e for e in validate_data(str(data_dir)))


def test_future_verified_date_rejected(data_dir):
    bad = copy.deepcopy(VALID_RULE)
    bad["verified"] = "2999-01-01"
    write_rules(data_dir, [bad])
    assert any("future" in e for e in validate_data(str(data_dir)))


def test_missing_field_rejected(data_dir):
    bad = copy.deepcopy(VALID_RULE)
    del bad["duration"]
    write_rules(data_dir, [bad])
    assert any("missing fields" in e for e in validate_data(str(data_dir)))


def test_invalid_json_rejected(data_dir):
    (data_dir / "rules.json").write_text("{not json", encoding="utf-8")
    assert any("invalid JSON" in e for e in validate_data(str(data_dir)))


def test_unknown_passport_rejected(data_dir):
    bad = copy.deepcopy(VALID_RULE)
    bad["passport"] = "JP"
    write_rules(data_dir, [bad])
    assert any("unknown passport" in e for e in validate_data(str(data_dir)))


def test_duplicate_substitute_entry_rejected(data_dir):
    write_file(data_dir, "substitute_visa.json", [VALID_SUBSTITUTE, copy.deepcopy(VALID_SUBSTITUTE)])
    assert any("duplicate entry" in e for e in validate_data(str(data_dir)))


def test_bad_transit_status_rejected(data_dir):
    bad = copy.deepcopy(VALID_TRANSIT)
    bad["status"] = "visa_free"
    write_file(data_dir, "transit.json", [bad])
    assert any("invalid status" in e for e in validate_data(str(data_dir)))


def test_transit_self_entry_rejected(data_dir):
    bad = copy.deepcopy(VALID_TRANSIT)
    bad["passport"] = "TH"
    bad["destination"] = "Thailand"
    bad["destination_iso"] = "TH"
    write_file(data_dir, "transit.json", [bad])
    assert any("self entry" in e.lower() for e in validate_data(str(data_dir)))


def test_substitute_missing_requires_rejected(data_dir):
    bad = copy.deepcopy(VALID_SUBSTITUTE)
    del bad["requires"]
    write_file(data_dir, "substitute_visa.json", [bad])
    assert any("missing fields" in e for e in validate_data(str(data_dir)))


def test_substitute_unknown_destination_rejected(data_dir):
    bad = copy.deepcopy(VALID_SUBSTITUTE)
    bad["destination"] = "Japan"
    bad["destination_iso"] = "JP"
    write_file(data_dir, "substitute_visa.json", [bad])
    assert any("not in scope" in e for e in validate_data(str(data_dir)))


def test_substitute_bad_region_rejected(data_dir):
    bad = copy.deepcopy(VALID_SUBSTITUTE)
    bad["region"] = "North America"
    write_file(data_dir, "substitute_visa.json", [bad])
    assert any("region" in e for e in validate_data(str(data_dir)))


def test_held_visas_must_be_string_list(data_dir):
    bad = copy.deepcopy(VALID_SUBSTITUTE)
    bad["held_visas"] = "US"
    write_file(data_dir, "substitute_visa.json", [bad])
    assert any("held_visas" in e for e in validate_data(str(data_dir)))


def test_transit_non_https_source_rejected(data_dir):
    bad = copy.deepcopy(VALID_TRANSIT)
    bad["source"] = {"name": "X", "url": "http://example.gov/transit"}
    write_file(data_dir, "transit.json", [bad])
    assert any("https://" in e for e in validate_data(str(data_dir)))


def test_substitute_future_verified_date_rejected(data_dir):
    bad = copy.deepcopy(VALID_SUBSTITUTE)
    bad["verified"] = "2999-01-01"
    write_file(data_dir, "substitute_visa.json", [bad])
    assert any("future" in e for e in validate_data(str(data_dir)))


def test_missing_new_file_rejected(data_dir):
    (data_dir / "transit.json").unlink()
    assert any("missing file" in e for e in validate_data(str(data_dir)))


def test_optional_fee_allowed_in_new_files(data_dir):
    sub = copy.deepcopy(VALID_SUBSTITUTE)
    sub["fee"] = "USD 400"
    write_file(data_dir, "substitute_visa.json", [sub])
    assert validate_data(str(data_dir)) == []

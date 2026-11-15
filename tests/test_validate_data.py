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


@pytest.fixture
def data_dir(tmp_path):
    (tmp_path / "passports.json").write_text(json.dumps(VALID_PASSPORTS), encoding="utf-8")
    (tmp_path / "rules.json").write_text(json.dumps([VALID_RULE]), encoding="utf-8")
    return tmp_path


def write_rules(data_dir, rules):
    (data_dir / "rules.json").write_text(json.dumps(rules), encoding="utf-8")


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

# Contributing

Thanks for helping keep this accurate. Read `DATA_POLICY.md` first: it is
short and strict.

## Data lives in JSON

- `data/passports.json`: one object per passport: `code`, `name`,
  `henley_score`, `henley_as_of` (YYYY-MM, display only).
- `data/rules.json`: one object per passport + destination pair.

Rule schema:

```json
{
  "passport": "VN",
  "destination": "Thailand",
  "destination_iso": "TH",
  "region": "Southeast Asia",
  "status": "visa_free",
  "duration": "30 days",
  "fee": null,
  "conditions": ["Passport valid 6 months"],
  "extension": null,
  "notes": null,
  "source": {"name": "Immigration Bureau", "url": "https://example.gov/visas"},
  "verified": "2026-11-15"
}
```

`status` must be one of: `visa_free`, `visa_on_arrival`, `evisa`, `eta`,
`visa_required`. `fee`, `extension`, and `notes` are optional: omit them or
set them to `null` when the official page does not state them.
`passport` + `destination_iso` must be unique, and a passport cannot list
itself as a destination. `source.url` must be `https://` and official.
`verified` must be YYYY-MM-DD and not in the future.

Keep rules sorted by passport, then destination name.

## Before opening a pull request

```bash
python3 scripts/validate_data.py
python3 -m pytest tests/ -q
```

Both must pass. The validator checks schema, uniqueness, status values,
https sources, verified dates, and self-entries. It cannot check that the
official page actually says what the rule says: reviewers check that.

## Code contributions

The site is deliberately boring: plain HTML, one CSS file, one small JS
file, no frameworks, no build step. Please keep it that way. Small, pure
functions; minimal comments; relative paths only so the same files work on
GitHub Pages project pages and locally.

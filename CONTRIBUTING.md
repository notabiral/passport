# Contributing

Thanks for helping keep this accurate. Read `DATA_POLICY.md` first: it is
short and strict.

## Data lives in JSON

- `data/passports.json`: one object per passport: `code`, `name`,
  `henley_score`, `henley_as_of` (YYYY-MM, display only).
- `data/rules.json`: one object per passport + destination pair (main
  ledger).
- `data/substitute_visa.json`: one object per passport + destination pair
  ("With another visa").
- `data/transit.json`: one object per passport + destination pair
  ("Transit visa").

Rule schema (`rules.json`):

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
set them to `null` when the source page does not state them.
`passport` + `destination_iso` must be unique, and a passport cannot list
itself as a destination. `source.url` must be `https://` and official
(except the labelled Wikipedia cases in `DATA_POLICY.md`).
`verified` must be YYYY-MM-DD and not in the future.
`region` must be `Southeast Asia` or `East Asia`.

Substitute-visa schema (`substitute_visa.json`): no `status` field.
Required: `passport`, `destination`, `destination_iso`, `region`,
`requires` (plain-language held-visa description), `benefit` (what the
held document unlocks, worded honestly — a visa on arrival or an online
authorisation is not visa-free entry), `held_visas` (array of issuing
countries/schemes, e.g. `US`, `Schengen`, `UK`), `duration`,
`conditions[]`, `source`, `verified`. Optional: `fee`, `notes`.
Destinations are limited to the 12 in `DATA_POLICY.md` section 5.

Transit schema (`transit.json`): same fields as the substitute-visa
schema, plus `status`, which must be one of: `transit_visa` (a transit
visa is needed, but a held visa/permit exempts) or
`transit_visa_restricted` (a transit visa is needed, with no exemption).
For `transit_visa_restricted` entries `held_visas` is an empty array.
Destinations are limited to the 12 in `DATA_POLICY.md` section 5, and
sources must be official only — no Wikipedia citations.

Region vocabulary for the two newer files: exactly five labels —
`Europe`, `Asia`, `Africa`, `Americas`, `Oceania`. Georgia, Türkiye and
Bahrain file under `Asia`; all of the Americas (North, Central, South,
Caribbean) file under `Americas`; Morocco under `Africa`; Australia and
New Zealand under `Oceania`.

Keep entries sorted by passport in `passports.json` order (VN, ID, PH,
TH), then destination name.

## Before opening a pull request

```bash
python3 scripts/validate_data.py
python3 -m pytest tests/ -q
```

Both must pass. The validator checks schema, uniqueness, status values,
destination scopes, region vocabulary, https sources, verified dates, and
self-entries. It cannot check that the source page actually says what the
entry says: reviewers check that.

## Code contributions

The site is deliberately boring: plain HTML, one CSS file, one small JS
file, no frameworks, no build step. Please keep it that way. Small, pure
functions; minimal comments; relative paths only so the same files work on
GitHub Pages project pages and locally.

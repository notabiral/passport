# Passport Switch

> Pick a passport, see where it takes you.

A visa guide for travellers on weaker passports. Pick your passport and the
whole guide switches: visa-free, visa on arrival, eVisa, ETA, and
visa-required destinations, each linked to an official government source
with the date it was last verified.

**Live site:** enable GitHub Pages from `main` / root (see below), then it
serves at `https://notabiral.github.io/passport/`.

## Scope (v1)

Passports: Vietnam (VN), Indonesia (ID), Philippines (PH), Thailand (TH).

Destinations: the ASEAN 10 (Thailand, Vietnam, Indonesia, Philippines,
Malaysia, Singapore, Cambodia, Laos, Myanmar, Brunei) plus Japan and South
Korea. No passport-to-itself entries. Maximum 44 rules; v1 ships 36 verified
rules (Vietnam 10, Indonesia 8, Philippines 9, Thailand 9). Destinations
that could not be verified against an official source are omitted, not
guessed: all four Myanmar rules, plus Indonesia to Vietnam, Indonesia to
Cambodia, Philippines to Cambodia, and Thailand to Cambodia. See the commit
history and issues for the reasons.

Nepal is explicitly out of scope. The inspiration site below already covers
Nepali passports well.

## Why

Visa information for weaker passports is scattered, outdated, and often
copied blog-to-blog without sources. This repo keeps one dataset where
every fact is dated and verifiable, and where switching passports shows how
different the same world looks.

Henley Passport Index scores shown under each passport (July 2026: Thailand
77, Indonesia 70, Philippines 65, Vietnam 48) are display context only. The
rules themselves come only from official sources.

## Inspiration and credit

Inspired by [The Nepali Passport Diaries](https://nepalipassportdiaries.therashverse.com/)
([RashikaKarki/Nepali-Passport-Diaries](https://github.com/RashikaKarki/Nepali-Passport-Diaries)),
a single-passport Jekyll + YAML guide. Passport Switch generalises the idea
to multiple passports with a toggle, in plain HTML/CSS/JS + JSON. No data
was copied from that site; every rule here was researched fresh.

## Running locally

No build step. Serve the folder over HTTP (plain `file://` blocks the JSON
fetch in most browsers):

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000
```

Check the data:

```bash
python3 scripts/validate_data.py
python3 -m pytest tests/ -q
```

## Structure

- `index.html`, `assets/style.css`, `assets/app.js`: the site. No
  frameworks. Relative paths only, so the same files work locally and on
  GitHub Pages project pages.
- `data/passports.json`, `data/rules.json`: the dataset.
- `scripts/validate_data.py`: schema and sanity checks.
- `tests/`: pytest checks for the validator.
- `DATA_POLICY.md`: official sources only, dated verification.
- `CONTRIBUTING.md`: rule schema and how to add a destination.

## Deploying with GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → branch
`main`, folder `/ (root)`. Save. No custom domain is configured for v1.

## Disclaimer

Informational only. Visa rules change without notice. Always confirm with
the official source linked on each card, and with your airline, before you
travel.

## License

Code: MIT. Data (`data/`): CC BY 4.0. See `LICENSE`.

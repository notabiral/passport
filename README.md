# Passport Switch

> Pick a passport, see where it takes you.

A visa guide for travellers on weaker passports. Pick your passport and the
whole guide switches: visa-free, visa on arrival, eVisa, ETA, and
visa-required destinations; places a visa you already hold opens up; and
places that need a visa even to change planes. Every entry links to its
source and shows the date it was last checked. Most entries cite official
government sources; a small number cite Wikipedia and say so on the entry
(see `DATA_POLICY.md`).

**Live site:** enable GitHub Pages from `main` / root (see below), then it
serves at `https://notabiral.github.io/passport/`.

## Scope (v2)

Passports: Vietnam (VN), Indonesia (ID), Philippines (PH), Thailand (TH).

Three sections, all switching with the passport picker:

1. **Where this passport goes** (`data/rules.json`): the ASEAN 10
   (Thailand, Vietnam, Indonesia, Philippines, Malaysia, Singapore,
   Cambodia, Laos, Myanmar, Brunei) plus Japan and South Korea. No
   passport-to-itself entries. All 44 rules verified (11 per passport).
   The 8 rules v1 could not verify were filled in v2: 4 from official
   sources and 4 from labelled Wikipedia sources where the official page
   could not be read (see `DATA_POLICY.md`).
2. **With another visa** (`data/substitute_visa.json`): 11 destinations
   (Mexico, Georgia, Albania, Montenegro, Moldova, Türkiye,
   Argentina, Panama, Antigua and Barbuda, Bahrain, Costa Rica) where a
   held visa or permit changes the route. 30 verified entries (Vietnam 7,
   Indonesia 9, Philippines 8, Thailand 6). A destination appears only
   when its substitute rule was checked for that passport; already
   visa-free destinations and unverifiable rules are omitted.
3. **Transit visa** (`data/transit.json`): 6 destinations (United
   Kingdom, Mexico, New Zealand, United States, Canada, Australia)
   where a transit visa may be needed even to stay airside. 15 verified
   entries (Vietnam 6, Indonesia 3, Philippines 3, Thailand 3), all
   official sources only. Places a passport can transit without a visa
   do not appear.

Destinations that could not be verified are omitted, not guessed.

Nepal is explicitly out of scope. The inspiration site below already covers
Nepali passports well.

## Why

Visa information for weaker passports is scattered, outdated, and often
copied blog-to-blog without sources. This repo keeps one dataset where
every fact is dated and verifiable, and where switching passports shows how
different the same world looks.

Henley Passport Index scores shown under each passport (July 2026: Thailand
77, Indonesia 70, Philippines 65, Vietnam 48) are display context only. The
entries themselves come from official government sources wherever they
could be read; the exceptions are labelled on the entry and listed in
`DATA_POLICY.md`.

## Inspiration and credit

Inspired by [The Nepali Passport Diaries](https://nepalipassportdiaries.therashverse.com/)
([RashikaKarki/Nepali-Passport-Diaries](https://github.com/RashikaKarki/Nepali-Passport-Diaries)),
a single-passport Jekyll + YAML guide. Passport Switch generalises the idea
to multiple passports with a toggle, as a Vite + React + TypeScript +
Tailwind app over the same JSON dataset. No data
was copied from that site; every rule here was researched fresh.

## Running locally

Requires Node 20+ and npm. Install once, then run the dev server or a
production build:

```bash
npm install
npm run dev     # Vite dev server with hot reload
npm run build   # type-check (tsc) + production build into dist/
```

Check the data:

```bash
python3 scripts/validate_data.py
python3 -m pytest tests/ -q
```

## Structure

- `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`: the site
  (Vite + React + TypeScript + Tailwind). The entry data is imported
  directly from `data/*.json` at build time; nothing is fetched at
  runtime. `vite.config.ts` uses a relative base (`./`) so the same
  build works served from the `/passport/` subpath or a domain root.
  See `DESIGN.md` for the design system and data-wiring notes.
- `data/passports.json`, `data/rules.json`, `data/substitute_visa.json`,
  `data/transit.json`: the dataset.
- `scripts/validate_data.py`: schema and sanity checks for all four files.
- `tests/`: pytest checks for the validator.
- `DATA_POLICY.md`: sourcing rules, dated verification, what Wikipedia
  may and may not source.
- `CONTRIBUTING.md`: file schemas and how to add an entry.

## Deploying with GitHub Pages

Build, then push the built output to the `gh-pages` branch manually:

```bash
npm run build   # output in dist/
```

Settings → Pages → Build and deployment → Deploy from a branch → branch
`gh-pages`, folder `/ (root)`. The `main` branch holds source only; the
live site serves whatever is on `gh-pages`. No custom domain is
configured.

## Disclaimer

Informational only. Visa rules change without notice. Always confirm with
the official source linked on each card, and with your airline, before you
travel.

## License

Code: MIT. Data (`data/`): CC BY 4.0. See `LICENSE`.

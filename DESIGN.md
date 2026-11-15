# DESIGN.md — Passport Switch: Meta AI remake merged with verified data

Design notes for the v2 rebuild (15 Nov 2026). The presentation is the
remake Abiral produced with Meta AI (`App.tsx` + `index.css`), kept
verbatim; the data layer underneath it was replaced with the verified
dataset in `data/*.json`. This document supersedes the v2 "Border Ledger"
system entirely. There is no new design name: it is the Meta AI remake,
merged.

## Stack

Vite + React 19 + TypeScript (strict) + Tailwind CSS v3. Entry:
`index.html` → `src/main.tsx` → `src/App.tsx` + `src/index.css`. The
dataset is imported directly from `data/*.json` at build time
(`resolveJsonModule`); nothing is fetched at runtime. Build output is
`dist/` with a relative base (`./`) so the same build works under the
`/passport/` GitHub Pages subpath and at a domain root.

## Tokens (from `src/index.css`, verbatim copy of the remake's stylesheet)

Light: surface `#FFFFFF`, surface-2 `#F3F3EE`, surface-3 `#EDEDE7`, ink
`#111110`, muted `#6B6B64`, line `#E2E2DB`, accent `#FF4A1C`, green
`#147A4A`, amber `#9A6500`, blue `#1B4BD8`. Dark mode is a full token
swap via `@media (prefers-color-scheme: dark)` plus Tailwind `dark:`
variants (default media mode). Type: Space Grotesk (display/body) and
IBM Plex Mono (labels, eyebrows, counts), loaded via a Google Fonts
`@import` at the top of the stylesheet. Cards are 20px radius with a
hover lift (`translateY(-2px)`, ink border, soft shadow). The accent is
spent sparingly: hero words, icons, active states, key badges.

## Components (unchanged from the remake)

Slim sticky header with wordmark, noun nav, and a verified-entries pill;
hero with mono eyebrow pills, oversized tight-tracked headline, and a
large search bar; passport picker cards (Henley score prominent, active
card inverted to ink); sticky left filter rail (section switch, region
pills, category list, how-to-read box, "why this exists" panel); three
card grids; a dark inverted compare block; a data-policy block; an
amber disclaimer panel; a footer with totals and credits.

## Data wiring

- All counts are computed from the imported JSON: per-passport and total
  entry counts, group counts, distinct destinations in scope (11
  substitute, 6 transit), and the Henley label (formatted from
  `henley_as_of`, e.g. `2026-07` → `JULY 2026`). No hardcoded totals.
- Entry text (benefit, conditions, notes, requires, duration, fee,
  extension, source name/URL, verified date) is rendered verbatim.
  Optional fields (`fee`, `extension`, substitute `notes`) render only
  when present.
- Region display: the data's `Southeast Asia` is shown and filtered as
  `ASEAN` (`displayRegion`); all other regions render as stored.
  Substitute regions are Americas/Europe/Asia, so `Asia` was added to
  the region filter list; Africa/Caribbean/Middle East pills match zero
  entries and are left as-is.
- Search matches destination name, code, region, and status/benefit
  text (plus duration for main/transit entries).
- The left-rail category list is a working status filter for the main
  section only (parity with the old site): click to filter, click again
  to clear, Reset clears it. All five categories stay listed; visa on
  arrival and eVisa have zero entries in the current data.
- Every card carries its source: source name, `Checked {verified}`, and
  a link to the source URL. Entries whose source is Wikipedia show a
  `WIKIPEDIA` flag instead of `SOURCE LINKED` / `OFFICIAL SOURCE`, and
  the main-card link reads `Wikipedia source` instead of
  `Official source`. Transit entries are official sources only.

## HOLD → UNLOCK grouping ("With another visa")

The section's concept is that a visa already held is the key that opens
a destination. Cards keep the remake's grammar: `HOLD` chips → `UNLOCK`
name, benefit pill, `Requires`, conditions, source line.

Grouping is derived from the benefit sentence, not stored: an entry is
in the `easier` group when its benefit matches
`/AVE|e-Visa|eVisa|Visa-on-Arrival|Visa on arrival|Electronic Travel
Authorisation|Eligibility for/` (9 entries: Antigua and Barbuda ×4,
Argentina ×3, Bahrain, Türkiye), otherwise `no-visa` (21 entries).
The easier pill reads `{ROUTE} INSTEAD OF EMBASSY VISA`, where ROUTE is
`AVE`, `E-VISA`, or `VISA ON ARRIVAL`, derived from the same benefit
text (`granted on arrival` counts as an on-arrival route; fallback
`EASIER ROUTE` is unused by the current data). The no-visa pill reads
`NO VISA TO APPLY FOR`. Green/amber pill styling follows the group.

## Held-visa filter normalization

Filter labels are short names; the data's `held_visas` values are
precise issuer names. The explicit map in `src/App.tsx` (`HELD_MATCHES`)
says: US matches US+USA; Schengen matches `Schengen`, `Schengen/EU
states`, `EU`, and the 29 Schengen member-state names (Georgia for
Vietnam lists 45 individual countries with no `Schengen` string, so the
state list is what makes the filter match it); NZ matches New Zealand;
Korea matches South Korea; GCC matches `GCC`, the long `GCC states
(...)` string, and the six member names. Australia, Canada, Japan,
Ireland, and UK match themselves.

## Conditional example box

The "You hold an Australian visa → You unlock Georgia" example renders
only when the current passport has a Georgia entry whose held visas
include Australia (Vietnam, Indonesia, Philippines). Thailand has no
Georgia entry, so the box hides rather than show a false example.

## What changed vs the Meta AI original

Only the data layer and data-necessitated wiring: hardcoded pools and
counts replaced with JSON imports; the `SUB_POOL` type error fixed (the
identifier never existed); placeholder card copy replaced with real
entry rendering; source lines, Wikipedia flags, fee/extension lines,
and notes added; the status filter wired; `Asia` added to regions;
counts, labels, and scope numbers computed. No className, layout,
component, or other copy string was changed.

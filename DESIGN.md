# DESIGN.md — Passport Switch: "The Border Ledger"

Design system for the v2 redesign (15 Nov 2026). Written from the
design-taste-workflow: taste direction first, then tokens adapted from the
vendored references (Notion spacing/hairline discipline, Verge mono-label
and flat-rule discipline). Nothing here clones a brand: the palette, type
and components are Passport Switch's own, evolved from the v1 paper/ink
manual. No user reference image was supplied for this redesign; the system
was built from this document plus the existing code.

## 1. Kind, dials, waivers

**Kind: dense data guide / reference tool.** Not a marketing page. Nothing
is sold. The one main action is switching passports and scanning the
ledger. The data is the product; the page must read like a well-kept
border-crossing ledger, not a landing page.

Three dials (1–10):

- Design variance: **4** — mostly conventional, one strong gesture (the ink
  switchboard). The ledger itself stays disciplined so facts stay scannable.
- Motion intensity: **2** — mostly static. Hover/press micro-interactions
  plus one restrained load-in. No scroll animation, no loops, no effects.
- Visual density: **8** — information-heavy by requirement. Ruled rows,
  compact metadata, generous but purposeful whitespace only between
  sections.

**Explicit waivers** for taste-skill marketing-page rules that do not fit
a reference tool (recorded, not ignored):

1. One section per screen / hero alone on screen one: WAIVED. The picker
   and the first results must coexist; long scroll is the product.
2. Photographs lead: WAIVED. No photographs; no stock imagery. Type, rules
   and data carry the page. The subject is a dataset, not a place or
   product.
3. Hero entrance + dealt moments: ADAPTED. One restrained masthead load-in
   only. The dealt moment IS the passport switch: the whole ledger visibly
   re-sorts. No shader, scene, or scroll-linked motion.
4. 60–80 words per screen: WAIVED. Density is the requirement.
5. Real product icons: NOT APPLICABLE. Status is carried by text + colour,
   never colour alone. No icons are drawn or faked.
6. Kept in full: equal left/right content edges; hover micro-interactions;
   no violet/lavender anywhere; no gradients; one system (one button pair,
   one row style, one link look); keyboard access, visible focus, reduced
   motion respected; no caption under any visual (there are no visuals).

## 2. Tokens

### Colour (paper/ink ledger, sharpened from v1)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f6f1e7` | Page ground |
| `--surface` | `#fffdf8` | Row/card surface, switchboard selected plate |
| `--surface-2` | `#efe8d9` | Hover tint, control fill |
| `--ink` | `#1b1815` | Text, rules, switchboard ground |
| `--ink-soft` | `#2a2622` | Switchboard plate borders on ink |
| `--muted` | `#6b6357` | Secondary text (4.6:1 on paper) |
| `--muted-on-ink` | `#c9c0b0` | Secondary text on ink ground |
| `--line` | `#d8cfbc` | Hairline rules, borders |
| `--line-strong` | `#1b1815` | Section rules, masthead rule |
| `--stamp` | `#a83a26` | Single accent: stamp, notice, visa-required |
| `--link` | `#1f4e79` | Links, visa-on-arrival |
| `--green` | `#2c6b3c` | Visa-free |
| `--amber` | `#7a5200` | eVisa, ETA, transit-with-exemption |
| `--slate` | `#4c5560` | Neutral fallback |

No violet, no lavender, no gradients. Status colours always pair with a
text label.

### Type (system stacks only — no webfont dependency)

- Display / serif: `"Iowan Old Style", Charter, "Bitstream Charter", Georgia, "Times New Roman", serif` — masthead, section titles, destination names.
- UI / sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — body, controls, conditions.
- Mono / data: `ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace` — kickers, counts, codes, verified dates, source rails. `font-variant-numeric: tabular-nums` on all counts.

Scale: display clamp(2.6rem, 6vw, 4rem)/0.95, −0.01em; section title
1.6rem/1.1 serif; destination 1.25rem/1.2 serif; body 1rem/1.55; small
0.875rem; mono labels 0.72rem, uppercase, 0.12em tracking.

### Spacing / shape

4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Max width 1120px, gutters
24px desktop / 16px mobile, equal edges. Radii: 3px chips, 6px controls,
0–3px elsewhere — ledger geometry is near-square. Borders do the work
shadows would do: hairline 1px rules, 2–3px section rules. One shadow only:
switchboard plate hover lift is a 2px translate, no blur shadow.

### Motion

- Hover: linked rows tint + 2px lift; buttons step (translateY −1px) on
  hover, press (translateY 1px) on active; link underlines draw.
- Load: masthead fades/slides 200ms once. Nothing else animates on load.
- `prefers-reduced-motion: reduce`: all transitions/animations off, nothing
  stays hidden. No scroll-linked motion anywhere.

## 3. Components

- **Masthead.** Mono kicker, oversized serif wordmark, one-line tagline,
  inspection stamp (rectangular, slight rotation, honest wording — see §5),
  triple rule beneath. No hero image, no CTA.
- **Switchboard.** Full-width ink panel: label "TRAVELLING ON", four
  passport plates in a row (2×2 under 768px). Each plate: big serif country
  code, passport name, Henley score + rule counts in mono. Selected plate
  inverts to paper. `aria-pressed`, full keyboard support, 44px+ targets.
  This panel is the point of the page: switching re-sorts everything below.
- **Controls.** Status filter (main rules only) + search (all three
  sections) + live count line in mono. Labels visible, 44px controls.
- **Notice.** "RULES CHANGE" box: dashed stamp-red border, plain wording,
  kept from v1.
- **Ledger sections.** Numbered: `01 · WHERE THIS PASSPORT GOES`,
  `02 · WITH ANOTHER VISA`, `03 · TRANSIT VISA`. Each has a serif title, a
  one-line explainer, a mono count line, then ruled rows grouped by status
  (main section) or flat (new sections). Group subheads carry counts.
- **Ledger row.** Hairline-separated, never a rounded card. Destination in
  serif; status as a rectangular mono chip (bordered, uppercase); duration
  in semibold; fee where stated; conditions as a compact list; notes and
  extension in small text; source rail in mono: `VERIFIED 2026-11-15 ·
  SOURCE NAME ↗`. New-section rows lead with the device: substitute rows
  show `HOLD [held visas] → BENEFIT`; transit rows show the status chip +
  requires/benefit.
- **Coverage ledger.** Mono footer line reporting all three counts per
  passport, plus the omitted-not-guessed sentence.
- **Footer.** How-it-works, inspiration credit, correction invitation.
  Plain, small, ruled above.

## 4. Responsive

- 1440/1024: full ledger, switchboard 4-across, rows single-column ledger
  (density over grid; rows read like a book).
- 768: switchboard 2×2, controls wrap, rows full width.
- 390/320: single column, plates full width, controls stacked, no sideways
  scroll, no clipped chips. Tap targets ≥ 44px.

## 5. Sourcing honesty (binding)

The v1 stamp read "Verified Official Sources Only". That is no longer
true: v2 cites labelled Wikipedia for the 8 gap rules and as fallback for
some substitute-visa entries, per DATA_POLICY.md. The stamp now reads
"EVERY RULE / DATED + SOURCED / NO GUESSES" and the footer/lede wording
matches DATA_POLICY.md exactly: official sources first, Wikipedia only
where labelled, transit official-only, unverified destinations omitted.
Any future sourcing claim on the page must be re-checked against
DATA_POLICY.md before shipping.

## 6. What was adapted, what was not

From Notion's DESIGN.md: the 4px spacing scale, hairline-over-shadow
depth, rectangular control geometry, 44px input heights. Its purple
primary, pastel card tints and Inter-based face were NOT taken (anti-slop
rules + this palette).
From The Verge's DESIGN.md: mono-uppercase metadata labels, flat 1px rules
doing structural work, timeline/ledger stacking, tight display leading.
Its dark canvas, acid accents, ultraviolet and pill-card geometry were NOT
taken. The paper/ink palette, serif display and stamp device are Passport
Switch's own, carried from v1.

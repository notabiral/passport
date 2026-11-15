# DESIGN.md — Passport Switch: "Index"

Design system for the v3 rebuild (15 Nov 2026). Written from the
design-taste-workflow. This document SUPERSEDES the v2 "Border Ledger"
system entirely: the paper/ink ledger, serif display, mono data rails,
numbered sections and stamp device are all retired. The new direction
adapts the design language of Mobbin (mobbin.com, studied live in a
browser 15 Nov 2026, public pages only) to a dense data guide: one
sans-serif face, black/grey/white only, full-pill controls, minimal
copy, generous chrome spacing. Nothing here copies Mobbin's wordmark,
logo, brand assets, screenshots or words; the language is adapted,
and Passport Switch keeps its own name, tagline and identity.

## 1. Kind, dials, waivers

**Kind: dense data guide / reference tool.** Not a marketing page.
Nothing is sold. The one main action is switching passports and
scanning the results. The data is the product.

Three dials (1–10):

- Design variance: **3** — highly conventional on purpose. Centred
  column, slim sticky header, pill controls, hairline rows. Restraint
  IS the look; the page must read as calm infrastructure, not as a
  designed artefact.
- Motion intensity: **1** — near-static. Hover/press micro-interactions
  plus one restrained 200ms hero load-in. No scroll animation, no
  loops, no effects.
- Visual density: **7** — the tension in this brief, resolved
  explicitly: Mobbin's language is spacious and minimal, but this page
  is information-dense by requirement. Spaciousness lives in the
  CHROME (header, hero, section gaps, picker); density lives inside
  hairline-separated ROWS with no per-row card chrome. Rows are never
  cards, so density never reads as clutter.

**Explicit waivers** for taste-skill marketing-page rules that do not
fit a reference tool (recorded, not ignored):

1. One section per screen / hero alone on screen one: WAIVED. The
   picker, controls and first results must coexist; long scroll is
   the product.
2. Photographs lead: WAIVED. No photographs; no stock imagery. There
   is no imagery to show. Type, hairlines and data carry the page.
3. 60–80 words per screen: WAIVED for the data rows (entry text is
   rendered verbatim from JSON and cannot be cut). KEPT for page
   chrome: headings 2–9 words, at most two short sentences per block.
4. Real product icons: NOT APPLICABLE. Status is carried by text in
   pills, never by colour or icon alone. No icons are drawn or faked.
5. Hero entrance + dealt moments: ADAPTED. One restrained load-in
   only. The dealt moment IS the passport switch: the whole index
   visibly re-sorts. No shader, scene, or scroll-linked motion.
6. H1 names the category: ADAPTED. The H1 is the tagline ("Pick a
   passport, see where it takes you."), which names the product's
   action in plain words; the product name sits in the header
   wordmark and the page title.
7. Kept in full: equal left/right content edges; hover
   micro-interactions; no violet/lavender anywhere; no gradients; one
   system (one button pair, one pill, one row style, one link look);
   keyboard access, visible focus, reduced motion respected; no
   caption under any visual (there are no visuals).

## 2. Tokens

### Colour (black / grey / white only; no accent hue)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#ffffff` | Page ground |
| `--ink` | `#0a0a0a` | Text, primary buttons, active picker pill, dark panel |
| `--body` | `#4d4d4d` | Body-adjacent secondary text |
| `--muted` | `#666666` | Secondary text, counts, source lines (5.7:1 on white; darkened from the ~`#737373` seen on Mobbin so small text holds AA) |
| `--surface` | `#f5f5f5` | Pill track, tiles, search fill, chip fill |
| `--surface-2` | `#fafafa` | Row hover tint |
| `--line` | `#e5e5e5` | Hairlines, borders |
| `--on-ink` | `#ffffff` | Text on ink surfaces |

No blue link colour, no bright accent, no status hues. Links are ink
with an underline. Status is a text pill: neutral grey fill for most
states, black fill for "visa required" / "no exemption" states — the
inversion draws the eye without introducing hue, and the text label
always carries the meaning. Focus ring: 2px ink outline, 2px offset;
on ink surfaces a white outline plus an ink halo so the ring reads on
both the pill and the page.

### Type (one face: Geist Sans)

- Family: `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI",
  Roboto, Helvetica, Arial, sans-serif`. Geist for everything:
  headings, body, nav, buttons, chips, counts, footer. No serif, no
  mono, no second face. (Geist Mono is deliberately NOT loaded.)
- Loading: Google Fonts stylesheet, weights 400/500/600,
  `display=swap`, with preconnect. Geist is SIL OFL 1.1 and is listed
  on Google Fonts as family "Geist" (verified 15 Nov 2026). Loaded
  from the CDN rather than self-hosted because the repo's snapshot
  push accepts UTF-8 text only and cannot carry binary font files;
  the system-sans fallback stack renders the page fully if the CDN
  is unreachable. Never hotlink or copy Mobbin's font files.
- Weights: 400 body, 500 emphasis/labels, 600 headings and strong.
  Display ceiling is 600.
- Scale: H1 `clamp(3rem, 8vw, 6rem)`/1.0, −0.04em, 600; H2
  `clamp(1.75rem, 3.5vw, 2.5rem)`/1.05, −0.02em, 600; destination
  20px/1.25, −0.01em, 600; tagline/subhead 20–22px grey; body
  16px/1.5; small UI 14–15px, 500; chips 13–14px, 500; counts/meta
  14px grey. Counts use `font-variant-numeric: tabular-nums`
  (Geist supports `tnum`).
- Hierarchy comes from size, weight and black-vs-grey only.

### Spacing / shape

4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Max width
1240px, gutters 24px desktop / 16px mobile, equal edges. Section
gaps 96px desktop (Mobbin uses 120–160px; tightened for a scanning
tool — recorded adaptation). Grid gaps 20–24px. Radii: pills 999px
(buttons, chips, picker, search, select); tiles 24px (empty states,
disclaimer); everything else square or hairline. One shadow only:
the active picker pill (`0 1px 2px rgba(0,0,0,.06), 0 4px 12px
rgba(0,0,0,.06)`); the sticky header is separated by a hairline, not
a shadow.

### Motion

- Hover: buttons darken/step, pills tint, rows tint to `--surface-2`.
  Transitions 120–160ms ease, on background-color / transform only.
  Never `transition: all`.
- Load: hero fades/slides 200ms once. Nothing else animates on load.
- `prefers-reduced-motion: reduce`: all transitions/animations off,
  nothing stays hidden. No scroll-linked motion anywhere.

## 3. Components

- **Header.** Slim (64px), sticky, white, hairline under. Text
  wordmark "Passport Switch" left (600, no logo mark). Short noun
  nav centre/right: Destinations, Another visa, Transit (anchor
  links to the three sections). Black pill button right: "GitHub"
  (opens the repo). Under 768px the nav links hide; all content
  stays reachable by scrolling.
- **Hero.** H1 = the tagline. One grey sub-line, rendered live from
  the loaded data: passport count, total verified entries, and the
  honesty line "Every entry dated and sourced." No CTA row: the
  picker below IS the action.
- **Picker.** Segmented control: light-grey pill track, four
  segments (code + name), active segment a white pill with the one
  soft shadow. Below the track, one meta line for the selected
  passport: Henley score + date, and its counts for all three
  sections. `aria-pressed`, full keyboard support, 44px+ targets.
  Under 640px the track becomes a 2×2 grid of bordered pills and
  the active pill inverts to black.
- **Controls.** Search first: full-width pill input, light-grey
  fill, 56px. Status filter: pill `<select>` (native, keyboard
  friendly) labelled "Status" with the scope note "main list only".
  Live count line in grey. Labels visible above both controls.
- **Disclaimer.** Light-grey tile, 24px radius: "Rules change."
  in ink, then the re-check wording in grey. Wording keeps the v2
  meaning (re-check the source, confirm with the airline, before
  booking); "informational only" is carried in the footer.
- **Sections.** H2 noun titles — "Destinations", "With another
  visa", "Transit visa" — with a grey count at the right edge.
  One-line notes only where needed (another-visa and transit);
  the destinations section needs none. Group subheads carry status
  labels + counts and one short sentence each.
- **Row.** Hairline-separated, never a card. Destination name,
  status pill, duration (600), fee where stated; conditions as a
  compact list; notes and extension in body text; source line in
  small grey: "Verified DATE · Source name" with the source as an
  underlined ink link and a bold "Wikipedia source" flag where the
  source is Wikipedia. Substitute/transit rows lead with the
  Hold → Benefit line and wrap the held visas as small grey pills.
  NOTHING in a row uses `white-space: nowrap`: chips, fees,
  durations and held-visa chips all wrap, so the v3 CSS cannot
  reintroduce the phone-width overflow fixed in commit b6eb029e.
- **Empty / error states.** Light-grey tiles, 24px radius, one
  short sentence. Empty states distinguish "no verified entries
  for this passport" from "no search matches".
- **Coverage line.** Small grey text: per-passport counts for all
  three sections plus the omitted-not-guessed sentence.
- **Footer.** How-it-works (tourism/short visits, ordinary
  passports, Henley display context, official-first sourcing with
  labelled Wikipedia exceptions, transit official-only, links to
  DATA_POLICY.md and CONTRIBUTING.md), inspiration credit, error
  reporting line, and a type credit ("Set in Geist."). Ruled
  above, small grey text.

## 4. Responsive

- 1440/1024: full column, picker 4-across in one track, rows
  single-column (density over grid; rows read like an index).
- 768: header nav hides, controls stack, rows full width.
- 640: picker 2×2 pills, section counts wrap under titles.
- 390/320: single column, full-width controls, no sideways scroll,
  no clipped chips. Tap targets ≥ 44px. Longest strings checked in
  review: the Antigua fee, the transit exemption chip, Georgia's
  45 held-visa chips, long Albania durations — all wrap.

## 5. Sourcing honesty (binding)

Unchanged from v2: official sources first, Wikipedia only where
labelled (the 8 gap rules + some substitute-visa fallbacks), transit
official-only, unverified destinations omitted, never guessed. The
hero honesty line ("Every entry dated and sourced.") and the footer
wording must keep matching DATA_POLICY.md exactly. Any future
sourcing claim on the page must be re-checked against DATA_POLICY.md
before shipping.

## 6. What was adapted, what was not

From Mobbin (browser study, 15 Nov 2026): one sans face for
everything; black/grey/white palette; full-pill buttons, chips and
segmented control; slim sticky header; minimal copy discipline
(2–9 word headings, ≤2 short sentences per block, nouns for
navigation); wide centred container; generous section spacing;
hierarchy from size/weight/black-vs-grey. NOT taken: Mobbin's
wordmark, logo, screenshots, text, or any brand asset; its
96–110px hero scale (tightened for a tool); its 120–160px section
gaps (96px here).
From Vercel's DESIGN.md (awesome-design-md): Geist token values
(weights 400/500/600, negative display tracking, 4px spacing
scale, hairline-over-shadow depth, pill CTA geometry, stacked
soft shadow). NOT taken: the mesh gradient, link blue, mono
eyebrows, or any Vercel branding.
From Linear's DESIGN.md: display-tracking discipline only. Its
dark canvas and lavender accent were rejected outright (this
system is light-only, no accent hue).

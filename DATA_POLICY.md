# Data policy

Passport Switch is only useful if every fact can be checked. This policy is
short and strict.

## 1. Official sources first, Wikipedia only where labelled

Every entry should link to an official government source: an immigration
department, ministry of foreign affairs, embassy, or official e-visa / ETA
portal for the destination country.

Wikipedia is acceptable as a cited source ONLY in these two cases, and the
entry must say so (the site flags Wikipedia-sourced entries on the card):

- the 8 gap rules in `rules.json` that v1 could not verify, where the
  official page could not be read (4 of the 8 cite Wikipedia; the other 4
  cite official pages);
- substitute-visa entries in `substitute_visa.json` where the official
  page could not be read and Wikipedia is the fallback source.

Transit entries in `transit.json` are official sources ONLY, with no
exception. Wikipedia may help *find* the official page, but must never be
cited as a transit source.

The 36 rules shipped in v1 keep their official government sources
verbatim. Do not downgrade or rewrite them.

Not acceptable as a source anywhere: blogs, travel aggregators, social
media, visa agency sites, or AI summaries. Those may help you *find* the
official page, but the entry must cite a source that actually says what
the entry says.

## 2. Dated verification

Every entry carries a `verified` date (YYYY-MM-DD): the date a human
checked the source. Do not copy a date forward. If you re-check an entry,
update the date. If the source page has changed, update the entry to match
it.

## 3. No guessing

If an entry cannot be verified, omit it. An omitted destination is honest;
a guessed rule can strand a traveller. Record unverified destinations in
the pull request description so someone else can pick them up.

Tourism / short visit only. Work, study, and long-stay rules are out of
scope. Ordinary passports only, unless an entry explicitly says otherwise.

## 4. What to capture

For each entry, capture: status (where the file has one), duration, fee
(if the source page states one), conditions (passport validity, onward
ticket, arrival cards, and so on), extension rights if stated, and any
caveat the source page warns about. For the two newer files, also capture
`requires` (the held visa or permit, in plain language), `benefit` (what
it unlocks), and `held_visas` (the issuing countries or schemes).

Paraphrase in your own words; do not copy sentences verbatim from any
source, including Wikipedia. Where a source page states no figure — for
example no stay length for an exemption — say so honestly instead of
borrowing a figure from elsewhere on the page.

## 5. Scope (v2)

Passports: Vietnam (VN), Indonesia (ID), Philippines (PH), Thailand (TH).
Nepal is explicitly out of scope for this project; see the README for why
the inspiration site already covers it.

- `rules.json`: the ASEAN 10 plus Japan and South Korea. No
  passport-to-itself entries.
- `substitute_visa.json`: Mexico, Georgia, Albania, Montenegro, Moldova,
  Morocco, Türkiye, Argentina, Panama, Antigua and Barbuda, Bahrain,
  Costa Rica.
- `transit.json`: United Kingdom, Spain, Belgium, Netherlands,
  Luxembourg, Romania, Mexico, New Zealand, United States, Canada,
  Australia, Ireland.

## 6. Disclaimer

Informational only. Visa rules change without notice. Always confirm with
the official source linked on each card, and with your airline, before
you travel.

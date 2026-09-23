# Ogham reference and reset rules (#223)

## Reproducible data

Collected 2026-09-16 KST with `pnpm data:collect` using the existing Prilus
browser/decoder/IndexedDB collector. Source `Version.CreatedAt` and committed
IndexedDB `CreatedAt_kr` both equal **1789028032** (2026-09-10 17:13:52 KST).
This is source generation time, not a claimed game patch date.

Revalidated on 2026-09-23 against snapshot `1790058363`: the Ogham word,
ability and cost tables are unchanged. Their derived reference was regenerated
with the new snapshot provenance.

The collector discovers the mirror via the upstream app. The manifest records
its actual resource/version URLs and entry script. It exports the three Ogham
tables plus supporting ItemList/StringTable in one same-version snapshot.
Raw fields and source ordering are retained, including object-shaped OghamCost.
The newer full snapshot also refreshes existing derived references; table mixing
would invalidate same-version provenance.

- [Prilus Ogham page](https://prilus.gitlab.io/ogham)
- Inspected entry: `https://prilus.gitlab.io/assets/index-D0SobkQZ.js`
- Ogham page: `https://prilus.gitlab.io/assets/oghamList-Wz0czwBW.js`
- Value formatter: `https://prilus.gitlab.io/assets/mabiutil-Bz2OdofO.js`

Hashes can change: discover the entry script from the page and follow its Ogham
imports. Collection never runs during builds or page requests.

`pnpm ogham:build` emits `src/data/ogham-reference.json` (about 18 KB).
`pnpm data:check` includes its deterministic `--check`. Only resolved words,
effects, values, costs, materials and provenance ship to the client. Checks reject
duplicate IDs/cost keys, unsupported grades, missing strings/items, empty or
nonfinite values, and incomplete cost rows. Observed counts 26 words, 97 effects
and 52 GeneralPool effects are an audit baseline, not permanent count assertions.

## Probability, slots, duplicates and locks

Verified 2026-09-16 against the [official Ogham guide](https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4893656&num=13):

- Elite/Epic/Master have 1/2/3 effects. Special words support Master only;
  general words support all three grades. The compact data uses each word's Grades.
- The official eligibility table lists talent effects for general words and
  talent plus arcana effects for special words, without a per-slot category quota.
  These correspond to GeneralPool=true and the whole ability table respectively.
- Effects are selected uniformly, sequentially from top to bottom, without
  repeating the same effect. Identity is source Id; similar text is not merged.
- Locked effects retain both type and value. Reset is unavailable with every
  slot locked. Together with the slot counts, this establishes maximum usable
  lock counts 0/1/2 independently of the cost rows.
- Excluding every locked ID before drawing is the consequence of global
  uniqueness and exact locked-effect preservation, including a lock in the last
  slot. Each new draw also removes its ID before the next unlocked slot.
- Levels are uniformly selected within their eligible range, separately after
  selecting an effect. A conditional effect/level pair has probability 1/N × 1/L;
  later slots have smaller N because of exclusions.

Prilus `ogham.poolHint` independently documents uniform effects within the
normal/special pool and uniform levels between minimum and maximum. This is a
source-documented model, not a simulator assumption borrowed from relics.

### Level boundary evidence

The official guide's effect table lists maxima of 10 or 20 without grade-specific
columns; those maxima agree with the upstream Values lengths. Its prose does not
state the numeric minimum. On 2026-09-16 the user explicitly confirmed that **all
grades use levels 1 through the effect maximum**. This numeric lower-bound rule is
user-confirmed; it is not attributed to an independent official minimum statement.
Values[level - 1] maps the first allowed level to the first source value.

## Values and materials

Values are per-level source values, not necessarily equal to the level. Prilus's
`abilityRange` passes Values[0] and Values[last] into its formatter. That formatter
replaces `[*factor]` with the value multiplied by the numeric factor and rounded
to four decimal places. Inspected factors are 1, 0.1, 0.01 and 100. Keep the raw
values in the compact data; render supported placeholders as React text, retaining
units and decimals. Reject unknown placeholder syntax during generation.

Material IDs resolve through the same snapshot: **5300305 오검 파편**,
**5100071 불타래**, **5100091 얼어붙은 불타래**. Reset costs come from OghamCost,
not duplicated constants. Two one-lock Master resets cost 20,000 Gold + 6 fragments
+ 불타래 ×2; adding one two-lock reset totals 40,000 Gold + 11 fragments + 불타래 ×3
+ 얼어붙은 불타래 ×1.

Local unmodified PNG icons in `public/images/ogham` were acquired from the
collector's working mirror at `https://mabires.pril.cc/oghamimage/kr/{id}/{id}.png`
for word IDs and `/invimage/kr/{id}/{id}.png` for material IDs. The UI serves them
locally; each download is checked for a PNG signature. The Prilus Ogham page uses
`resImageUrl('oghamimage', region, word.Id)` for word icons.

## Session and verification

Initial configuration is the first distinct effects in ascending source ID order,
at level 1. This is a free editable starting configuration, not a claimed random
acquisition. Changing word/grade or initializing clears locks and resource totals;
a modified session requires confirmation before it is discarded. Editing current
effects is free and preserves counters; locked rows must be unlocked before edits.

`src/lib/__tests__/ogham.test.ts` checks every word/grade and every eligible effect
at level boundaries, uniform effect intervals, sequential exclusions, exact locked
preservation, failed transactions, and the three-reset resource example. The
Playwright Ogham scenarios cover manual setup, keyboard locks, repeat rolls,
zero roll requests, discard cancellation, pool/grade changes, and metadata/preview.

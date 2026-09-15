# Auction search filters

The `/auction` search filters apply to current listings and require an item name
or category. All active conditions must match the same listing. Dye color search
and completed-sale filtering are outside this feature.

## Reference generation

Run `pnpm auction-filters:build` after the existing enchant/reforge/echostone
reference generators. `pnpm data:check` checks the committed output with
`--check`; `prebuild` generates it locally. No reference collection or network
request runs during generation or autocomplete.

`auction-filter-reference.json` contains only enchant aliases/usage/rank,
reforge names, echostone color/name lists, and the verified fixed awakening.
Original equipment, probabilities, raw snapshots, and descriptions stay outside
this new index. The text/context helpers are independent of generated data so
reference generation can bootstrap without importing its own output.

`auction-filter-evidence.json` records six current auction spellings observed
on 2026-09-15. They are additional exact-name suggestions, not guessed aliases
of similar old reference strings. Its fixed red awakening is the exact option
`돌진 인간 및 엘프일 때 방패 없이 사용 가능`: the committed RandomTableList
color 1 / ability 2001120 has Min=Max=1. The generator checks that evidence;
other unnumbered descriptions must not be assumed to be level 1.

## Matching and editing

Prefix and suffix names are separate conditions. Exact names match within their
position; aliases use the reference's position, usage and reported rank. Missing
or conflicting position and ambiguous identities remain unevaluable. The legacy
position-independent name keeps literal matching and remains editable until
explicitly removed.

One to three distinct reforge names can each specify a minimum integer level.
Both `name N 레벨` and `name(N레벨:effect)` are supported, including levels above
20. All rows must match, regardless of the order on the item. Plain values have
no effect description to render. Erg presence, grade and minimum level remain
supported.

Echostone conditions include color (from the base item name), grade 1–30,
awakening name/minimum level, and innate stat/minimum value. The black stone's
life, mana and stamina are a single reported stat. Changing color narrows local
suggestions without deleting manual text. Only the source-verified red awakening
may infer level 1 from a value without a level.

Murias filters reuse the exact rendered effect templates and their 1–10 levels.
Enchanted relics are eligible. Totem conditions compare each reported stat in its
actual API units using the existing integer tick conversion, including zero and
supported decimal precision. Independent all-stat rolls must each satisfy their
own threshold; reference bounds are not needed for listing matching.

Missing required options do not match. Malformed or duplicate required options
remain unevaluable rather than being guessed. An independently failing AND
condition still excludes the listing. Suggestions are optional: manual names
are accepted. Incompatible groups or categories are never silently changed.

## URL and preset compatibility

Both existing auction endpoints and the page URL share these keys:

| Condition | Query keys |
| --- | --- |
| Legacy any-position enchant | `option_enchant` |
| Prefix / suffix | `option_enchant_prefix`, `option_enchant_suffix` |
| Reforge row N (1–3) | `option_reforge_N`, `option_reforge_N_min_level` |
| Erg | `option_erg=present`, `option_erg_grade`, `option_erg_min_level` |
| Echostone | `option_echo_color`, `option_echo_min_grade` |
| Awakening | `option_echo_awakening`, `option_echo_awakening_min_level` |
| Innate stat | `option_echo_stat`, `option_echo_min_value` |
| Murias relic | `option_murias_effect`, `option_murias_min_level` |
| Totem stat | `option_totem_<stat>` (keys from `TOTEM_STATS`) |

The old `option_reforge` / `option_reforge_min_level` pair and preset `reforge`
object are read as a single row. New URLs and saves use indexed keys and the
`reforges` array. Combining old and new representations is an error, even if
values agree. Rows must be consecutive; names and paired minima must be complete.
Duplicate, unknown and prototype query keys are rejected. Filter query encoding
is limited to 8192 characters, excluding unrelated query and cursor parameters.
Serialization orders keys deterministically and preserves reforge row order.

Invalid links retain the base search and show the existing recovery warning.
Presets validate entire groups and preview discarded conditions before loading.
Reading legacy or invalid presets does not overwrite local storage. Removing a
chip deletes only that condition; clear-all retains the base search. Existing
Back/Forward and shared URL behavior use the same canonical parser.

## Collection boundaries

Conditions are evaluated locally on the server after each upstream response;
`option_` keys are not forwarded to Nexon. Both routes keep their five-page
batch bound and cursor contract. The client continues the full filtered scan,
up to the existing 100-batch guard, and preserves cancellation, repeated/missing
cursor detection and failure reporting. Recent-sale comparisons are suppressed
for filtered listings, and local price/name filters do not initiate a new scan.

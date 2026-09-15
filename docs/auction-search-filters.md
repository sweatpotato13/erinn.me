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

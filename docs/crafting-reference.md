# Crafting reference and calculation contract

`/tools/crafting` uses the committed Prilus snapshot and an offline derived catalog.
`scripts/build-crafting-reference.ts` reads the common snapshot with its checksum
validation and resolves names using the existing item identity contract. It never
fetches data. The raw ProductionList remains unchanged, including duplicate rows.

Recipe identity is SHA-256 of the entire stable serialized original record.
Object keys are sorted; ingredient and finishing arrays retain their order.
Different originals with the same digest fail generation. Exact duplicates share
one consumer choice with an occurrence count. Output IDs index all choices.
Derived items and fingerprints are sorted independently of source row order.
Source, reference and rule versions accompany saved plans; stale choices must be
reviewed instead of being silently replaced.

## Evidence and coverage

On 2026-09-10, snapshot source version 1788405829 contains 1,883 production rows,
1,871 distinct recipes and 3,471 referenced item IDs. Twenty-six recipes reference
names that the shared identity resolver cannot resolve. These remain visible with
their original IDs and reasons. Counts are snapshot observations, not permanent
limits on future catalogs.

The current [Prilus constants module](https://prilus.gitlab.io/assets/consts-DUtChVyk.js)
and [production display module](https://prilus.gitlab.io/assets/productionInfo-CDP87h7e.js)
were inspected on 2026-09-10. `crafting-rules.json` records the Type→SkillList ID
mapping and rank codes (0 practice, 1–15 F–1, 16–18 dan 1–3). Types 1 and 2 use
spinning-wheel/loom suffixes. Skill names come from the local SkillList/StringTable.
The two refining recipes for mithril ingots share the translated facility name
`노` but have different facility keys and materials. Material descriptions must
therefore distinguish the choices.

`FormId` is preserved as a recipe/form identifier. No verified rule establishes it
as a consumed ItemList ID. Facilities and reusable tools are requirements, not
automatically priced ingredients. The raw table does not supply output quantity,
success probability, progress passes, partial failure loss, recovery or bonus yield.
The mechanics supplement is deliberately empty until separately attributed evidence
exists. Users must enter output and consumption-pass assumptions; these are an
input-based estimate, never a verified stochastic expected cost. An unsupported
mechanic must leave the full total incomplete with the specific missing condition.
Alternative arrays do not prove that mixed stock is interchangeable within a pass;
mixed allocation is enabled only by an independently verified rule.

## Maintainer update and rollback

For an intentional common source refresh, run `pnpm data:collect` using the existing
collector prerequisites. Review and commit its raw tables/manifest with every
affected derived consumer. Ordinary builds, page requests and CI never run it.
For this consumer, run:

```sh
pnpm crafting:build
pnpm exec tsx scripts/build-crafting-reference.ts --check
pnpm data:check
pnpm typecheck
pnpm build
```

Review output/facility/rank resolution, unresolved references, raw occurrence
coverage and generated sizes. Record an evidence URL/date and bump the rule version
before adding or changing mechanics defaults. Do not insert assumptions into raw
Prilus records. If a refresh fails, retain the previous committed catalog. Roll back
the snapshot/manifest/rules/derived consumers together to a reviewed commit and run
the same offline checks. Never stamp old data with a new collection date.

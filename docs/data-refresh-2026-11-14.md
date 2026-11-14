# Game-data recheck, 2026-11-14

Recheck data omitted from the November 12 Korean-server refresh, with particular
attention to barter. The initial recheck was completed on `develop` before
publication was requested. This report records collection and local verification.

## Reference snapshot

`pnpm data:collect` collected all 25 tables with `upstream-playwright-mabidb`
at version **1794561420**, generated upstream on November 13 at 18:17 Asia/Seoul.
The previous version was `1794457727`. Comparisons use record identities and
field values rather than array order. Seven tables changed; 18 are byte-identical.

| Table | Change from the November 12 snapshot |
| --- | --- |
| ItemList | Same 43,706 IDs. Tooltip fields change on 16,624 records. Names, description keys, item categories, and all other fields remain unchanged. |
| ItemCategoryList | One category added, for 8,262 total. Masks change on 194 existing categories. |
| ItemCategoryGroups | `TertiaryTotem` added, for 24 groups. Later group references shift. |
| ItemExtendTotemList | Four Tala Gah coin effect records added, IDs 5160519 through 5160522. All 278 prior records remain unchanged. |
| ItemUpgradeList | All 3,242 records gain `ItemLevels`. There are 3,215 empty arrays and 27 arrays containing level 85. Those 27 records also change `Personalize` from false to true and `EffectOrder` from `[2]` to `[2,4]`. |
| OptionSetList | All 1,770 records have category-reference changes. Derived enchant effects remain unchanged. |
| StringTable | Three tooltip strings added. One existing box-description string changes. No keys removed. |

The unchanged tables include all barter rows, commerce-post names, production
recipes, skills, miniatures, reforging tables, all echostone tables, random
probabilities, upgrade joins, and Ogham tables. Raw records were not manually edited.
Existing localization exceptions and source warnings remain unchanged.

## Barter

`pnpm barter:season:collect` rejects the current Labanyu response with
`Expected one active season`, because no listed period contains the current time.
The latest listed season remains **17/version 2**, ending November 5 at
07:00 Asia/Seoul. A fresh request with cache bypass returns the same list.
The site's page module passes that list directly to its trade component.

The expired supplement remains byte-identical, including its October 29 collection
timestamp and original source version. No November season, validity period,
material requirement, or season ID was inferred. All 28 fixed goods, four historical
seasonal goods, material identities, and saved-plan keys remain unchanged.
The UI continues disabling expired goods. `pnpm data:expiry` still fails for that
retained expiry; catalog evidence remains valid until December 5 at 13:29:45 Seoul.

`pnpm barter:build` regenerated both consumers with the new common-snapshot
provenance. `pnpm barter:icons:collect` fetched all 65 referenced icons again;
their bytes are unchanged. Older unused icons remain.

The [official November patch](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893919)
also changes profits for 20 life-season trade goods. This preparation tool
calculates ingredients and their purchase cost; it does not calculate trade-sale
gold or ducat proceeds. That payout rule requires no change to its calculations.
An unchanged source table does not independently verify in-game monthly rotation.

## Tala Gah totems

The newly exported coins use the new `TertiaryTotem` category and an empty
source `TotemType`. The old builder rejected those rows. It now checks the
same-version category masks and derives `tertiarytotem`, matching the current
Prilus classification. Conflicting secondary and tertiary membership, and
nonempty types for tertiary rows, fail validation.

The catalog adds a **3차** filter and badge. All 278 existing derived totem
payloads remain identical by ID. Only the four new coins are added.
No stored configuration shape or public function signature changed.

The official patch and source descriptions establish mutual exclusion among
the four coins and coexistence with other totems. Numerical replacement
comparison remains unverified because the complete effect set and units are not
mapped. Unknown effects retain their raw names, bounds, and source descriptions.
No percentages, probabilities, or API option spellings were invented. Historical
listing fixtures remain intact. See [totem reference](totem-reference.md).

The prior missing-coin-effects gap recorded in issue #255 now has source coverage.
The issue was not updated. The separate Hydra gap remains. Prilus still supplies
maximum 20 without its effect join, so the existing official maximum-10 correction
and its limits remain unchanged.

## Generated consumers

`pnpm prebuild` regenerated all 13 outputs.

| Result | Files |
| --- | --- |
| Byte-identical | `suggest-index.json`, `item-id-map.json`, `enchant-index.json`, `auction-filter-reference.json` |
| Four new totems and new provenance | `totem-reference.json` |
| Provenance only; numerical and catalog payloads unchanged | `reforge-reference.json`, `echostone-reference.json`, `miniature-reference.json`, `barter-reference.json`, `barter-material-index.json`, `crafting-reference.json`, `murias-reference.json`, `ogham-reference.json` |

Unchanged regenerated files are checked against fresh derivation rather than
inferred from Git status. No new item names or artwork IDs require separate
echostone, Murias, or Ogham icon downloads.

The current crafting-index regression pin advances only its `catalogVersion`.
All 1,630 fingerprints were matched to their original raw recipe hashes first.
The output-index digest, count, ordered samples, and recipe payloads are unchanged.

## Independent evidence and limits

- **Polishing.** Recomputed all six fixtures using current random tables,
  grade bounds, normal-agent adjustments, and resolved item 53940. Weights,
  bounds, and totals remain 160, 240, 8690, 180, 300, and 12020. Only then updated
  `sourceVersion` and `checkedAt`. These are source-derived checks, not new trials.
- **Auction catalog.** Validated all 500 active identities and the existing
  November 5 and November 12 evidence against the new snapshot. No API
  recollection, membership changes, archives, or observation dates were changed.
- **Cash packages.** Fresh official notice and sale-image checks match the 36
  supported entries, quantities, choice boxes, trading restrictions, and prices
  of 32,900, 89,900, and 119,000 cash. Sales ended October 21 at 23:59.
  All three product-detail URLs redirect to an error page, so a complete fresh
  product check is unavailable. Retained `verifiedAt=2026-10-15` and historical
  comparisons. This is not a complete current cash-shop catalog.
- **Curated supplements.** Retained crafting mappings and their November 12
  semantic verification, Murias ten-level rules, historical auction-option
  observations, and localization exceptions. Production types and skills are
  unchanged. Builders check their applicable snapshot relationships; historical
  dates were not advanced.
- **Official follow-up.** The [November 13 maintenance notice](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893928)
  adjusts hard-mode Tala Gah material and orb drop rates toward normal-mode
  levels. No numerical probabilities are published, and this repository has
  no corresponding drop-rate calculator. No numerical data was inferred.
- **Code metadata.** Fresh official auction and NPC schema downloads match
  the November 5 evidence byte-for-byte. The existing 79 categories, 21 NPCs,
  and four servers remain compatible. The official guide retains 5% normal
  and 4% membership fees. Channel maximum 42, every live response shape,
  coupon denominations, aliases, exclusions, and all simulation or stacking
  rules were not independently reverified against exhaustive current sources.
- **Artwork and live data.** Non-barter artwork is retained without a fresh
  download. Live prices, sales, listings, horns, inventories, and image responses
  were not written into static catalogs. Historical fixtures remain unchanged.

## Verification

Logs, source comparisons, source evidence, baseline hashes, design sketches,
the checklist, and decision trail are under `artifacts/refresh-2026-11-14/`.

| Check | Result |
| --- | --- |
| `pnpm data:collect` | All 25 tables collected at version 1794561420. |
| `pnpm prebuild` | All 13 outputs regenerated. |
| `pnpm data:check` and `pnpm catalog:validate` | Passed. Final totem builder self-check also passed separately. |
| `pnpm lint` | Passed with 69 existing warnings and no errors. |
| `pnpm exec next typegen` and `pnpm typecheck` | Passed after the browser server stopped. |
| `pnpm test --runInBand` | All 76 suites and 869 tests passed. |
| Affected Chromium E2E command from AGENTS.md | All 27 tests passed, including the new tertiary-coin filter and raw-evidence path. |
| `pnpm build` | Passed, including its repeated prebuild and production type check. |
| `pnpm data:expiry` | Expected failure for the retained expired barter supplement. Catalog evidence is valid. |
| `git diff --check` | Passed. |

The first full unit run caught the current crafting-version pin mismatch.
The initial new totem browser check inspected the wrong panel, then encountered
the existing separate desktop and mobile presentations. The final check opens
the visible candidate's raw-evidence disclosure. An existing miniature-navigation
test exceeded its URL wait once, then passed both individually and in the final
27-test run without assertion or timeout changes.

Independent review verified all 25 raw hashes, sizes, and counts, the 278 preserved
totem records, four new category memberships, and unchanged barter data.
It identified the crafting pin and browser-test issues before the final passing
runs. Changed code contains no new comments or suppression directives.
Reviewer models inherited the session model; no cross-model diversity is claimed.

Firefox, mobile-browser projects, deployment, exhaustive live API responses,
new cash-product pages, and a current Labanyu season remain outside fresh
verification. The latter two are unavailable source evidence, not successful
refreshes. Commit, push, and pull-request creation were requested separately
after the recheck. No deployment or remote issue update was performed.

# Game-data refresh, 2026-11-05

The request covers every repository game-data source and consumer after the
November 5 Korean-server patch. Prilus collection and local generation are
complete. The current monthly barter season remains unavailable upstream.
This report distinguishes fresh collection from retained historical evidence.

## Source and semantic changes

`pnpm data:collect` collected all 25 required tables at version **1793843770**,
created by upstream at 2026-11-05 10:56:10 Asia/Seoul. Collection completed at
2026-11-05T04:19:54.579Z with the existing `upstream-playwright-mabidb` decoder.
The previous version was 1793241448. No raw rows were manually patched.

Comparisons use identities and field values, not file order.

| Table | Change |
| --- | --- |
| ItemList | Four additions, no removals, 42 existing `HaveMesh` values changed. Total 43,586. |
| StringTable | 105 additions, no removals or changed existing strings. Total 187,563. |
| ItemCategoryList | 1,466 existing `TagMask` arrays changed. No category additions or removals. |
| ProductionList | All 1,612 records gained `UnlockCondition` and `LifeEffectId`. All pre-existing fields and row order match. |
| Other 21 tables | Byte-identical, including probabilities, skills, upgrades, enchant options, miniatures, totems, barter, Ogham, and category group definitions. |

New items are 이벤트 선물 상자 `4100729`, 이벤트 선물 선택 상자 `4400739`,
마법의 변신 메달 `5041348`, and 붓벌레 미니돌 `5450045`.
All four add exact suggestion/image names. Existing image IDs remain unchanged.
Localization exceptions and placeholder handling are unchanged.

The [official November 5 patch](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893911)
describes the collaboration event, auction storage changes, preview fixes, and
costume-grade corrections. It does not announce changes to this site's fee or
simulation formulas. This is a patch compatibility review, not independent
reverification of every historical game mechanic.

## Generated consumers

All 13 outputs were regenerated through `pnpm prebuild` and checked through
`pnpm data:check`.

| Output | Result |
| --- | --- |
| suggest-index.json | Four new names, 37,906 unique suggestions. |
| item-id-map.json | Four new names, 37,972 image names. No existing ID changed. |
| enchant-index.json | Byte-identical, 1,375 enchants. |
| reforge-reference.json | Provenance changed. Equipment, abilities, tools and weights unchanged. |
| echostone-reference.json | Provenance changed. Awakening, polishing and upgrades unchanged. |
| miniature-reference.json | Provenance changed. All 218 miniatures unchanged. |
| totem-reference.json | Provenance changed. All 276 totems unchanged, including classification after the mask changes. |
| barter-reference.json | Provenance changed. Retains 28 fixed goods and the expired four-good October season. |
| barter-material-index.json | Four new item records. Existing material identities unchanged. |
| crafting-reference.json | New fingerprints for all 1,612 recipes and prerequisite warnings for 45 recipes. Material quantities unchanged. |
| murias-reference.json | Provenance changed. Thirty effects and 300 reviewed level values unchanged. |
| auction-filter-reference.json | Byte-identical. |
| ogham-reference.json | Provenance changed. Twenty-six words, 97 effects and costs unchanged. |

## Independent datasets

- **Barter season.** `pnpm barter:refresh` failed before publication because
  Labanyu returned no active season. A separate fresh page read still lists
  season 17/version 2 as the newest, ending 2026-11-05 07:00 Asia/Seoul.
  `barter-season.json` and its original date are preserved. Expired seasonal
  goods remain disabled by the existing UI. No November rotation was inferred.
- **Auction catalog.** Reobserved all 500 active identities. Nexon supplied 496
  current listings and two recent sales. Labanyu's published total-value ranking
  verifies 실습용 마력탄 at rank 240. The ranking still describes December 2025,
  so its historical observation interval remains unchanged. 더스크바운드 이지스
  가드(여성용) had neither API activity nor ranking membership and retains its
  valid October 12 evidence without changing its timestamp. That observation
  expires November 11 at 14:40:24.899 Asia/Seoul. All 500 active and 104 archived
  identities are preserved. The collector exits 1 for 498 API-eligible results;
  this is its minimum-500 rule, not a network or identity-validation failure.
- **Cash packages.** Reviewed the shared [official notice](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893855),
  its contents, choice boxes and trading rules. The [official sale image](https://ssl.nexon.com/s2/game/mabinogi/mabiweb/event/2026/0922_th_xbqmqp/bg.jpg)
  lists the three stored prices and a sale ending October 21 at 23:59.
  All three live product pages returned HTTP 500. Cached text was available for
  two products, but it does not establish a fresh full product-page check.
  Keep `verifiedAt=2026-10-15` and historical comparison data. The current UI
  does not claim that these packages remain on sale.
- **Polishing evidence.** Recalculated all six fixtures against new random,
  grade and normal-agent tables, and checked item 53940's resolved identity.
  Bounds, arrays and totals remain 160, 240, 8690, 180, 300 and 12020.
  Only then advanced `checkedAt` and `sourceVersion`. These remain source-derived
  probabilities, not fresh in-game reroll observations.
- **Crafting rules.** Compared all 19 skill mappings and rank semantics with
  the current upstream modules. Updated source URLs and verification date.
  Retained the local 방직기 label for upstream 물레. The mechanics supplement
  remains empty. See [crafting reference](crafting-reference.md).
- **Crafting prerequisites.** Current upstream exposes 18 명장 and 27 특화
  requirements. The builder validates the two new fields and shows prerequisite
  warnings using the original effect IDs. Exact names require the uncollected
  `LifeSpeciality.LifeEffects` mapping and are not invented. Material estimates
  remain available, as with existing character rank/facility requirements.
  The 27 speciality recipes display 특화 rather than the inapplicable 연습 rank.
- **Murias rules.** Retained historical Arcana membership and ten-level rules.
  Generation rechecked the complete effect set, descriptions, maxima, units,
  skill references and local icons. No new observed probability evidence.
- **Auction filter evidence.** Retained the September 15 historical API option
  observations. The fixed awakening still passes its source assertion.
- **Missing localization allowlist.** Unchanged. No exceptions were added.

All recipe fingerprints change because their identity hashes the entire raw
record. Existing saved choices require review and reselection. The current-index
regression pin was updated after independently comparing its sampled fingerprints
with hashes of the corresponding raw records. Historical and synthetic market,
simulation and browser fixtures were retained.

## Code metadata, images and live data

The official auction schema's 79 category names match the maintained list.
The NPC schema currently loaded by the official documentation also matches all
21 supported NPC names and all four server names. Its channel parameter has no
documented maximum, so it does not independently verify the local limit of 42.
The [official auction guide](https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4888135)
still specifies 5% normal and 4% membership fees. The guide lists coupons for
10%, 20%, 30% and 100%; the source snapshot retains the 50% coupon identity.
Search exclusions, effect aliases, units, stacking and simulation assumptions
were retained. Snapshot-based checks and focused tests cover their consumers.
The channel limit, live response samples for every endpoint, and every historical
stacking/simulation rule were not independently reverified against complete
current official documentation.

`pnpm barter:icons:collect` fetched all 65 icons referenced by the retained
catalog. Their bytes are unchanged. These are not November-season icon coverage.
Older unused files remain.

Separately downloaded all nine echostone icons, 30 Murias skill icons, the relic
thumbnail, 26 Ogham word icons and three Ogham material icons. All are valid PNGs
with matching dimensions. The current resource mirror's 68 renditions differ
slightly in pixel channels, by at most 3 of 255, while showing the same artwork
in paired visual inspection. The relic thumbnail is byte-identical. Existing
committed artwork is retained. No new referenced skill, word or material IDs
require additional assets.

Auction listings, prices, sales, horns, NPC inventories and proxied images remain
live responses. No market payload or credentials were copied into static catalogs.
No collectors were added to build, CI, pages or request handlers.

## Verification and remaining work

Local logs and source comparisons are under `artifacts/refresh-2026-11-05/`;
the local decision trail is `artifacts/refresh-2026-11-05/decisions.tsv`.

| Check | Result |
| --- | --- |
| `pnpm data:collect` | Passed, all 25 tables. |
| `pnpm prebuild` | Passed, all 13 outputs. Repeated by the final build. |
| `pnpm catalog:validate` | Passed, 500 active identities. |
| `pnpm data:check` | Passed on the final snapshot and every generated output. |
| `pnpm lint` | Passed with 69 existing warnings, no errors. |
| `pnpm exec next typegen` and `pnpm typecheck` | Passed after the browser test server stopped. |
| `pnpm test --runInBand` | Final full run passed all 76 suites and 866 tests. |
| `pnpm build` | Passed after final data and prerequisite-display changes. |
| Full Chrome E2E | 124/125 passed initially. Queued-edit Back restoration failed once, expecting 240000 but retaining 123456. |
| Crafting and auction-calculator E2E, each repeated twice | 20/20 passed on final data, including the initially failing restoration scenario. |
| Direct browser check | Item 5030165 displays 목공 · 특화 and the effect #36 prerequisite warning. |
| `pnpm data:expiry` | Failed as expected because the retained barter season expired. Also warns that one catalog observation expires November 11. |
| Barter season retry | Failed again because upstream still has no current season. Prior file unchanged. |

An intermediate unit run found the catalog's old fixed evidence counts, which
were updated to the reviewed one-ranked/499-API-evidence distribution. It also had a one-second
Murias UI wait failure. All six tests in that file passed on focused rerun.
No timeout or browser assertion was weakened. The initial browser failure was
not reproduced in the two focused runs, but its cause is not established.

The collector implementation did not change, so its separate browser decoder
regression command was not rerun. `data:check` exercised snapshot validation,
deterministic publication, failure preservation and rollback. Firefox and Safari
were not run. Deployment is outside this refresh.

Independent review verified raw checksums, semantic deltas, recipe fingerprints,
ingredient groups and browser warning visibility. It found the speciality-rank
display error described above, which was corrected before final verification.

The current-season blocker remains upstream publication. Retry
`pnpm barter:refresh` once Labanyu publishes the unique active November season,
then regenerate consumers and run `pnpm data:check` and `pnpm data:expiry`.
Do not extend October's dates or infer November's goods.

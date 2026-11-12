# Game-data refresh, 2026-11-12

Refresh repository game-data sources and consumers after the November 12
Korean-server patch, then test and prepare a develop-to-main pull request.
Prilus collection and local generation are complete. Two upstream gaps remain
tracked in [issue #255](https://github.com/sweatpotato13/erinn.me/issues/255).

## Source changes

`pnpm data:collect` collected all 25 tables at version **1794457727**, generated
upstream on November 12 at 13:28:47 Asia/Seoul. Collection completed at
2026-11-12T06:00:12.682Z with `upstream-playwright-mabidb`. A second collection
with the final collector returned identical data and preserved the original
manifest timestamp. The prior snapshot version was 1793843770.

Comparisons use record identities and values rather than array order.

| Table | Semantic change |
| --- | --- |
| ItemList | 120 additions, no removals. Existing records have 8,256 category-ID changes and 392 name/description key changes. Resolved existing names remain unchanged except the previously unavailable 엘레노아 클래식 바이시클 원드. |
| ItemCategoryList / ItemCategoryGroups | 23 categories and ActivateFlying group added. 7,295 masks and existing group IDs changed. Existing derived totem classifications remain identical. |
| StringTable | 1,370 keys added, 857 removed, five existing values changed. Missing-string exceptions remain unchanged. |
| OptionSetList | All 1,770 rows have remapped category references. The 1,375 derived enchants are unchanged. |
| ItemExtendMetalWareList | 34 equipment records added. Ability, tool and level tables are byte-identical. |
| ProductionList | 18 net additional rows. Fifteen finishing recipes accept 희미한 에너지 조각 as an alternative. One 랑그히리스 본브레이커 recipe accepts two more lance identities. The energy-fragment recipe output changes from 5100469 to 5100471. |
| ItemExtendUpgradeList / ItemUpgradeList | 25 equipment joins added. 27 existing upgrade rows change Personalize from true to false. |
| MiniatureList | 낭만 농장 전격검 미니어처 added, with source BonusDamage=3. All 218 existing miniatures are unchanged. |
| ItemExtendTotemList | Two damage-skin records added. All 276 existing totems are unchanged. |
| BarterList | Twenty seasonal name keys changed. The 28 selected fixed goods and material identities remain unchanged. |
| SkillList | Three additions and ten changed existing records. |
| Remaining 12 tables | Byte-identical, including random probabilities, all four echostone tables, Ogham tables and the commerce-post map. |

New items and recipes include 종말의 로브, 포인셰 equipment and cosmetics,
탈라 가흐 주화, and the new material alternative. Raw records were not patched.

## Official correction and source gaps

The [official November 12 patch](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893919)
reduces 하이드라 연성 마법 보호 감소 수치 awakening from maximum level 20 to
10 and doubles its per-level value. Existing levels convert by halving and
rounding up. The latest Prilus random table still says maximum 20 and has no
effect join for this option.

The echostone builder applies the official maximum only to that exact black
echostone option. It accepts upstream maxima 20 or 10 and rejects another value
for review. Source records and probabilities remain intact. The simulator uses
the existing source-backed maximum-10 level table; it does not claim a new
observed probability distribution. The unresolved effect value remains unavailable.
A regression verifies maximum 10, a possible level-10 target and zero probability
for level 11. Historical auction option text and fixtures are not rewritten.

Prilus includes coin item IDs 5160519 through 5160522 and their recipes, but no matching
`ItemExtendTotemList` effects. The totem tool therefore does not add inferred
effect ranges or stacking rules. The official mutual-exclusion rule is recorded
in issue #255 for the follow-up once source coverage exists.

## Generated consumers

All 13 outputs were regenerated with `pnpm prebuild`.

| Output | Result |
| --- | --- |
| suggest-index.json / item-id-map.json | 116 added names in each. Totals 38,022 suggestions and 38,088 image names. |
| enchant-index.json | Byte-identical, 1,375 enchants. |
| reforge-reference.json | 11,641 equipment records. Existing abilities, tools and weights retained. |
| echostone-reference.json | New provenance and the explicit official Hydra maximum correction. Other options, polishing fixtures and upgrades retained. |
| miniature-reference.json / totem-reference.json | 219 miniatures and 278 totems. Existing records unchanged. |
| barter-reference.json / barter-material-index.json | Same 28 fixed goods and retained expired season; current item metadata rebuilt. |
| crafting-reference.json | 1,630 recipe choices and 3,310 items. Changed recipe selections require review through existing fingerprints. |
| murias-reference.json | New provenance; 30 effects and 300 reviewed level values unchanged. |
| auction-filter-reference.json | Byte-identical. Exact historical option spelling remains supported. |
| ogham-reference.json | New provenance; 26 words, 97 effects and costs unchanged. |

Two existing image-name lookups now use the newly added highest numeric ID,
following the existing policy. 리틀 케라우노스 호루라기(메달 불가) changes from
5020139 to 5020255, and 희미한 에너지 조각 from 5100469 to 5100471. No existing
image names are removed. Explicit old-ID lookups remain available.

Every generated recipe fingerprint was independently matched to a hash of its
original raw record before updating the current-index regression pin. Historical
market and simulation fixtures remain intact.

## Independent sources and maintained contracts

- **Barter season.** `pnpm barter:refresh` failed before publication because
  Labanyu has no unique active season. The season-17 file and its October 29
  collection timestamp remain unchanged. Its November 5 expiry is not extended.
  Existing UI disables the expired goods. No November rotation was inferred.
- **Auction catalog.** Reobserved 497 of the 500 active identities through
  Nexon, including 496 current listings and one recent sale. Fresh published
  ranking evidence verifies 실습용 마력탄 at total-value rank 285. The page still
  labels the period as seven days after December 14, 2025 at 04:00, so its original
  observation interval remains unchanged. 더스크바운드 이지스 그리브 retains valid
  November 5 evidence. Expired-evidence 더스크바운드 이지스 가드(여성용) moves to
  the archive; fresh current-listing evidence returns 소울 리버레이트 해머 to
  discovery. All 604 public identities survive as 500 active and 104 archived
  items. Empty API observations do not establish retirement. The two collector
  reports exit 1 because each has fewer than 500 eligible candidates; catalog
  validation checks the reviewed combined result separately.
- **Cash packages.** The shared [official notice](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893855)
  still matches all 36 entries, quantities, choice boxes, trade restrictions and
  box-to-item mappings. The freshly downloaded [sale image](https://ssl.nexon.com/s2/game/mabinogi/mabiweb/event/2026/0922_th_xbqmqp/bg.jpg)
  matches the prior bytes and prices of 32,900, 89,900 and 119,000 cash. Sales ended
  October 21 at 23:59. All three product URLs redirect to an error page, so a full
  fresh product-page check is unavailable and `verifiedAt=2026-10-15` is retained.
  These remain historical comparisons, not a complete current shop inventory.
- **Polishing evidence.** Recomputed all six fixtures against current level,
  grade and normal-agent tables and resolved item 53940. Bounds, weights and
  totals remain 160, 240, 8690, 180, 300 and 12020. Only then advanced the evidence
  version and check date. These are source-derived probabilities, not new trials.
- **Crafting rules.** Rechecked all 19 skill mappings, 19 ranks and prerequisite
  handling against current Prilus constants and production display modules.
  Updated their source URL and verification date. The mechanics supplement remains
  empty; material-return and character-eligibility behavior are not invented.
- **Murias, filter evidence and localization exceptions.** Retained the curated
  ten-level mappings, historical API observations and existing missing-string
  allowlist. Builders recheck their applicable source relationships. Historical
  observation dates remain unchanged.
- **API and rules in code.** Fresh official auction and NPC schemas match the
  November 5 copies byte-for-byte, retaining 79 categories, 21 NPCs and four
  servers. The official fee guide retains 5% normal and 4% membership fees.
  Channel maximum 42, all live response shapes, coupon denominations, exclusions,
  aliases, units and all historical stacking/simulation rules were not separately
  reverified against complete current official evidence. Related snapshot checks
  and tests cover their existing consumers.
- **Artwork and live responses.** All 65 active barter material icons were
  fetched again with identical bytes. Older unused icons remain. Echostone,
  Murias and Ogham icons are retained without a fresh download; their referenced
  identities did not change. Auction prices, listings, sales, horns, NPC inventories
  and proxied images remain live responses. No transient market data or credentials
  were added to static catalogs.

## Collector repair

Prilus now loads a module Worker for zstd. The old MabiDB search imported every
observed asset module into Window, causing that Worker to resolve its WASM at the
site root and fail with HTTP 404. The collector now examines module-script
resources and DOM modulepreload URLs. It preserves the existing origin/path
restrictions, source-version check, validation and atomic publication.

Independent review caught that Chromium reports both Worker and modulepreload
resources with initiator type `other`. The final implementation explicitly retains
DOM modulepreload URLs. A real module Worker and a preload-only store are included
in the isolated browser regression. Removing the guard reproduces
`worker evaluated in window`; the final guard passes and preserves all 25 tables,
typed masks, failed-collection rollback and browser cleanup.

## Verification

Local logs, source comparisons and the decision trail are under
`artifacts/refresh-2026-11-12/`.

| Check | Result |
| --- | --- |
| `pnpm data:collect` | All 25 tables collected. Final collector rerun returned identical data. |
| `pnpm prebuild` | All 13 outputs rebuilt. Repeated by the final build. |
| `pnpm data:check` / `pnpm catalog:validate` | Passed. Independent review also checked raw counts, sizes, hashes, generated deltas and catalog evidence. |
| `pnpm exec tsx scripts/check-reference-collector.ts` | Passed, including Worker and preload-only discovery, failure preservation and cleanup. |
| `pnpm lint` | Passed with 69 existing warnings and no errors. |
| `pnpm exec next typegen` / `pnpm typecheck` | Passed after the browser test server stopped. |
| `pnpm test --runInBand` | All 76 suites and 867 tests passed. |
| `pnpm exec playwright test --project=크롬` | All 125 tests passed. Includes all reference, crafting and simulator suites. |
| `pnpm build` | Passed. |
| `pnpm data:expiry` | Expected failure for the retained expired barter season. Catalog evidence remains valid. |
| `git diff --check` | Passed. |

Independent review found and verified the modulepreload correction before the
final checks. It also corrected a documentation typo about lance alternatives.
No test assertion or timeout was weakened. Firefox, mobile-browser projects and
deployment were not run. New season collection and coin-effect coverage remain
open in issue #255; a complete fresh cash-product check remains unavailable.

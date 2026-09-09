# Totem reference and evaluation

The tool derives `src/data/totem-reference.json` from the existing same-version
`ItemExtendTotemList`, `ItemList`, and `StringTable` snapshots. It does not fetch
Prilus at application/build time. `Id` joins `ItemList.Id`; item names and
descriptions resolve through StringTable. All totem rows, raw bonuses, and
lowercase `isExtra`/`isPet` flags survive derivation, including duplicate names.
The snapshot reviewed on 2026-09-09 has source version `1788405829`, 271 rows,
24 types, and 74 empty bonus arrays. These counts are observations, not schema
limits. Empty bonuses do not mean zero effects or a fixed roll.

## Evidence and units

Reviewed 2026-09-09 against:

- [Official OX book rewards](https://m.mabinogi.nexon.com/m/news/notice_view.asp?id=4889852): ranges for eight ordinary effects and the bonus-damage book (2022-05-12).
- [Official emart24 item description](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4890357): item 5160052 grants 1% bonus damage; raw bounds are both 10 (2022-12-15).
- [Official totem guide](https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4887001&num=41): same-type activation exclusion, different types coexist, separate amulet/custom systems.
- The versioned game's item descriptions, especially 5160469 (`itemdb_etc.17307`, explicit movement speed 2%), 5160100 (`itemdb_etc.7687`, intelligence/magic attack 1–10 and exclusion with royal society coins), and 5160005 (`itemdb_etc.1715`, minimum/maximum damage 1–20).
- A read-only request to the deployed `/api/auction?auction_item_category=토템` on 2026-09-09 returned 1,551 rows through the existing Nexon proxy. Sixteen selected rows preserve all original option fields in `src/lib/__tests__/fixtures/totem-listings.json`. Prices, quantities, and expiry are **synthetic test values**. These fixtures are not current prices. They cover all 19 observed subtypes; they are not a promise of complete future API coverage.

The following table is the complete reviewed source mapping. All API numbers are
already displayed values (API scale 1). Only source `bonusdamage` divides by ten.
Blank display units mean the game's numeric stat value, not an inferred percent
or a conversion into another physical quantity. `critical` therefore remains a
numeric 크리티컬 stat; only bonus damage and speed receive a `%` suffix.

| Raw key | Source ID / description key | Raw bounds | API subtype / observed value | Display unit | Source divisor | Precision |
|---|---|---|---|---|---|---|
| critical | 5160032 / itemdb_etc.4899 | 1–22 | 크리티컬 / 8 | numeric | 1 | 0 |
| stamina | 5160030 / itemdb_etc.4897 | 10–110 | 최대스태미나 / 99 | numeric | 1 | 0 |
| magicattack | 5160034 / itemdb_etc.4901 | 1–20 | 마법 공격력 / 6 | numeric | 1 | 0 |
| allstat | 5160026 / itemdb_etc.4893 | 1–25 | 체력/솜씨/지력/의지/행운 | numeric, independently rolled | 1 | 0 |
| maxdamage | 5160033 / itemdb_etc.4900 | 1–30 | 최대대미지 / 28 | numeric | 1 | 0 |
| bonusdamage | 5160052 / itemdb_etc.6981 | 10–10 | 보너스 대미지 / 0.4 on 5160004 | % | 10 | 1 |
| life | 5160031 / itemdb_etc.4898 | 10–110 | 최대생명력 / 38 | numeric | 1 | 0 |
| mana | 5160029 / itemdb_etc.4896 | 10–110 | 최대마나 / 130 on a different item | numeric | 1 | 0 |
| speed | 5160469 / itemdb_etc.17307 | 2–2 | 이동속도 증가 / 3% on 93360 | % | 1 | 0 |
| def | 5160028 / itemdb_etc.4895 | 1–22 | 방어력 / 4 | numeric | 1 | 0 |
| magic_defense | 5160028 / itemdb_etc.4895 | 1–22 | 마법 방어력 / 24 on a different item | numeric | 1 | 0 |
| stat_int | 5160100 / itemdb_etc.7687 | 1–10 | 지력 / 3 on an all-stat item | numeric | 1 | 0 |
| mindamage | 5160005 / itemdb_etc.1715 | 1–20 | 최소대미지 / 5 | numeric | 1 | 0 |

The observed 52289 handkerchief fixture has five distinct values 9/13/5/13/7.
Its single raw allstat range 1–21 expands into five ranges, never five identical
actual values. The 5160004 painting fixture's 0.4 compares with 0.1–1.0, without
another division by ten.

API-only effects were checked independently in the live response:

| Subtype | Observed item/value | Handling |
|---|---|---|
| 힐링 효과 | 리트리버 멍토템 / `6.000000`; 브리 레흐의 주화 / `7.000000` | Numeric API value, scale 1, up to six decimal places. No inferred percent. `healingeffect` reference rows have no bounds. |
| 모든 연금술 대미지 | 샴 냥토템 / `35` | Integer API value, scale 1. `allalchemydamage` reference rows have no bounds. |
| 음악 버프 지속 시간 | 브리 레흐의 주화 / `18` | Integer API value, scale 1, explicitly labeled **API 수치**. The response supplies no seconds/percent unit; no seconds or percent is asserted. This item has no reference row and cannot establish a replacement group or range. |

These actual numeric effects remain readable when ranges are absent. No bounds
are borrowed from miniatures, amulets, event reward tables, or another item.
Future keys and unrecognized units keep their raw text and receive no score.
Input parsing matches the entire nonnegative decimal (maximum 64 characters,
six fractional characters, value at most 1,000,000); trailing fractional zeros
are allowed without implying additional meaningful precision. Per-stat integer
ticks avoid floating-point subtraction errors. Blank/malformed/duplicate options
are unknown. Out-of-range values are retained and not clamped.

## Replacement evidence

Ordinary effects with reviewed full effect sets use their complete `TotemType`
and applicability, never the first stat. The ordinary type rule follows the
official guide and item descriptions. Extra items explicitly describe coexistence
with ordinary effects (for example 5160373, 5160011, 5160402); normal/extra and
character/pet comparisons do not produce replacement deltas.

Royal coins 5160005/5160090/5160091/5160092/5160099/5160100 are one explicitly
reviewed exception group across `minmaxdamage` and `intmagicattack`. The jousting
coin descriptions exclude society coins. A replacement must expose the union
of minimum damage, maximum damage, intelligence and magic attack, including
lost effects. Absent effects can contribute zero only with a verified complete
effect set; missing values within that set stay unknown.

Pet-only item 52495 additionally restricts use to 피니핀. Comparisons with other
pet items cannot silently assume this restriction is satisfied. Enhancement,
custom, decorative and other unreviewed types have no inferred replacement rule.
Duplicate exact names (including 52189/52197, 52187/52195, 52188/52196 and
5160326/5160332) remain ambiguous for a live listing even after a user picks one
catalog ID. Listing `item_display_name` is not evidence of a unique source ID.

## Refresh and checks

Run the existing `pnpm data:collect` only for an intentional source refresh.
For the current snapshot run `pnpm totems:build`, then `pnpm data:check`.
`prebuild` also regenerates the compact index. The generator sorts by ID and
hashes a stable payload, checks joins/unique IDs/bounds, preserves unknown keys
and flags, and validates the evidence rows above. A changed assertion requires
review of the evidence, not simply updating expected numbers. A new key stays
visible but unsupported until its source/API unit and effect rules are reviewed.

No probabilities, drop percentiles, reroll cost, rarity, or fair market value are
inferred from min/max. Range position describes an interval only. Listing prices
are asking prices observed at a time, not completed sales or durable listings.

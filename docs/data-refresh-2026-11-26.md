# Game data refresh, 2026-11-26

Collected all 25 Prilus Korean tables at version `1795660092`, replacing `1795057019`. No commits were created. The collector validated references and published the manifest atomically.

## Source changes

Eight tables changed; 17 are unchanged. ID-based comparison is saved in `artifacts/refresh-2026-11-26/semantic-diff.json`.

- ItemList adds 42 items and removes none. Existing 3,799 records change category references, class flags, or color tables.
- StringTable adds 26,960 keys and changes 3,551 values. No keys are removed.
- ItemCategoryList removes one category and changes 2,686 masks. ItemCategoryGroups changes with it.
- All 1,770 OptionSetList changes concern category references only.
- Equipment connections add 26 reforging entries. Upgrade connections add 16 and remove one.
- Totem source effects, crafting recipes, probability tables, miniature effects, Ogham tables, and skill records are unchanged.

## Generated consumers

All 13 outputs were regenerated. Enchant and auction-filter outputs remain byte-identical. Six previously unnamed extra totems now have Korean names and descriptions: cat, dog, rabbit, guinea pig, hamster, and parrot squishies. Their effects remain unchanged.

Crafting has 32 skill-label changes because upstream `skillinfo.3002` changed from a missing-key placeholder to an empty string. Existing fallback text now appears. All recipe fingerprints, quantities, ingredients, and referenced item records are unchanged. Miniature records and fixed barter goods remain unchanged.

## Independent sources and limits

- Labanyu collection failed with zero active seasons. The previous season and original collection date remain intact. Season 17 expired on November 5 at 07:00 Asia/Seoul. No future rotation was inferred. All 65 referenced barter icons were fetched; their bytes are unchanged.
- Polishing probability tables, grade and agent adjustments, and item 53940 were compared with the previous snapshot. The numerical fixture checks passed before accepting the updated evidence version/date.
- The auction catalog validates 500 active identities. Its oldest evidence remains valid until December 5 at 13:29:45 Asia/Seoul. Existing observations and 104 archived identities were retained, not recollected.
- The [official cash notice](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893855) still matches the three supported prices, 36 entries, choice boxes, restrictions, and tradable mappings. Its sale window ended October 21 at 23:59. All three product detail links redirect to errors, so the complete configuration verification date remains unchanged.
- The [November 26 patch](https://m.mabinogi.nexon.com/m/news/notice_view.asp?id=4893946) changes the commander's emblem effect to duration increase, three seconds at level five. The local catalog only exposes its general description and no numerical effects; it contains no obsolete numerical rule to replace.
- Current Prilus crafting constants and display modules were inspected. All 19 skill mappings, ranks, suffixes, and prerequisite display rules agree. Updated the crafting evidence date and display module URL.
- Historical auction option observations, missing-string exceptions, Murias rules, and regression observations retain their dates. Builders validate their applicable source relationships. Existing non-barter artwork was retained without redownload.
- Current server/NPC/channel enums and every live API response were not independently reobserved. The official patch does not announce changes to fees, crafting, Ogham, or echostone calculations. This does not establish fresh verification of all simulation or stacking mechanics.

## Validation

Verification logs are under `artifacts/refresh-2026-11-26/`. Data checks, catalog validation, lint, Next.js type generation, type checking, and the production build passed. Lint retains 69 warnings and no errors. All 76 unit suites and 869 tests passed after excluding ignored historical copies under artifacts. The initial unrestricted Jest command included those stale copies; an intermediate run also overlapped regeneration. The final run used complete regenerated data. The crafting regression pin was updated only after its output digest, count, and ordered samples were independently checked. All 70 Chromium tests passed across 11 reference, planner, and simulator suites. After the final crafting source metadata update, regeneration, 16 focused crafting tests, type generation, type checking, and the production build passed again. Other browsers were not tested. `data:expiry` rejects the expired Labanyu season; catalog evidence remains valid.

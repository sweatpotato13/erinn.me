# Item reference data

## Local source and updates

Item consumers use the committed `src/data/reference/manifest.json` and its `snapshot` directory through `scripts/reference-data.ts:readSnapshot`. The manifest supplies the Korean source version, table counts and checksums. `scripts/item-reference.ts` resolves `ItemList.Name` against the same snapshot's `StringTable.Id`/`Str`; raw records, IDs, flags and variant relationships remain untouched.

1. To update the upstream source, run the separate maintainer command `pnpm data:collect` using the collector's local Playwright prerequisites. Collection is never invoked by build, dev or requests.
2. Run `pnpm catalog:validate` and `pnpm items:build`. These commands read and validate committed files only; they work without upstream reference-data access.
3. Run `pnpm data:check` to validate the snapshot and verify that both committed generated indexes match fresh derivation. Run `pnpm test`, `pnpm typecheck` and `pnpm build` for integration changes.
4. Review and commit the snapshot, manifest and both indexes together. Inspect name additions/removals and image ID changes in the JSON diff. Roll back that complete update together if necessary; do not restore an independently maintained item list.

`items:build` generates only `src/data/suggest-index.json` and `src/data/item-id-map.json`. Production `prebuild` validates the reviewed catalog and runs this local generation. Catalog candidate collection and validation read resolved snapshot items directly. The legacy TypeScript item list, JSON copy and conversion script have been removed.

The raw loader lives in `scripts/` and Node tests. Runtime `/api/suggest` reads only the compact suggestion index and `/api/item-image` imports only the compact name-to-ID map. The browser receives suggestion results and existing image URLs, never complete source tables. The existing image proxy still makes live image requests; Nexon market requests remain live and name-based.

## Name and suggestion policy

- Names must resolve through StringTable. Missing entries, empty/whitespace-only text, `None`, `<nil>`, and the existing `hasExcludedKeyword` markers (`itemdb`, `not found key`, case insensitive) are excluded from derived items. Raw records are retained; generation reports skipped counts and `pnpm data:check` prints example IDs/keys.
- Display/search text is preserved exactly, including Korean spacing, punctuation and parentheses. Trimming is used only to detect placeholders, not to rewrite names.
- `IsAuctionSearchable` is advisory, not a filter. This preserves the previous all-name autocomplete policy and allows manually entered exact-name searches. The migration snapshot even marks seven reviewed catalog IDs false, including `52458` (동물 캐릭터 분양 메달) and `12441` (보호의 6단계 푸른 개조석). An upstream false value alone must not hide existing supported names.
- Autocomplete requires at least two characters and retains the six previous substring exclusions: `피터`, `머미`, `스폰서`, `낡은`, `뮤턴트`, `점령전`.
- Records are sorted by numeric ID before derivation. Suggestion names are deduplicated in first-ID order, then grouped by the existing lowercase two-character prefix. The API retains its existing query limits, matching, 20-result cap and response shape.

## Image and page identity

Name-based images choose the highest numeric source ID, independently of upstream row order. One reviewed exception in `imageIdOverrides` preserves `생활 협회 코인 상자` as `4090082`; the snapshot adds another variant, `4090093`. A missing or renamed override target fails generation and requires review. Explicit-ID lookup, ID precedence, the unknown-name `1000` fallback, image headers and upstream failure handling are unchanged.

The reviewed `auction-item-catalog.json` remains the sole allowlist for stable `/auction/items/<id>` pages. No catalog item, name, evidence or timestamp changed in this migration. Its validator still enforces exact name/ID membership, duplicate rules and 30-day evidence freshness. Missing or renamed source records fail validation with the affected ID/name; they never remove existing pages automatically. No catalog compatibility mapping is necessary for this snapshot (all 500 identities match). If a later update requires one, review a narrow old-ID/exact-auction-name exception before promoting the update, keeping the allowlist and freshness checks intact.

The game's image ID and the stable page ID are separate choices. Auction price lookup continues to use the catalog's exact auction item name; candidate collection still requires an explicit canonical ID for ambiguous names.

## Migration comparison

Compared base `7e07367` with Korean source version `1788405829`:

| Check | Before | After |
| --- | ---: | ---: |
| Raw item records | 43,049 legacy rows | 43,064 source rows |
| Resolved source records | — | 42,426 |
| Image name keys | 38,092 | 37,468 |
| Suggestion entries | 42,979 | 37,402 unique names |
| Unique suggestion names | 38,026 | 37,402 |
| Reviewed catalog pages | 500 | 500 |

- All 37,454 existing resolved image names retain their old IDs. No existing source IDs were removed and no resolved source names changed.
- Removed 638 invalid name keys (577 unresolvable localization keys and 61 StringTable `not found key` values) from image lookup and autocomplete. They are source references, not valid Korean search names; explicit image-ID requests still work for those records.
- Added 15 source IDs: 14 new names and the coin-box variant. New names include `가을빛 포도나무 의자(2인)`, `탈틴 농장 꽃양배추 씨앗` and `에코 마리오네트 크래프트 키트`.
- Deduplication removes repeated visible suggestions while preserving all source variants. No valid existing suggestion name was removed.

`check-item-reference.ts` covers localization failures, exact text, advisory auction flags, exclusions, duplicate variants, numeric ID ordering, the image exception and byte-for-byte generated output. API and browser tests cover new snapshot suggestions, exact query selection, image IDs and existing fallback behavior. Catalog tests cover source removal/rename failures while retaining all 500 stable identities.

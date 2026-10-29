<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project and working rules

- This is a Korean-server Mabinogi tools site built with Next.js App Router, React, TypeScript, and pnpm. Use `package.json` for installed versions and commands, and `.github/workflows/` for CI requirements.
- Features live in `src/app/`, API proxies in `src/app/api/`, shared calculations in `src/lib/`, collectors/builders/checks in `scripts/`, and committed game data in `src/data/`.
- Read `git status --short` and the relevant `docs/*-reference.md` before editing. Preserve existing work. Do not manually patch generated records or raw snapshots to bypass validation.
- Reuse existing collectors and helpers. Keep changes within the requested scope. Never commit or print API keys, cookies, CSRF tokens, or private user data.

## Weekly game-data refresh

A request to update game data covers **all repository game-data sources and consumers**, not just enchants and barter. Some datasets are generated, some are curated, and others are live API responses. Do not describe all of them as freshly collected merely because `pnpm prebuild` succeeds.

After a Thursday patch, check actual upstream versions and content. Sources can lag behind the game; changing a local date does not refresh data.

### Complete source snapshot

`pnpm data:collect` collects the Korean snapshot from https://prilus.gitlab.io/ by running the site's own decoder in Chromium and reading its in-memory MabiDB cache. `scripts/reference-data.ts` defines the required tables, validates references, and publishes matching tables and `src/data/reference/manifest.json` atomically. The manifest records the source version, collection time, counts, checksums, and warnings.

The current snapshot contains these 25 tables under `src/data/reference/snapshots/`:

| Area | Tables |
| --- | --- |
| Items and localization | `ItemList`, `StringTable`, `ItemCategoryList`, `ItemCategoryGroups` |
| Enchants and relic effects | `OptionSetList` |
| Reforging | `ItemExtendMetalWareList`, `MetalWareAbilityList`, `MetalWareItemList`, `MetalWareLevelList` |
| Shared probability tables | `RandomTableList` |
| Echostones | `EchoStoneList`, `EchoStoneAwakenAdjustByGradeList`, `EchoStoneAwakenAdjustByItemList`, `EchoStoneConvertAdditionalRewardList` |
| Equipment upgrades | `ItemExtendUpgradeList`, `ItemUpgradeList` |
| Crafting and skills | `ProductionList`, `SkillList` |
| Miniatures and totems | `MiniatureList`, `ItemExtendTotemList` |
| Barter | `BarterList`, `CommercePostNameMap` |
| Ogham | `OghamWordList`, `OghamAbilityList`, `OghamCost` |

The collector's `tableNames` and the manifest are authoritative. Update this inventory when coverage changes. Tables without a dedicated page or builder still belong to the complete snapshot and must be collected and checked.

### All generated JSON consumers

Paths below are relative to `src/data/`. `pnpm prebuild` validates the auction catalog and runs all local builders in dependency order. It generates these **13 files**, without contacting reference-data sources:

| Command | Output files | Review focus |
| --- | --- | --- |
| `pnpm items:build` | `suggest-index.json`, `item-id-map.json` | Exact names, additions/removals, duplicate names, image IDs |
| `pnpm enchants:build` | `enchant-index.json` | Prefix/suffix and relic identities, ranks, conditions, effect bounds |
| `pnpm reforge:build` | `reforge-reference.json` | Equipment, abilities, tools, weights and valid configurations |
| `pnpm echostone:build` | `echostone-reference.json` | Colors, grades, agents, awakening/polishing weights, upgrade rewards |
| `pnpm miniatures:build` | `miniature-reference.json` | New facilities, bonuses, stacking groups, unsupported effects |
| `pnpm totems:build` | `totem-reference.json` | New items, category membership, effects, units and ranges |
| `pnpm barter:build` | `barter-reference.json`, `barter-material-index.json` | Selected fixed goods, current seasonal goods, material IDs and plan keys |
| `pnpm crafting:build` | `crafting-reference.json` | Recipes, ingredients, finishing alternatives, skill/rank mappings |
| `pnpm murias:build` | `murias-reference.json` | Exact effect descriptions, reviewed ten-level values and skill references |
| `pnpm auction-filters:build` | `auction-filter-reference.json` | Enchant/reforge/echostone suggestions and verified fixed awakening |
| `pnpm ogham:build` | `ogham-reference.json` | Words, effects, pools, grades, costs and material identities |

An unchanged generated file is a valid result when its newly derived bytes match. `pnpm data:check` checks the source and every generated file, including outputs that have no embedded source-version field. Do not use Git modification status alone as proof of freshness.

### Independent and curated datasets

These are **not automatically refreshed by `data:collect` or `prebuild`**. Include each in the review and report its actual verification status.

| File or area | Maintenance procedure |
| --- | --- |
| `src/data/barter-season.json` | Collect the actual current season from https://labanyu.com/trade with `pnpm barter:season:collect`, or use `pnpm barter:refresh` to collect the season, rebuild barter data, and fetch material icons together. |
| `src/data/auction-item-catalog.json` | Run `pnpm catalog:validate`. Evidence must be within 30 days. For expired evidence or an explicit catalog refresh, follow `docs/auction-item-catalog.md` and `pnpm catalog:collect --input <file>` with the existing Nexon environment variables. Review membership separately from source refreshes. |
| `src/data/cash-packages.json` | Manually check every product's official `sourceUrl` and the shared `noticeUrl`: prices, names, quantities, choice-box contents, trade restrictions, and box-to-tradable-item mappings. Review sale-period information and page copy when relevant. Update `verifiedAt` only after the check. This is the supported package selection, not an automatically complete cash-shop catalog. |
| `src/data/echostone-polishing-evidence.json` | Compare the recorded fixtures with current probability tables, grade/agent adjustments, and item 53940. Only then update `sourceVersion` and `checkedAt`. Re-audit changed bounds/weights instead of making fixtures pass blindly. |
| `src/data/crafting-rules.json` | Curated crafting type-to-skill, rank, suffix and mechanics mappings. Compare changed production types with the current Prilus constants/display modules and `docs/crafting-reference.md`. A successful generation alone does not reverify upstream mapping semantics. |
| `scripts/murias-rules.json` | Curated Arcana membership and ten-level values. The builder checks the complete source effect set, exact descriptions, maxima, units, skill names, and local skill icons. Revisit official evidence if mechanics change; generation does not constitute new observed probability evidence. |
| `src/data/auction-filter-evidence.json` | Historical exact API option spellings and one fixed awakening. The builder checks the fixed source option. Reobserve actual API options when their contract changes; never relabel historical observations as current. See `docs/auction-search-filters.md`. |
| `scripts/reference-known-missing-strings.json` | Reviewed upstream localization gaps. Compare new missing keys with the source before changing exceptions. Never expand this list merely to silence a collection failure. |

Catalog identity is stable: preserve removed active entries' original IDs and names in `archivedItems`. Empty API results do not prove an item is retired. Never change `verifiedAt` without evidence, or replace the source's historical observation interval with the current week.

Cash packages are limited-time offers. Their contents and prices can remain unchanged after sales end. Check the official sale window separately during patch reviews; an accessible product page or a recent `verifiedAt` does not prove that the package is currently purchasable. Treat `verifiedAt` as the configuration verification date, not an availability guarantee. Preserve historical comparison data when a sale ends unless removal is requested. If the UI states current availability, verify the official deadline and timezone before updating that claim; never infer a sale window from the collection date.

### Game rules and metadata stored in code

A JSON inventory alone is insufficient. Check patch/API changes against these maintained contracts; edit only with supporting evidence and run their focused tests:

- `src/constant/categories.ts`: Nexon auction category names. `src/constant/excluded-keywords.ts`: intentional search exclusions, not an upstream item catalog.
- `src/lib/schemas/nexon.ts`: server names, supported NPC shops, channel bounds, and response shapes. Check the corresponding selectors in `src/app/npc-shop/page.tsx` and API handlers when changing these enums or bounds.
- `src/lib/auction-calculator.ts`: coupon denominations and normal/membership auction fees. Other tools reuse this calculation; review the shared implementation and callers together.
- `src/lib/enchant-effects.ts`, `src/lib/auction-option-text.ts`, `src/lib/auction-options.ts`: supported effect names, aliases, ranks, units, and matching rules. Preserve unknown text instead of inventing an interpretation.
- `src/lib/totems.ts` and `src/lib/miniatures.ts`: effect/unit mappings, activation exclusions, stacking and compatibility rules. Source IDs changing does not establish a new stacking rule.
- `src/lib/reforge.ts`, `src/lib/echostone.ts`, `src/lib/echostone-upgrade.ts`, `src/lib/ogham.ts`, `src/lib/murias-simulator.ts`, `src/lib/crafting.ts`, and `src/lib/barter.ts`: simulation/calculation semantics. Source-derived numbers and documented simulation assumptions must remain distinct. Inspect related builder constants and fixtures if source shapes or mechanics change.

### Images, historical fixtures, and live data

- `public/images/barter/`: `pnpm barter:icons:collect` fetches material icons referenced by the current barter catalog. The directory can retain older icons; not every file is necessarily part of the active refresh.
- `public/images/echostone/`, `public/images/murias/`, and `public/images/ogham/`: committed inventory/skill/word icons, maintained separately. Check new/changed IDs and source artwork using the URLs and acquisition rules in the corresponding reference documents. There is no general collector for these directories; `prebuild` does not redownload them. Report existing assets retained without a fresh download as such.
- `src/lib/__tests__/fixtures/*.json`, inline unit fixtures, and E2E fixtures are historical or synthetic regression evidence. Do not replace them wholesale with live listings or adjust observation dates. Add/update fixtures when a changed contract requires it.
- Auction listings, sales, prices, horns, NPC shop inventories and proxied item images are live API data, not committed weekly snapshots. Their handlers are under `src/app/api/`. Review response compatibility and caches when needed; do not write transient market data into static game catalogs or call collectors from request handlers.

### Refresh sequence

1. Check dependencies and Chromium. If needed, run `pnpm install --frozen-lockfile` and `pnpm exec playwright install chromium`. Inspect existing reference-data changes before replacing them.
2. Run `pnpm data:collect`. Compare actual source versions and review changed rows by ID; upstream array reordering is not itself a semantic change.
3. If fields or references changed, inspect current upstream semantics and update schemas, builders, and focused checks together. Do not guess missing numbers/booleans or weaken validation.
4. Review the independent datasets and code metadata above. Update the polishing evidence only after its numerical checks. Run `pnpm barter:refresh`, then `pnpm prebuild` to rebuild every consumer.
5. Run the checks below and affected browser tests. Run type generation/type checking after the test server has finished starting or stopping to avoid transient `.next/dev/types` races.

```sh
pnpm data:check
pnpm catalog:validate
pnpm lint
pnpm exec next typegen
pnpm typecheck
pnpm test --runInBand
pnpm build
pnpm exec playwright test e2e/item-reference.spec.ts e2e/enchant-reference.spec.ts e2e/barter.spec.ts e2e/miniatures.spec.ts e2e/totems.spec.ts --project=크롬
```

If collection code changed, also run `pnpm exec tsx scripts/check-reference-collector.ts`. Run additional affected simulator/crafting E2E suites when their data or behavior changes. The example browser command does not cover every feature or browser.

6. Run `git diff --check` and review the complete file list. Commit or roll back the source, manifest, derived outputs, reviewed supplements and necessary code changes as one coherent unit. Commit/deploy when requested.
7. Report the exact source version, semantic additions/removals/changes, unchanged regenerated outputs, manual evidence checks, retained historical data, checks performed, and anything not freshly verified. Never claim all repository game data was updated when only generated files were checked.

### Barter timing and identity

- Weekly usage resets on **Thursday at 07:00 Asia/Seoul**. Monthly seasonal validity is independent; use Labanyu's actual start and exclusive end timestamps and the unique season containing the current instant. Do not infer future rotations.
- Current fixed coverage is eight Skatha goods and five each at Karu/Oasis/Calida/Pera. Seasonal coverage is the four Iria tier-six goods. These counts are reviewed observations, not permanent schema assumptions. Do not publish every raw barter row as a fixed good.
- `BarterList.Id` is a trade-good ID; `Prices[].Id` is a material item ID. Exact ingredient names must resolve to exactly one item ID. `weekCount` is the weekly limit; ingredient quantities are per exchange, without multiplying by `bundleCount`.
- Preserve existing plan keys and material identities. On seasonal collection failure, keep the previous file and its original date. See `docs/barter-reference.md` for details and recovery.

### Source-format changes and recovery

- Builders use `readSnapshot`. Do not import the Node-only loader or entire raw tables into browser code or runtime APIs; consume the generated subsets.
- Since the 2026-10-15 source, item `IsDyeAble` and totem `Flags` have been replaced by category-based metadata. Totem classification follows `ItemList.CategoryId` into `ItemCategoryList.TagMask` and `ItemCategoryGroups`. `ExtraTotem`, `PetTotem`, and `SecondaryTotem` require all group bits to be present. Collect both tables in the same snapshot; serialize `Uint8Array` masks as numeric arrays.
- Since the 2026-10-29 source, Prilus serves its bundle from a CDN (the collector sets the site's `assetSelfUntil` fallback flag), downloads `kr_resourcedata.bin.zst`, and keeps only compressed bytes in IndexedDB. The collector finds the exported MabiDB instance among loaded `/assets/*.js` modules, awaits `startFull`, and reads `getData(name, "kr")`; manifests record decoder `upstream-playwright-mabidb`. Earlier manifests keep `upstream-playwright-indexeddb`.
- Roll back schema support with its corresponding data when restoring older formats. Do not fabricate newly required tables for an old snapshot.
- Preserve upstream placeholders such as `not found key` and `<nil>` in raw data; retain existing exclusion/unavailable behavior in derived data.
- If `.collect-lock` remains, inspect running collectors and its `previous-snapshots` backup. Restore files matching the active manifest before removing the backup or lock. Never run concurrent collectors.
- Collectors are explicit maintainer commands. Do not add network collection to `prebuild`, CI, deployment, page loads, or API requests.

## Latest refresh audit: 2026-10-15

This is dated evidence, not a promise that future sources remain unchanged.

- All 25 Prilus tables were collected at source version `1792036284`; all 13 derived JSON outputs were regenerated. `enchant-index.json` and `auction-filter-reference.json` are byte-identical to the prior versions, which is expected and checked.
- Added 217 item IDs, 18 miniatures, and one totem. Existing 275 derived totems are unchanged. All 1,375 derived enchants are unchanged. New category tables contain 8,238 categories and 22 groups.
- Barter retains 28 fixed goods and season 17/version 2 with four goods. Labanyu was collected again; the season ends on 2026-11-05 at 07:00 Asia/Seoul. All 65 active material icons were fetched; their bytes are unchanged. Older unused icons remain in the directory.
- Polishing fixtures were checked against unchanged probability/adjustment data before advancing their evidence version/date. The auction catalog's existing 2026-10-12 evidence remains within its validity window and compatible with the new snapshot; it was validated, not recollected.
- The three supported cash packages were separately rechecked against their official product pages and notice: prices, all 36 product entries, choice boxes and box-to-item mappings are unchanged. `cash-packages.json` now records configuration verification on 2026-10-15. Current purchase availability and sale deadlines were not verified; limited-time sales may have ended. This does not claim a complete inventory of newly released cash-shop products.
- Curated crafting mappings, relic rules and auction option observations were retained. Generator checks validate their applicable snapshot relationships; their historical source/observation dates were not rewritten. The allowlisted missing localization keys remain unchanged.
- NPC/server/channel/category metadata, fee/stacking/simulation rules, and non-barter artwork were inventoried but were **not independently reverified against every current official source or redownloaded**. Historical regression fixtures were retained. These are explicit limits of the refresh, not automatically refreshed data.

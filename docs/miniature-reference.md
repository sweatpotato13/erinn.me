# Miniature reference and comparison

## Current UI revision (2026-09-08)

The default target is **전체**, allowing name/effect searches across all miniatures. Selecting a specific stat excludes missing and zero effects; the minimum-value filter applies only to specific stats. Search words match independently. Cards display actual item effects. Specific stats sort by descending item effect; 전체 sorts by descending facility ID as a registration-order proxy because release dates are unavailable.

Saved installations use a non-scrolling responsive grid: image, name, then normal/extra type on separate lines. The catalog checkbox adds installations; there is no duplicate installation search/editor. Candidate cards integrate individual before/after effects, editable prices, automatic auction lookup on selection, and immediately visible lookup results, pending/error states. The basket retains independent group maxima. No standalone preview, share URL/state/image endpoint, title strip, provenance footer, or related-tools footer remains. Local installation persistence and scoped reset remain.

Verification and screenshots below describe the original implementation and its retired UI, not this revision.

## Source and refresh

The committed MiniatureList is already part of the existing manual collector and manifest. Build reads `readSnapshot` and reuses `resolveItems`; no runtime reference-table download or second collector. Facility `Id` identifies installations/comparison; `ItemId` identifies inventory images, prices and exact `ItemList.Name` auction searches. MiniatureList booleans are retained unchanged. Item/facility description differences are retained as plain text.

Run `pnpm data:collect` only for a deliberate maintainer refresh, review the complete snapshot/manifest together, then `pnpm miniatures:build` and `pnpm data:check`. `prebuild` generates locally. Commit the derived index with any reviewed source change. The composite version uses CreatedAt plus SHA-256 of the compact payload, detecting changes with an unchanged upstream timestamp. Unknown keys remain visible with unverified units/rules and are excluded from supported totals. Negative values, broken joins, duplicate facilities and changed evidence fixtures stop generation for review.

## Reviewed effect units

Source snapshot CreatedAt `1788405829`, collected 2026-09-05. Reviewed 2026-09-08. Flat values stay flat (not inferred percentages). Percent source values stay in percent units; a difference is displayed in percentage points. The generator has runnable assertions for every mapping below against the specified source descriptions.

| Key | Korean label | Unit | Facility / item | Raw example |
| --- | --- | --- | --- | --- |
| Strength | 체력 | flat | 1281 / 5030588 | 2 |
| Will | 의지 | flat | 564 / 54536 | 5 |
| Intelligence | 지력 | flat | 341 / 54312 | 5 |
| Dexterity | 솜씨 | flat | 564 / 54536 | 5 |
| Luck | 행운 | flat | 190 / 54165 | 5 |
| Life | 최대 생명력 | flat | 1375 / 5030675 | 10 |
| Mana | 최대 마나 | flat | 232 / 54207 | 25 |
| Stamina | 최대 스태미나 | flat | 165 / 54141 | 10 |
| AttackMax | 최대 대미지 | flat | 789 / 5030118 | 5 |
| MagicAttack | 마법 공격력 | flat | 829 / 5030168 | 6 |
| MusicSkill | 음악 버프 스킬 효과 | flat | 790 / 5030119 | 2 |
| BonusDamage | 보너스 대미지 | % | 1387 / 5030687 | 2 |
| CriticalDamage | 크리티컬 대미지 | % | 1372 / 5030672 | 2 |
| MoveSpeed | 이동 속도 | % | 740 / 5030070 | 1 |
| Defense | 방어 | flat | 1143 / 5030462 | 1 |
| Protect | 보호 | flat | 1207 / 5030515 | 1 |
| MagicDefense | 마법 방어 | flat | 1287 / 5030594 | 2 |
| MagicProtect | 마법 보호 | flat | 1207 / 5030515 | 1 |
| AllAlchemy | 모든 연금술 대미지 | flat | 1439 / 5030736 | 4 |
| HealingEffect | 힐링 효과 | flat | 1440 / 5030737 | 2 |
| CriticalRateLimitUp | 크리티컬 상한 증가 | % | 1218 / 5030526 | 1 |

### String provenance

- Strength: facility `1281`, item description `itemdb_etc.12382`.
- Will: facility `564`, item description `itemdb.76946`.
- Intelligence: facility `341`, item description `itemdb.65066`.
- Dexterity: facility `564`, item description `itemdb.76946`.
- Luck: facility `190`, item description `itemdb.53444`.
- Life: facility `1375`, item description `itemdb_etc.15580`.
- Mana: facility `232`, item description `itemdb.58041`.
- Stamina: facility `165`, item description `itemdb.50543`.
- AttackMax: facility `789`, item description `itemdb_etc.1975`.
- MagicAttack: facility `829`, item description `itemdb_etc.3028`.
- MusicSkill: facility `790`, item description `itemdb_etc.1976`.
- BonusDamage: facility `1387`, item description `itemdb_etc.15695`.
- CriticalDamage: facility `1372`, item description `itemdb_etc.15577`.
- MoveSpeed: facility `740`, item description `itemdb_etc.1197`.
- Defense: facility `1143`, item description `itemdb_etc.9550`.
- Protect: facility `1207`, item description `itemdb_etc.10114`.
- MagicDefense: facility `1287`, item description `itemdb_etc.12388`.
- MagicProtect: facility `1207`, item description `itemdb_etc.10114`.
- AllAlchemy: facility `1439`, item description `itemdb_etc.17609`.
- HealingEffect: facility `1440`, item description `itemdb_etc.17610`.
- CriticalRateLimitUp: facility `1218`, item description `itemdb_etc.10296`.

## Supported individual-effect rule

Evidence reviewed on 2026-09-08:

- [Official reward notice](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4889152), miniature reward explanation: normal and extra effects coexist; extras do not stack within their group; only installed facilities activate effects. Source descriptions (including facility 564 / item 54536) agree.
- [Labanyu normal miniature guide](https://mabi.labanyu.com/miniature/normal/%EC%A7%80%EB%A0%A5) and [extra guide](https://mabi.labanyu.com/miniature/extra/%EC%B5%9C%EB%8C%80%20%EB%8C%80%EB%AF%B8%EC%A7%80): “같은 효과 중 가장 높은 하나만 적용됩니다.” The author-maintained guide separates each effect and group and gives a real critical-damage example. This is community guide evidence for per-effect maximum selection, not an official claim of a complete farm simulator or a newly performed in-game experiment.

Rule: for each supported stat independently, take the maximum installed normal value plus maximum installed extra value. Buying a candidate changes only its group's maximum. A basket recomputes maxima over the union. Do not sum competing individual deltas. Ownership, inventory possession or comparison selection alone does not activate anything.

### Reproducible real fixtures

The guide's named critical-damage example joins the committed snapshot:

| Facility / item | Group | Relevant effects |
| --- | --- | --- |
| 485 / 54455 (마르에드 미니어처) | normal | CriticalDamage 4, Life 20, Strength 3 |
| 826 / 5030165 (심연의 구슬 미니어처) | normal | CriticalDamage 2, BonusDamage 1, Will 7 |
| 770 / 5030100 (멜윈 엑스트라 미니어처) | extra | CriticalDamage 3, Intelligence 6 |

The supported critical total is 7; removing 485 leaves 5, while 826 still supplies BonusDamage 1 and Will 7. Starting with 826+770, adding 485 increases CriticalDamage by 2, not 4. This directly instantiates the guide's rule on real records.

A second fixture exercises different suppliers: normal 592 / 54564 (청자) supplies AttackMax 5, MagicAttack 5, CriticalDamage 2; normal 739 / 5030069 (에탄) supplies MagicAttack 6 and Intelligence 11; extra 789 / 5030118 (피유) supplies AttackMax 5. The rule gives AttackMax 10 and MagicAttack 6. Removing 739 retains AttackMax 10 and reduces MagicAttack to 5. These are calculated guide-rule fixtures from the recorded snapshot, not measured character totals. Focused Jest tests retain these and the issue's A/B/C/D synthetic overlap example.

## Coverage and market limitations

Set effects, pet houses and all other farm/island systems are outside totals. Facility 1207 / item 5030515 mentions a six-piece set: retain that explanation, show its set contribution is excluded, and calculate only its individual Protect/MagicProtect values. Never claim unsupported search means unavailable acquisition or a zero market price.

Price-summary responses are requested explicitly for at most four selected unique searches. Empty markets remain unknown; manual zero is distinct; fetched times/quantity/completeness are shown. Auction prices are unit references, not stock guarantees. Browser icon calls use the existing item-image proxy (which can fetch upstream images), not reference data or auction prices.

## UI reference and validation

The user supplied the [traits-window screenshot](assets/miniature-traits-reference.png) on 2026-09-08; capture date and game build are unknown. This is the primary theme/layout reference. The earlier character-window image corroborates the theme. Echostone styling and generated mockup artwork are explicitly excluded.

Match translucent dark gray panels, thin outlines/inset edges, shallow title bar, rectangular gray controls, compact white text and restrained yellow values. Adapt left selection/effects plus right list to four comparison candidates; installations remain separately editable and are not slot-limited. Do not add trait leveling, locked slots, AP gems or set activation. Use real inventory icons, never generated figurines.

Visual verification must compare real desktop/mobile output to this screenshot. Readable contrast, 44px touch controls and mobile stacking are intentional web adaptations. Implementation screenshots and verification results will be recorded after browser checks.

## Original implementation verification (2026-09-08; before UI revision)

### Requirements and evidence

| Requirement | Implementation | Verification |
| --- | --- | --- |
| R1: local index and joins | `build-miniature-reference.ts`, committed compact JSON, existing collector | Generator and `data:check`: 200 entries, 21 reviewed effects, 0 unknown keys; deterministic 127,503 bytes. Browser bundle contains no raw table loader, `StringTable.json`, or `ItemList.json`. |
| R2: labels, units, unknown effects, safe descriptions | Reviewed map, React text nodes, expandable source descriptions | Generator checks all 21 source/unit fixtures; component fixture displays an unknown key and literal script-like text without creating script elements; set facility 1207 remains visibly excluded. |
| R3: independent installation maxima | Shared pure totals/delta functions | Synthetic 7/7 and overlapping +6/+8 cases plus real 485/826/770 and 592/739/789 fixtures. Official installation/group notice and community per-effect guide rechecked on 2026-09-08. |
| R4: filters, rank, compact catalog | Independent catalog and installed-list filters | Korean search, type/stat/minimum, price boundary and unknown-price group tests; browser journey preserves four candidates through no-results filtering. |
| R5: four candidates and basket | Separate installation IDs, comparison IDs and transient preview | Fifth-candidate rejection, preview without installation, all-stat detail, removing/clearing candidates, overlapping basket computation. Production fixture 592/739/789/485/826/770 plus candidate 589 shows AttackMax 10 → 13 (+3). |
| R6: explicit prices | Disabled TanStack queries, name/version identity, manual override map | No price calls until explicit action; same-name aliases deduplicate; pending batch cannot overlap; zero/blank manual edits survive late response/removal; quantity/time/partial/error/empty-market states tested. |
| R7: bounded local/shared state | Versioned strict schemas, guarded after-mount storage, temporary URL baseline | Corruption/denial/bounds/reconciliation tests; browser reload and history journey preserves saved installations and unrelated favorites; reset removes only this feature key. |
| R8: discovery and SEO | Shared feature registry, server page and PNG route | Home/menu navigation, one sitemap URL, base canonical for generic/shared URLs, crawler HTML and 1200×630 PNG checks. Existing home sitemap expectation includes the new base route. |

### Visual comparison with the supplied traits window

Compared the production [desktop screen](assets/miniature-desktop.png), [390px mobile screen](assets/miniature-mobile.png), and [mobile detail](assets/miniature-mobile-detail.png) side by side with the [unaltered user reference](assets/miniature-traits-reference.png). The gray title strip, narrow inset panel borders, flat rectangular buttons, small framed inventory images, white text with shadow and yellow numeric emphasis follow that reference. The left four-candidate tray sits above the basket and separately named single-candidate preview; the right catalog scrolls within the desktop window. Installation editing stays above both, with no four-slot installation restriction. Detailed comparison sits below the window columns and uses the same stat rows on desktop/mobile.

Intentional web adaptations: four comparison cards rather than five trait slots; no trait ornaments, locked slots, AP or levels; a higher-opacity gray background against the site's white page for readable contrast; 44px controls and visible keyboard focus; mobile 2×2 candidates and a bottom comparison summary with safe-area padding. The original game scenery is not copied. Icons use actual item IDs through the existing proxy, and load failures retain a fixed-size neutral placeholder. No generated imagery or echostone styling is shipped.

### Production inspection

A task-owned `pnpm start --port 3101` server served the completed build. A JavaScript-disabled browser confirmed the exact H1, rules and base canonical on a shared/invalid query URL. The generated server HTML is 161,996 bytes; the compact feature data is 127,503 bytes versus the 6.5 MB ItemList and 29.8 MB StringTable source tables. A real-data desktop/mobile journey observed 55 browser requests and zero price-summary, browser-direct Prilus, or raw-table requests before explicit price action. Expected image-proxy calls remain enabled. The [PNG](assets/miniature-preview.png) was visually inspected for readable Korean text and has dimensions 1200×630. Local Vercel analytics endpoints return 404 outside Vercel; these are existing site integrations, not miniature errors.

### Review

CodeRabbit round 1 reported three findings. Fixed shared icon failure state surviving a candidate change and the share-link test's input type. Added a regression covering icon replacement and non-overlapping pending price batches. Retained normalized display labels: the documentation column describes Korean UI labels, while the generator fixture tokens intentionally match the original description spelling. Round 2 initially failed with a recoverable WebSocket connection error; its retry completed with zero findings.

The first full browser run exposed two outdated shared-navigation test assumptions in `e2e/reforge.spec.ts`: the newly released 아이템 비교 group was expected to be absent, and a center-of-heading outside-click target now fell beneath the wider dropdown layout. Updated the group expectation and clicked the visible left edge of the same heading, retaining the actual outside-click behavior assertion. No reforge calculation or shared-navigation implementation changed.

### Final gates

- `pnpm miniatures:build` and generator `--check`: passed; deterministic 200-entry output, all source/unit fixtures.
- `pnpm data:check`: passed, including the existing reference validation, failed-write/promotion and rollback fixtures. Its changed-content warning is an intentional synthetic fixture; committed raw tables are unchanged.
- Focused miniature Jest suites: passed. Full `pnpm test --runInBand`: 39 suites / 508 tests passed.
- `pnpm lint`, `pnpm exec next typegen`, `pnpm typecheck`, changed-file Prettier check and `pnpm build`: passed on final application code.
- Full `pnpm exec playwright test` ran all 340 cases across Chrome, Firefox, mobile Chrome and mobile Safari: 332 passed; eight failures were the same two obsolete navigation tests across four projects. After the documented test corrections, the affected eight cases plus all twelve miniature cases were rerun together: 20/20 passed. No unresolved browser failures remain.
- Production inspection was repeated after the final preview change: no 390px horizontal overflow, base canonical retained, zero forbidden/automatic price requests, JavaScript-disabled server content present, real candidate inventory icons loaded. PNG and screenshot artifacts are linked above.
- CodeRabbit rounds 2 and 3 completed with zero findings. Round 3 includes the final preview and navigation test changes. No dependencies, additional data collector, pricing endpoint, cloud/account integration or generated UI artwork were added.

Task progress: plan loaded; four implementation phases completed; CodeRabbit review completed; local CI-equivalent commands and production/browser verification completed. The feature is ready for review; no PR or deployment was requested.

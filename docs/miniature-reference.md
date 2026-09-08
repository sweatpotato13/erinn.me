# Miniature reference and comparison

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

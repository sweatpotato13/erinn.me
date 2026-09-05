# Enchantment reference data

## Source contract and refresh

`scripts/enchant-reference.ts` reads the existing `src/data/reference/manifest.json` through `readSnapshot`, validating the coherent snapshot and checksums. It resolves `OptionSetList.Name`, `Name2` and `Desc` against that snapshot's `StringTable`. Raw source files are unchanged. Ordinary prefixes/suffixes (`Usage=0/1`) and relic prefixes/suffixes (`Usage=11/12`) enter `src/data/enchant-index.json` with distinct identities and labels. Other option types remain excluded. Source IDs, both localized names, usage, rank and original description survive derivation.

1. Refresh upstream data using the existing **manual** `pnpm data:collect` command and its documented Playwright prerequisites in the repository README.
2. Run `pnpm enchants:build` and `pnpm items:build` to derive local indexes. `prebuild` invokes only local generation and catalog validation; it never invokes collection.
3. Run `pnpm data:check`, focused enchant tests, `pnpm lint`, `pnpm typecheck`, `pnpm build` and relevant browser tests.
4. Review source version/count/checksum changes, missing localization, aliases, ranks and description diffs. Commit the coherent source snapshot, manifest and generated indexes together. Roll them back together when necessary.

The current index has 1,325 ordinary rows plus 10 relic enchants. All have localized names; 92 descriptions resolve to upstream `not found key` placeholders and become an explicit unavailable-description state. Unresolved names are excluded, an available alternate name remains usable, and localization keys are never displayed. Unknown ranks stay unavailable rather than being guessed.

The browser imports only the generated localized enchant subset through `src/lib/enchant-reference.ts`. Neither components nor API handlers import the raw snapshot loader, StringTable or ResourceData. Auction name filters, URL/preset contracts and Nexon option values remain unchanged.

## Detail investigation

On 2026-09-05, the current [Prilus HTML](https://prilus.gitlab.io/) selected [the main decoder bundle](https://prilus.gitlab.io/assets/index-CZYUf-Rr.js). Its [enchantment module](https://prilus.gitlab.io/assets/optionSetList-BJA3llWz.js) sends `{Region:"kr", Id}` to gRPC-Web `prilus.mabiapi/OptionSetJson`; the protobuf response is `JsonRes.Json` (field 1, string). The decoded JSON has `OptionList` as a game-script string, not a structured effects array. `OptionDesc` matches the committed localized description for the inspected records. Per-item applicability would require a different endpoint and is outside this migration.

Representative responses were inspected directly at `https://mabiapi2.pril.cc/prilus.mabiapi/OptionSetJson` using the request and protobuf contract above. The findings are summarized below; raw research responses are not maintained as application data. No detail response is required by the implementation, so the shared collector needs no extension and no interpreter is introduced. Future data that actually requires detail collection must extend that same manual collector.

The option module uses [the source rank map](https://prilus.gitlab.io/assets/index-xuTzgeeV.js): `0=연습`, `1=F`, `2=E`, … `6=A`, `7=9`, … `15=1`. All ordinary rows in this snapshot have levels 0–15; skill dan ranks in that shared upstream map are not inferred as enchant ranks.

| Source example | Verified source behavior | Application behavior |
| --- | --- | --- |
| 어스름한, 21639 | `MagicAttack +(50~65)` with skill 30301 level 18; 100 mana and repair cost 200 | Actual roll 60 remains 60, `(최대치 -5)`; full reference condition is readable, never assumed active |
| 잔허의, 21698 | Fixed maximum damage/magic/alchemy 15; music bonus 2 and duration 5 | Scroll shows fixed effects, personalization and source rank 7 |
| 햄스터헌터, 1 | `AttMax -(10~12)` | A roll reducing damage by 12 is two points below the most favorable attainable effect, -10 |
| 폭스, 207 | Both attack bounds carry `level>=14` | A standalone condition line applies to both following effects |
| 얼어붙은 / 재난 | `alchemy_fire` and `alchemy_water` despite alternate Korean description spellings | Verified fire/water attack-damage spellings normalize to their alchemy effect identities |
| 대적자, 31207 | `marionette_control_critical +(5~10)` | Source `마리오네트 크리티컬` matches the existing `마리오네트 조종술 크리티컬` name |

## Parsing and comparison

`enchant-effects.ts` accepts an anchored numeric effect grammar: recognized effect name, signed integer/decimal, optional `~` range, optional `%`/`초`/`Gold`/`만 Gold`, and `증가` or `감소`. Whitespace is optional around values. Percent units implied by critical/balance/wound-rate names are normalized; unrelated units are never interchangeable. Gold magnitudes expand only the explicit `만 Gold` suffix. Repair multipliers such as `수리비 2배` remain text and do not become percentages.

Only enumerated effect names and verified spelling aliases are supported. Conditions retain their full identity; whitespace, rank word order and a few equivalent Korean particles are normalized. Standalone condition lines scope subsequent plain effects until another condition, bracketed effect or unsupported line. This behavior is verified by Fox's actual script. Brackets and literal `\\n` become safe text lines; React never injects upstream HTML.

A listing effect must have one fixed numeric roll, compatible type/unit/direction and exactly one matching reference effect. A supplied condition must match; an omitted condition may match a unique source effect, whose condition remains available in the reference details. Repeated stats with different conditions are not added or guessed. Unrecognized competing effects suppress comparison. Unsupported text is always retained for reading.

The existing **최대치** label is retained. Its difference measures how far the signed effect falls short of the most favorable attainable endpoint: ordinary increases use the upper bound, ordinary decreases use the lower magnitude, and repair-cost/stamina-consumption increases use the lower bound. The formula keeps decimals and zero minima. Out-of-range listing values remain unchanged and show `기준 범위 밖`; they do not redefine reference bounds. Fixed effects, including zero and repair cost 200%, display only their original text. Comparisons apply exclusively to variable ranges (min < max). There is no separate “최적치” feature or label.

Name lookup uses the unchanged `parseEnchantName`/`normalizeOptionText` helpers. Every name maps to an array, preserving collisions. Listing prefix/suffix, explicit relic context and rank narrow candidates; more than one remaining row is unresolved even when descriptions happen to match. For example, `스네이크` requires prefix/suffix context; `견고한` needs rank as well. No numeric roll is used to pick an identity. Three ID-scoped spelling aliases preserve existing exact listing names: `다크크로스` (30809), `다이어울프` (30505), `실버폭스` (20714). These do not rewrite search inputs or add numeric fallback data.

## Legacy audit and exceptions

A migration audit compared all 3,190 legacy effects across 1,128 names, including all 831 ranges, against the current snapshot. The historical input is `7980d0a:src/constant/enchants.ts`, never imported at runtime. The entire 19,245-line hand-maintained database is retired.

- **823 ranges** match canonical identity/condition and both bounds directly. Four source-supported range corrections are `오래가는` critical minimum 7 (old 8), `48층의` minimum damage maximum 30 (old 35), `어마어마한` luck maximum 25 (old 15), and `스태틱` critical minimum 10 (old 12). Directly inspected detail scripts confirm the two changed maxima.
- `밀렵꾼` retains dexterity 8–15 but its source requires ecology rank 5; the legacy table swapped that condition with rank 3 for critical. Both source description and detailed script agree. `플라밍고 슬레이어` modifies **maximum** wound rate 2–4%, not the legacy minimum wound rate; its detailed script confirms `wAttMax`.
- The two remaining legacy ranges belong to `직장인의` and `비지니스맨` (one 100–200 character-stat entry per alias, typed `야근 상태일때 체력`). Neither name exists anywhere in this snapshot. Along with `스테이블` (three fixed effects), these are the only absent-name exceptions: keep actual listing text and show reference unavailable; do not invent source IDs, conditions or maxima. There is no numeric fallback. Revisit only if a later source supplies them.
- Ten legacy names (`관리자`, `후회`, `편린`, `자아`, `선물`, `순수한`, `잠식된`, `기억의`, `쌓여가는`, `신뢰하는`) are actually relic prefix/suffix usages 11/12, totaling 23 fixed effects. Their descriptions are included with explicit 유물 접두/유물 접미 labels and the arcana activation condition. They are never presented as ordinary enchants; fixed values have no maximum annotations.
- Fixed-effect discrepancies were reviewed: old/source condition wording differences remain visible, while changed thresholds are taken from source rather than made equivalent. Examples include `현자의 돌` rank 1단, `바람빛` skill thresholds, `명중` rank A and `여행자의` cumulative-level conditions. `동백나무` uses source mana decrease 10 instead of old 15. Unknown or mismatched conditions do not receive a confident comparison.

The source may contain awkward or malformed prose (for example duplicated `때` or a stray backslash). Preserve it as text; do not silently rewrite conditions or manufacture a general parser. Duplicate-name cases intentionally require more listing context than the old dictionary's overwritten value.

## Verification

`check-enchant-reference.ts` checks deterministic generation, localization, ordinary usage, aliases and rank output against the manifest-backed source. Focused Jest tests cover parser boundaries, signed/decimal/zero/percent effects, ambiguous identity/conditions, exact and outside-range rolls, safe text rendering and both consumers. Existing auction tests cover filters, shared URLs, presets and equipment comparison. Browser coverage expands real auction result markup using equipment and scroll fixtures and rejects any Prilus runtime request. Production verification also inspects client chunks for raw-table/localization/endpoint markers.

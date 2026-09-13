# Murias relic reference and market baseline

`pnpm murias:build` derives a compact versioned reference from the committed snapshot using `readSnapshot`. `pnpm data:check` verifies reproducibility. Build/runtime never requests Prilus. Raw OptionSetList and StringTable records remain untouched. Only Usage=10 participates; the source Level=0 is not a roll level. Items 3600007 and 3600006 resolve to the base relic and Idea respectively.

`scripts/murias-rules.json` is the reviewed supplement for Arcana membership and explicit ten-value arrays. The generator checks the entire set of 30 IDs, exact current descriptions, units and maxima; changed source descriptions stop generation for review. The uniform steps are a curated mapping, not a probability claim or a deduction from the source Level field.

Evidence reviewed 2026-09-13:

- [Nexon introduction](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4892577): each effect has ten stages.
- [Sacred Guard changes](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893513), [June balance changes](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893577), [Hydro Pierce wording](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893633), [Interlude changes](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893436), [Fury changes](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893320), [Summon Nightmare changes](https://mabinogi.nexon.com/page/news/notice_view.asp?id=4893557) explain why old templates must not match.
- A read-only request to the existing deployed `/api/auction?item_name=무리아스의 유물` (backed by Nexon) returned 768 listings with no remaining cursor. All 30 effects had observations; every observed effect value matched the explicit mapping. Sanitized option-only evidence for each effect is committed in `src/lib/__tests__/fixtures/murias-options.json`. Observed decimal examples include the 0.05-step Sacred Oath and 0.3-step Annihilation. Missing levels in the observation are not asserted to have active listings.
- [Nexon API schema](https://openapi.nexon.com/static/api/mabinogi/36_ko_script20250410023004.yaml) specifies per-unit asking price, quantity, expiry and generic option fields. It specifies no dedicated pristine-condition or durability field. The observation contained only `무리아스 유물` and `전용 해제 거래 보증서 사용 불가` option types. Neither is evidence of pristine condition.

Baseline: exact base item and display name, positive safe-integer unit price and quantity, one exact known relic option. Explicit enchantment, upgrade, reforge, erg, durability or trade-condition option fields exclude a listing conservatively with a visible reason. This baseline is **not certified fresh/pristine**: when condition is absent it cannot be verified. If Nexon begins supplying durability, review its shape and fresh-restoration bounds before admitting those listings. Raw documented options remain inspectable for included and rejected listings. Unknown/duplicate/conflicting relic effects are counted separately from excluded listings. Zero/missing/error prices never enter cells.

Relic requests follow cursors to the final page with no page-count cap. A 50-second deadline and repeated-cursor detection fail the scan rather than expose partial prices; the route requests a 60-second execution allowance compatible with the deployed Hobby plan. Only completed relic scans enter the ten-minute cache, and POST refresh expires it. Pagination is not an atomic market snapshot: listings can change during the scan. Idea independently retains its existing bounded exact-name summary and coverage indicator. Search and cell selection use local data only. Failed refreshes preserve previous successful data and timestamps independently for relic and Idea.

Prices are observed asking prices, not completed sales, estimates or competitor data. No interpolation or other-level fallback is used. #216 owns restoration simulation and its eventual link.

## Skill icons

Each reviewed effect maps to a SkillList ID; the generator verifies its name against the effect prefix. The 30 PNG icons in `public/images/murias` were collected on 2026-09-13 from `https://mabires2.pril.cc/skillimage/kr/{skillId}/{skillId}.png`, the resource used by [Prilus skill listings](https://prilus.gitlab.io/skill). They are committed locally; builds and page views do not fetch this source.

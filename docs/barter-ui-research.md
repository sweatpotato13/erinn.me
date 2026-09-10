# Barter planner UI review — 2026-09-10

The previous page led with an empty result, several paragraphs and administrative
controls. Fixed limits, planned exchanges and already completed exchanges looked
like equally important inputs. Monthly goods were mixed into long collapsed post
lists without a recognizable tier-six label. This made existing seasonal data
appear missing.

## Services and research reviewed

| Source | Observation | Applied decision |
| --- | --- | --- |
| [AnyList recipes](https://www.anylist.com/recipes) | Selecting recipes feeds a separate shopping list; images help identify entries. | Selecting goods fills their weekly allotment and builds one preparation list. |
| [Paprika groceries](https://www.paprikaapp.com/help/android/#groceries) | Separates recipes from ingredients, consolidates demand, accounts for pantry items and checks off purchases. | Two columns on desktop; material rows distinguish required, owned and still needed. Checklist does not mutate inventory. |
| [Labanyu trade calculator](https://labanyu.com/trade) | Groups goods by trading post, shows tier, fixed weekly limits and ingredient icons. Current September season supplies four rotating Iria goods. | Keep post grouping and visible limits; promote all four monthly goods to the initial screen. Retain an independent local collection workflow. |
| [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Defer secondary controls so the initial view focuses on the primary task. | Completed-exchange adjustments, price provenance and record/undo use disclosures; manual entry and the on-page source explanation are removed. Errors remain visible. |
| [NN/g: Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/) | Clear structure and labels reduce the work needed to interpret inputs. | Replace “추가 교환 / 이번 주 사용” with “준비할 횟수 / 이미 교환한 횟수”; show “주 N회” as a fixed label. |
| [Baymard: Grocery quantity selectors](https://baymard.com/blog/grocery-add-to-cart-buttons) | Visible selection feedback and inline quantity controls help people track items already added. | Checkbox, selected-card styling, plus/minus/direct entry and live list count stay together. |

These are design references, not evidence that this particular redesign has been
user-tested. The implementation adapts their patterns to barter's actual quantity,
weekly-limit and inventory rules; it does not copy their branding or assets.

## Resulting flow

1. Choose individual goods or **이번 주 전체 담기**. A checkbox uses the known
   remaining weekly limit. The initial view does not require entering any numbers.
2. Adjust **준비할 횟수** only for a partial plan. **이미 교환했다면** exposes prior
   exchanges, defaults to zero and never changes the source's weekly limit.
3. Enter owned materials in the preparation list; read the highlighted deficit.
   Prices and contribution detail are optional disclosures. Lookup stays explicit.
4. Check prepared materials or copy/share/download the list. Mobile has a direct
   link to the result without duplicating the form or adding a second UI state.

All four sixth-tier goods are visible without opening a trading-post disclosure.
The existing seasonal collector was rerun successfully: 나무 조각 퍼즐, 유적 탐사
개론, 대형 해먹 and 불의 수정구, valid September 3–October 1 at 07:00 Seoul.
`pnpm barter:refresh` collects the season, rebuilds the derived catalog and collects
local ingredient icons. Ordinary builds/page requests never contact these sources.
The 65 icon files come from the same Prilus inventory-image source used by the
existing item-image route; they are stored locally instead of adding runtime calls.
Missing/legacy manual icons have a neutral fallback and never affect calculations.

## Follow-up design constraints

User feedback requested consistency with the rest of Erinn.me. The independent
green palette and system-font override were removed. The planner inherits the
site's MabinogiClassic font, neutral cards, DaisyUI theme tokens and shared
`btn`/`btn-primary` controls, using `/calculator` as the visual reference. The
manual season entry component and on-page data explanation were removed, while
existing saved plans remain readable.

# Echostone reference and polishing evidence (#192)

The committed Korean snapshot `1788405829` is the only reference-data input.
`pnpm echostone:build` generates a compact subset locally; production builds never collect Prilus data.
`pnpm data:check` verifies reproducibility. Raw snapshot files are not modified.

Colors use RandomTableList IDs 1–5; source row positions become identities within a color.
Visible-name targets sum all matching entries, retaining each entry's distinct level distribution.
Level tables are keyed by `10000 + Max`; grade and agent joins use option base maximum.
Supports retain `AdjustMinLevel < level <= AdjustMaxLevel`, then normalize original weights.
An empty support invalidates the configuration; it never removes an option and redistributes its weight.
Effect ID 0 means no supported effect join: show the original option and probabilities with an unavailable effect value.
Other unknown effect IDs fail generation. Equipment reforge caps do not apply to echostones.

Items 53940/53941/53942 are auction searchable; 5000078 has the same highest-quality name but explicitly says nontradeable.
Stone 5040961 is not auction searchable in the snapshot. Opportunity prices can be entered manually, including zero; blank means unknown.
Direct orrery access spends 25 AP per awakening, separate from Gold; an optional user-entered service fee is not a claimed game fee.

## Polishing distribution and source fixtures

Checked 2026-09-07. The user confirmed that Prilus contains data extracted from the actual game and accepted it as the calculation source; a separate probability-screen capture is not required for this implementation.

- [Prilus echostone data](https://prilus.gitlab.io/echostone), committed Korean snapshot `1788405829`: original level weights, grade upper bounds and agent lower bounds.
- [Official 2025-09-11 patch](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893022) and [current echo guide](https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4886983): polishing uses the probabilities of 에코스톤 각성제, the exact name resolved for item **53940**. It consumes only the stone, permits one attempt, excludes maximum-level options and retains the current level on a lower draw.
- Snapshot item 5040961 description excludes additional bonus effects. Consequently the prior high/highest-quality agent's minimum adjustment is not carried over.

The implemented mapping joins `RandomTableList[10000 + option.Max]`, `EchoStoneAwakenAdjustByItemList[53940]` and the current grade's `EchoStoneAwakenAdjustByGradeList` row. Retain levels above the exclusive lower bound and at or below the inclusive grade cap, then normalize their weights. This applies the official same-probability rule to the accepted game-data source, rather than claiming an independent in-game experiment.

`src/data/echostone-polishing-evidence.json` records that basis and six numerical fixtures: grades 21/30 × base maximum 3/5/20. The generator checks their source version, joins, bounds, exact weights and totals; unit tests also check the resulting probabilities and state transitions. At grade 30, maximum-5 polishing uses weights `[100,80,60,40,20]` over 300, while highest-quality awakening omits level 1 and normalizes over 200. Polishing must not inherit that premium adjustment.

The [official in-game awakening screen](https://file.mabinogi.nexon.com/dataAdmin/UpImg/91195739.png) shows blue grade 21, Icebolt maximum damage 11/20 and reroll available. The ordinary grade cap is 11, but the option's own maximum remains 20 for eligibility. Under the documented distribution, polishing that level-11 state cannot improve it; it still consumes the one permitted attempt. The fixture records the screen only as eligibility evidence, not as a numerical reroll measurement.

## Cost and simulation rules

A: expected awakenings `1/p`. B: enumerate below-target states that permit one polish; sum their weights times polish target probability for cycle success, and their weights for expected stones per cycle. Divide cycle resource expectations by cycle success.
C: one stone plus failure probability times the selected restart policy's expected resources. Already-satisfied state costs zero.
Expectations use floating point and are approximate displays of exact analytical formulas; actual Gold totals/budgets use bigint.
Mixed-cost cycles have no fixed-price geometric budget estimate.
Each actual action checks cancellation, target, action cap and remaining budget before sampling/spending; only the latest 100 actions are retained.

## UI item images

`public/images/echostone/*.png` contains the existing game inventory icons, downloaded unchanged from `https://mabires2.pril.cc/invimage/kr/{itemId}/{itemId}.png`. IDs 53934–53938 identify the five colors; 53940/53941/53942 identify the three displayed agents; 5040961 identifies the polishing stone. The layout follows the awakening window in the official guide. Images are served locally without runtime upstream requests.

## Upgrade simulation and simplified UI

The UI groups the identical highest-quality agent identities under 53942. Legacy 5000078 selections normalize to it. Price inputs and Gold totals cover agent purchases only; polishing stones, service fees, upgrade fees and whole-session budgets are excluded from the UI. Raw identities and the reusable budget engine remain intact.

`EchoStoneList.Upgrades[Grade]` describes the attempt from that grade to the next; grade30 is a terminal zero row. The compact generator validates all150 source rows and rejects downgrade-enabled rows. Upgrade simulation uses RateEasy for the base Gold-upgrade chance, without dungeon or potion bonuses. Gold upgrade fees are not included in the agent-only cost display.

The user explicitly requested an equal probability for each integer between AbilityMin and AbilityMax, inclusive. Black echostone life/mana/stamina are sampled independently under that assumption. New stones start at grade1 with each stat1 as the starting assumption; there is no manual grade/stat input. Failure retains grade and stats. Success increments grade and accumulates the sampled gains. Continuous runs stop at the requested grade, cancellation or10000 actions and retain only100 recent rows. Upgrade and awakening/polishing are independent simulators. Awakening/polishing always uses grade30 and does not consume the upgrade result. Each simulator retains its own color and state when switching views. Starting a new upgrade stone or changing its color clears only upgrade progress.

Upgrade visuals follow the official guide images `https://file.mabinogi.nexon.com/dataAdmin/UpImg/91195649.png` and `https://file.mabinogi.nexon.com/dataAdmin/UpImg/91195654.png`.

Agent price fields automatically request the existing auction summary on mount and seed untouched empty inputs with an available safe-integer minimum price. Manual edits (including zero) and restored prices take priority over late results; missing listings or failed requests remain unpriced. The single manual refresh button fetches and applies the latest available price; edits made while that request is pending take priority.

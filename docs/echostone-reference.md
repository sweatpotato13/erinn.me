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

## Evidence gate — not yet satisfied

Checked 2026-09-07:

- [Official 2025-09-11 patch](https://mabinogi.nexon.com/m/news/notice_view.asp?id=4893022): one reroll per awakening, max-level exclusion, only stone consumed, retain higher current level; normal-awakener wording.
- [Official echo guide](https://mabinogi.nexon.com/page/archive/guide_view.asp?id=4886983): current rule description, without numeric grade-dependent reroll probabilities.
- Snapshot item 5040961 description excludes additional bonus effects. No separate polishing adjustment row exists.

- [Official in-game awakening screen](https://file.mabinogi.nexon.com/dataAdmin/UpImg/91195739.png), linked from the guide (updated 2026-02-12), inspected 2026-09-07: blue grade 21, Icebolt maximum damage 11/20, highest-quality agent effect, reroll available. Snapshot grade 21 caps ordinary awakening at 11 for base maximum 20. Therefore retain base maximum separately from awakening support when checking polishing eligibility. The image contains **no numeric reroll distribution** and does not verify grade truncation for polishing.

These establish eligibility and material rules. They do **not** independently verify the normal-agent numeric mapping, especially grade truncation.
`src/data/echostone-polishing-evidence.json` records the unresolved status. No in-game observations have been fabricated.
Polishing calculations/actions must stay unavailable until a dated in-game probability fixture establishes the mapping.
The issue must remain open/incomplete until that fixture is recorded and production strategy B/C and polishing actions pass verification.

Needed evidence: game version/date, stone grade, option/base maximum, complete displayed reroll-level probability table, and provenance (screenshot or independently inspectable capture).
Compare at grade 30 and at a truncated grade with maxima 3/5/20; confirm the distribution does not inherit the prior premium agent.
If observations verify 53940, add the fixture and use that independent distribution. If they contradict it, implement the observed rule rather than change the expected fixture.

## Cost and simulation rules

A: expected awakenings `1/p`. B: enumerate below-target states that permit one polish; sum their weights times polish target probability for cycle success, and their weights for expected stones per cycle. Divide cycle resource expectations by cycle success.
C: one stone plus failure probability times the selected restart policy's expected resources. Already-satisfied state costs zero.
Expectations use floating point and are approximate displays of exact analytical formulas; actual Gold totals/budgets use bigint.
Mixed-cost cycles have no fixed-price geometric budget estimate.
Each actual action checks cancellation, target, action cap and remaining budget before sampling/spending; only the latest 100 actions are retained.

# Auction item catalog

`src/data/auction-item-catalog.json` is the reviewed allowlist for stable `/auction/items/<id>` pages. Membership changes only in an intentional pull request; a temporary empty response or API outage never removes a page.

## Initial selection

- Source: Labanyu's seven-day [경매장 아이템 거래 TOP 300](https://mabi.labanyu.com/in-game/auction/trading-volume), using both trading-volume and total-traded-value rankings.
- Observation: the source labels the snapshot as the seven days from `2025-12-14 04:00 KST`.
- Ordering: merge both rankings by each item's better rank, use the other rank as the tie-breaker, exclude names absent from local data, then keep the first 500.
- Stable IDs: price lookup still uses the exact item name. When local data has multiple IDs for that name, the lowest numeric ID is retained only as the stable page key.
- Limitations: Labanyu samples the one-hour Nexon API by item name, excludes some item types, and notes that its totals may differ from actual trades. `verifiedAt` records when the published ranking was checked, while `observedFrom` and `observedTo` describe the ranking's data period.

## 2026-10-01 refresh

Rebuilt the 500-item catalog from the currently published two TOP 300 tables,
using the same rank merge and canonical-ID rules. Of 540 distinct source names,
four could not be resolved against the Korean snapshot and were excluded.
The selection retains 397 items and replaces 103. All evidence ranks and check
timestamps were refreshed. The source still labels its observation period as
2025-12-14 04:00 KST plus seven days; this refresh does not claim current-week
trade observations. The committed observation period remains unchanged.

The 103 retired IDs and exact names are retained in `archivedItems`. Existing
detail-page and preview URLs continue to use live market queries by that saved
name, including the normal empty/unavailable states. The discovery list and
sitemap use only active `items`. Archived identities have no freshness claim
and remain valid even when the latest reference snapshot no longer contains them.

## 2026-10-12 evidence refresh

The documented Nexon collector checked all 500 active identities and found
current listings or recent sales for 496. A fresh read of both published
Labanyu rankings verified two more; the rankings still label their data period
as the seven days from 2025-12-14 04:00 KST, so `observedFrom` and `observedTo`
remain unchanged.

리파인드 마제스틱 나이트 아머(여성용) and 레더 롱 보우 had neither fresh API
activity nor ranking membership. They rotated into the archive with their exact
IDs and names preserved; this discovery rotation does not establish permanent
retirement. Fresh current-listing evidence supports the returning 불완전한 공상의
왕관 헤일로 and newly selected 낭만 농장 에아렌이 그려진 이젤. The catalog now
has 500 active entries (498 API observations and two ranking observations) and
104 archived identities. All 603 previously published IDs and names survive.

## Updating

1. Prepare an ordered JSON array of exact names or `{ "name", "canonicalId" }` objects.
2. Run `pnpm catalog:collect --input <file>`. The maintainer-only command requires `NXOPEN_API_URL` and `NXOPEN_API_KEY`, checks current listings then recent sales, and writes an ignored report to `artifacts/auction-catalog-candidates.json`.
3. Review evidence and explicitly select a canonical ID for duplicate names. Never change an existing canonical ID merely because live data is temporarily empty.
4. Edit the catalog in a dedicated pull request and run `pnpm catalog:validate`. Validation rejects evidence checks more than 30 days old, so revisit the source before refreshing `verifiedAt`; do not merely change its timestamp.
   Move each removed item's original `{ id, name }` into `archivedItems` to keep
   published links working. Preserve older archive entries; when an item returns
   to the active list, remove its archive entry. IDs must be unique across both lists.

If catalog data is stored or republished, follow Nexon Open API's current attribution and refresh requirements, including the documented 30-day update requirement.

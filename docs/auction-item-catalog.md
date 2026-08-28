# Auction item catalog

`src/data/auction-item-catalog.json` is the reviewed allowlist for stable `/auction/items/<id>` pages. Membership changes only in an intentional pull request; a temporary empty response or API outage never removes a page.

## Initial selection

- Source: Labanyu's seven-day [경매장 아이템 거래 TOP 300](https://mabi.labanyu.com/in-game/auction/trading-volume), using both trading-volume and total-traded-value rankings.
- Observation: the source labels the snapshot as the seven days from `2025-12-14 04:00 KST`.
- Ordering: merge both rankings by each item's better rank, use the other rank as the tie-breaker, exclude names absent from local data, then keep the first 500.
- Stable IDs: price lookup still uses the exact item name. When local data has multiple IDs for that name, the lowest numeric ID is retained only as the stable page key.
- Limitations: Labanyu samples the one-hour Nexon API by item name, excludes some item types, and notes that its totals may differ from actual trades. `verifiedAt` records when the published ranking was checked, while `observedFrom` and `observedTo` describe the ranking's data period.

## Updating

1. Prepare an ordered JSON array of exact names or `{ "name", "canonicalId" }` objects.
2. Run `pnpm catalog:collect --input <file>`. The maintainer-only command requires `NXOPEN_API_URL` and `NXOPEN_API_KEY`, checks current listings then recent sales, and writes an ignored report to `artifacts/auction-catalog-candidates.json`.
3. Review evidence and explicitly select a canonical ID for duplicate names. Never change an existing canonical ID merely because live data is temporarily empty.
4. Edit the catalog in a dedicated pull request and run `pnpm catalog:validate`. Validation rejects evidence checks more than 30 days old, so revisit the source before refreshing `verifiedAt`; do not merely change its timestamp.

If catalog data is stored or republished, follow Nexon Open API's current attribution and refresh requirements, including the documented 30-day update requirement.

# Auction item catalog

`src/data/auction-item-catalog.json` is the reviewed allowlist for stable `/auction/items/<id>` pages. Membership changes only in an intentional pull request; a temporary empty response or API outage never removes a page.

## Initial selection

- Source: the first five cursor pages returned by Erinn.me production `/api/auction` for category `기타`, backed by Nexon Open API.
- Observation: `2026-08-28T10:17:29Z`.
- Ordering: upstream response order, keeping the first 500 names with current listings and one exact local ID.
- Limitations: this is an activity seed, not a popularity or search-demand ranking. Forty-six duplicate local names and eleven locally unmapped names in the snapshot were excluded.
- Nexon data may be delayed by about ten minutes. Auction history covers only the most recent hour, and buyers should verify prices in game.

## Updating

1. Prepare an ordered JSON array of exact names or `{ "name", "canonicalId" }` objects.
2. Run `pnpm catalog:collect --input <file>`. The maintainer-only command requires `NXOPEN_API_URL` and `NXOPEN_API_KEY`, checks current listings then recent sales, and writes an ignored report to `artifacts/auction-catalog-candidates.json`.
3. Review evidence and explicitly select a canonical ID for duplicate names. Never change an existing canonical ID merely because live data is temporarily empty.
4. Edit the catalog in a dedicated pull request and run `pnpm catalog:validate`. Validation rejects API evidence more than 30 days old, so refresh the evidence before expiry; do not merely change its timestamp.

If catalog data is stored or republished, follow Nexon Open API's current attribution and refresh requirements, including the documented 30-day update requirement.

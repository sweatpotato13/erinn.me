# Korean game reference snapshot

This is the source contract for issues #188, #189 (items), and #190
(enchantments). Existing application consumers are unchanged. Raw tables are
maintained locally and committed; collection never runs in `dev`, `build`,
`prebuild`, installation, Vercel hooks, or API requests.

## Setup and refresh

Use the repository's Node/pnpm versions (CI checks Node 22, 24 and 26):

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
# Linux may need: pnpm exec playwright install --with-deps chromium
pnpm data:collect
pnpm data:check
```

No API key, account, persistent browser profile, or manual export is needed.
Playwright and tsx are existing development dependencies. The collector launches
headless Chromium with a fresh context, explicitly sets region and language to
`kr`, and loads [Prilus](https://prilus.gitlab.io/). Its HTML discovers current
hashed JavaScript assets; the app chooses an active resource mirror and uses its
Brotli/Protocol Buffers decoder (`prilus.ResourceData`). We export decoded data
rather than maintain another protobuf schema.

The collector waits for a successful Korean resource download and the upstream
`MabiDB.update: updated <version> kr` completion message, then reads selected tables
and the committed version in one readonly IndexedDB transaction: database
`prilus_mabi_db`, stores `data` and `version`, keys `<Table>_kr`, `Version_kr`, and
`CreatedAt_kr`. Embedded, committed, and freshly fetched versions must agree.
Actual mirror and discovered module asset URLs are recorded in the manifest;
no numbered mirror or hashed asset is hardcoded as the data source.
Changes to these upstream storage/completion conventions require reviewing the
collector. Launch/navigation have 30-second limits; remaining browser work has a
120-second deadline. Resources close on success and failure.

Dynamic price APIs, analytics and visual downloads are blocked during collection.
The decoder may temporarily decode other tables in memory/IndexedDB; only the
selected tables are exported. The source site currently announces that it has
stopped updating its information, so successful collection does not imply that
the data tracks the latest game patch.

## Committed contract

Read `src/data/reference/manifest.json` **once** and use its `snapshot` relative to
`src/data/reference/` for every table needed in that operation:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("src/data/reference");
const manifest = JSON.parse(
    readFileSync(resolve(root, "manifest.json"), "utf8")
);
const items = JSON.parse(
    readFileSync(resolve(root, manifest.snapshot, "ItemList.json"), "utf8")
);
const strings = JSON.parse(
    readFileSync(resolve(root, manifest.snapshot, "StringTable.json"), "utf8")
);
const textById = new Map(
    strings.map((row: { Id: string; Str: string }) => [row.Id, row.Str])
);
// Preserve the raw key when its upstream translation is missing.
const displayName = textById.get(items[0].Name) ?? items[0].Name;
```

Future consumers should generate compact feature-specific files locally or read
only necessary tables on the server. Do not import all raw tables into client
components, import collector scripts into the application, or add live enchantment
detail calls. Additional collection belongs in this explicit manual workflow.

Manifest format version `1` includes:

- `snapshot`: `snapshots/<CreatedAt>-<SHA256 of canonical table metadata>`.
- `source`: site, region, language, actual resource/version URLs, decoder method,
  and discovered module assets.
- `sourceVersion`: original decoded `Version` object, including `CreatedAt`.
- `collectedAt`: UTC time of successful local publication.
- `tables`: exact names, record counts, UTF-8 byte sizes and SHA-256 hashes.
- `warnings`: counts and examples of preserved source placeholders/missing text.

Each `<Table>.json` is an array, with one compact record per line. Object keys,
including nested maps, are sorted. Array order, fields, values, string keys and
duplicate records are retained. Never flatten all tables into ID maps: the initial
`ItemUpgradeList` has 428 repeated IDs. `OptionSetList` retains every usage, not
only ordinary prefix/suffix usage 0/1. The `Version` object is in `sourceVersion`.

## Initial successful collection

Collected 2026-09-05; source `CreatedAt = 1788405829`
(2026-09-03 12:23:49 KST). These are observations, not validation thresholds.
The selected JSON totals 40,321,723 bytes (about 38.45 MiB).

| Table                                |    Rows |      Bytes |
| ------------------------------------ | ------: | ---------: |
| ItemList                             |  43,064 |  6,467,666 |
| OptionSetList                        |   1,730 |    187,838 |
| StringTable                          | 222,033 | 29,765,187 |
| ItemExtendMetalWareList              |  11,500 |    861,924 |
| MetalWareAbilityList                 |     528 |    225,805 |
| MetalWareItemList                    |       5 |      1,278 |
| MetalWareLevelList                   |      25 |      4,251 |
| EchoStoneList                        |       5 |     33,298 |
| EchoStoneAwakenAdjustByGradeList     |      30 |      6,997 |
| EchoStoneAwakenAdjustByItemList      |       4 |        953 |
| EchoStoneConvertAdditionalRewardList |       6 |      4,589 |
| RandomTableList                      |      19 |    150,841 |
| ProductionList                       |   1,883 |    569,420 |
| ItemExtendUpgradeList                |   4,722 |    672,644 |
| ItemUpgradeList                      |   3,637 |  1,369,032 |

## Validation and source gaps

`pnpm data:check` checks table checksums/counts, shapes, source-version metadata,
required string and item references, upgrade/option relationships, production
materials, and echo-stone grades/rewards. It runs isolated temporary-directory
regressions for invalid input, duplicate upgrade IDs, placeholders, new missing
strings, stable serialization, failed writes/manifest promotion, repeat collection
and rollback. It needs no browser/network and runs in Node CI.

Known gaps were verified against the initial decoded upstream data: 577 item
names and 674 item descriptions refer to 1,251 missing string keys. Exact keys
are in `scripts/reference-known-missing-strings.json`; this is reviewed source
evidence, never regenerated automatically by collection. There are also 1,402
`<nil>` item descriptions and six `<nil>` random-table names. Empty text, `None`,
and `<nil>` are explicit placeholders. Raw values stay intact, with occurrences
reported in the manifest. All option name/name2/description keys resolve from the
same snapshot's StringTable. A new unresolved string fails validation: verify it
against a complete upstream load before updating the exception list. Do not add
a broad wildcard or invent a translation.

Validation covers selected table shapes and critical relationships, not game
balance, every probability formula, or references to excluded visual/skill tables.
New fields and unknown enum values remain raw. Add stricter field-specific checks
when a downstream consumer relies on them.

Optional browser failure checks (all responses are mocked locally):

```sh
pnpm exec tsx scripts/check-reference-collector.ts
```

These exercise download/decoder failures, resource cleanup, and unchanged active
manifest/table checksums. Real collection was repeated against unchanged source
data; every table hash and the manifest/timestamp stayed identical.

## Review, commit, failure recovery and rollback

1. Run `pnpm data:collect`. Review old/new counts, sizes, changed table hashes,
   source version and warnings in stdout. Same-version changed content is explicitly
   reported; an older version is rejected.
2. Run `pnpm data:check` and inspect `git diff -- src/data/reference/manifest.json`.
   Compare specific old/new table files with `git diff --no-index` (exit 1 means
   differences). Investigate unexpected count drops or untranslated keys; counts
   are not fixed to historical values.
3. Commit the manifest and its entire referenced directory together:
   `git add src/data/reference && git commit -m "chore(data): refresh reference snapshot"`.
   Do not commit just the manifest or manually edit generated table contents.

The collector validates before promotion, writes a unique staged directory under
`.collect-lock`, moves completed files to their immutable version/hash directory,
and atomically renames the manifest **last**. Previous referenced files are never
overwritten or deleted. Failed download/decode/validation/write exits nonzero
without publishing a partial version. A failure before manifest rename can leave
an unreferenced directory; it is safe to remove after checking the manifest.
A killed process may leave `.collect-lock`; remove it only after confirming no
collector is running. This is a local single-writer update, not a background service.

To discard an uncommitted update, restore `manifest.json` from Git and remove only
the newly generated, now-unreferenced directory. For a committed rollback use
`git revert <snapshot-commit>` or restore a known-good manifest and its referenced
files from the same commit. Run `pnpm data:check` before committing. Older directories
remain available for readers/rollback; remove unreferenced versions in a separate
reviewed cleanup once no reader uses them. Git history is the long-term archive.

Normal builds use committed local files and existing index scripts. This does not
claim that existing external image URLs or Nexon market requests work offline.
Existing auction catalog evidence validation is separate; do not refresh evidence
timestamps merely to make a build pass.

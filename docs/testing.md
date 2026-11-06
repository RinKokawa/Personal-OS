# Regression tests

Use Node 22.12+ or Node 24. Tests run against a temporary directory and the real
SQLite schema, without launching Electron or touching your personal data.

```sh
npm ci --ignore-scripts
npm rebuild better-sqlite3
npm test
npm run lint
npm run build
```

`better-sqlite3` is a native module. The commands above build it for Node so the
service tests can execute. Before launching or packaging the desktop application,
rebuild it for Electron using the existing project hook:

```sh
npm run postinstall
npm run dev
```

The service suite covers historical edits, multiple entries per local day,
missing/deleted IDs, invalid dates, UTC+8 midnight boundaries, daylight-saving
boundaries, failed file writes/replacements, SQLite COMMIT failure, recovery failure,
and pagination/search/statistics above the old 50/100/200-row limits. The component
suite exercises compiled Vue pages with a DOM and mocked IPC/UI controls: load more,
server-side task filters, stale responses, archive selection, save controls, and
aggregate dashboard counts.

## Journal save guarantees and limits

Edits retain the existing date, file path, source and creation time, including legacy
`YYYY-MM-DD.md` files. New entries use `YYYY-MM-DD-<uuid>.md`; no migration of existing
files is required. File writes are staged beside the destination. New-file publication
uses a hard link to avoid overwriting any existing file, including unindexed Markdown.
This requires a filesystem supporting hard links (for example NTFS, APFS or ext4);
unsupported filesystems fail the save instead of falling back to an unsafe overwrite.

Existing content is backed up before replacement. SQLite changes and the activity log
are in one transaction; caught failures roll back metadata and restore/remove the file.
If restoration fails, the original `.bak` file is retained and its path is included in
the save error. Cleanup failures after a committed save are logged without reporting
the save itself as failed.

This does not provide a distributed transaction between SQLite and the filesystem.
An abrupt process termination or power loss between file publication and SQLite commit
can still leave a mismatch; automatic startup recovery is not implemented. Do not
delete leftover `.bak` files without inspecting them. These tests do not replace a
Windows Electron desktop smoke test.

Lists use deterministic ordering with an ID tie-breaker and offset pagination. Local
mutations, task filter changes and submitted journal searches restart pagination;
aggregate counts are independent of the loaded pages. Concurrent external database
changes between page requests do not have snapshot guarantees.

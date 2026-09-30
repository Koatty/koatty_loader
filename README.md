# koatty_loader
Efficient glob library for Koatty.

> **v2.1.0** (koatty 5.0.0 family): scan directories are validated with realpath boundary checks (out-of-bounds paths are rejected instead of falling back to scanning the whole project); module loading integrates with per-app containers (`app.container`) and supports both default and named exports; dual-mode decorator adapter keeps TC39 field-initializer classes working alongside legacy decorators.


## Scan cache (PERF-03)

`Load()` caches its directory scan in `.koatty/scan-cache.json` (relative to the scan
base dir). A cache entry is reused only when nothing under the scanned path changed;
otherwise the directory is scanned again and the cache is rewritten atomically
(temp file + rename). Any read/parse error or unknown schema version silently falls
back to a fresh scan, and an unwritable cache location is ignored.

Disable it with the `scanCache: false` option or `KOATTY_DISABLE_SCAN_CACHE=1`.

## Scan boundary (SEC-16)

Scan roots are resolved against `baseDir` and clamped to it: absolute paths outside
the project and `../` traversal are never scanned. `toSafePath(baseDir, target)`
reports a path relative to `baseDir` (or just the basename) so absolute host paths
outside the project are never logged.

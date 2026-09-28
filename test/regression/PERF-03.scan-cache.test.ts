/*
 * PERF-03 (plan D-7): scan-result cache.
 * SEC-16: the scan must never leave `baseDir`.
 *
 * `globby` is replaced by a counting wrapper around the real implementation, so a
 * cache hit is asserted by "the real glob did not run again" rather than by a
 * timing/behaviour proxy.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

const realGlobby = jest.requireActual<any>('globby');
const actualSync: any = (realGlobby.default ?? realGlobby).sync;
let realScanCount = 0;

declare const global: any;

jest.mock('globby', () => ({
    __esModule: true,
    default: { sync: (...args: any[]) => global.__globbySync(...args) },
}));

import { Load, buildLoadDir, toSafePath } from '../../src/index';

let base: string;
let cacheFile: string;

function writeModule(file: string, marker: string) {
    fs.writeFileSync(
        path.join(base, file),
        `module.exports = { marker: ${JSON.stringify(marker)} };`,
        'utf8'
    );
}

function load(options: any = {}) {
    return Load(['.'], base, undefined, ['**/*.js'], ['**/node_modules/**'], { cacheFile, ...options });
}

/**
 * Move everything the first load recorded into the future, so the assertion does
 * not depend on filesystem timestamp granularity (ext4 reports whole seconds for
 * directories). This only ever makes files *newer*, so a cache hit is still a
 * real reuse and a miss is still a real invalidation.
 */
function stampFuture(yearsAhead = 0) {
    const stamp = new Date(Date.now() + 2000 + yearsAhead);
    for (const name of fs.readdirSync(base)) {
        if (!name.endsWith('.js')) continue;
        fs.utimesSync(path.join(base, name), stamp, stamp);
    }
    fs.utimesSync(base, stamp, stamp);
}

/** how many times the real globby ran (cache hits never reach it) */
function realScans(): number {
    return realScanCount;
}

function cachedEntries(): Record<string, any> {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8')).entries;
}

beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), 'koatty-loader-'));
    cacheFile = path.join(base, '.koatty', 'scan-cache.json');
    realScanCount = 0;
    global.__globbySync = (pattern: any, opts: any) => {
        realScanCount++;
        return actualSync(pattern, opts);
    };
    writeModule('a.js', 'a');
    writeModule('b.js', 'b');
});

afterEach(() => {
    delete process.env.KOATTY_DISABLE_SCAN_CACHE;
    fs.rmSync(base, { recursive: true, force: true });
});

describe('PERF-03: scan cache', () => {
    test('an unchanged tree reuses the cache and skips the real glob', () => {
        const first = load();
        expect(first.map((r) => r.name).sort()).toEqual(['a', 'b']);
        expect(realScans()).toBe(1);
        expect(fs.existsSync(cacheFile)).toBe(true);

        const before = JSON.stringify(cachedEntries());
        const second = load();
        expect(second.map((r) => r.name).sort()).toEqual(['a', 'b']);
        expect(realScans()).toBe(1); // served from the cache
        expect(second[0].target).toBeDefined();
        // the cached entry was reused verbatim (no re-glob, no re-fingerprint)
        expect(JSON.stringify(cachedEntries())).toBe(before);
    });

    test('the cache stores an entry for the scanned root and pattern set', () => {
        load();
        const keys = Object.keys(cachedEntries());
        expect(keys).toHaveLength(1);
        expect(keys[0]).toContain(base);
        expect(keys[0]).toContain('**/*.js');
        expect(cachedEntries()[keys[0]].files.sort()).toEqual(['a.js', 'b.js']);
    });

    test('a new file invalidates the cache and shows up in the result', () => {
        load();
        expect(realScans()).toBe(1);

        stampFuture();
        writeModule('c.js', 'c');

        const res = load();
        expect(realScans()).toBe(2);
        expect(res.map((r) => r.name).sort()).toEqual(['a', 'b', 'c']);
    });

    test('an edited file invalidates the cache', () => {
        load();
        const stamp = new Date(Date.now() + 2000);
        fs.utimesSync(path.join(base, 'a.js'), stamp, stamp);

        load();
        expect(realScans()).toBe(2);
    });

    test('a deleted file invalidates the cache', () => {
        load();
        fs.unlinkSync(path.join(base, 'b.js'));
        stampFuture();

        const res = load();
        expect(realScans()).toBe(2);
        expect(res.map((r) => r.name).sort()).toEqual(['a']);
    });

    test('a new subdirectory invalidates the cache', () => {
        load();
        stampFuture();
        fs.mkdirSync(path.join(base, 'nested'));
        writeModule(path.join('nested', 'd.js'), 'd');

        const res = load();
        expect(realScans()).toBe(2);
        expect(res.map((r) => r.name).sort()).toEqual(['a', 'b', 'd']);
    });

    test('a corrupt cache is tolerated and rewritten', () => {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
        fs.writeFileSync(cacheFile, '{ not json', 'utf8');

        const res = load();
        expect(res.map((r) => r.name).sort()).toEqual(['a', 'b']);
        // rewritten as valid JSON and reused by the next load
        expect(() => JSON.parse(fs.readFileSync(cacheFile, 'utf8'))).not.toThrow();
        expect(realScans()).toBe(1);
        expect(load().length).toBe(2);
        expect(realScans()).toBe(1);
    });

    test('a foreign cache schema is ignored', () => {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify({ version: 999, entries: { x: {} } }), 'utf8');

        expect(load().length).toBe(2);
        expect(realScans()).toBe(1);
        expect(Object.keys(cachedEntries())).toHaveLength(1);
    });

    test('scanCache:false and KOATTY_DISABLE_SCAN_CACHE=1 always rescan', () => {
        load();
        expect(realScans()).toBe(1);

        load({ scanCache: false });
        expect(realScans()).toBe(2);

        process.env.KOATTY_DISABLE_SCAN_CACHE = '1';
        load();
        expect(realScans()).toBe(3);
    });

    test('an unwritable cache location does not break loading', () => {
        const res = load({ cacheFile: path.join(base, 'a.js', 'nested', 'scan-cache.json') });
        expect(res.map((r) => r.name).sort()).toEqual(['a', 'b']);
    });
});

describe('SEC-16: scans stay inside baseDir', () => {
    test('relative traversal is rejected', () => {
        expect(() => buildLoadDir(base, '../outside')).toThrow(/escapes/);
        expect(() => buildLoadDir(base, '../../etc')).toThrow(/escapes/);
    });

    test('absolute paths outside baseDir are rejected, absolute paths inside are kept', () => {
        expect(() => buildLoadDir(base, path.join(base, '..', 'elsewhere'))).toThrow(/escapes/);
        fs.mkdirSync(path.join(base, 'sub'));
        expect(buildLoadDir(base, path.join(base, 'sub'))).toBe(fs.realpathSync(path.join(base, 'sub')));
    });

    test('a traversal Load() result stays inside baseDir', () => {
        expect(() => Load(['../..'], base, undefined, ['**/*.js'], [], { cacheFile })).toThrow(/escapes/);
    });

    test('toSafePath never exposes an absolute path outside baseDir', () => {
        expect(toSafePath(base, path.join(base, 'a.js'))).toBe('a.js');
        expect(toSafePath(base, path.join(base, '..', 'secret.js'))).toBe('secret.js');
        expect(toSafePath(base, path.join(base, '..'))).toBe(path.basename(path.resolve(base, '..')));
    });
});

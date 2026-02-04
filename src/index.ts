/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-12-01 14:27:47
 * @LastEditTime: 2023-01-10 16:56:58
 */
import globby from "globby";
import path from "path";

/** Default glob patterns: JS/TS files, excluding declaration files */
const DEFAULT_PATTERN = ["**/**.js", "**/**.ts", "!**/**.d.ts"] as const;

/** Default ignore patterns for safety and performance */
const DEFAULT_IGNORE = [
    "**/node_modules/**",
    "**/logs/**",
    "**/static/**",
] as const;

/** Result item for each loaded file. */
export interface ResInterface {
    name: string;
    path: string;
    target: any;
}

/** Callback invoked for each loaded file: (fileName, filePath, exportedTarget) */
export type callbackFunc = (fileName: string, xpath: string, target: any) => void;

/**
 * Load modules from directories by glob pattern.
 *
 * @param loadDir - Directories to load (relative to baseDir or absolute)
 * @param baseDir - Base directory; defaults to process.cwd()
 * @param fn - Optional callback per file
 * @param pattern - Glob patterns; defaults to JS/TS excluding .d.ts
 * @param ignore - Glob ignore patterns; defaults to node_modules, logs, static
 * @returns Array of `\{ name, path, target \}` for each loaded file
 */
export function Load(
    loadDir: string[],
    baseDir?: string,
    fn?: callbackFunc,
    pattern: string[] = [...DEFAULT_PATTERN],
    ignore: string[] = [...DEFAULT_IGNORE]
): ResInterface[] {
    const base = path.resolve(baseDir ?? process.cwd());
    const loadDirs = Array.isArray(loadDir) ? loadDir : [loadDir];
    const res: ResInterface[] = [];

    for (let dir of loadDirs) {
        dir = buildLoadDir(base, dir);
        const fileResults = globby.sync(pattern, {
            cwd: dir,
            ignore,
        });

        for (const name of fileResults) {
            const file = path.join(dir, name);
            const baseName = path.basename(name);
            const lastDot = baseName.lastIndexOf(".");
            const fileName = lastDot > -1 ? baseName.slice(0, lastDot) : baseName;

            const target = requireDefault(file);
            if (fn) {
                fn(fileName, file, target);
            }
            res.push({ name: fileName, path: file, target });
        }
    }
    return res;
}

/**
 * Resolve load directory against base (normalized for security).
 */
function buildLoadDir(baseDir: string, dir: string): string {
    const resolved = path.isAbsolute(dir)
        ? path.normalize(dir)
        : path.join(baseDir, dir);
    return path.resolve(resolved);
}


/**
 * es5/6 require
 *
 * @export
 * @param {string} p
 * @returns
 */
function requireDefault(p: string) {
    /* eslint-disable global-require */
    const ex = require(p);
    return (ex && (typeof ex === "object") && "default" in ex) ? ex.default : ex;
}

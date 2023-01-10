/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-12-01 14:27:47
 * @LastEditTime: 2023-01-10 09:49:55
 */
import { globbySync } from "globby";
import path from "path";

/**
 *
 *
 * @interface ResInterface
 */
interface ResInterface {
    name: string;
    path: string;
    target: any;
}
// callbackFunc function
type callbackFunc = (fileName: string, xpath: string, target: any) => void;

/**
 * Load
 *
 * @export
 * @param {string[]} loadDir
 * @param {string} [baseDir]
 * @param {callbackFunc} [fn]
 * @param {string[]} pattern
 * @param {string[]} ignore
 */
export function Load(loadDir: string[],
    baseDir?: string,
    fn?: callbackFunc,
    pattern: string[] = ['**/**.js', '**/**.ts', '!**/**.d.ts'],
    ignore: string[] = [
        '**/node_modules/**',
        '**/logs/**',
        '**/static/**'
    ]): ResInterface[] {

    baseDir = baseDir || process.cwd();
    const loadDirs = [].concat(loadDir ?? []);
    const res: ResInterface[] = [];

    for (let dir of loadDirs) {
        dir = buildLoadDir(baseDir, dir);
        const fileResults = globbySync(pattern, {
            cwd: dir,
            ignore: ignore,
        });
        for (let name of fileResults) {
            const file = path.join(dir, name);

            if (name.indexOf('/') > -1) {
                name = name.slice(name.lastIndexOf('/') + 1);
            }
            const fileName = name.slice(0, name.lastIndexOf("."));
            // const fileName = name.slice(0, -3);

            // require
            const target = requireDefault(file);

            // callback
            if (fn) {
                fn(fileName, file, target);
            }
            res.push({
                name: fileName,
                path: file,
                target: target,
            });
        }
    }
    return res;
}

/**
 * 
 * @param baseDir 
 * @param dir 
 */
function buildLoadDir(baseDir: string, dir: string) {
    if (!path.isAbsolute(dir)) {
        return path.join(baseDir, dir);
    }
    return dir;
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

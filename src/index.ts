/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-12-01 14:27:47
 * @LastEditTime: 2023-01-10 16:56:58
 */

import globby from "globby";
import path from "path";

/**
 * 加载结果接口
 * @interface ResInterface
 */
interface ResInterface {
    /** 模块名称（不含扩展名） */
    name: string;
    /** 模块完整路径 */
    path: string;
    /** 模块导出内容 */
    target: unknown;
}

/**
 * 回调函数类型定义
 * @param fileName 文件名（不含扩展名）
 * @param xpath 文件完整路径
 * @param target 模块导出内容
 */
type callbackFunc = (fileName: string, xpath: string, target: unknown) => void;

/**
 * 动态加载指定目录下的模块文件
 * 
 * @export
 * @param {string[]} loadDir - 要扫描的目录数组，支持相对路径和绝对路径
 * @param {string} [baseDir] - 基础目录，默认为当前工作目录
 * @param {callbackFunc} [fn] - 可选的回调函数，每加载一个模块时调用
 * @param {string[]} [pattern] - 文件匹配模式，默认为js和ts文件
 * @param {string[]} [ignore] - 忽略的目录模式
 * @returns {ResInterface[]} 加载的模块信息数组
 * @throws {Error} 当参数验证失败或目录不存在时抛出错误
 * 
 * @example
 * ```typescript
 * // 加载controllers目录下的所有模块
 * const modules = Load(['./controllers'], __dirname);
 * 
 * // 使用回调函数处理每个模块
 * Load(['./services'], __dirname, (fileName, filePath, target) => {
 *   console.log(`Loaded ${fileName} from ${filePath}`);
 * });
 * ```
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

    // 参数验证
    if (!loadDir || !Array.isArray(loadDir) || loadDir.length === 0) {
        throw new Error('loadDir must be a non-empty array');
    }
    
    if (!Array.isArray(pattern) || pattern.length === 0) {
        throw new Error('pattern must be a non-empty array');
    }
    
    if (!Array.isArray(ignore)) {
        throw new Error('ignore must be an array');
    }

    baseDir = baseDir || process.cwd();
    
    // 验证baseDir是否存在
    try {
        const fs = require('fs');
        if (!fs.existsSync(baseDir)) {
            throw new Error(`Base directory does not exist: ${baseDir}`);
        }
    } catch (error) {
        throw new Error(`Invalid base directory: ${baseDir}`);
    }

    const loadDirs = [...(loadDir ?? [])];
    const res: ResInterface[] = [];

    for (let dir of loadDirs) {
        try {
            dir = buildLoadDir(baseDir, dir);
            const fileResults = globby.sync(pattern, {
                cwd: dir,
                ignore: ignore,
            });
            
            for (const name of fileResults) {
                try {
                    const file = path.join(dir, name);

                    // 使用path模块优化文件名提取
                    const fileName = path.basename(name, path.extname(name));

                    // require
                    const target = requireDefaultSafe(file);

                    // callback
                    if (fn) {
                        fn(fileName, file, target);
                    }
                    res.push({
                        name: fileName,
                        path: file,
                        target: target,
                    });
                } catch (moduleError) {
                    console.warn(`Failed to load module ${name}: ${moduleError.message}`);
                    // 继续加载其他模块，不因单个模块失败而中断整个过程
                }
            }
        } catch (dirError) {
            console.warn(`Failed to scan directory ${dir}: ${dirError.message}`);
            // 继续处理其他目录
        }
    }
    return res;
}

/**
 * 构建加载目录路径，并进行安全验证
 * @param baseDir 基础目录
 * @param dir 目标目录
 */
function buildLoadDir(baseDir: string, dir: string): string {
    // 规范化路径，移除 .. 等危险路径
    const normalizedDir = path.normalize(dir);
    
    // 检查是否包含路径遍历字符
    if (normalizedDir.includes('..') || normalizedDir.includes('~')) {
        throw new Error(`Invalid directory path: ${dir}. Path traversal is not allowed.`);
    }
    
    let fullPath: string;
    if (path.isAbsolute(normalizedDir)) {
        fullPath = normalizedDir;
    } else {
        fullPath = path.resolve(baseDir, normalizedDir);
    }
    
    // 确保最终路径在baseDir范围内（对于相对路径）
    if (!path.isAbsolute(dir) && !fullPath.startsWith(path.resolve(baseDir))) {
        throw new Error(`Directory ${dir} is outside of base directory ${baseDir}`);
    }
    
    return fullPath;
}

/**
 * 验证文件是否安全可加载
 * @param filePath 文件路径
 */
function validateFileForLoading(filePath: string): void {
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.js', '.ts'];
    
    if (!allowedExtensions.includes(ext)) {
        throw new Error(`File type not allowed: ${ext}. Only .js and .ts files are permitted.`);
    }
    
    // 检查文件名是否包含危险字符
    const fileName = path.basename(filePath);
    if (fileName.includes('..') || fileName.includes('~') || fileName.startsWith('.')) {
        throw new Error(`Invalid file name: ${fileName}`);
    }
}

/**
 * 安全的模块加载函数
 * @param filePath 文件路径
 */
function requireDefaultSafe(filePath: string): any {
    // 验证文件安全性
    validateFileForLoading(filePath);
    
    try {
        /* eslint-disable global-require */
        const ex = require(filePath);
        return (ex && (typeof ex === "object") && "default" in ex) ? ex.default : ex;
    } catch (error) {
        throw new Error(`Failed to load module ${filePath}: ${error.message}`);
    }
}

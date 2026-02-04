/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2021-12-17 10:20:44
 * @LastEditTime: 2021-12-18 11:58:46
 */
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";

const plugins = [
    json(),
    typescript({
        tsconfigOverride: {
            compilerOptions: {
                declaration: false,
                declarationMap: false,
                module: "ESNext",
                skipLibCheck: true,
            },
        },
        useTsconfigDeclarationDir: false,
        check: false,
    }),
];

export default [
    {
        input: "./src/index.ts",
        output: [{
            format: "cjs",
            file: "./dist/index.js",
            banner: require("./scripts/copyright"),
        }],
        plugins,
    },
    {
        input: "./src/index.ts",
        output: [{
            format: "es",
            file: "./dist/index.mjs",
            banner: require("./scripts/copyright"),
        }],
        plugins,
    },
];
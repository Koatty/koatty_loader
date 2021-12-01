/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-12-01 16:02:03
 * @LastEditTime: 2021-12-01 16:18:24
 */
import { Load } from "../src/index";

describe("Load", () => {
    test("LoadDir", async function () {
        const res = await Load(["./test"], "", function (params: string) {
            expect(['Test', 'Test2', 'Test3']).toContain(params);
        }, undefined, ['**/**.test.ts']);
        expect(res.length > 0).toEqual(true);
        expect(res.length).toEqual(3);
        console.log(res);
    });
});
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createHash } from 'crypto';
import { Load } from '../../src';

let root: string;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(),'koatty-manifest-'));fs.mkdirSync(path.join(root,'dist')); });
afterEach(() => fs.rmSync(root,{recursive:true,force:true}));
const file = (name: string, value = 'module.exports = class Example {};') => {
  const dest = path.join(root,'dist',name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,value);
  return {file:name,sha256:createHash('sha256').update(value).digest('hex')};
};
const manifest = (files: any[]) => { fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({runtime:{version:1,root:'dist',files}}));return {manifestFile:'manifest.json'}; };

test('loads the built inventory without glob traversal or scan-cache writes', () => {
  const options = manifest([file('service/Example.js'),file('ignored.js')]);
  const result = Load(['dist'],root,undefined,['**/*.js'],['ignored.js'],options);
  expect(result.map(x=>x.name)).toEqual(['Example']);
  expect(fs.existsSync(path.join(root,'.koatty'))).toBe(false);
});
test('validates all digests before executing any module', () => {
  const entries = [file('first.js', 'throw new Error("EXECUTED");'),file('second.js')];
  const options = manifest(entries);fs.writeFileSync(path.join(root,'dist/second.js'),'module.exports = 2;');
  expect(()=>Load(['dist'],root,undefined,undefined,undefined,options)).toThrow('Runtime manifest file changed');
});
test('rejects missing files, malformed schema, duplicate files and escaping links', () => {
  const entry = file('inside.js');
  expect(()=>Load(['dist'],root,undefined,undefined,undefined,manifest([entry,entry]))).toThrow('Duplicate');
  const outside = path.join(root,'outside.js');fs.writeFileSync(outside,'module.exports = 1;');
  fs.symlinkSync(outside,path.join(root,'dist/link.js'));
  expect(()=>Load(['dist'],root,undefined,undefined,undefined,manifest([{...entry,file:'link.js'}]))).toThrow('escapes');
  expect(()=>Load(['dist'],root,undefined,undefined,undefined,manifest([{...entry,file:'missing.js'}]))).toThrow();
  fs.writeFileSync(path.join(root,'manifest.json'),'{"runtime":{"version":99}}');
  expect(()=>Load(['dist'],root,undefined,undefined,undefined,{manifestFile:'manifest.json'})).toThrow('schema');
});
test('inventory is authoritative; source-only AI manifests retain ordinary scanning', () => {
  const options = manifest([file('included.js')]);file('unlisted.js');
  expect(Load(['dist'],root,undefined,undefined,undefined,options)).toHaveLength(1);
  fs.writeFileSync(path.join(root,'manifest.json'),'{"components":[]}');
  expect(Load(['dist'],root,undefined,undefined,undefined,options)).toHaveLength(2);
});

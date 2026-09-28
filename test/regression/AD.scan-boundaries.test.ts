import fs from 'fs';
import os from 'os';
import path from 'path';
import { Load } from '../../src';
let root: string;
beforeEach(()=> { root=fs.mkdtempSync(path.join(os.tmpdir(),'koatty-ad-')); });
afterEach(()=>fs.rmSync(root,{recursive:true,force:true}));
test('symlink directories and files cannot load outside base',()=>{
  const base=path.join(root,'app');fs.mkdirSync(base);fs.writeFileSync(path.join(root,'outside.js'),'module.exports = 1');
  fs.symlinkSync(root,path.join(base,'linked'),'dir');
  expect(()=>Load(['linked'],base)).toThrow(/escapes/);
  fs.unlinkSync(path.join(base,'linked')); fs.symlinkSync(path.join(root,'outside.js'),path.join(base,'inside.js'));
  expect(()=>Load(['.'],base)).toThrow(/escapes/);
});
test('new modules with old timestamps invalidate cached membership',()=>{
  fs.writeFileSync(path.join(root,'one.js'),'module.exports = 1');
  expect(Load(['.'],root,undefined,['*.js'])).toHaveLength(1);
  fs.writeFileSync(path.join(root,'two.js'),'module.exports = 2'); fs.utimesSync(path.join(root,'two.js'),new Date(0),new Date(0));
  expect(Load(['.'],root,undefined,['*.js'])).toHaveLength(2);
});

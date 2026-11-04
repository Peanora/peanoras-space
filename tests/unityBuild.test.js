import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { newUnityNote, newUnitySection } from '../src/content/unityNotes.js';

test('real production build emits published note HTML and excludes draft bodies and editor', async()=>{
  const root=await mkdtemp(join(tmpdir(),'peanora-unity-build-'));
  const source=fileURLToPath(new URL('../',import.meta.url));
  try {
    for(const name of ['src','server','index.html','vite.config.js','package.json']) await cp(join(source,name),join(root,name),{recursive:true});
    await symlink(join(source,'node_modules'),join(root,'node_modules'),process.platform==='win32'?'junction':'dir');
    const content=JSON.parse(await readFile(join(root,'src/data/content.json'),'utf8'));
    const notebook=content.pages.world.blocks.find(b=>b.type==='unityNotes');
    notebook.data.items=[{...newUnityNote(),id:'build-check',title:'构建验收文章',summary:'静态描述检查',draft:false,sections:[{...newUnitySection(),id:'intro',heading:'章节',body:'<p>构建验收正文</p>'}]},{...newUnityNote(),id:'draft-check',title:'DRAFT_SECRET_47',sections:[{...newUnitySection(),id:'draft-body',body:'PRIVATE_DRAFT_BODY_47'}]}];
    await writeFile(join(root,'src/data/content.json'),JSON.stringify(content));
    await build({root,logLevel:'silent'});
    const html=await readFile(join(root,'dist/unity-notes/build-check/index.html'),'utf8');
    assert.ok(html.includes('构建验收文章'));assert.ok(html.includes('静态描述检查'));
    assert.ok(html.includes('https://peanora.cn/unity-notes/build-check/'));
    assert.ok((await readdir(join(root,'dist/unity-notes'))).includes('index.html'));
    assert.ok(!(await readdir(join(root,'dist/unity-notes'))).includes('draft-check'));
    const js=await Promise.all((await readdir(join(root,'dist/assets'))).filter(f=>f.endsWith('.js')).map(f=>readFile(join(root,'dist/assets',f),'utf8')));
    assert.ok(js.some(s=>s.includes('构建验收正文')));
    assert.ok(!js.some(s=>s.includes('PRIVATE_DRAFT_BODY_47')||s.includes('DRAFT_SECRET_47')||s.includes('本地内容工作台')));
  } finally {
    if(dirname(resolve(root))!==resolve(tmpdir())||!basename(root).startsWith('peanora-unity-build-')) throw new Error('Unexpected test workspace');
    await rm(root,{recursive:true,force:true});
  }
});

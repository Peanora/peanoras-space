import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { newUnityNote, newUnitySection } from '../src/content/unityNotes.js';
import { sectionPages } from '../src/data/site.js';

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
    // Local listening material must stay outside the publicly distributed site.
    await mkdir(join(root, '.local-audio'));
    await writeFile(join(root, '.local-audio/catalog.json'), JSON.stringify({ tracks: { private: { src: '/.local-audio/PRIVATE_AUDIO_73.mp3' } } }));
    await writeFile(join(root, '.local-audio/PRIVATE_AUDIO_73.mp3'), 'PRIVATE_AUDIO_BYTES_73');
    // Approved public assets are copied; the private preview directory is not.
    await mkdir(join(root, 'public/audio/hanser'), { recursive: true });
    await writeFile(join(root, 'public/audio/hanser/netease-1982796624.flac'), 'APPROVED_AUDIO_FIXTURE_91');
    await build({root,logLevel:'silent'});
    assert.ok(!(await readdir(join(root, 'dist'))).includes('.local-audio'));
    assert.equal(await readFile(join(root, 'dist/audio/hanser/netease-1982796624.flac'), 'utf8'), 'APPROVED_AUDIO_FIXTURE_91');
    const html=await readFile(join(root,'dist/unity-notes/build-check/index.html'),'utf8');
    assert.ok(html.includes('构建验收文章'));assert.ok(html.includes('静态描述检查'));
    assert.ok(html.includes('https://peanora.cn/unity-notes/build-check/'));
    assert.ok((await readdir(join(root,'dist/unity-notes'))).includes('index.html'));
    assert.ok(!(await readdir(join(root,'dist/unity-notes'))).includes('draft-check'));
    for (const page of sectionPages) {
      const entry = await readFile(join(root, 'dist', page.path.slice(1), 'index.html'), 'utf8');
      assert.ok(entry.includes(`href="https://peanora.cn${page.path}/"`), `Missing canonical static entry for ${page.path}`);
      assert.ok(entry.includes(`${page.title} — Peanora&#39;s Space`));
    }
    const js=await Promise.all((await readdir(join(root,'dist/assets'))).filter(f=>f.endsWith('.js')).map(f=>readFile(join(root,'dist/assets',f),'utf8')));
    assert.ok(js.some(s=>s.includes('构建验收正文')));
    assert.ok(!js.some(s=>s.includes('PRIVATE_DRAFT_BODY_47')||s.includes('DRAFT_SECRET_47')||s.includes('本地内容工作台')));
    assert.ok(!js.some(s=>s.includes('/.local-audio/catalog.json') || s.includes('PRIVATE_AUDIO_73') || s.includes('PRIVATE_AUDIO_BYTES_73')));
    assert.ok(js.some(s=>s.includes('/audio/hanser/netease-1982796624.flac')), 'Public native catalog must reach production');
  } finally {
    if(dirname(resolve(root))!==resolve(tmpdir())||!basename(root).startsWith('peanora-unity-build-')) throw new Error('Unexpected test workspace');
    await rm(root,{recursive:true,force:true});
  }
});

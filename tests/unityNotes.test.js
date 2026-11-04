import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newUnityNote, newUnitySection, unityEntries, publishedDocument } from '../src/content/unityNotes.js';
import { createBlock, validateContent, clone, restoreContent } from '../src/content/model.js';
import { staticContentPaths } from '../src/data/metadata.js';
const original = JSON.parse(await readFile(new URL('../src/data/content.json',import.meta.url),'utf8'));
function fixture() {
  const document=clone(original);
  const block=createBlock('unityNotes','test-notebook');
  block.data.items=[{...newUnityNote(),id:'published',title:'测试文章',draft:false,sections:[{...newUnitySection(),id:'section-1',code:'if (a < b) { return "<script>"; }'}]}, {...newUnityNote(),id:'private-draft',title:'私有草稿'}];
  document.pages.world.blocks=[block];return document;
}
test('published articles have static entries while drafts are stripped without mutating the editor document',()=>{
  const document=fixture();validateContent(document);
  assert.equal(unityEntries(document).length,1);assert.equal(unityEntries(document,true).length,2);
  assert.ok(staticContentPaths(document).includes('/unity-notes/published'));
  assert.ok(!staticContentPaths(document).includes('/unity-notes/private-draft'));
  const published=publishedDocument(document);
  assert.ok(!JSON.stringify(published).includes('私有草稿'));assert.equal(document.pages.world.blocks[0].data.items.length,2);
  assert.equal(published.pages.world.blocks[0].data.items[0].sections[0].code,'if (a < b) { return "<script>"; }');
});
test('note validation rejects duplicate URLs, section anchors, unsafe images and invalid dates',()=>{
  for(const alter of [d=>d.pages.world.blocks.push({...clone(d.pages.world.blocks[0]),id:'second'}),d=>d.pages.world.blocks[0].data.items[0].sections.push(clone(d.pages.world.blocks[0].data.items[0].sections[0])),d=>d.pages.world.blocks[0].data.items[0].sections[0].image='javascript:alert(1)',d=>d.pages.world.blocks[0].data.items[0].date='yesterday']) {
    const document=fixture();alter(document);assert.throws(()=>validateContent(document));
  }
});
test('legacy World imports and other page content still restore with notebook support',()=>{
  const document=fixture();const other=clone(document.pages.music);
  assert.deepEqual(restoreContent({version:1,pages:{world:document.pages.world}},original).pages.music,other);
});

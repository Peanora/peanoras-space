import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newUnityNote, newUnitySection, unityEntries, publishedDocument, noteOutline } from '../src/content/unityNotes.js';
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
test('outline nests headings, retains anchors, skips untitled continuations and handles skipped levels',()=>{
  const tree=noteOutline([{id:'a',heading:'主标题'},{id:'body',heading:''},{id:'b',heading:'子标题',headingLevel:3},{id:'c',heading:'深层标题',headingLevel:5},{id:'d',heading:'第二个子标题',headingLevel:3},{id:'e',heading:'下一主标题',headingLevel:2}]);
  assert.deepEqual(tree.map(n=>n.id),['a','e']);
  assert.deepEqual(tree[0].children.map(n=>n.id),['b','d']);
  assert.equal(tree[0].children[0].children[0].id,'c');
  assert.equal(tree[0].level,2);
});
test('legacy sections remain valid; only numeric H2-H6 levels are accepted',()=>{
  const document=fixture();const section=document.pages.world.blocks[0].data.items[0].sections[0];
  delete section.headingLevel;validateContent(document);
  for(const level of [1,7,'3',null]) { section.headingLevel=level;assert.throws(()=>validateContent(document)); }
  for(const level of [2,3,4,5,6]) {section.headingLevel=level;validateContent(document);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { headerMenuFor, sectionPages } from '../src/data/site.js';
import { metadataFor, staticContentPaths } from '../src/data/metadata.js';

test('all requested header destinations have real static entries and share metadata', async () => {
  const content = JSON.parse(await readFile(new URL('../src/data/content.json', import.meta.url), 'utf8'));
  const paths = new Set(staticContentPaths(content));
  for (const menu of headerMenuFor()) {
    for (const item of menu.children || [menu]) {
      if (item.url) continue;
      const path = item.path.split('#')[0] || '/';
      assert.ok(paths.has(path), `Missing static entry for ${item.label}: ${path}`);
      assert.equal(metadataFor(path).robots, 'index,follow');
    }
  }
  assert.equal(new Set(sectionPages.map(page => page.path)).size, sectionPages.length);
});

test('header keeps requested menu groups, homepage paper shortcut, and music access', () => {
  const menus = headerMenuFor();
  assert.deepEqual(menus.map(menu => menu.label), ['主页', '文章', '社交', '我的', '关于', '链接']);
  const menu = label => menus.find(item => item.label === label).children;
  assert.deepEqual(menu('文章').map(item => item.label), ['归档', '分类', '标签', '系列']);
  assert.deepEqual(menu('社交').map(item => item.label), ['友链', '留言']);
  assert.deepEqual(menu('我的').map(item => item.label), ['动态', '项目', '相册', '书签导航', '哔哩哔哩', '我的小角落', 'Music&Memories']);
  assert.equal(menu('我的').find(item => item.label === '我的小角落').path, '/#little');
  assert.equal(menu('我的').find(item => item.label === 'Music&Memories').path, '/music');
  assert.deepEqual(menu('关于'), [{ label: '本站源码', url: 'https://github.com/Peanora/peanoras-space' }]);
  assert.deepEqual(menu('链接'), [{ label: 'GitHub', url: 'https://github.com/Peanora' }]);
});

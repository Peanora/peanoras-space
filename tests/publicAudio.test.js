import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import catalog from '../src/data/audio.json' with { type: 'json' };

test('public audio includes exactly the approved fourteen published songs with matching bytes', async () => {
  const content = JSON.parse(await readFile(new URL('../src/data/content.json', import.meta.url), 'utf8'));
  const songs = content.pages.music.blocks.filter(block => block.type === 'songs' && !block.hidden)
    .flatMap(block => block.data.items.filter(song => !song.isPlaceholder));
  assert.equal(songs.length, 14);
  assert.deepEqual(Object.keys(catalog.tracks).sort(), songs.map(song => song.id).sort());
  const files = [];
  for (const [id, track] of Object.entries(catalog.tracks)) {
    assert.match(track.src, new RegExp(`^/audio/hanser/${id}\\.(flac|mp3)$`));
    const file = await readFile(new URL(`../public${track.src}`, import.meta.url));
    assert.equal(file.length, track.bytes, `Wrong byte count: ${id}`);
    assert.equal(createHash('sha256').update(file).digest('hex'), track.sha256, `Audio changed: ${id}`);
    files.push(track.src.split('/').at(-1));
  }
  assert.deepEqual((await readdir(new URL('../public/audio/hanser/', import.meta.url))).sort(), files.sort(), 'No unapproved extra files');
});

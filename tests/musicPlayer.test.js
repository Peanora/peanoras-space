import test from "node:test";
import assert from "node:assert/strict";
import { musicPlatformName, officialEmbedUrl, useMusicPlayer } from "../src/composables/useMusicPlayer.js";

test("official embedding is click-only, shared across pages and explicitly stoppable", () => {
  const song = { id: "netease-1982799628", neteaseId: "1982799628", title: "它像一颗" };
  const first = useMusicPlayer();
  const second = useMusicPlayer();
  first.stop();
  assert.equal(first.embedUrl.value, null, "no third-party frame before loading");
  first.expanded.value = true;
  assert.equal(first.embedUrl.value, null, "opening the panel alone does not load it");
  assert.equal(first.loadSong(song), true);
  assert.equal(second.embedUrl.value, "https://music.163.com/outchain/player?type=2&id=1982799628&auto=0&height=66");
  second.expanded.value = false;
  assert.equal(first.activeSong.value, song, "minimizing preserves the loaded player");
  const revision = first.revision.value;
  second.loadSong({ ...song });
  assert.equal(first.activeSong.value, song, "opening the same track preserves the iframe");
  assert.equal(first.revision.value, revision);
  first.retry();
  assert.equal(first.revision.value, revision + 1);
  assert.equal(first.loadSong({ neteaseId: "not-an-id" }), false);
  assert.equal(first.activeSong.value, song);
  second.stop();
  assert.equal(first.embedUrl.value, null, "stop removes the embedded audio document");
  assert.equal(officialEmbedUrl(null), null);
  assert.equal(officialEmbedUrl({ neteaseId: "1982799628&auto=1" }), null);
  first.expanded.value = false;
});

test('switching between QQ and NetEase replaces the frame, while reopening a track preserves it', () => {
  const player = useMusicPlayer();
  const qq = { id: 'qq-track', title: '二次元凶', qqSongId: '610333693', neteaseId: '' };
  // Identical numeric IDs from different providers must not reuse the old iframe.
  const netease = { id: 'other-provider', neteaseId: '610333693' };
  player.stop();
  assert.equal(player.loadSong(qq), true);
  assert.equal(player.embedUrl.value, 'https://i.y.qq.com/n2/m/outchain/player/index.html?songid=610333693&songtype=0');
  assert.equal(musicPlatformName(player.activeSong.value), 'QQ 音乐');
  player.loadSong({ ...qq });
  assert.equal(player.activeSong.value, qq);
  player.loadSong(netease);
  assert.equal(player.activeSong.value, netease);
  assert.equal(musicPlatformName(player.activeSong.value), '网易云音乐');
  assert.match(player.embedUrl.value, /^https:\/\/music\.163\.com\//);
  player.loadSong(qq);
  for (const invalid of ['610333693&autoplay=1', 'javascript:alert(1)', '-1']) {
    assert.equal(player.loadSong({ qqSongId: invalid }), false);
    assert.equal(player.activeSong.value, qq);
  }
  assert.equal(officialEmbedUrl({ ...qq, neteaseId: '123' }), null);
  player.stop();
  assert.equal(player.embedUrl.value, null);
  player.expanded.value = false;
});

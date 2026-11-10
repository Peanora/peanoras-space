import test from "node:test";
import assert from "node:assert/strict";
import { localAudioUrl, musicPlatformName, officialEmbedUrl, setLocalAudioCatalog, useMusicPlayer } from "../src/composables/useMusicPlayer.js";

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

test('choosing a song waits for explicit loading, switches an existing player and remembers the choice after stopping', () => {
  const player = useMusicPlayer();
  const first = { id: 'netease-1982799628', title: '它像一颗', neteaseId: '1982799628' };
  const second = { id: 'culprit2-01', title: '二次元凶', neteaseId: '', qqSongId: '610333693' };
  player.stop();
  player.selectedSong.value = null;
  player.expanded.value = true;
  assert.equal(player.chooseSong(first), true);
  assert.equal(player.selectedSong.value, first);
  assert.equal(player.embedUrl.value, null, 'selecting before loading does not contact a platform');
  player.loadSong(player.selectedSong.value);
  assert.equal(player.activeSong.value, first);
  assert.equal(player.chooseSong(second), true);
  assert.equal(player.activeSong.value, second);
  assert.match(player.embedUrl.value, /songid=610333693/);
  player.stop();
  assert.equal(player.embedUrl.value, null);
  assert.equal(player.selectedSong.value, second, 'stop must not reset the picker to the first track');
  assert.equal(player.chooseSong({ id: 'invalid' }), false);
  assert.equal(player.selectedSong.value, second);
  player.selectedSong.value = null;
  player.expanded.value = false;
});

class TestAudio extends EventTarget {
  attributes = new Map();
  currentTime = 0;
  duration = NaN;
  volume = 1;
  loop = false;
  error = null;
  playCalls = 0;
  loadCalls = 0;
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  load() { this.loadCalls += 1; }
  play() { this.playCalls += 1; return Promise.resolve(); }
  pause() { this.dispatchEvent(new Event('pause')); }
}

test('native playback waits for explicit play and media events, survives shared access, and stops without forgetting the track', () => {
  const player = useMusicPlayer();
  const song = { id: 'local-preview', title: 'Test fixture', neteaseId: '1982799628' };
  const element = new TestAudio();
  player.stop();
  setLocalAudioCatalog({ tracks: { [song.id]: { src: '/.local-audio/test%20fixture.wav' } } });
  player.attachAudio(element);
  assert.equal(element.preload, 'none');
  assert.equal(element.getAttribute('src'), null, 'attaching audio must not load a source');
  player.chooseSong(song);
  assert.equal(element.playCalls, 0, 'initial selection must not start playback');
  player.loadSong(song);
  assert.equal(element.getAttribute('src'), '/.local-audio/test%20fixture.wav');
  assert.equal(player.embedUrl.value, null, 'native source must not load a second official player');
  assert.equal(player.playing.value, false, 'a play request is not playback evidence');
  element.dispatchEvent(new Event('playing'));
  assert.equal(useMusicPlayer().playing.value, true);
  player.expanded.value = false;
  assert.equal(element.getAttribute('src'), '/.local-audio/test%20fixture.wav');
  element.duration = 45;
  element.dispatchEvent(new Event('durationchange'));
  player.seek(15);
  assert.equal(element.currentTime, 15);
  player.seek(999);
  assert.equal(element.currentTime, 45);
  player.setVolume(0.25);
  assert.equal(element.volume, 0.25);
  player.pause();
  assert.equal(player.playing.value, false);
  const calls = element.playCalls;
  element.dispatchEvent(new Event('ended'));
  assert.equal(element.playCalls, calls, 'ended never advances or restarts a track');
  player.stop();
  assert.equal(element.getAttribute('src'), null);
  assert.equal(player.selectedSong.value, song);
  assert.equal(player.currentTime.value, 0);
  player.releaseAudio();
  setLocalAudioCatalog({ tracks: {} });
  player.selectedSong.value = null;
});

test('local preview catalog rejects external URLs and traversal while keeping the official fallback', () => {
  const song = { id: 'test-source', neteaseId: '1982799628' };
  for (const src of ['https://example.com/song.mp3', '/.local-audio/../secret.mp3', '/.local-audio/%2e%2e/secret.mp3', '/.local-audio/%5csecret.mp3', '/.local-audio/file.mp3?x=1']) {
    setLocalAudioCatalog({ tracks: { [song.id]: { src } } });
    assert.equal(localAudioUrl(song), null);
  }
  const player = useMusicPlayer();
  player.loadSong(song);
  assert.match(player.embedUrl.value, /^https:\/\/music\.163\.com\//);
  player.stop();
  setLocalAudioCatalog({ tracks: {} });
  player.selectedSong.value = null;
  player.expanded.value = false;
});

test('mute restores the last audible volume without loading or playing a source', () => {
  const player = useMusicPlayer();
  const element = new TestAudio();
  player.stop();
  player.attachAudio(element);
  player.setVolume(0.35);
  player.toggleMute();
  assert.equal(player.muted.value, true);
  assert.equal(element.volume, 0);
  useMusicPlayer().toggleMute();
  assert.equal(player.muted.value, false, 'mute is shared with the persistent controller');
  assert.equal(element.volume, 0.35, 'unmuting restores the previous audible level');
  player.setVolume(0.8);
  player.setVolume(0);
  player.toggleMute();
  assert.equal(element.volume, 0.8, 'dragging volume to zero also remembers its last audible level');
  assert.equal(element.playCalls, 0);
  assert.equal(element.getAttribute('src'), null);
  player.setVolume(0.7);
  player.releaseAudio();
});

test('single-track repeat requires explicit opt-in and never starts an unloaded track', () => {
  const player = useMusicPlayer();
  const element = new TestAudio();
  const first = { id: 'repeat-first' }, second = { id: 'repeat-second' };
  player.stop();
  setLocalAudioCatalog({ tracks: { 'repeat-first': { src: '/.local-audio/repeat-first.wav' }, 'repeat-second': { src: '/.local-audio/repeat-second.wav' } } });
  player.attachAudio(element);
  assert.equal(player.repeatOne.value, false, 'repeat is off by default');
  assert.equal(element.loop, false);
  player.toggleRepeat();
  assert.equal(player.repeatOne.value, true);
  assert.equal(element.loop, false, 'a repeat preference cannot load or start a track');
  assert.equal(element.playCalls, 0);
  assert.equal(element.getAttribute('src'), null);
  player.loadSong(first);
  assert.equal(element.loop, true, 'native media looping applies only after explicit play');
  player.chooseSong(second);
  assert.equal(player.activeSong.value, second, 'manual next/selection still changes tracks in single repeat mode');
  assert.equal(element.loop, true);
  player.toggleRepeat();
  assert.equal(element.loop, false);
  const calls = element.playCalls;
  element.dispatchEvent(new Event('ended'));
  assert.equal(element.playCalls, calls, 'repeat-off never auto-restarts or advances');
  assert.equal(player.activeSong.value, second);
  player.toggleRepeat();
  player.stop();
  assert.equal(element.loop, false, 'stop releases media looping as well as the source');
  assert.equal(element.getAttribute('src'), null);
  assert.equal(player.selectedSong.value, second);
  player.setRepeatOne(false);
  player.releaseAudio();
  setLocalAudioCatalog({ tracks: {} });
  player.selectedSong.value = null;
  player.expanded.value = false;
});

test('failed native play requests do not claim playback and an old rejection cannot override a newly selected track', async () => {
  const player = useMusicPlayer();
  const element = new TestAudio();
  const first = { id: 'first-local' }, second = { id: 'second-local' };
  setLocalAudioCatalog({ tracks: { 'first-local': { src: '/.local-audio/first.wav' }, 'second-local': { src: '/.local-audio/second.wav' } } });
  player.attachAudio(element);
  let rejectFirst;
  element.play = () => new Promise((resolve, reject) => { rejectFirst = reject; });
  player.loadSong(first);
  element.play = () => Promise.resolve();
  player.loadSong(second);
  element.dispatchEvent(new Event('playing'));
  rejectFirst(new Error('Old source aborted'));
  await Promise.resolve();
  assert.equal(player.activeSong.value, second);
  assert.equal(player.playing.value, true);
  assert.equal(player.nativeStatus.value, '');
  element.play = () => Promise.reject(new Error('NotAllowedError'));
  player.pause();
  player.loadSong(second);
  await Promise.resolve();
  assert.equal(player.playing.value, false);
  assert.match(player.nativeStatus.value, /播放未开始/);
  player.releaseAudio();
  setLocalAudioCatalog({ tracks: {} });
  player.selectedSong.value = null;
  player.expanded.value = false;
});

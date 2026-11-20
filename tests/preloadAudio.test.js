import test from 'node:test';
import assert from 'node:assert/strict';
import { preloadAudio } from '../src/composables/preloadAudio.js';

class TestAudio extends EventTarget {
  load() {}
  removeAttribute(name) { delete this[name]; }
}

function setup(sources, timeout) {
  const elements = [];
  const queue = preloadAudio(sources, () => {
    const element = new TestAudio();
    elements.push(element);
    return element;
  }, timeout);
  return { queue, elements };
}

test('background audio preloads sequentially, skips manually requested songs, and hands off the prepared element', () => {
  const { queue, elements } = setup(['/first', '/second', '/third', '/first']);
  try {
    assert.deepEqual(elements.map(element => element.src), ['/first']);
    assert.equal(elements[0].preload, 'metadata');
    assert.equal(queue.take('/second'), undefined);
    elements[0].dispatchEvent(new Event('suspend'));
    assert.deepEqual(elements.map(element => element.src), ['/first', '/third']);
    assert.equal(queue.take('/first'), elements[0]);
    assert.equal(queue.take('/first'), undefined);
    elements[1].dispatchEvent(new Event('error'));
    assert.equal(queue.take('/third'), undefined);
    assert.equal(elements[1].src, undefined);
  } finally {
    queue.dispose();
  }
  assert.equal(elements[0].src, '/first', 'cleanup does not unload an element already handed to the player');
});

test('a stalled preload times out rather than blocking the queue', async () => {
  const { queue, elements } = setup(['/stalled', '/next', '/unused'], 5);
  try {
    await new Promise(resolve => setTimeout(resolve, 6));
    assert.equal(elements[0].src, undefined);
    assert.equal(elements[1].src, '/next');
  } finally {
    queue.dispose();
  }
  assert.equal(elements[1].src, undefined);
  assert.equal(elements.length, 2);
});

test('starting the currently preloading track hands it off without holding up the queue', () => {
  const { queue, elements } = setup(['/first', '/second']);
  try {
    assert.equal(queue.take('/first'), elements[0]);
    assert.deepEqual(elements.map(element => element.src), ['/first', '/second']);
    elements[0].dispatchEvent(new Event('error'));
    assert.equal(elements[0].src, '/first');
  } finally {
    queue.dispose();
  }
});

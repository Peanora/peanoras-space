export function createWheelGestureGate({ threshold = 35, pause = 180 } = {}) {
  let lastAt = -Infinity;
  let total = 0;
  let consumed = false;
  return (delta, now, locked = false) => {
    if (now - lastAt > pause) {
      total = 0;
      consumed = false;
    }
    lastAt = now;
    if (locked) {
      consumed = true;
      total = 0;
      return 0;
    }
    if (consumed) return 0;
    total += delta;
    if (Math.abs(total) < threshold) return 0;
    consumed = true;
    return Math.sign(total);
  };
}

export function normalizeWheelDelta(event, height) {
  return (
    event.deltaY *
    (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1)
  );
}

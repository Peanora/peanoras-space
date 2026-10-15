export function canReadMore(panel, delta) {
  if (!panel || panel.scrollHeight <= panel.clientHeight + 3) return false;
  return delta > 0
    ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 3
    : panel.scrollTop > 3;
}

// Freeze the starting boundary: reaching the bottom while reading requires a
// fresh swipe to turn the page, rather than unexpectedly doing both at once.
export function createTouchGesture({ x, y, panel, previous, next }) {
  const metrics = panel && {
    scrollTop: panel.scrollTop,
    scrollHeight: panel.scrollHeight,
    clientHeight: panel.clientHeight,
  };
  let axis = null;
  let direction = 0;
  let allowed = false;
  function move(point) {
    const dy = y - point.y;
    const dx = x - point.x;
    if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 12) {
      axis = Math.abs(dy) > Math.abs(dx) * 1.2 ? "vertical" : "horizontal";
      direction = Math.sign(dy);
      allowed = axis === "vertical" && !canReadMore(metrics, dy) &&
        (direction > 0 ? next : previous);
    }
    return { dy, dx, preventScroll: !!allowed };
  }
  return {
    move,
    end(point) {
      const result = move(point);
      return allowed && Math.abs(result.dy) >= 50 &&
        Math.abs(result.dy) > Math.abs(result.dx) * 1.2 &&
        Math.sign(result.dy) === direction ? direction : 0;
    },
  };
}

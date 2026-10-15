// The editor owns history so structural changes and inline edits undo together.
export function createHistory(limit = 60) {
  let past = [], future = [], lastKey = "", lastTime = 0;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  return {
    record(before, key = "", now = Date.now()) {
      if (!key || key !== lastKey || now - lastTime > 650) {
        past.push(copy(before));
        if (past.length > limit) past.shift();
      }
      lastKey = key; lastTime = now; future = [];
    },
    undo(current) {
      if (!past.length) return null;
      future.push(copy(current)); lastKey = "";
      return past.pop();
    },
    redo(current) {
      if (!future.length) return null;
      past.push(copy(current)); lastKey = "";
      return future.pop();
    },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
  };
}

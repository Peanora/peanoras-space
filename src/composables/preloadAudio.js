function unload(element) {
  element.removeAttribute('src');
  element.load();
}

export function preloadAudio(sources, createAudio = () => new Audio(), timeout = 8000) {
  const pending = new Set(sources);
  const prepared = new Map();
  let current;

  function next() {
    const source = pending.values().next().value;
    if (!source) return;
    pending.delete(source);
    const element = createAudio();
    prepared.set(source, element);
    const timer = setTimeout(() => finish(false), timeout);
    function finish(keep) {
      clearTimeout(timer);
      element.removeEventListener('suspend', suspend);
      element.removeEventListener('error', fail);
      current = null;
      if (!keep && prepared.delete(source)) unload(element);
      next();
    }
    const suspend = () => finish(true);
    const fail = () => finish(false);
    current = { source, finish };
    element.addEventListener('suspend', suspend);
    element.addEventListener('error', fail);
    element.preload = 'metadata';
    element.src = source;
  }

  next();
  return {
    take(source) {
      pending.delete(source);
      const element = prepared.get(source);
      prepared.delete(source);
      if (current?.source === source) current.finish(true);
      return element;
    },
    dispose() {
      pending.clear();
      current?.finish(false);
      for (const element of prepared.values()) unload(element);
      prepared.clear();
    },
  };
}

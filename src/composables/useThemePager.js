import { nextTick, onUnmounted, ref, toValue, watch } from 'vue';
import { createWheelGestureGate, normalizeWheelDelta } from '../utils/wheelGesture.js';
import { canReadMore, createTouchGesture } from '../utils/touchGesture.js';

const GESTURE_PAUSE = 180;
const TOOLS = 'input, textarea, select, [contenteditable], .wallpaper-picker, .wallpaper-options, .site-navigation, .music-widget';
const TOUCH_TOOLS = `${TOOLS}, .home-theme-controls, .theme-pager, .theme-pager-footer, .pager-bottom`;

// This pager owns only events bound to its wrapper. The banner and article feed
// remain ordinary document content, including at the two ends of the themes.
export function useThemePager({ root, viewport = root, count, getPanel, getTopOffset = () => 88, onBoundary }) {
  const current = ref(0);
  const direction = ref(1);
  const moving = ref(false);
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const transitionDuration = ref(media.matches ? { enter: 0, leave: 0 } : { enter: 390, leave: 140 });
  const total = () => Math.max(0, Math.floor(Number(toValue(count)) || 0));
  const panel = () => getPanel?.() ?? root.value?.querySelector('[data-theme-active="true"]');
  const closest = (target, selector) => (target?.nodeType === 3 ? target.parentElement : target)?.closest?.(selector);
  const prevent = (event) => { if (event.cancelable !== false) event.preventDefault(); };
  const hasNext = step => step > 0 ? current.value < total() - 1 : current.value > 0;
  const clock = () => performance.now();
  let moveTimer;
  let focusAfterMove = false;
  let touch;
  let containedPanel;
  let priorOverscroll;
  let suppressClickUntil = 0;
  let lastWheelAt = -Infinity;
  let wheelMode;
  let wheelPanel;
  let wheelGate = createWheelGestureGate({ pause: GESTURE_PAUSE });

  function position() {
    const top = (viewport.value ?? root.value)?.getBoundingClientRect?.().top ?? getTopOffset();
    const distance = top - getTopOffset();
    return { distance, aligned: Math.abs(distance) <= 4 };
  }
  function alignRegion() {
    const { distance } = position();
    if (Math.abs(distance) > 4) window.scrollBy({ top: distance, behavior: 'instant' });
  }
  function headingFocus() {
    panel()?.querySelector('.home-theme-title')?.focus({ preventScroll: true });
  }
  async function finishMove() {
    clearTimeout(moveTimer);
    moving.value = false;
    if (focusAfterMove) {
      focusAfterMove = false;
      await nextTick();
      headingFocus();
    }
  }
  function goTo(index, options = {}) {
    if (typeof options === 'boolean') options = { focus: options };
    if (!total() || !Number.isFinite(Number(index)) || (moving.value && !options.force)) return false;
    const next = Math.max(0, Math.min(total() - 1, Math.floor(Number(index))));
    if (options.align !== false) alignRegion();
    if (next === current.value) {
      if (options.force) {
        focusAfterMove = false;
        finishMove();
      }
      if (options.focus) nextTick(headingFocus);
      return false;
    }
    const focusedPanel = typeof document !== 'undefined' && closest(document.activeElement, '.home-theme');
    focusAfterMove = options.focus ?? !!focusedPanel;
    releaseContainment();
    direction.value = next > current.value ? 1 : -1;
    moving.value = true;
    current.value = next;
    nextTick(() => {
      const active = panel();
      if (current.value === next && active) active.scrollTop = 0;
    });
    clearTimeout(moveTimer);
    // A fallback also unlocks if a transition is interrupted by route/editor work.
    moveTimer = setTimeout(finishMove, media.matches ? 0 : 750);
    return true;
  }
  watch(total, length => {
    if (current.value >= length) goTo(Math.max(0, length - 1), { force: true, align: false, focus: false });
    if (!length) {
      current.value = 0;
      finishMove();
    }
  }, { flush: 'sync' });

  function resetWheel() {
    lastWheelAt = -Infinity;
    wheelMode = undefined;
    wheelGate = createWheelGestureGate({ pause: GESTURE_PAUSE });
  }
  function gestureMode(active, delta) {
    const { aligned } = position();
    const reading = canReadMore(active, delta);
    // A banner scroll can overshoot the top of this region. Settle the visible
    // region before reading or turning, but keep both terminal exits native.
    if (!aligned) return reading || hasNext(delta) ? 'align' : 'pass';
    return reading ? 'read' : hasNext(delta) ? 'page' : 'pass';
  }
  function handoffFocus(step, source, event) {
    if (root.value?.contains?.(document.activeElement)) {
      if (onBoundary) onBoundary(step, { source, event });
      else document.activeElement?.blur?.();
    }
  }
  function onWheel(event) {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || closest(event.target, TOOLS)) {
      resetWheel();
      return;
    }
    const delta = normalizeWheelDelta(event, viewport.value?.clientHeight ?? window.innerHeight);
    if (!delta) return;
    const now = clock();
    const fresh = now - lastWheelAt > GESTURE_PAUSE;
    lastWheelAt = now;
    if (fresh) releaseContainment();
    if (moving.value) wheelMode = 'blocked';
    else if (fresh || !wheelMode) {
      wheelPanel = panel();
      wheelMode = gestureMode(wheelPanel, delta);
      if (wheelMode === 'align') alignRegion();
      if (wheelMode === 'read') containReading(wheelPanel);
    }
    const step = wheelGate(delta, now, wheelMode !== 'page' || moving.value);
    if (wheelMode === 'pass') {
      if (fresh) handoffFocus(Math.sign(delta), 'wheel', event);
      return;
    }
    if (wheelMode === 'read') {
      // Keep the original read gesture a read gesture even after it reaches an
      // edge. Clamp an overshooting event so it cannot scroll the document too.
      const remaining = delta > 0
        ? wheelPanel.scrollHeight - wheelPanel.clientHeight - wheelPanel.scrollTop
        : wheelPanel.scrollTop;
      const inside = wheelPanel.contains?.(event.target) ?? closest(event.target, '.home-theme') === wheelPanel;
      if (!inside || remaining <= Math.abs(delta) + 3) {
        prevent(event);
        wheelPanel.scrollTop = Math.max(0, Math.min(wheelPanel.scrollHeight - wheelPanel.clientHeight, wheelPanel.scrollTop + delta));
      }
      return;
    }
    prevent(event);
    if (step) goTo(current.value + step, { align: false });
  }

  function onKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || closest(event.target, TOOLS)) return;
    const step = ['ArrowDown', 'PageDown'].includes(event.key) ? 1
      : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (!step && !['Home', 'End'].includes(event.key)) return;
    if (moving.value || event.repeat) { prevent(event); return; }
    const active = panel();
    if (step && canReadMore(active, step)) {
      prevent(event);
      active.scrollBy({ top: step * (event.key.startsWith('Page') ? active.clientHeight * 0.8 : 60) });
      return;
    }
    if (step && !hasNext(step)) {
      if (onBoundary) { prevent(event); onBoundary(step, { source: 'keyboard', event }); }
      return;
    }
    prevent(event);
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? total() - 1 : current.value + step, { focus: true });
  }

  function releaseContainment() {
    if (containedPanel?.style) containedPanel.style.overscrollBehaviorY = priorOverscroll;
    containedPanel = undefined;
  }
  function containReading(active) {
    if (!active?.style) return;
    containedPanel = active;
    priorOverscroll = active.style.overscrollBehaviorY;
    active.style.overscrollBehaviorY = 'contain';
  }
  function onTouchCancel() {
    touch = undefined;
    releaseContainment();
  }
  function onTouchStart(event) {
    onTouchCancel();
    suppressClickUntil = 0;
    if (event.touches.length !== 1 || closest(event.target, TOUCH_TOOLS)) return;
    const point = event.touches[0];
    const active = panel();
    touch = {
      id: point.identifier, x: point.clientX, y: point.clientY, index: current.value,
      panel: active, metrics: active && { scrollTop: active.scrollTop, scrollHeight: active.scrollHeight, clientHeight: active.clientHeight },
      blocked: moving.value, kind: undefined, axis: undefined,
      gesture: createTouchGesture({ x: point.clientX, y: point.clientY, panel: active, previous: hasNext(-1), next: hasNext(1) }),
    };
  }
  function touchMove(point, event, canPrevent = true) {
    const dx = touch.x - point.clientX;
    const dy = touch.y - point.clientY;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 12) {
      touch.axis = Math.abs(dy) > Math.abs(dx) * 1.2 ? 'vertical' : 'horizontal';
      if (touch.axis === 'vertical') {
        touch.kind = touch.blocked ? 'blocked' : gestureMode(touch.metrics, dy);
        if (touch.kind === 'read') containReading(touch.panel);
        if (touch.kind === 'align') alignRegion();
        if (touch.kind === 'pass') handoffFocus(Math.sign(dy), 'touch', event);
      }
    }
    const result = touch.gesture.move({ x: point.clientX, y: point.clientY });
    if (canPrevent && touch.axis === 'vertical' && ['page', 'align', 'blocked'].includes(touch.kind) && (touch.kind !== 'page' || result.preventScroll)) prevent(event);
    return { dx, dy };
  }
  function onTouchMove(event) {
    if (!touch) return;
    if (event.touches.length !== 1 || event.touches[0].identifier !== touch.id) { onTouchCancel(); return; }
    touchMove(event.touches[0], event);
  }
  function onTouchEnd(event) {
    if (!touch) return;
    const point = Array.from(event.changedTouches).find(item => item.identifier === touch.id);
    if (!point) { onTouchCancel(); return; }
    const { dx, dy } = touchMove(point, event, false);
    const step = touch.kind === 'page' && touch.index === current.value ? touch.gesture.end({ x: point.clientX, y: point.clientY }) : 0;
    if (touch.axis === 'vertical' && Math.abs(dy) >= 12 && Math.abs(dy) > Math.abs(dx) * 1.2) suppressClickUntil = clock() + 600;
    // Keep containment through native read momentum; the next touchstart restores
    // it before deciding whether that fresh swipe should leave the theme region.
    touch = undefined;
    if (step) goTo(current.value + step, { align: false });
  }
  function onClickCapture(event) {
    if (event.detail !== 0 && clock() < suppressClickUntil && closest(event.target, '.home-theme')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  function updateMotion() {
    transitionDuration.value = media.matches ? { enter: 0, leave: 0 } : { enter: 390, leave: 140 };
  }
  media.addEventListener('change', updateMotion);
  onUnmounted(() => {
    clearTimeout(moveTimer);
    media.removeEventListener('change', updateMotion);
    onTouchCancel();
  });
  return { current, direction, moving, transitionDuration, goTo, finishMove, onWheel, onKeydown, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture };
}

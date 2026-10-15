import { ref, onMounted, onUnmounted, nextTick } from "vue";
import {
  createWheelGestureGate,
  normalizeWheelDelta,
} from "../utils/wheelGesture.js";
import { canReadMore, createTouchGesture } from "../utils/touchGesture.js";

export function useScreenPager(stage, count) {
  const current = ref(0);
  const direction = ref(1);
  const moving = ref(false);
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const transitionDuration = ref(
    motionPreference.matches
      ? { enter: 0, leave: 0 }
      : { enter: 390, leave: 140 },
  );
  function updateMotion() {
    transitionDuration.value = motionPreference.matches
      ? { enter: 0, leave: 0 }
      : { enter: 390, leave: 140 };
  }
  const gesture = createWheelGestureGate();
  let timer;
  let focusAfterMove = false;
  let touchStart = null;
  let touchId = null;
  let suppressClickUntil = 0;
  function goTo(index, keyboard = false) {
    const next = Math.max(0, Math.min(count - 1, index));
    if (moving.value || next === current.value) return;
    direction.value = next > current.value ? 1 : -1;
    focusAfterMove =
      keyboard || !!document.activeElement?.closest(".home-screen");
    moving.value = true;
    current.value = next;
    clearTimeout(timer);
    timer = setTimeout(() => {
      moving.value = false;
    }, 750);
  }
  async function finishMove() {
    clearTimeout(timer);
    moving.value = false;
    if (focusAfterMove) {
      await nextTick();
      const heading = stage.value?.querySelector(
        ".home-screen:not(.screen-leave-active) .screen-heading",
      );
      if (heading) {
        heading.focus({ preventScroll: true });
        focusAfterMove = false;
      }
    }
  }
  function onWheel(event) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    )
      return;
    if (event.target.closest(".wallpaper-options, input, textarea, select"))
      return;
    const delta = normalizeWheelDelta(event, stage.value.clientHeight);
    if (canReadMore(event.target.closest(".home-screen"), delta) || !delta)
      return;
    event.preventDefault();
    const step = gesture(delta, performance.now(), moving.value);
    if (step) goTo(current.value + step);
  }
  function onKey(event) {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest(
        "input, textarea, select, [contenteditable], .wallpaper-picker, .site-navigation",
      )
    )
      return;
    const step = ["ArrowDown", "PageDown"].includes(event.key)
      ? 1
      : ["ArrowUp", "PageUp"].includes(event.key)
        ? -1
        : 0;
    if (!step && !["Home", "End"].includes(event.key)) return;
    if (step && canReadMore(stage.value?.querySelector(".home-screen"), step))
      return;
    event.preventDefault();
    goTo(
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? count - 1
          : current.value + step,
      true,
    );
  }
  function onTouchStart(event) {
    if (
      event.touches.length !== 1 || moving.value ||
      event.target.closest("input, textarea, select, [contenteditable], .wallpaper-picker, .pager-bottom")
    ) {
      touchStart = null;
      return;
    }
    const touch = event.touches[0];
    touchId = touch.identifier;
    touchStart = createTouchGesture({
      y: touch.clientY, x: touch.clientX,
      panel: event.target.closest(".home-screen"),
      previous: current.value > 0, next: current.value < count - 1,
    });
  }
  function onTouchMove(event) {
    if (!touchStart) return;
    if (event.touches.length !== 1) return onTouchCancel();
    const touch = event.touches[0];
    if (touch.identifier !== touchId) return onTouchCancel();
    const result = touchStart.move({ x: touch.clientX, y: touch.clientY });
    if (result.preventScroll && event.cancelable) event.preventDefault();
  }
  function onTouchEnd(event) {
    if (!touchStart || !event.changedTouches.length) return;
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === touchId);
    if (!touch) return onTouchCancel();
    const step = touchStart.end({ x: touch.clientX, y: touch.clientY });
    touchStart = null;
    if (step) {
      suppressClickUntil = performance.now() + 600;
      goTo(current.value + step);
    }
  }
  function onClick(event) {
    if (event.detail !== 0 && performance.now() < suppressClickUntil &&
        event.target.closest(".home-screen")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  function onTouchCancel() {
    touchStart = null;
    touchId = null;
  }
  onMounted(() => {
    motionPreference.addEventListener("change", updateMotion);
    stage.value.addEventListener("wheel", onWheel, { passive: false });
    stage.value.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.value.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.value.addEventListener("touchend", onTouchEnd, { passive: true });
    stage.value.addEventListener("touchcancel", onTouchCancel, {
      passive: true,
    });
    window.addEventListener("keydown", onKey);
    stage.value.addEventListener("click", onClick, true);
  });
  onUnmounted(() => {
    motionPreference.removeEventListener("change", updateMotion);
    clearTimeout(timer);
    stage.value?.removeEventListener("wheel", onWheel);
    stage.value?.removeEventListener("touchstart", onTouchStart);
    stage.value?.removeEventListener("touchmove", onTouchMove);
    stage.value?.removeEventListener("touchend", onTouchEnd);
    stage.value?.removeEventListener("touchcancel", onTouchCancel);
    stage.value?.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", onKey);
  });
  return { current, direction, moving, goTo, finishMove, transitionDuration };
}

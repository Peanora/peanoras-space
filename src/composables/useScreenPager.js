import { ref, onMounted, onUnmounted, nextTick } from "vue";
import {
  createWheelGestureGate,
  normalizeWheelDelta,
} from "../utils/wheelGesture";

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
  function canReadMore(element, delta) {
    if (!element || element.scrollHeight <= element.clientHeight + 3)
      return false;
    return delta > 0
      ? element.scrollTop + element.clientHeight < element.scrollHeight - 3
      : element.scrollTop > 3;
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
      event.touches.length !== 1 ||
      event.target.closest("button, a, .wallpaper-options")
    ) {
      touchStart = null;
      return;
    }
    const panel = event.target.closest(".home-screen");
    if (panel && panel.scrollHeight > panel.clientHeight + 3) {
      touchStart = null;
      return;
    }
    touchStart = { y: event.touches[0].clientY, x: event.touches[0].clientX };
  }
  function onTouchEnd(event) {
    if (!touchStart || !event.changedTouches.length) return;
    const deltaY = touchStart.y - event.changedTouches[0].clientY;
    const deltaX = touchStart.x - event.changedTouches[0].clientX;
    touchStart = null;
    if (Math.abs(deltaY) >= 50 && Math.abs(deltaY) > Math.abs(deltaX))
      goTo(current.value + Math.sign(deltaY));
  }
  function onTouchCancel() {
    touchStart = null;
  }
  onMounted(() => {
    motionPreference.addEventListener("change", updateMotion);
    stage.value.addEventListener("wheel", onWheel, { passive: false });
    stage.value.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.value.addEventListener("touchend", onTouchEnd, { passive: true });
    stage.value.addEventListener("touchcancel", onTouchCancel, {
      passive: true,
    });
    window.addEventListener("keydown", onKey);
  });
  onUnmounted(() => {
    motionPreference.removeEventListener("change", updateMotion);
    clearTimeout(timer);
    stage.value?.removeEventListener("wheel", onWheel);
    stage.value?.removeEventListener("touchstart", onTouchStart);
    stage.value?.removeEventListener("touchend", onTouchEnd);
    stage.value?.removeEventListener("touchcancel", onTouchCancel);
    window.removeEventListener("keydown", onKey);
  });
  return { current, direction, moving, goTo, finishMove, transitionDuration };
}

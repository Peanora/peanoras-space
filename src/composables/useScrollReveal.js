import { onMounted, onUnmounted } from "vue";

export function useScrollReveal() {
  let observer;
  onMounted(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 },
    );
    document.querySelectorAll("main [data-reveal]").forEach((element) => {
      element.classList.add("reveal-pending");
      observer.observe(element);
    });
  });
  onUnmounted(() => observer?.disconnect());
}

import { useEffect } from "react";

// Scroll-reveal: elements marked `.reveal` rise into place as they enter the
// viewport. Content is visible by default and only animated once we confirm
// (via a 2-frame rAF probe) that the animation clock is live — so with JS off
// or motion reduced, everything simply stays visible.
export function useReveal(deps = []) {
  useEffect(() => {
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return undefined;

    const reveals = [...document.querySelectorAll(".reveal")];
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const delayFor = (el) => {
      if (el.classList.contains("d3")) return 220;
      if (el.classList.contains("d2")) return 150;
      if (el.classList.contains("d1")) return 75;
      return 0;
    };

    function tweenIn(el, fade) {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "1";
      const fromY = 22;
      const dur = 850;
      const delay = delayFor(el);
      if (fade) el.style.opacity = "0";
      el.style.transform = "translateY(" + fromY + "px)";
      let start = null;
      function step(ts) {
        if (start === null) start = ts;
        const e = ts - start - delay;
        if (e <= 0) {
          requestAnimationFrame(step);
          return;
        }
        const t = Math.min(1, e / dur);
        const k = easeOut(t);
        if (fade) el.style.opacity = String(k);
        el.style.transform = "translateY(" + (fromY * (1 - k)).toFixed(2) + "px)";
        if (t < 1) requestAnimationFrame(step);
        else {
          el.style.opacity = "";
          el.style.transform = "";
        }
      }
      requestAnimationFrame(step);
    }

    function scan() {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      reveals.forEach((el) => {
        if (el.dataset.revealed) return;
        const r = el.getBoundingClientRect();
        if (r.top >= vh) return;
        tweenIn(el, r.top > vh * 0.85);
      });
    }

    let cleanup = () => {};
    const id = requestAnimationFrame((a) =>
      requestAnimationFrame((b) => {
        if (b > a) {
          scan();
          window.addEventListener("scroll", scan, { passive: true });
          window.addEventListener("resize", scan);
          cleanup = () => {
            window.removeEventListener("scroll", scan);
            window.removeEventListener("resize", scan);
          };
        }
      })
    );

    return () => {
      cancelAnimationFrame(id);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

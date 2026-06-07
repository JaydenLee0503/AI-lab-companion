import { useEffect } from "react";

// Gravity Grid — an interactive chromatic point-lattice that warps toward a
// gravity well. The well tracks the pointer (with spring lag) and idles in a
// slow drift when untouched. Three RGB channels are displaced by slightly
// different amounts → chromatic separation near the well, merging to white in
// the calm field far away. Ported from the landing concept into a hook that
// drives a <canvas id="gravity"> inside the given container ref.
export function useGravityGrid(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");

    let W;
    let H;
    let dpr;
    let spacing;
    let cols;
    let rows;
    const SPACING = 16;
    const well = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let hasPointer = false;
    let pressed = false;
    let t = 0;
    let raf = 0;

    const cfg = {
      spacingScale: 1,
      strength: 5.5,
      colors: ["rgba(255,64,74,", "rgba(72,238,116,", "rgba(86,134,255,"],
    };
    const SPLIT = [1.12, 1.0, 0.9];

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      W = canvas.width = Math.floor(rect.width * dpr);
      H = canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      spacing = SPACING * cfg.spacingScale * dpr;
      cols = Math.ceil(W / spacing) + 2;
      rows = Math.ceil(H / spacing) + 2;
      if (!hasPointer) {
        target.x = W * 0.3;
        target.y = H * 0.42;
      }
      if (well.x === 0 && well.y === 0) {
        well.x = target.x;
        well.y = target.y;
      }
    }

    function render() {
      if (!W) {
        build();
        if (!W) return;
      }
      const hole = spacing * 1.15;
      let G = spacing * spacing * cfg.strength;
      if (pressed) G *= 1.7;
      const dotR = 1.35 * dpr;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      const soft = spacing * 2.0;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const hsh = ((cx * 73856093) ^ (cy * 19349663)) >>> 0;
          const jx = (((hsh >> 8) & 31) / 31 - 0.5) * spacing * 0.85;
          const jy = (((hsh >> 13) & 31) / 31 - 0.5) * spacing * 0.85;
          const bx = cx * spacing + jx;
          const by = cy * spacing + jy;
          const dx = bx - well.x;
          const dy = by - well.y;
          const r = Math.sqrt(dx * dx + dy * dy) + 0.0001;
          const ux = dx / r;
          const uy = dy / r;
          const pull = G / (r + soft);
          const ci = hsh % 3;
          const jit = 0.74 + ((hsh >> 4) & 7) / 22;
          const nr = Math.max(r - pull * SPLIT[ci], hole);
          const px = well.x + ux * nr;
          const py = well.y + uy * nr;
          let a = (0.42 + (64 * dpr) / (r + spacing * 1.6)) * jit;
          if (a > 1) a = 1;
          ctx.fillStyle = cfg.colors[ci] + a.toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(px, py, dotR, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function frame() {
      t += 0.016;
      if (!hasPointer) {
        target.x = W * (0.5 + 0.27 * Math.cos(t * 0.23));
        target.y = H * (0.5 + 0.22 * Math.sin(t * 0.31));
      }
      well.x += (target.x - well.x) * 0.07;
      well.y += (target.y - well.y) * 0.07;
      render();
      raf = requestAnimationFrame(frame);
    }

    const host = canvas.parentElement;
    function locate(e) {
      const rect = canvas.getBoundingClientRect();
      target.x = (e.clientX - rect.left) * dpr;
      target.y = (e.clientY - rect.top) * dpr;
      hasPointer = true;
    }
    const onMove = (e) => locate(e);
    const onLeave = () => {
      hasPointer = false;
      pressed = false;
    };
    const onDown = (e) => {
      pressed = true;
      locate(e);
    };
    const onUp = () => {
      pressed = false;
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", build);

    function paintInitial(tries) {
      build();
      render();
      if (!W && tries < 40) setTimeout(() => paintInitial(tries + 1), 40);
    }
    paintInitial(0);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", build);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

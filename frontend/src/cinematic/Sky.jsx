import { useEffect, useRef } from "react";

// Fixed starfield + atmosphere + grain that sits behind every screen.
// The same drifting, twinkling field from the landing concept — mounted
// once at the app root so all views share one continuous backdrop.
export default function Sky() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let stars = [];
    let w;
    let h;
    let dpr;
    let scrollY = 0;
    let raf = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const count = Math.min(
        260,
        Math.floor((window.innerWidth * window.innerHeight) / 7000)
      );
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        r: (Math.random() * 1.1 + 0.2) * dpr,
        tw: Math.random() * Math.PI * 2,
        tws: Math.random() * 0.012 + 0.003,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.tws;
        const a = (Math.sin(s.tw) * 0.4 + 0.6) * s.z;
        const py = (s.y - scrollY * s.z * 0.25 * dpr) % h;
        const yy = py < 0 ? py + h : py;
        const hue = s.z > 0.75 ? "rgba(200,225,255," : "rgba(220,228,240,";
        ctx.beginPath();
        ctx.fillStyle = hue + a.toFixed(3) + ")";
        ctx.arc(s.x, yy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Static single frame for reduced-motion users.
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(220,228,240," + (0.5 * s.z).toFixed(3) + ")";
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="sky" aria-hidden="true">
      <canvas id="stars" ref={canvasRef} />
      <div className="atmosphere" />
      <div className="grain" />
    </div>
  );
}

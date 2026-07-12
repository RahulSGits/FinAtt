"use client";

import { useEffect, useRef } from "react";

/**
 * Rotating 3D point-globe rendered on a canvas. Points are placed on a sphere
 * (fibonacci distribution), rotated in 3D, projected to 2D, and drawn with
 * depth-based size/opacity. Pure math + canvas — no 3D library.
 */
export default function Globe({ size = 380 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const N = 520;
    const R = size * 0.36;
    const pts: { x: number; y: number; z: number }[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      pts.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
    }

    let raf = 0;
    let a = 0;
    const cx = size / 2;
    const cy = size / 2;

    const render = () => {
      a += 0.0035;
      ctx.clearRect(0, 0, size, size);
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);
      const tilt = 0.42;

      const drawn = pts.map((p) => {
        const x = p.x * cosA - p.z * sinA;
        const z = p.x * sinA + p.z * cosA;
        const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
        const z2 = p.y * Math.sin(tilt) + z * Math.cos(tilt);
        return { sx: cx + x * R, sy: cy + y * R, depth: z2 };
      });
      drawn.sort((m, n) => m.depth - n.depth);

      for (const d of drawn) {
        const t = (d.depth + 1) / 2;
        const alpha = 0.15 + t * 0.7;
        const rad = 0.6 + t * 1.9;
        const g = Math.round(120 + t * 120);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${Math.round(110 + t * 40)}, ${g}, 245, ${alpha})`;
        ctx.arc(d.sx, d.sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className="float"
      aria-hidden
    />
  );
}

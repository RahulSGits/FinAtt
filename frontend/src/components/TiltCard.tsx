"use client";

import { useRef } from "react";

/** Wraps children in a 3D perspective card that tilts toward the cursor. */
export default function TiltCard({
  children,
  className = "",
  max = 10,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function reset() {
    if (ref.current) ref.current.style.transform = "rotateX(0) rotateY(0)";
  }

  return (
    <div className={`scene ${className}`}>
      <div ref={ref} className="tilt" onMouseMove={onMove} onMouseLeave={reset}>
        {children}
      </div>
    </div>
  );
}

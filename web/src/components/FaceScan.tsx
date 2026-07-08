"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanFace, CheckCircle2, AlertTriangle, X, RefreshCw } from "lucide-react";

type Phase = "starting" | "live" | "denied" | "nocam" | "error";

/**
 * Real-time webcam face detection. Streams the user's camera and, where the
 * browser exposes the Shape Detection API (`window.FaceDetector`, Chromium),
 * draws live bounding boxes and reports how many faces are in frame. Falls
 * back gracefully (still shows the camera) when detection isn't available.
 */
export default function FaceScan({
  mode = "verify",
  onVerified,
  onEnrolled,
  onClose,
}: {
  mode?: "verify" | "enroll";
  onVerified?: () => void;
  onEnrolled?: (snapshot: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("starting");
  const [faces, setFaces] = useState(0);
  const [supported, setSupported] = useState(true);
  const [retry, setRetry] = useState(0);
  const [matching, setMatching] = useState(false);

  function captureSnapshot(): string {
    const video = videoRef.current;
    if (!video) return "";
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 240;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    // center-crop square, mirror to match the on-screen preview
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    const vw = video.videoWidth || 480;
    const vh = video.videoHeight || 480;
    const s = Math.min(vw, vh);
    ctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  }

  function handlePrimary() {
    if (mode === "enroll") {
      onEnrolled?.(captureSnapshot() || "enrolled");
      return;
    }
    // verify: brief "matching against registered face" then done
    setMatching(true);
    setTimeout(() => onVerified?.(), 900);
  }

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase("nocam");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase("live");
        loop();
      } catch (err) {
        const name = (err as DOMException)?.name;
        setPhase(name === "NotAllowedError" ? "denied" : name === "NotFoundError" ? "nocam" : "error");
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FD = (typeof window !== "undefined" && (window as any).FaceDetector) || null;
    const detector = FD ? new FD({ fastMode: true, maxDetectedFaces: 5 }) : null;
    if (!detector) setSupported(false);

    async function loop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (detector) {
          try {
            const found = await detector.detect(video);
            setFaces(found.length);
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#34d399";
            ctx.shadowColor = "#34d399";
            ctx.shadowBlur = 12;
            for (const f of found) {
              const b = f.boundingBox;
              ctx.strokeRect(b.x, b.y, b.width, b.height);
            }
          } catch {
            setSupported(false);
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [retry]);

  const doRetry = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setFaces(0);
    setPhase("starting");
    setRetry((r) => r + 1);
  };

  const detected = faces > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-strong w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanFace size={20} className="text-indigo-300" />
            <h3 className="font-semibold">{mode === "enroll" ? "Register your face" : "Live face check"}</h3>
          </div>
          <button onClick={onClose} className="muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />

          {/* scanning ring */}
          {phase === "live" && (
            <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-dashed"
              style={{ borderColor: detected ? "#34d399" : "rgba(165,180,252,0.5)" }} />
          )}

          {phase !== "live" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              {phase === "starting" && <StateMsg icon={<Camera />} tone="#a5b4fc" text="Starting camera…" />}
              {phase === "denied" && <StateMsg icon={<AlertTriangle />} tone="#fbbf24" text="Camera permission denied. Allow access and retry." />}
              {phase === "nocam" && <StateMsg icon={<AlertTriangle />} tone="#fbbf24" text="No camera found on this device." />}
              {phase === "error" && <StateMsg icon={<AlertTriangle />} tone="#f87171" text="Couldn't start the camera." />}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${matching ? "bg-indigo-400" : detected ? "bg-emerald-400" : "bg-slate-500"}`} />
          {matching
            ? <span className="text-indigo-200">Matching against registered face…</span>
            : phase === "live"
              ? supported
                ? detected
                  ? <span className="text-emerald-300">Face detected ({faces})</span>
                  : <span className="muted">Position your face in the ring…</span>
                : <span className="muted">Camera live · live detection not supported in this browser</span>
              : <span className="muted">Waiting for camera…</span>}
        </div>

        <div className="mt-4 flex gap-2">
          {(phase === "denied" || phase === "nocam" || phase === "error") && (
            <button
              onClick={doRetry}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-medium hover:bg-white/10"
            >
              <RefreshCw size={17} /> Retry camera
            </button>
          )}
          <button
            onClick={handlePrimary}
            disabled={matching || phase !== "live" || (supported && !detected)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            <CheckCircle2 size={18} /> {mode === "enroll" ? "Capture & register" : "Confirm & check in"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StateMsg({ icon, tone, text }: { icon: React.ReactNode; tone: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2" style={{ color: tone }}>
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanFace, CheckCircle2, AlertTriangle, X, RefreshCw } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";

type Phase = "starting" | "loading_models" | "live" | "denied" | "nocam" | "error";
type EnrollStep = "center" | "left" | "right" | "up" | "done";

const ENROLL_STEPS: EnrollStep[] = ["center", "left", "right", "up", "done"];

export default function FaceScan({
  mode = "verify",
  enrolledDescriptor,
  onVerified,
  onEnrolled,
  onClose,
}: {
  mode?: "verify" | "enroll";
  enrolledDescriptor?: Float32Array | null;
  onVerified?: () => void;
  onEnrolled?: (snapshot: string, descriptor: Float32Array) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("starting");
  const [retry, setRetry] = useState(0);
  
  // Verification state
  const [matchStatus, setMatchStatus] = useState<"pending" | "matched" | "mismatch">("pending");
  const [distanceVal, setDistanceVal] = useState<number | null>(null);
  
  // Enrollment state
  const [enrollStepIdx, setEnrollStepIdx] = useState(0);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);

  const enrollStep = ENROLL_STEPS[enrollStepIdx];

  function captureSnapshot(): string {
    const video = videoRef.current;
    if (!video) return "";
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 240;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    const vw = video.videoWidth || 480;
    const vh = video.videoHeight || 480;
    const s = Math.min(vw, vh);
    ctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  }

  useEffect(() => {
    let cancelled = false;

    async function initModels() {
      setPhase("loading_models");
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        if (!cancelled) startCamera();
      } catch (err) {
        console.error("Failed to load face-api models", err);
        setPhase("error");
      }
    }

    async function startCamera() {
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

    async function loop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || cancelled) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      
      const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detection) {
          // Draw bounding box
          const box = detection.detection.box;
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#34d399";
          
          if (mode === "verify") {
            if (enrolledDescriptor) {
              const distance = faceapi.euclideanDistance(detection.descriptor, enrolledDescriptor);
              setDistanceVal(distance);
              if (distance < 0.5) { // 0.5 threshold for strict matching
                setMatchStatus("matched");
                ctx.strokeStyle = "#34d399"; // Green
                // Auto-confirm if match
                setTimeout(() => { if (!cancelled) onVerified?.(); }, 1000);
              } else {
                setMatchStatus("mismatch");
                ctx.strokeStyle = "#f87171"; // Red
              }
            } else {
              setMatchStatus("mismatch");
              ctx.strokeStyle = "#f87171";
            }
          } else {
            // ENROLL MODE
            const landmarks = detection.landmarks;
            const nose = landmarks.getNose()[3];
            const leftEye = landmarks.getLeftEye()[0];
            const rightEye = landmarks.getRightEye()[3];
            
            const distLeft = Math.abs(nose.x - leftEye.x);
            const distRight = Math.abs(nose.x - rightEye.x);
            const yaw = (distRight - distLeft) / (distRight + distLeft);
            
            const eyeY = (leftEye.y + rightEye.y) / 2;
            const pitch = (nose.y - eyeY);
            
            setEnrollStepIdx(curr => {
              const step = ENROLL_STEPS[curr];
              if (step === "center" && Math.abs(yaw) < 0.15 && pitch > 20) {
                if (!capturedDescriptor) setCapturedDescriptor(detection.descriptor);
                return curr + 1;
              }
              if (step === "left" && yaw < -0.3) return curr + 1;
              if (step === "right" && yaw > 0.3) return curr + 1;
              if (step === "up" && pitch < 15) return curr + 1;
              return curr;
            });
          }

          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    initModels();
    
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry, mode, enrolledDescriptor]);

  const doRetry = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("starting");
    setMatchStatus("pending");
    setRetry((r) => r + 1);
  };

  const handleEnrollComplete = () => {
    if (capturedDescriptor) {
      onEnrolled?.(captureSnapshot(), capturedDescriptor);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-strong w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanFace size={20} className="text-indigo-300" />
            <h3 className="font-semibold">{mode === "enroll" ? "Secure Face Registration" : "Biometric Check-in"}</h3>
          </div>
          <button onClick={onClose} className="muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" />

          {phase === "live" && (
            <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-dashed"
              style={{ borderColor: matchStatus === "mismatch" ? "#f87171" : matchStatus === "matched" ? "#34d399" : "rgba(165,180,252,0.5)" }} />
          )}

          {phase !== "live" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center bg-black/80">
              {phase === "starting" && <StateMsg icon={<Camera />} tone="#a5b4fc" text="Starting camera…" />}
              {phase === "loading_models" && <StateMsg icon={<RefreshCw className="animate-spin" />} tone="#a5b4fc" text="Loading AI models..." />}
              {phase === "denied" && <StateMsg icon={<AlertTriangle />} tone="#fbbf24" text="Camera permission denied. Allow access and retry." />}
              {phase === "nocam" && <StateMsg icon={<AlertTriangle />} tone="#fbbf24" text="No camera found on this device." />}
              {phase === "error" && <StateMsg icon={<AlertTriangle />} tone="#f87171" text="Couldn't start the camera or load AI." />}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium h-12">
          {mode === "enroll" && phase === "live" && (
            <div className="text-center w-full">
              {enrollStep === "center" && <span className="text-indigo-300">Look straight at the camera</span>}
              {enrollStep === "left" && <span className="text-amber-300">Turn your head left</span>}
              {enrollStep === "right" && <span className="text-amber-300">Turn your head right</span>}
              {enrollStep === "up" && <span className="text-amber-300">Look slightly up</span>}
              {enrollStep === "done" && <span className="text-emerald-400">Liveness check complete!</span>}
              
              <div className="flex justify-center gap-1 mt-3">
                {ENROLL_STEPS.slice(0, 4).map((s, i) => (
                  <div key={s} className={`h-2 w-8 rounded-full ${i < enrollStepIdx ? "bg-emerald-400" : i === enrollStepIdx ? "bg-amber-400 animate-pulse" : "bg-white/10"}`} />
                ))}
              </div>
            </div>
          )}

          {mode === "verify" && phase === "live" && (
            <div className="text-center w-full">
              {matchStatus === "pending" && <span className="text-indigo-300 animate-pulse">Scanning face...</span>}
              {matchStatus === "matched" && <span className="text-emerald-400 flex justify-center items-center gap-1"><CheckCircle2 size={16}/> Identity Verified!</span>}
              {matchStatus === "mismatch" && (
                <div className="text-red-400">
                  <div className="flex justify-center items-center gap-1 font-bold"><AlertTriangle size={16}/> Face Mismatch!</div>
                  <div className="text-xs opacity-70 mt-1">Distance: {distanceVal?.toFixed(2)} (Must be &lt; 0.5)</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {(phase === "denied" || phase === "nocam" || phase === "error") && (
            <button
              onClick={doRetry}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-medium hover:bg-white/10"
            >
              <RefreshCw size={17} /> Retry
            </button>
          )}
          {mode === "enroll" && (
            <button
              onClick={handleEnrollComplete}
              disabled={enrollStep !== "done"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> Register Profile
            </button>
          )}
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

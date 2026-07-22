'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Eye,
  MapPin,
  ScanFace,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import {
  analyseFrame,
  averageDescriptors,
  captureFrame,
  LivenessTracker,
  loadFaceModels,
  matchDescriptor,
} from '@/lib/face'
import {
  checkGeofence,
  formatDistance,
  getCurrentPosition,
  GeolocationFailure,
  type Coords,
} from '@/lib/geo'
import type { Site } from '@/lib/types'
import { Alert, Spinner } from './ui'

type Phase =
  | 'idle'
  | 'locating'
  | 'camera'
  | 'models'
  | 'scanning'
  | 'blink'
  | 'capturing'
  | 'submitting'
  | 'done'
  | 'error'

const PHASE_COPY: Record<Phase, string> = {
  idle: 'Ready when you are',
  locating: 'Confirming you are on site…',
  camera: 'Starting the camera…',
  models: 'Loading face recognition…',
  scanning: 'Hold still — looking for your face',
  blink: 'Blink once to prove you are live',
  capturing: 'Capturing…',
  submitting: 'Recording your attendance…',
  done: 'Done',
  error: 'Something needs your attention',
}

/** How many good frames enrollment averages over. */
const ENROLL_SAMPLES = 5
/** Detector cadence — fast enough to catch a blink, light enough for laptops. */
const FRAME_INTERVAL_MS = 180
/** Give up rather than hold the camera open forever. */
const SCAN_TIMEOUT_MS = 60_000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface CheckInPayload {
  descriptor: number[]
  selfie: Blob | null
  coords: Coords
  liveness: 'blink'
}

class Aborted extends Error {}

export default function FaceCheckIn({
  mode,
  site,
  enrolledDescriptor,
  onSubmit,
  onCancel,
}: {
  mode: 'enroll' | 'verify'
  /** Required for `verify`; the fence is checked before the camera opens. */
  site?: Site | null
  enrolledDescriptor?: number[] | null
  onSubmit: (payload: CheckInPayload) => Promise<{ ok: boolean; error?: string }>
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const abortedRef = useRef(false)

  // The run loop outlives the render that started it, so anything it calls has
  // to be reached through a ref — a captured `onSubmit` would be pinned to
  // whichever render kicked the loop off.
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [samplesTaken, setSamplesTaken] = useState(0)
  const [blinked, setBlinked] = useState(false)
  const [faceVisible, setFaceVisible] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    // The camera light must go out the moment this component leaves the tree.
    return () => {
      abortedRef.current = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    abortedRef.current = false
    setError(null)
    setHint(null)
    setProgress(0)
    setSamplesTaken(0)
    setBlinked(false)
    setFaceVisible(false)

    const liveness = new LivenessTracker()
    const samples: Float32Array[] = []

    /** Bail out of the run if the user cancelled or the dialog closed. */
    const checkAborted = () => {
      if (abortedRef.current) throw new Aborted()
    }

    try {
      /* 1. Location — no point opening the camera if they are off site. */
      let position: Coords | null = null

      if (mode === 'verify') {
        setPhase('locating')
        position = await getCurrentPosition()
        checkAborted()
        setCoords(position)

        if (site) {
          const fence = checkGeofence(position, site)
          setDistance(fence.distance)
          if (!fence.inside) {
            throw new Error(
              `You are ${formatDistance(fence.distance)} from ${site.name}. Move within the ${site.radius_m} m check-in zone and try again.`,
            )
          }
        }
      }

      /* 2. Camera. */
      setPhase('camera')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      if (abortedRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        throw new Aborted()
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      /* 3. Models. */
      setPhase('models')
      await loadFaceModels()
      checkAborted()

      /* 4. Frame loop. A flat `while` keeps the whole run in one scope rather
            than a chain of setTimeout callbacks each capturing stale state. */
      setPhase('scanning')
      const deadline = Date.now() + SCAN_TIMEOUT_MS

      for (;;) {
        checkAborted()

        if (Date.now() > deadline) {
          throw new Error(
            'Timed out waiting for a clear face. Check your lighting and try again.',
          )
        }

        const video = videoRef.current
        if (!video) throw new Aborted()

        let frame: Awaited<ReturnType<typeof analyseFrame>> = null
        try {
          frame = await analyseFrame(video)
        } catch {
          // A dropped frame is not fatal — keep looping.
        }
        checkAborted()

        setFaceVisible(Boolean(frame))

        if (!frame) {
          setHint('No face detected — centre yourself in the frame.')
          await sleep(FRAME_INTERVAL_MS)
          continue
        }

        if (frame.box.width < 110) {
          setHint('Move a little closer to the camera.')
          await sleep(FRAME_INTERVAL_MS)
          continue
        }

        setHint(null)

        /* Enrollment: gather several frames and average them. */
        if (mode === 'enroll') {
          samples.push(frame.descriptor)
          setSamplesTaken(samples.length)
          setProgress(Math.min(1, samples.length / ENROLL_SAMPLES))

          if (samples.length < ENROLL_SAMPLES) {
            await sleep(FRAME_INTERVAL_MS)
            continue
          }

          setPhase('capturing')
          const selfie = await captureFrame(video)
          await finish({
            descriptor: averageDescriptors(samples),
            selfie,
            coords: position ?? ZERO_COORDS,
            liveness: 'blink',
          })
          return
        }

        /* Verification: match the enrolled template, then require a blink. */
        if (enrolledDescriptor && enrolledDescriptor.length === 128) {
          const result = matchDescriptor(frame.descriptor, enrolledDescriptor)
          if (!result.matched) {
            setHint('Face not recognised yet — face the camera in even lighting.')
            await sleep(FRAME_INTERVAL_MS)
            continue
          }
        }

        setPhase('blink')
        const didBlink = liveness.push(frame.ear)
        setBlinked(didBlink)
        setProgress(didBlink ? 1 : 0.5)

        if (!didBlink) {
          await sleep(FRAME_INTERVAL_MS)
          continue
        }

        setPhase('capturing')
        const selfie = await captureFrame(video)
        await finish({
          descriptor: Array.from(frame.descriptor),
          selfie,
          coords: position ?? ZERO_COORDS,
          liveness: 'blink',
        })
        return
      }
    } catch (err) {
      stopCamera()
      if (err instanceof Aborted) return

      setError(toMessage(err))
      setPhase('error')
    }

    async function finish(payload: CheckInPayload) {
      stopCamera()
      setPhase('submitting')

      const result = await onSubmitRef.current(payload)
      if (abortedRef.current) return

      if (result.ok) {
        setPhase('done')
      } else {
        setError(result.error ?? 'The server rejected the request.')
        setPhase('error')
      }
    }
  }, [mode, site, enrolledDescriptor, stopCamera])

  const cancel = useCallback(() => {
    abortedRef.current = true
    stopCamera()
    onCancel()
  }, [onCancel, stopCamera])

  const busy = phase !== 'idle' && phase !== 'error' && phase !== 'done'
  const showVideo = ['camera', 'models', 'scanning', 'blink', 'capturing'].includes(phase)

  return (
    <div className="space-y-4">
      {mode === 'verify' && site && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
          <MapPin size={15} className="shrink-0" style={{ color: 'var(--primary)' }} />
          <span className="min-w-0 flex-1 truncate">{site.name}</span>
          <span className="muted shrink-0 text-xs tabular-nums">
            {distance === null ? `${site.radius_m} m zone` : formatDistance(distance)}
          </span>
        </div>
      )}

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[var(--surface-3)]">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Camera preview"
          className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {showVideo && (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <motion.div
              animate={{
                borderColor: faceVisible ? 'var(--success)' : 'rgba(255,255,255,0.4)',
                scale: faceVisible ? 1 : 0.97,
              }}
              transition={{ duration: 0.25 }}
              className="h-[68%] w-[52%] rounded-[50%] border-[3px] border-dashed"
            />
          </div>
        )}

        <AnimatePresence>
          {!showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center px-6 text-center"
            >
              {phase === 'done' ? (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="flex flex-col items-center gap-2"
                >
                  <CheckCircle2 size={48} style={{ color: 'var(--success)' }} />
                  <p className="font-semibold">
                    {mode === 'enroll' ? 'Face enrolled' : 'Checked in'}
                  </p>
                </motion.div>
              ) : phase === 'error' ? (
                <TriangleAlert size={40} style={{ color: 'var(--danger)' }} />
              ) : phase === 'locating' || phase === 'submitting' ? (
                <div className="flex flex-col items-center gap-3">
                  <Spinner size={28} />
                  <p className="muted text-sm">{PHASE_COPY[phase]}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ScanFace size={44} className="muted opacity-40" />
                  <p className="muted text-sm">
                    {mode === 'enroll'
                      ? 'We will capture a few frames to build your face template.'
                      : 'Your face and location are both checked before attendance is recorded.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'blink' && !blinked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 text-sm font-medium text-white backdrop-blur"
            >
              <motion.span
                animate={{ scaleY: [1, 0.15, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.5 }}
                className="inline-flex"
              >
                <Eye size={16} />
              </motion.span>
              Blink once
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {busy && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="muted">{PHASE_COPY[phase]}</span>
            {mode === 'enroll' && phase === 'scanning' && (
              <span className="muted text-xs tabular-nums">
                {samplesTaken}/{ENROLL_SAMPLES}
              </span>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--primary)' }}
              animate={{ width: `${Math.max(8, progress * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {hint && busy && <Alert tone="info">{hint}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {phase === 'idle' && (
        <p className="muted flex items-start gap-2 text-xs">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Your face is stored as a numeric template, not a photograph. The check-in selfie
          is kept privately for audit and is visible only to you and HR.
        </p>
      )}

      <div className="flex gap-2">
        {phase === 'done' ? (
          <button onClick={cancel} className="btn btn-primary flex-1">
            Close
          </button>
        ) : (
          <>
            <button onClick={cancel} className="btn btn-ghost flex-1">
              Cancel
            </button>
            <button onClick={start} disabled={busy} className="btn btn-primary flex-1">
              {busy ? (
                <Spinner size={16} />
              ) : (
                <>
                  <Camera size={16} />
                  {phase === 'error'
                    ? 'Try again'
                    : mode === 'enroll'
                      ? 'Start enrollment'
                      : 'Check in'}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {coords && phase !== 'idle' && (
        <p className="muted text-center text-[11px] tabular-nums">
          GPS ±{Math.round(coords.accuracy)} m
        </p>
      )}
    </div>
  )
}

const ZERO_COORDS: Coords = { latitude: 0, longitude: 0, accuracy: 0 }

function toMessage(err: unknown): string {
  if (err instanceof GeolocationFailure) return err.message

  if (err instanceof Error) {
    switch (err.name) {
      case 'NotAllowedError':
        return 'Camera access was blocked. Allow it in your browser settings, then retry.'
      case 'NotFoundError':
        return 'No camera was found on this device.'
      case 'NotReadableError':
        return 'The camera is already in use by another app.'
      default:
        return err.message
    }
  }
  return 'Something went wrong. Please try again.'
}

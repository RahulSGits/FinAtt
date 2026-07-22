/**
 * Client-side face enrollment and verification on top of @vladmandic/face-api.
 *
 * Everything here touches `window`/`HTMLVideoElement`, so import it lazily from
 * a `"use client"` component — never from a server component or action.
 *
 * Weights are served from `public/models` (already committed): tiny face
 * detector for locating the face, the 68-point landmark net for the liveness
 * check, and the recognition net for the 128-float descriptor we match against.
 */

import type * as FaceApi from '@vladmandic/face-api'

export const MODEL_URL = '/models'

/**
 * Euclidean distance below which two descriptors are the same person.
 * face-api's own default is 0.6; attendance is a security control, so this is
 * tightened to trade a few extra retries for far fewer false accepts.
 */
export const MATCH_THRESHOLD = 0.5

/** Minimum detector confidence before a frame is considered usable. */
export const MIN_DETECTION_SCORE = 0.5

let faceapi: typeof FaceApi | null = null
let loadPromise: Promise<typeof FaceApi> | null = null

/**
 * Load the library and its three nets once per page. Concurrent callers share
 * the same promise so opening the camera twice doesn't fetch 7 MB twice.
 */
export function loadFaceModels(): Promise<typeof FaceApi> {
  if (faceapi) return Promise.resolve(faceapi)
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const lib = await import('@vladmandic/face-api')
    await Promise.all([
      lib.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      lib.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      lib.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    faceapi = lib
    return lib
  })()

  loadPromise.catch(() => {
    // Let a later attempt retry instead of caching the rejection forever.
    loadPromise = null
  })

  return loadPromise
}

export interface FaceFrame {
  descriptor: Float32Array
  /** Detector confidence, 0..1. */
  score: number
  /** Eye-aspect ratio averaged across both eyes; drives the blink check. */
  ear: number
  box: { x: number; y: number; width: number; height: number }
}

/** Detect exactly one face in a video frame and describe it. */
export async function analyseFrame(
  video: HTMLVideoElement,
): Promise<FaceFrame | null> {
  const lib = await loadFaceModels()

  const detection = await lib
    .detectSingleFace(video, new lib.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }))
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!detection || detection.detection.score < MIN_DETECTION_SCORE) return null

  const { x, y, width, height } = detection.detection.box
  return {
    descriptor: detection.descriptor,
    score: detection.detection.score,
    ear: averageEyeAspectRatio(detection.landmarks),
    box: { x, y, width, height },
  }
}

type Point = { x: number; y: number }

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Eye-aspect ratio (Soukupová & Čech): the ratio of eye height to eye width.
 * It sits near 0.3 for an open eye and collapses toward 0 when the lid closes,
 * which makes a blink trivially detectable without any extra model.
 */
function eyeAspectRatio(eye: Point[]): number {
  if (eye.length < 6) return 0
  const vertical = dist(eye[1], eye[5]) + dist(eye[2], eye[4])
  const horizontal = 2 * dist(eye[0], eye[3])
  return horizontal === 0 ? 0 : vertical / horizontal
}

function averageEyeAspectRatio(landmarks: FaceApi.FaceLandmarks68): number {
  return (
    (eyeAspectRatio(landmarks.getLeftEye()) +
      eyeAspectRatio(landmarks.getRightEye())) /
    2
  )
}

/** Compare a live descriptor against a stored enrollment. */
export function matchDescriptor(
  live: Float32Array | number[],
  enrolled: Float32Array | number[],
): { matched: boolean; distance: number; confidence: number } {
  const distance = euclidean(live, enrolled)
  return {
    matched: distance < MATCH_THRESHOLD,
    distance,
    // Map distance onto a friendlier 0..1 score for display.
    confidence: Math.max(0, Math.min(1, 1 - distance / 0.8)),
  }
}

function euclidean(a: Float32Array | number[], b: Float32Array | number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

/**
 * Blink-based liveness gate.
 *
 * A printed photo or a still on a phone screen holds a constant EAR. Requiring
 * the ratio to fall below `CLOSED` and come back above `OPEN` proves the eyelid
 * actually moved, which a flat image cannot fake.
 */
export class LivenessTracker {
  private static readonly CLOSED = 0.2
  private static readonly OPEN = 0.26
  /** Frames the eye must stay shut for, so sensor noise isn't read as a blink. */
  private static readonly MIN_CLOSED_FRAMES = 1

  private closedFrames = 0
  private sawClose = false

  blinked = false

  /** Feed one frame's EAR. Returns true once a full blink has been observed. */
  push(ear: number): boolean {
    if (this.blinked) return true

    if (ear < LivenessTracker.CLOSED) {
      this.closedFrames += 1
      if (this.closedFrames >= LivenessTracker.MIN_CLOSED_FRAMES) this.sawClose = true
    } else {
      if (this.sawClose && ear > LivenessTracker.OPEN) this.blinked = true
      this.closedFrames = 0
    }

    return this.blinked
  }

  reset() {
    this.closedFrames = 0
    this.sawClose = false
    this.blinked = false
  }
}

/**
 * Average several descriptors into one enrollment template. Averaging across
 * frames smooths out a single unlucky angle or exposure, which materially
 * reduces false rejects at check-in.
 */
export function averageDescriptors(samples: Float32Array[]): number[] {
  if (samples.length === 0) return []
  const length = samples[0].length
  const out = new Array<number>(length).fill(0)
  for (const sample of samples) {
    for (let i = 0; i < length; i++) out[i] += sample[i]
  }
  return out.map((v) => v / samples.length)
}

/** Grab the current video frame as a JPEG blob for the audit trail. */
export function captureFrame(
  video: HTMLVideoElement,
  maxWidth = 480,
): Promise<Blob | null> {
  const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round((video.videoWidth || maxWidth) * scale)
  canvas.height = Math.round((video.videoHeight || maxWidth) * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8),
  )
}

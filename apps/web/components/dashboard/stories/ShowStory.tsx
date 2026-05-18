"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { CldImage } from "next-cloudinary"
import { cn } from "@/lib/utils"
import { CarouselApi } from "@/components/ui/carousel"
import { Story } from "@repo/trpc/user"
import { formatDate } from "@/utils/util"
import { MdPause } from "react-icons/md"

// ─── Constants ────────────────────────────────────────────────────────────────
const TICK_MS = 50
const STORY_DURATION_MS = 5000

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShowStoryProps {
  story: Story
  index: number
  currentIndex: number
  isCurrent: boolean
  lastIndex: number
  api?: CarouselApi
  open: boolean
  onMediaChange?: (mediaIndex: number) => void
  onRegisterHandlers?: (back: () => void, forward: () => void) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
const ShowStory = ({
  story,
  index,
  currentIndex,
  isCurrent,
  lastIndex,
  api,
  open,
  onMediaChange,
  onRegisterHandlers,
}: ShowStoryProps) => {

  // ── State ──────────────────────────────────────────────────────────────────
  const [mediaIdx, setMediaIdx]     = useState(0)
  const [progress, setProgress]     = useState(0)
  const [paused, setPaused]         = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [error, setError] = useState(false)

  // ── Refs ───────────────────────────────────────────────────────────────────

  // navigatingRef is the core fix for both snap-back bugs.
  // It is set to true the INSTANT any navigation begins, and only
  // released after two animation frames (giving React + the carousel
  // time to settle). While true, the advance effect is fully suppressed.
  const navigatingRef = useRef(false)

  // Mirrors of state for use inside stale closures (callbacks, intervals).
  const mediaIdxRef = useRef(0)
  mediaIdxRef.current = mediaIdx

  // Tracks the previous value of isCurrent so we can detect transitions
  // without a dependency-array effect (which fires too late).
  const prevIsCurrentRef = useRef(false)

  // Fallback so a CldImage that never fires onLoad doesn't stall the story.
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fallback helpers ───────────────────────────────────────────────────────
  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  const armFallback = useCallback(() => {
    clearFallback()
    fallbackTimerRef.current = setTimeout(() => setImageReady(true), 2000)
  }, [clearFallback])

  useEffect(() => clearFallback, [clearFallback])

  // ── Navigation primitives ─────────────────────────────────────────────────
  //
  // Every navigation call:
  //   1. Sets navigatingRef = true  ← blocks the advance effect immediately
  //   2. Resets relevant state
  //   3. Releases the lock after 2× rAF (carousel + React have both settled)
  //
  // This prevents the advance effect from double-firing because:
  //   - On automatic advance: goToMedia/goNextStory set navigatingRef before
  //     state changes, so the effect won't re-run with stale progress=100
  //   - On manual back: goPrevStory locks, preventing the old card's
  //     lingering progress=100 from triggering another scrollNext

  const goToMedia = useCallback((idx: number) => {
    navigatingRef.current = true
    clearFallback()
    setProgress(0)
    setImageReady(false)
    setMediaIdx(idx)
    armFallback()
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { navigatingRef.current = false })
    )
  }, [armFallback, clearFallback])

  const goNextStory = useCallback(() => {
    if (!api) return
    navigatingRef.current = true
    api.scrollNext()
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { navigatingRef.current = false })
    )
  }, [api])

  const goPrevStory = useCallback(() => {
    if (!api) return
    navigatingRef.current = true
    api.scrollPrev()
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { navigatingRef.current = false })
    )
  }, [api])

  // ── Tap / chevron handlers ─────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (mediaIdxRef.current > 0) goToMedia(mediaIdxRef.current - 1)
    else goPrevStory()
  }, [goToMedia, goPrevStory])

  const handleForward = useCallback(() => {
    const total = story.stories?.length ?? 0
    if (mediaIdxRef.current < total - 1) goToMedia(mediaIdxRef.current + 1)
    else goNextStory()
  }, [story.stories?.length, goToMedia, goNextStory])

  // ── Register handlers with parent (chevron wiring) ────────────────────────
  useEffect(() => {
    if (!isCurrent) return
    onRegisterHandlers?.(handleBack, handleForward)
  }, [isCurrent, handleBack, handleForward, onRegisterHandlers])

  // ── isCurrent transition detector ────────────────────────────────────────
  //
  // Runs after EVERY render (no dep array) but only acts on actual transitions.
  // Using prevIsCurrentRef instead of a [isCurrent] dep-array effect because
  // dep-array effects are batched and can miss the frame where isCurrent flips,
  // causing the reset to run one render too late.
  useEffect(() => {
    const wasActive = prevIsCurrentRef.current
    prevIsCurrentRef.current = isCurrent

    if (isCurrent && !wasActive) {
      // ── Became active ──
      // Full reset. Also clear any lingering navigation lock from the
      // previous card — this is critical for the backward snap-back fix.
      navigatingRef.current = false
      clearFallback()
      setMediaIdx(0)
      setProgress(0)
      setPaused(false)
      setImageReady(false)
      armFallback()
    }

    if (!isCurrent && wasActive) {
      // ── Became inactive ──
      // Stop the timer and image load but do NOT reset mediaIdx:
      // the neighbour card still renders its last frame until it's
      // either scrolled away or becomes active again (where it resets).
      navigatingRef.current = false
      clearFallback()
      setProgress(0)
      setImageReady(false)
    }
  })

  // ── Notify parent ─────────────────────────────────────────────────────────
  useEffect(() => {
    onMediaChange?.(mediaIdx)
  }, [mediaIdx, onMediaChange])

  // ── Progress timer ─────────────────────────────────────────────────────────
  // mediaIdx in the dep array means the interval restarts cleanly for each
  // new slide, so there are never ghost ticks from the previous slide.
  useEffect(() => {
    if (!isCurrent || !open || paused || !imageReady) return
    const step = (TICK_MS / STORY_DURATION_MS) * 100
    const id = setInterval(() =>
      setProgress((p) => Math.min(p + step, 100)),
    TICK_MS)
    return () => clearInterval(id)
  }, [isCurrent, open, paused, imageReady, mediaIdx])

  // ── Advance on completion ──────────────────────────────────────────────────
  // navigatingRef.current is the single guard that prevents all snap-backs.
  // If anything is navigating — automatic or manual — this effect is a no-op.
  useEffect(() => {
    if (progress < 100) return
    if (!isCurrent || !open) return
    if (navigatingRef.current) return // ← key guard

    const total = story.stories?.length ?? 0
    if (mediaIdx < total - 1) goToMedia(mediaIdx + 1)
    else goNextStory()
  }, [progress, isCurrent, open, mediaIdx, story.stories?.length, goToMedia, goNextStory])

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalMedia   = story.stories?.length ?? 0
  const currentMedia = story.stories?.[mediaIdx]

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full select-none">

      {/* Loading spinner — active card only, while image loads */}
      {isCurrent && !imageReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
        </div>
      )}

      {/* Card shell */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl will-change-transform",
          "transition-[transform,opacity] duration-500 ease-out",
          isCurrent ? "z-30 scale-100 opacity-100" : "scale-[0.65] opacity-70"
        )}
      >
        {/* Image — keyed so React always remounts when the slide changes */}
        {isCurrent ? (
          <CldImage
            key={`${story.id}-${mediaIdx}`}
            src={error?'/posts/item1.png':currentMedia?.url ?? ""}
            alt={currentMedia?.caption ?? story.name ?? ""}
            fill
            preload
            className="object-cover"
            onError={() => setError(true)}
            onLoad={() => {
              setError(false)
              clearFallback()
              setImageReady(true)
            }}
            preserveTransformations
          />
        ) : (
          <CldImage
            key={`${story.id}-thumb`}
            src={story.stories?.[0]?.url ?? ""}
            alt={story.stories?.[0]?.caption ?? story.name ?? ""}
            fill
            className="object-cover"
          />
        )}

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-black/70 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        {/* Active story UI — only when image is fully ready */}
        {isCurrent && imageReady && (
          <div className="absolute inset-0 z-20 flex flex-col p-3">

            {/* Progress bars */}
            <div className="flex w-full gap-0.75">
              {Array.from({ length: totalMedia }).map((_, i) => (
                <div
                  key={story.stories?.[i]?.id ?? i}
                  className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width:
                        i < mediaIdx   ? "100%"
                        : i === mediaIdx ? `${progress}%`
                        : "0%",
                      transition: "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* User info row */}
            <div className="mt-3 flex items-center gap-2">
              <div className="relative size-9 shrink-0 overflow-hidden rounded-full border-2 border-white">
                {story.image && story.name ? (
                  <CldImage src={story.image} alt={story.name} fill priority className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-700">
                    <span className="text-xs font-bold text-white">
                      {story.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight text-white">{story.name}</span>
                <span className="text-[11px] font-light text-white/50">{formatDate(story.lastUpdatedAt)}</span>
              </div>
              {paused && (
                <div className=" rounded-lg ml-auto px-2 py-0.5 backdrop-blur-sm">
                  <MdPause className="text-[10px] font-medium  text-white"/>
                </div>
              )}
            </div>

            {/* Caption */}
            {currentMedia?.caption && (
              <div className="mt-auto">
                <p className="text-sm font-light leading-snug text-white/90 drop-shadow-md">
                  {currentMedia.caption}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tap zones — active card only */}
        {isCurrent && (
          <>
            <div
              className="absolute left-0 top-0 z-30 h-full w-[30%] cursor-pointer"
              onPointerDown={handleBack}
            />
            <div
              className="absolute left-[30%] top-0 z-30 h-full w-[40%] cursor-pointer"
              onPointerDown={() => setPaused(true)}
              onPointerUp={() => setPaused(false)}
              onPointerLeave={() => setPaused(false)}
              onPointerCancel={() => setPaused(false)}
            />
            <div
              className="absolute right-0 top-0 z-30 h-full w-[30%] cursor-pointer"
              onPointerDown={handleForward}
            />
          </>
        )}

        {/* Neighbour overlay */}
        {!isCurrent && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-[2px]">
            <div className="relative size-16 overflow-hidden rounded-full border-[3px] border-white md:size-20">
              {story.image && story.name ? (
                <CldImage src={story.image} alt={story.name} fill priority className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-700">
                  <span className="text-sm font-bold text-white">
                    {story.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-white/80">{story.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShowStory
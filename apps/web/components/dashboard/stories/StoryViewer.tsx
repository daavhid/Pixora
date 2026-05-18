"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Story } from "@repo/trpc/user"
import ShowStory from "./ShowStory"
import { MdClose } from "react-icons/md"

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoryViewerProps {
  stories: Story[]
  currentIndex: number
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

// ─── Component ────────────────────────────────────────────────────────────────
const StoryViewer = ({
  stories,
  currentIndex,
  setCurrentIndex,
  open,
  setOpen,
}: StoryViewerProps) => {
  const [api, setApi]               = useState<CarouselApi>()
  const [isMobile, setIsMobile]     = useState(false)
  const [currentMedia, setCurrentMedia] = useState(0)

  // Stable snapshot of initialIndex so the Carousel key + startIndex
  // never change after mount (prevents re-mount loops)
  const [initialIndex]  = useState(() => currentIndex)

  // Per-story media index refs — used by chevron logic to know
  // whether to advance media or the whole story
  const currentMediaRef = useRef(0)
  currentMediaRef.current = currentMedia

  // Refs to the "handleBack" / "handleForward" functions exposed by
  // the currently-active ShowStory card. We store them in refs so
  // the chevron buttons always call the latest version without
  // needing to re-render when the active story changes.
  const handleBackRef    = useRef<(() => void) | null>(null)
  const handleForwardRef = useRef<(() => void) | null>(null)

  // ── Responsive drag ───────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── Sync carousel → currentIndex ─────────────────────────────────────────
  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      const idx = api.selectedScrollSnap()
      setCurrentIndex(idx)
      setCurrentMedia(0) // reset media progress when story changes via carousel
    }

    api.on("select", onSelect)
    onSelect() // sync initial position

    return () => { api.off("select", onSelect) }
  }, [api, setCurrentIndex])

  // ── Jump to story when currentIndex is set externally ────────────────────
  useEffect(() => {
    if (!api) return
    api.scrollTo(currentIndex, false)
  }, [api, currentIndex])

  // ── Chevron handlers ──────────────────────────────────────────────────────
  // These delegate into the active ShowStory card, which already knows
  // whether to go back one media slide or a full story — no duplication.
  const handleChevronBack = useCallback(() => {
    handleBackRef.current?.()
  }, [])

  const handleChevronForward = useCallback(() => {
    handleForwardRef.current?.()
  }, [])

  // Determine whether the forward chevron should be visually disabled
  const isLastStory = currentIndex === stories.length - 1
  const isLastMedia  = currentMedia === (stories[currentIndex]?.stories?.length ?? 1) - 1
  const forwardDisabled = isLastStory && isLastMedia

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "h-screen max-h-screen w-full max-w-full! p-0",
          "bg-[#08080A] [&>button]:hidde",
          // Remove default DialogContent padding / rounded
          "rounded-none border-0 outline-none"
        )}
      >
        {/* ── Brand ── */}
        <h1 className='text-4xl absolute top-4 left-4  font-extrabold bg-repeat bg-linear-to-t  from-[#8B5CF6] via-[#22D3EE] via-30% to-[#7C3AED]  bg-clip-text text-transparent'>Pixora</h1>

        {/* ── Close ── */}
        <DialogClose className="absolute right-4 top-4 z-50 rounded-full p-1 text-white/60 outline-none transition-colors hover:text-white">
          <MdClose className="text-white text-5xl hover:opacity-70 transition-opacity" />
        </DialogClose>

        {/* ── Carousel ── */}
        <Carousel
          key={initialIndex}
          opts={{
            startIndex: initialIndex,
            align: "center",
            loop: false,
            containScroll: false,
            watchDrag: isMobile,
          }}
          setApi={setApi}
          className="h-screen w-full"
        >
          <CarouselContent className="flex h-screen items-center">
            {stories.map((story, index) => {
              const active = currentIndex === index

              return (
                <CarouselItem
                  key={story.id}
                  className="flex aspect-[9/16] max-h-[90vh] basis-[75%] items-center justify-center overflow-hidden md:basis-[26%]"
                >
                  <ShowStory
                    story={story}
                    index={index}
                    currentIndex={currentIndex}
                    isCurrent={active}
                    lastIndex={stories.length - 1}
                    api={api}
                    open={open}
                    onMediaChange={(m) => {
                      currentMediaRef.current = m
                      if (active) setCurrentMedia(m)
                    }}
                    // Pass callback refs down so chevrons can delegate
                    // without needing a custom command/event bus
                    onRegisterHandlers={
                      active
                        ? (back, forward) => {
                            handleBackRef.current    = back
                            handleForwardRef.current = forward
                          }
                        : undefined
                    }
                  />
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>

        {/* ── Chevron: Back ── */}
        <button
          onClick={handleChevronBack}
          disabled={currentIndex === 0 && currentMedia === 0}
          aria-label="Previous"
          className={cn(
            "absolute bottom-[46%] left-[7%] z-40 md:left-[33%]",
            "flex size-9 items-center justify-center rounded-full",
            "border border-white/15 bg-white/10 backdrop-blur-md",
            "text-white transition-all duration-200",
            "hover:bg-white/20 hover:scale-110",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* ── Chevron: Forward ── */}
        <button
          onClick={handleChevronForward}
          disabled={forwardDisabled}
          aria-label="Next"
          className={cn(
            "absolute bottom-[46%] right-[7%] z-40 md:right-[33%]",
            "flex size-9 items-center justify-center rounded-full",
            "border border-white/15 bg-white/10 backdrop-blur-md",
            "text-white transition-all duration-200",
            "hover:bg-white/20 hover:scale-110",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
        >
          <ChevronRight className="size-5" />
        </button>
      </DialogContent>
    </Dialog>
  )
}

export default StoryViewer

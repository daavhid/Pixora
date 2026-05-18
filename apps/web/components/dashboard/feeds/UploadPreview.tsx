'use client'

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react'

import Cropper, { Area } from 'react-easy-crop'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { LuVolume2, LuVolumeX } from 'react-icons/lu'
import { uploadPreview } from './UploadFile'
import { MediaFile } from './CreatePostDialog'

const aspectMap = {
  '1:1': 1,
  '4:5': 4 / 5,
  '16:9': 16 / 9,
}

type AspectType = '1:1' | '4:5' | '16:9'

const UploadPreview = ({
  previews,
  mediaFiles,
  setMediaFiles,
  previewStory = false,
}: {
  previews: uploadPreview[]
  mediaFiles: MediaFile[]
  setMediaFiles: React.Dispatch<React.SetStateAction<MediaFile[]>>
  previewStory?: boolean
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState<AspectType>('1:1')
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)
  const [isCropApplied, setIsCropApplied] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null)

  // Keep a ref to mediaFiles so the restore effect can read the
  // latest value without having it as a dependency (which caused
  // the re-run loop every time applyCrop called setMediaFiles).
  const mediaFilesRef = useRef(mediaFiles)
  mediaFilesRef.current = mediaFiles

  const hasMultipleMedia = previews.length > 1

  /* ---------------------------------- */
  /* RESTORE CROP — only on index change */
  /* ---------------------------------- */

  useEffect(() => {
    // Read from ref, not from state — no dependency on mediaFiles
    const currentMedia = mediaFilesRef.current.find(
      (item) => item.id === previews[currentIndex]?.id
    )

    if (!currentMedia) {
      // Fresh slide with no saved crop — reset to defaults
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setAspect('1:1')
      setCroppedPixels(null)
      return
    }

    // Restore saved crop position
    setCrop(currentMedia.crop ?? { x: 0, y: 0 })

    // Restore saved zoom
    setZoom(currentMedia.zoom ?? 1)

    // Restore saved aspect ratio
    const foundAspect = (
      Object.entries(aspectMap) as [AspectType, number][]
    ).find(([_, value]) => value === currentMedia.aspect)

    setAspect(foundAspect ? foundAspect[0] : '1:1')

    // Restore saved crop pixels
    if (currentMedia.width && currentMedia.height) {
      setCroppedPixels({
        x:      currentMedia.x      ?? 0,
        y:      currentMedia.y      ?? 0,
        width:  currentMedia.width,
        height: currentMedia.height,
      })
    } else {
      setCroppedPixels(null)
    }

    // Reset applied state when navigating to a new slide
    setIsCropApplied(!!currentMedia.width && !!currentMedia.height)

  // ✅ Only currentIndex and previews — NOT mediaFiles.
  // mediaFilesRef.current always has the latest value without
  // needing to be a dependency.
  }, [currentIndex, previews])

  /* ---------------------------------- */
  /* ASPECT CHANGE */
  /* ---------------------------------- */

  const handleAspectChange = (ratio: AspectType) => {
    setAspect(ratio)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedPixels(null)
    setIsCropApplied(false)
  }

  /* ---------------------------------- */
  /* CROP COMPLETE */
  /* ---------------------------------- */

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedPixels(croppedAreaPixels)
  }, [])

  /* ---------------------------------- */
  /* APPLY CROP */
  /* ---------------------------------- */

  const applyCrop = () => {
    if (!croppedPixels) return

    setMediaFiles((prev) =>
      prev.map((item) => {
        if (item.id !== previews[currentIndex]?.id) return item

        return {
          ...item,
          x:      croppedPixels.x,
          y:      croppedPixels.y,
          width:  croppedPixels.width,
          height: croppedPixels.height,
          aspect: aspectMap[aspect],
          crop,
          zoom,
        }
      })
    )

    setIsCropApplied(true)
  }

  /* ---------------------------------- */
  /* VIDEO MUTE */
  /* ---------------------------------- */

  const toggleMute = () => {
    const video   = videoRef.current
    const bgVideo = backgroundVideoRef.current
    if (!video || !bgVideo) return

    const newMuted = !video.muted
    video.muted   = newMuted
    bgVideo.muted = newMuted
    setMuted(newMuted)
  }

  /* ---------------------------------- */
  /* NAVIGATION */
  /* ---------------------------------- */

  const next = () =>
    setCurrentIndex((p) => (p === previews.length - 1 ? p : p + 1))

  const prev = () =>
    setCurrentIndex((p) => (p === 0 ? p : p - 1))

  /* ---------------------------------- */
  /* EMPTY STATE */
  /* ---------------------------------- */

  if (!previews?.length || !previews[currentIndex]) {
    return (
      <div className="h-[75vh] flex items-center justify-center bg-gray-100 text-gray-500">
        No media to preview
      </div>
    )
  }

  const media = previews[currentIndex]

  return (
    <div className="h-full">
      <div className="relative flex items-center justify-center w-full h-full overflow-hidden bg-black rounded-lg aspect-square group">

        {/* VIDEO */}
        {media.file.type === 'video/mp4' ? (
          <div className="relative w-full h-full">
            <video
              ref={backgroundVideoRef}
              src={media.url}
              autoPlay
              muted
              playsInline
              loop
              className="absolute inset-0 object-cover w-full h-full scale-105 blur-lg"
            />
            <video
              ref={videoRef}
              src={media.url}
              autoPlay
              muted
              playsInline
              loop
              className="relative z-10 object-contain w-full h-full"
            />
            <button
              onClick={toggleMute}
              className="absolute z-20 p-2 text-white rounded-full bottom-4 right-4 bg-black/60"
            >
              {muted ? <LuVolumeX /> : <LuVolume2 />}
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full bg-black">

            {/* Aspect selector */}
            {!previewStory && (
              <div className="absolute left-2 bottom-2 z-50 flex gap-2">
                {(['1:1', '4:5', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => handleAspectChange(ratio)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      aspect === ratio
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-black'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            )}

            {/* Cropper — keyed on both media id AND aspect so it
                remounts cleanly when either changes, preventing the
                cropper from rendering stale image/aspect combos    */}
            <Cropper
              key={`${media.id}-${aspect}`}
              image={media.url}
              crop={crop}
              zoom={zoom}
              aspect={previewStory ? 9 / 16 : aspectMap[aspect]}
              onCropChange={(c) => { setCrop(c); setIsCropApplied(false) }}
              onZoomChange={(z) => { setZoom(z); setIsCropApplied(false) }}
              onCropComplete={onCropComplete}
            />

            {/* Apply crop */}
            <div className="absolute z-50 bottom-4 right-4">
              <button
                onClick={applyCrop}
                disabled={!croppedPixels}
                className={`
                  flex items-center gap-1.5 px-4 py-2 text-sm rounded-md font-medium
                  transition-all duration-300
                  ${
                    isCropApplied
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-white text-black hover:bg-gray-100'
                  }
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
              >
                {isCropApplied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Crop Applied
                  </>
                ) : (
                  'Apply Crop'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Prev */}
        {hasMultipleMedia && currentIndex > 0 && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/70"
          >
            <FaChevronLeft />
          </button>
        )}

        {/* Next */}
        {hasMultipleMedia && currentIndex < previews.length - 1 && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/70"
          >
            <FaChevronRight />
          </button>
        )}
      </div>
    </div>
  )
}

export default UploadPreview
'use client'
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useInView } from "react-intersection-observer";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Post, SavedPost } from "@repo/trpc/post";
import { CldImage } from "next-cloudinary";
import { getImageUrl } from "@/cloudinary/utils";

const FeedCard = ({ feed,imgClassName }: { feed: Post | SavedPost,imgClassName:string }) => {
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const videoTimeRef = useRef<number>(0); // Store pause position
  const hasMultipleMedia = feed.medias.length > 1;

  

  /* ------------------ VIDEO PLAY CONTROL (PRESERVE CURRENTTIME) ------------------ */


  /* ------------------ SYNC MUTED STATE TO VIDEO REF ------------------ */
  // useEffect(() => {
  //   const video = videoRefs.current[current];
  //   if (!video) return;
  //   video.muted = muted;
  // }, [muted, current]);

  /* ------------------ CAROUSEL SETUP ------------------ */
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    // 🔥 Critical fix: re-init AFTER layout stabilizes
    const timeout = setTimeout(() => {
      api.reInit();
      api.scrollTo(0, true);
      setCurrent(0);
    }, 120);

    return () => {
      api.off("select", onSelect);
      clearTimeout(timeout);
    };
  }, [api, feed.medias.length]);

  /* ------------------ DIALOG / REMOUNT SAFETY ------------------ */
  useEffect(() => {
    if (!api) return;

    api.reInit();
    api.scrollTo(0, true);
  }, [api]);

  /* ------------------ ACTIONS ------------------ */


  const setCarouselFrame = (index: number) => {
    api?.scrollTo(index);
  };

  /* ------------------ VIDEO COMPONENT ------------------ */
  const VideoPlayer = ({
    url,
    isActive,
    index
  }: {
    url: string;
    isActive: boolean;
    index:number
  }) => {
    const [muted, setMuted] = useState(true)
    const { ref: inViewRef, inView } = useInView({
    threshold: 0.7,
  });

    useEffect(() => {
    const video = videoRefs.current[current];
    if (!video) return;

    if (inView) {
      // Resume from saved position
      video.currentTime = videoTimeRef.current;
      video.play().catch(() => {});
    } else {
      // Save position before pausing
      videoTimeRef.current = video.currentTime;
      video.pause();
    }
  }, [inView]);
    
    // Memoize ref callback to prevent video remounting
    const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
      if (el && videoRefs.current[index] !== el) {
        videoRefs.current[index] = el;
      }
    }, [index]);

    const toggleMute = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();

      const video = videoRefs.current[index];
      if (!video) return;

      video.muted = !video.muted;
      setMuted(video.muted)
    };
    return (

      <div ref={inViewRef} className="relative w-full h-full aspect-square overflow-hidden">

        {/* Background blur (does NOT affect layout) */}
        <video
          src={url}
          muted
          // preload="none"
          // aria-hidden
          // style={{ pointerEvents: "none" }}
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-105 opacity-40"
        />

        {/* Main video */}
        <video
          ref={setVideoRef}
          src={url}
          muted
          loop
          autoPlay={isActive}
          className="absolute inset-0 w-full h-full object-contain z-10"
        />

        <button
          onClick={(e)=>{
            toggleMute(e,index)
          }}
          className={cn("absolute bottom-4 right-4 z-20 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/80",isActive?'block':'hidden')}
        >
          {videoRefs.current[index]?.muted ? <LuVolumeX size={20} /> : <LuVolume2 size={20} />}
          
        </button>
      </div>
    )
  };

  return (
    <div  className="bg-black h-full   ">
      <div className="group h-full   bg-black ">

        {hasMultipleMedia ? (
          <Carousel
            key={feed.id}
            opts={{
              startIndex: 0,
              align: "start",
              watchSlides: false, // 🔥 IMPORTANT
            }}
            setApi={setApi}
            className="relative "
          >
            <CarouselContent className="h-full">
              {feed.medias.map((media, idx: number) => (
                <CarouselItem key={`${media.id}_${idx}`} className="  flex  items-center ">

                  {media.type === "image" ? (
                    <div className={cn(` relative  w-full max-h-150 `,)} style={{ aspectRatio: media.aspect! }}>
                      
                      <CldImage
                        src={getImageUrl(media!)}
                        // width={feed.medias[0].width!}
                        // height={feed.medias[0].height!}
                        fill
                        preserveTransformations
                        alt="Post image"
                        className=""
                      />
                    </div>
                  ) : (
                    <VideoPlayer
                      url={media.url}
                      isActive={current === idx}
                      index={idx}
                    />
                  )}

                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Controls */}
            <div className="absolute inset-0 z-20 pointer-events-none">

              <CarouselPrevious className="pointer-events-auto left-4 bg-black/50 hover:bg-black/80 border-none text-white h-10 w-10" />
              <CarouselNext className="pointer-events-auto right-4 bg-black/50 hover:bg-black/80 border-none text-white h-10 w-10" />

              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <div className="flex gap-1.5">
                  {feed.medias.map((_: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => setCarouselFrame(i)}
                      className={cn(
                        "w-2 h-2 rounded-full cursor-pointer pointer-events-auto transition-all",
                        current === i ? "bg-white scale-110" : "bg-white/40"
                      )}
                    />
                  ))}
                </div>
              </div>

            </div>
          </Carousel>
        ) : (
          <div className='bg-black  flex h-full items-center'>
            {feed.medias[0]?.type === "image" ? (
              <div className={cn(` relative  w-full rounded-[1.5rem] `,)} style={{ aspectRatio: feed.medias[0]?.aspect || '1/1' }}>
                <CldImage
                  src={getImageUrl(feed.medias[0]!)}
                  // width={feed.medias[0].width!}
                  // height={feed.medias[0].height!}
                  fill
                  preserveTransformations
                  alt="Post image"
                  className=""
                />
              </div>
            ) : (
              <VideoPlayer
                url={feed.medias[0]?.url!}
                index={0}
                isActive={true}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FeedCard;
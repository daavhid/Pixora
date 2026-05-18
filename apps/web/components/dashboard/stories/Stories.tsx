'use client'
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import { CldImage } from "next-cloudinary"

import { FaPlus } from "react-icons/fa";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import StoryViewer from './StoryViewer';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import AddStory from './AddStory';
export interface StoryMedia {
  id: string;
  url: string;
  type: "image" | "video";
  duration?: number; // Duration in seconds (useful for progress bars)
  caption?: string;
  viewed: boolean;
  createdAt: string;
}

export interface UserStoryGroup {
  id: string; // User ID
  username: string;
  fullName: string;
  avatar: string;
  isVerified: boolean;
  lastUpdated: string; // Used to sort the story tray
  hasUnread: boolean;
  stories: StoryMedia[];
}

export const dummyStories: UserStoryGroup[] = [
  {
    id: "user-1",
    username: "iamnora",
    fullName: "Nora James",
    avatar: "https://i.pravatar.cc/150?img=32",
    isVerified: true,
    lastUpdated: "2026-04-22T08:10:00Z",
    hasUnread: true,
    stories: [
      {
        id: "m-101",
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        type: "image",
        duration: 5,
        caption: "Golden hour in Lagos ✨",
        viewed: true,
        createdAt: "2026-04-22T07:00:00Z",
      },
      {
        id: "m-102",
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        type: "image",
        duration: 5,
        caption: "Second cup of the day ☕",
        viewed: false,
        createdAt: "2026-04-22T08:10:00Z",
      }
    ]
  },
  {
    id: "user-2",
    username: "davidcodes",
    fullName: "David Ojo",
    avatar: "https://i.pravatar.cc/150?img=12",
    isVerified: false,
    lastUpdated: "2026-04-22T09:30:00Z",
    hasUnread: true,
    stories: [
      {
        id: "m-201",
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        type: "image",
        duration: 7,
        caption: "Debugging this NestJS microservice... 🛠️",
        viewed: false,
        createdAt: "2026-04-22T09:30:00Z",
      }
    ]
  },
  {
    id: "user-3",
    username: "theama",
    fullName: "Amaka Bello",
    avatar: "https://i.pravatar.cc/150?img=47",
    isVerified: false,
    lastUpdated: "2026-04-22T10:45:00Z",
    hasUnread: false,
    stories: [
      {
        id: "m-301",
        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
        type: "image",
        duration: 5,
        caption: "New sneakers just arrived!",
        viewed: true,
        createdAt: "2026-04-22T10:00:00Z",
      },
      {
        id: "m-302",
        url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
        type: "image",
        duration: 5,
        caption: "Streetwear mood today 👟",
        viewed: true,
        createdAt: "2026-04-22T10:45:00Z",
      }
    ]
  },
 
  {
    id: "user-5",
    username: "chef_tobi",
    fullName: "Tobi Wright",
    avatar: "https://i.pravatar.cc/150?img=11",
    isVerified: false,
    lastUpdated: "2026-04-22T12:05:00Z",
    hasUnread: true,
    stories: [
      {
        id: "m-501",
        url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        type: "image",
        duration: 5,
        caption: "Brunch is served 🥞",
        viewed: false,
        createdAt: "2026-04-22T12:00:00Z",
      },
      {
        id: "m-502",
        url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        type: "image",
        duration: 5,
        caption: "Healthy living options 🥗",
        viewed: false,
        createdAt: "2026-04-22T12:05:00Z",
      }
    ]
  },
  {
    id: "user-6",
    username: "pixelbytee",
    fullName: "Teni Alade",
    avatar: "https://i.pravatar.cc/150?img=20",
    isVerified: true,
    lastUpdated: "2026-04-22T13:40:00Z",
    hasUnread: true,
    stories: [
      {
        id: "m-601",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-603",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-601",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-601",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-603",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-604",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-605",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-606",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      },
      {
        id: "m-602",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        type: "image",
        duration: 5,
        caption: "Studio portraits loading...",
        viewed: false,
        createdAt: "2026-04-22T13:40:00Z",
      }
    ]
  }
];


const Stories = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [currentIndex,setCurrentIndex] = useState(0)
  const [open,setOpen] = useState(false)
  const [openAddDialog,setOpenAddDialog] = useState(false)

  const trpc = useTRPC()
  const {data,isFetching} = useQuery(trpc.user.getStories.queryOptions())

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    api.on("select", onSelect);
    api.on("reInit", onSelect);
    onSelect(); // Initial check
  }, [api]);
  return (
    <div className="w-5/6">
      <Carousel
        opts={{
          align: "start",
          // dragFree: true,
          slidesToScroll:4,
          // dragThreshold: 20,
          containScroll: "trimSnaps",
          startIndex: 0,
          duration: 20,      // Slightly higher duration (20-25) actually feels more 'intentional'
          skipSnaps: true,
        }}
        setApi={setApi}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4">
          {/* --- Add Story Item --- */}
          <CarouselItem onClick={()=>{
            setOpenAddDialog(true)
          }} className="pl-4 basis-1/5">
            <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer group">
              <div className="size-20 rounded-full relative p-0.5 overflow-hidden flex items-center justify-center">
                {/* Inner Circle */}
                <div className="z-10 size-full rounded-full flex items-center justify-center bg-[#262627]">
                  <FaPlus className="text-xl text-[#BA9EFF]" />
                </div>
                {/* Animated Gradient Border */}
                <div className="absolute inset-0 group-hover:rotate-180 transition-transform duration-700 bg-[linear-gradient(-135deg,#BA9EFF_0%,#70CBFD_25%,#69D0FD_53%,#60D5FC_88%,#53DDFC_100%)]"></div>
              </div>
              <p className="text-sm text-[#ADAAAB] text-center">Add Story</p>
            </div>
          </CarouselItem>

          <AddStory openAddDialog={openAddDialog} setOpenAddDialog={setOpenAddDialog}/>

          {/* --- Artist Stories --- */}
          {data?.map((story,index) => (
            <CarouselItem onClick={()=>{
              setCurrentIndex(index)
              setOpen(true)
            }} key={story.id} className="pl-4 basis-1/5">
              <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                <div className="size-24 rounded-full relative p-0.5 overflow-hidden">
                  {/* Avatar Wrapper with "Cutout" effect */}
                  <div className="z-10 size-full relative rounded-full overflow-hidden border-[3px] border-[#121212]">
                    {
                      story?.image && story?.name ? (
  
                        <CldImage
                          src={story?.image}
                          alt={story?.name}
                          priority
                          fill
                          className="object-cover"
                        />
                      ):(
                        <div>
                          <span className='text-white text-xs font-semibold'>
                            {story.name!.charAt(0).toUpperCase()}
                          </span>
                          
                        </div>
                      )
                    }
                  </div>
                  {/* Story Ring Gradient */}
                  <div className="absolute inset-0 group-hover:rotate-180 transition-transform duration-700 bg-[linear-gradient(-135deg,#BA9EFF_0%,#70CBFD_25%,#69D0FD_53%,#60D5FC_88%,#53DDFC_100%)]"></div>
                </div>
                <p className="text-sm text-[#ADAAAB] text-center truncate w-32">
                  {story.isMyStory?'your story':story.name}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute inset-0 z-50 pointer-events-none">
          {
            canScrollPrev && (
              <CarouselPrevious variant={"outline"} className={cn("pointer-events-auto -left-2 active:-translate-y-[80%] -translate-y-[80%] bg-[linear-gradient(135deg,#BA9EFF_0%,#70CBFD_25%,#69D0FD_53%,#60D5FC_88%,#53DDFC_100%)] border-none text-black font-bold size-6",canScrollPrev ? "opacity-100": "opacity-0")} />
            )
          }
          {
            canScrollNext && (

              <CarouselNext variant={"outline"} className={cn("pointer-events-auto active:-translate-y-[80%] -right-2 -translate-y-[80%] bg-[linear-gradient(135deg,#BA9EFF_0%,#70CBFD_25%,#69D0FD_53%,#60D5FC_88%,#53DDFC_100%)] border-none text-black text-2xl font-bold size-6")} />
            )
          }
        </div>
      </Carousel>
      {
        data && (
          <StoryViewer open={open} setOpen={setOpen} stories={data} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex}/>
        )
      }
    </div>
  );
};

export default Stories;
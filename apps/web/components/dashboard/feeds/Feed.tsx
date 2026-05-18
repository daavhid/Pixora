'use client'
import React, { useEffect,useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '../../ui/card';
import Image from 'next/image';

import { MdOutlineMoreHoriz } from "react-icons/md";

import FeedCard from './FeedCard';
import FeedFooter from './FeedFooter';
import CreatePostDialog from './CreatePostDialog';

import { useTRPC } from '@/utils/trpc';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useInView } from "react-intersection-observer";
import { cn } from '@/lib/utils';
import { Post } from '@repo/trpc/post'
import CommentsDialog from '../comments/CommentsDialog';
import { RiLoader2Line } from 'react-icons/ri';

import { formatDate } from '@/utils/util';


const Feed = () => {
  const [open,setOpened] = useState(false)
  const [activePost,setActivePost] = useState<Post | null>(null)
  const trpc = useTRPC()
  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useInfiniteQuery(trpc.post.getAllPost.infiniteQueryOptions(
    {
      limit:3,
      cursor:undefined,
      profileUserId:undefined
    },
    {
      getNextPageParam: (lastPage) => (
        lastPage.hasNextPage ? lastPage.cursor : undefined
      )
    }
))

const {ref,inView} = useInView({
  threshold:0,
  delay:100,
  trackVisibility:true,
})

useEffect(()=>{
  if(inView && hasNextPage && !isFetchingNextPage){
    console.log('now in view and fetching data')
    fetchNextPage()
  }
},[inView,hasNextPage,isFetchingNextPage,fetchNextPage])

const feeds = data?.pages.flatMap(page=>page.posts) ?? []
  return (
    <div className='flex relative flex-col max-w-5/7  space-y-8'>
      {/* Loader when initially loading or refetching */}
      {isLoading && (
        <div className='flex flex-col relative items-center justify-center  space-y-1'>
          <div className=" bg-gray-200 dark:bg-gray-800  animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <RiLoader2Line className="w-8 h-8 text-[#BA9EFF] animate-spin" />
            </div>
          </div>
        </div>
      )}

      {/* Top loader bar when refetching */}
      {isFetching && !isLoading && (
        <div className='flex flex-col relative items-center justify-center  space-y-1'>
          <div className=" bg-gray-200 dark:bg-gray-800 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <RiLoader2Line className="w-8 h-8 text-[#BA9EFF] animate-spin" />
            </div>
          </div>
        </div>
      )}
      {
        feeds?.map((feed)=>(
          <Card key={feed.id} className=' gap-0 bg-transparent p-0'>
            <CardHeader className='flex justify-between p-0 mb-2 items-center px-2'>
              <div className='flex gap-1 items-cente'>
                <div className='size-10'>
                  {
                    feed.user.image ? (

                      <Image src={feed.user.image} alt={feed.user?.name!} priority  width={40} height={40} className=' w-full h-full object-cover rounded-full relative' />
                    ):(
                      <div className='w-8 h-8 rounded-full bg-linear-to-r from-purple-500 to-pink-500 shrink-0 flex items-center justify-center'>
                        <span className='text-white text-xs font-semibold'>
                          {feed.user.name!.charAt(0).toUpperCase()}
                        </span>
                        
                      </div>
                    )
                  }
                </div>
                <div className=''>
                  <p className='text-white font-semibold text-base'>{feed.user.name}</p>
                  <p className='text-[#ADAAAB] text-xs font-medium'>{feed.location}</p>
                </div>
                <div className='text-[#ADAAAB] text-xs gap-2 ml-3 pt-1 inline-flex items-center place-self-start'>
                  <div className='size-1 rounded-full bg-gray-400'></div>
                    {formatDate(feed.createdAt)}
                </div>
              </div>
              <MdOutlineMoreHoriz className='text-2xl text-[#ADAAAB]'/>
            </CardHeader>
            <CardContent className=' relative p-0! rounded-sm border border-white/30 overflow-hidde'>
              <FeedCard feed={feed} imgClassName={''}/>
            </CardContent>
            <CardFooter  className='bg-transparent p-0 pt-2  px-4 border-none'>
              <FeedFooter feed={feed} setOpened={setOpened} setActivePost={setActivePost}/>
            </CardFooter>
          </Card>
        ))
      }
      {feeds.length > 1 &&  ( <div ref={ref} className={cn('h-1 w-64 absolute bottom-0')}></div>)}

      {/* Bottom loader when fetching next page */}
      {isFetchingNextPage && (
        <div className='flex flex-col relative items-center justify-center  space-y-1'>
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 top-6 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <RiLoader2Line className="w-8 h-8 text-[#BA9EFF] animate-spin" />
            </div>
          </div>
        </div>
      )}

      <CreatePostDialog/>
      {
        activePost && <CommentsDialog feed={activePost} isOpen={open} setIsOpen={setOpened}/>
      }
    </div>
  )
}

export default Feed
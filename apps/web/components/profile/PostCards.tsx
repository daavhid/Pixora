'use client'
import React,{ReactHTMLElement, Ref, useEffect, useState} from 'react'
import { Post } from '@repo/trpc/post'
import Image from 'next/image';
import { cn } from '@/lib/utils';
import CommentsDialog from '../dashboard/comments/CommentsDialog';
import { FiMessageSquare } from 'react-icons/fi';
import { FaHeart, FaMessage } from "react-icons/fa6";
import { Loader2 } from 'lucide-react';
import { RiLoader2Line } from "react-icons/ri";
import { useTRPC } from '@/utils/trpc';
import { useInfiniteQuery } from '@tanstack/react-query';
import { UserProfile } from '@repo/trpc/user';
import { CldImage } from 'next-cloudinary';
import { getImageUrl } from '@/cloudinary/utils';
import { useInView } from 'react-intersection-observer';


const PostCards = ({user}:{user:UserProfile}) => {
    const [isOpened,setIsOpened] = useState(false)
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
            profileUserId:user.id
          },
          {
            getNextPageParam: (lastPage) => (
              lastPage.hasNextPage ? lastPage.cursor : undefined
            )
          }
      ))
      const posts = data?.pages.flatMap(page=>page.posts) ?? []
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
  return (
    <div className='relative'>
      {/* {isLoading &&(
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 top-6 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <RiLoader2Line className="w-8 h-8 text-[#BA9EFF] animate-spin" />
            </div>
          </div>
        )} */}
        <div className='grid grid-cols-2 gap-2 mt-6  w-full'>
            {
              posts.map((post,idx)=>(
                  <div  key={idx} className={cn('rounded-lg relative group overflow-hidden', idx===0 && 'col-span-2')}>
                    <div className='w-full h-80 rounded-lg relative ' style={{ aspectRatio: post.medias[0]?.aspect || '1/1' }}>

                      <CldImage src={getImageUrl(post?.medias[0]!)} alt={post?.medias[0]?.altText || 'post media'} fill className='object-cover group-hover:scale-110 transition-transform duration-300 ' preserveTransformations />          
                    </div>
                      <div onClick={()=>{
                              setActivePost(post)
                              setIsOpened(true)

                          }} className='absolute flex items-center   justify-center gap-3  inset-0 hover:bg-black/50 transition-colors duration-300 cursor-pointer'>
                            <div className='flex group-hover:opacity-100 opacity-0 transition-opacity duration-300 items-center gap-2 cursor-pointer font-bold'>
                                <div className='cursor-pointer'>
                                  <FaHeart className='text-white text-xl'/>
                                </div>
                                <span className='text-white '>{post.likesCount}</span>
                            </div>
                            <div  className='flex group-hover:opacity-100 opacity-0 transition-opacity duration-300 items-center gap-2 cursor-pointer font-bold'>
                                <FaMessage className='text-white text-xl' />
                                <span className='text-white '>{post.commentsCount}</span>
                            </div>
                          
                      </div>
                      {post.medias.length > 1 && (
                        <div className="absolute top-2 right-2 rounded-full p-1">
                          <div className="flex gap-0.5">
                            {post.medias.slice(0, 3).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
                            ))}
                          </div>
                        </div>
                      )}  
                  </div>
              ))
            }
            {
              activePost && <CommentsDialog feed={activePost} isOpen={isOpened} setIsOpen={setIsOpened}/>
            }
            {
              (<EndIndicator ref={ref}/>)
            }
        </div>
    </div>
  )
}

const EndIndicator = ({ref}:{ref:Ref<HTMLDivElement>}) => (
  <div ref={ref} className="col-span-2 py-2 flex flex-col items-center justify-center gap-1">
    <div className="w-12 h-12 rounded-full bg-transparent dark:bg-gray-800 flex items-center justify-center">
      <FaHeart className="text-gray-400 text-xl" />
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400">You've seen all posts</p>
  </div>
);

export default PostCards
import { FeedPost } from '@/types/dashboard.types'
import React, { useState } from 'react'

import { FaRegHeart } from "react-icons/fa6";
import { FaHeart } from "react-icons/fa6";
import { BiSend } from "react-icons/bi";
import { LuBookmark, LuBookMarked } from "react-icons/lu";
import {Post} from "@repo/trpc/post"
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CommentsDialog from '../comments/CommentsDialog'
import { formatDate } from '@/utils/util';
import { LuMessageCircle } from "react-icons/lu";
import { MdBookmark } from 'react-icons/md';

const FeedFooter = ({feed,setOpened,setActivePost}:{feed:Post,setOpened:React.Dispatch<React.SetStateAction<boolean>>,setActivePost:React.Dispatch<React.SetStateAction<Post|null>>}) => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const infinitePostsQuery = trpc.post.getAllPost.infiniteQueryKey()
    const toggleLike = useMutation(trpc.post.toggleLike.mutationOptions(
        {
            onMutate:async ({postId}) => {
                feed.likesCount += feed.hasLiked ? -1 : 1
                feed.hasLiked = !feed.hasLiked
                return { previousFeed: feed }
            }
        }
    ))
    const toggleSave = useMutation(trpc.post.toggleSave.mutationOptions(
        {
            onMutate:async ({postId}) => {
                feed.savedCount += feed.hasSaved ? -1 : 1
                feed.hasSaved = !feed.hasSaved
                return { previousFeed: feed }
            }
        }
    ))
    const [isLiked,setisLiked] = useState(feed.hasLiked)

    const toggleLiked = ()=>{
        try{
            toggleLike.mutateAsync(
                {postId:feed.id},
                {
                    onSuccess:(data)=>{
                        feed.hasLiked = data.liked
                    },
                    onSettled: () => {
                        queryClient.invalidateQueries({ queryKey: infinitePostsQuery });
                    }
                }
            )
        }catch(err){
            console.error(err)
        }
        
    
        
    }
    const toggleSaved = ()=>{
        toggleSave.mutateAsync(
            {
                postId:feed.id,
            },
            {
                onSuccess:(data)=>{
                    feed.hasSaved = data.savedPost
                },
                onSettled: () => {
                    queryClient.invalidateQueries({ queryKey: infinitePostsQuery });
                }
            }
        )
    }
  return (
    <div className='w-full'>
        <div className='flex w-full justify-between items-center'>
            <div className='flex items-center space-x-5'>
                <div className='flex items-center gap-1'>
                    <div onClick={toggleLiked} className='cursor-pointer'>
                        {feed.hasLiked ? <FaHeart className='text-red-500 text-2xl'/> : <FaRegHeart className='text-white text-2xl'/>}
                    </div>
                    <span className='text-[#ADAAAB] text-sm font-semibold'>{feed.likesCount}</span>
                </div>
                <div onClick={()=>{
                    setOpened(true)
                    setActivePost(feed)
                }} className='flex items-center gap-1 cursor-pointer'>
                    <LuMessageCircle className='text-white text-2xl' />
                    <span className='text-[#ADAAAB] text-sm font-semibold '>{feed.commentsCount}</span>
                </div>
                
                <div>
                    <BiSend className='text-white text-2xl'/>
                </div>
            </div>
            {
                !feed.isSelfPost && (
                    <div onClick={toggleSaved}>
                        {feed.hasSaved ? <MdBookmark className='text-2xl text-white'/> : <LuBookmark className='text-white text-2xl'/>}
                        
                    </div>
                )
            }
        </div>

        <div className='mt-4'>
            <p className='leading-tight'><span className='text-white font-semibold mr-2'>{feed.user.name}</span> <span className='text-[#ADAAAB]'>{feed.caption}</span></p>
        </div>
    </div>
  )
}

export default FeedFooter
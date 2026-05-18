'use client'

import React, { useState } from 'react'
import { FaRegHeart, FaHeart } from 'react-icons/fa6'
import {Comment} from "@repo/trpc/post"
import { useTRPC } from '@/utils/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/utils/util'



const CommentItem = ({ comment }: {comment:Comment}) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [isLiked, setIsLiked] = useState(comment.hasLiked)
  const [likeCount, setLikeCount] = useState(comment.likesCount)
  
  const toggleCommentLike = useMutation(trpc.post.toggleCommentlike.mutationOptions(
    {
        onMutate:()=>{
            setIsLiked(!isLiked)
            setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
        }
    }
  ))
  const infiniteCommentQueryKey = trpc.post.getInfinteComment.infiniteQueryKey({postId:comment.postId})

  const handleLike = () => {
    console.log(comment)
    toggleCommentLike.mutateAsync({
        commentId:comment.id
    },{
        onSuccess:(data)=>{
            setIsLiked(data.liked)
        },
        onSettled:()=>{
            queryClient.invalidateQueries({queryKey:infiniteCommentQueryKey})
        }
    })
  }

  

  return (
    <div className='flex gap-3'>
      {/* Avatar */}
      <div className='w-8 h-8 rounded-full bg-linear-to-r from-purple-500 to-pink-500 shrink-0 flex items-center justify-center'>
        <span className='text-white text-xs font-semibold'>
          {comment.user.name!.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Comment Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1'>
            <div className='bg-gray-900 rounded-2xl px-4 py-2'>
              <p className='text-white font-semibold text-sm'>{comment.user.name}</p>
              <p className='text-gray-300 text-sm wrap-break-words'>{comment.content}</p>
            </div>
          </div>

          {/* Like Button */}
          <button
            onClick={handleLike}
            className='shrink-0 pt-1 hover:opacity-70 transition-opacity'
          >
            {isLiked ? (
              <FaHeart className='text-red-500 text-sm' />
            ) : (
              <FaRegHeart className='text-gray-500 text-sm hover:text-white' />
            )}
          </button>
        </div>

        {/* Footer: Time and Actions */}
        <div className='mt-1 px-4 flex items-center gap-3'>
          <span className='text-xs text-gray-500'>{formatDate(comment.createdAt)}</span>
          {likeCount > 0 && (
            <span className='text-xs text-gray-500 flex items-center gap-1'>
              {likeCount} {likeCount=== 1 ? 'like' : 'likes'}
            </span>
          )}
          <button className='text-xs text-gray-500 hover:text-gray-400 transition-colors'>
            Reply
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommentItem

'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent,
  DialogTrigger 
} from '@/components/ui/dialog'
import { FiMessageSquare } from 'react-icons/fi'
import {Post, SavedPost} from "@repo/trpc/post"
// import FeedCard from './feeds/
import CommentInput from './CommentInput'
import CommentItem from './CommentItem'
import { useTRPC } from '@/utils/trpc'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FeedCard from '../feeds/FeedCard'

interface CommentsDialogProps {
  feed: Post | SavedPost,
  isOpen: boolean,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const CommentsDialog = ({ feed, isOpen, setIsOpen }: CommentsDialogProps) => {
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const {
        data,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useInfiniteQuery(trpc.post.getInfinteComment.infiniteQueryOptions(
        {
            postId:feed.id,
            limit:10,
            cursor:undefined,
        },
        {
            getNextPageParam:(lastPage)=>(
                lastPage.hasNextPage ? lastPage.cursor : undefined
            ),
            enabled:isOpen
        }
        
    ))
    
    const infiniteCommentQueryKey = trpc.post.getInfinteComment.infiniteQueryKey({postId:feed.id})
    const infinitePostsQuery = trpc.post.getAllPost.infiniteQueryKey()
    const comments = data?.pages.flatMap(page=>page.comments) ?? []
    const createComment = useMutation(trpc.post.createComment.mutationOptions({
      onMutate:()=>{
        const previousData = queryClient.getQueryData(infinitePostsQuery);
        queryClient.setQueryData(infinitePostsQuery, (old) => {
    if (!old) return old;

    return {
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        posts: page.posts.map((post: any) =>
          post.id === feed.id
            ? { 
                ...post, 
                hasLiked: !post.hasLiked, 
                likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1,
                commentCount:post.commentsCount + 1
              }
            : post
        ),
      })),
    };
  });
      }
    }
    ))

  const handleAddComment = (newComment: string) => {
    createComment.mutateAsync({
        postId:feed.id,
        content:newComment
    },{
        onSuccess:(data)=>{
           const previousData = queryClient.getQueryData(infinitePostsQuery);
            queryClient.invalidateQueries({queryKey:infiniteCommentQueryKey})
            queryClient.invalidateQueries({queryKey:infinitePostsQuery})

        }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      
      <DialogContent className='max-w-5xl! rounded-none [&>button]:text-white [&>button]:text-xl [&>button]:opacity-100 p-0!  max-h-[90vh]! h-full w-full backface-visible bg-[#201F21]/80  backdrop-blur-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/15 overflow-hidden flex gap-0'>
        <div className='basis-[47%] flex items-center justify-center'>
          {/* Media Container */}
          {feed.medias && feed.medias.length > 0 && (
            <div className='  w-full'>
              <FeedCard feed={feed} imgClassName={'h-full'}/>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className='flex-1 bg-black border-l border-gray-800 flex flex-col'>
          {/* Header */}
          <div className='p-4 border-b border-gray-800'>
            <h2 className='text-white font-semibold text-lg'>Comments</h2>
          </div>

          {/* Comments List */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {comments.length === 0 ? (
              <div className='h-full flex items-center justify-center text-gray-500'>
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>

          {/* Divider */}
          <div className='border-t border-gray-800' />

          {/* Comment Input */}
          <CommentInput onAddComment={handleAddComment} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CommentsDialog

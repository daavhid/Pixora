'use client'

import React, { useState } from 'react'
import { BiSend } from 'react-icons/bi'
import { Button } from '@/components/ui/button'

interface CommentInputProps {
  onAddComment: (comment: string) => void
}

const CommentInput = ({ onAddComment }: CommentInputProps) => {
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comment.trim()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      onAddComment(comment)
      setComment('')
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = !comment.trim() || isLoading

  return (
    <form onSubmit={handleSubmit} className='p-4 bg-black'>
      <div className='flex items-end gap-3'>
        <input
          type='text'
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Add a comment...'
          className='flex-1 bg-gray-900 text-white placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-700 resize-none'
        />
        <button
          type='submit'
          disabled={isDisabled}
          className='shrink-0 text-white hover:text-gray-300 disabled:text-gray-600 transition-colors'
        >
          <BiSend className='text-xl' />
        </button>
      </div>
    </form>
  )
}

export default CommentInput

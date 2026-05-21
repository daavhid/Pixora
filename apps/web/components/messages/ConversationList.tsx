'use client'

import React from 'react'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { conversationSchema } from '../../../backend/src/conversations/schema/conversation.zod.schema'
// import { conversationSchema } from '@/schemas/conversation'

type Conversation = z.infer<typeof conversationSchema>

type ConversationListProps = {
  conversations: Conversation[]
  activeConversationId?: string
  onSelect?: (conversation: Conversation) => void
}

const ConversationList = ({
  conversations,
  activeConversationId,
  onSelect,
}: ConversationListProps) => {
  return (
    <div className="flex flex-col gap-2 p-3">
      {conversations.map((conversation) => {
        const isActive =
          activeConversationId === conversation.id

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect?.(conversation)}
            className={cn(
              'flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all duration-200',
              isActive
                ? 'border border-[#7849FB]/40 bg-[#1F1F25]'
                : 'hover:bg-[#15151A]'
            )}
          >
            {/* Avatar */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
              <CldImage
                src={
                  conversation.avatarUrl ||
                  'https://i.pravatar.cc/150'
                }
                alt={
                  conversation.title ||
                  'Conversation Avatar'
                }
                fill
                className="object-cover"
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-white md:text-base">
                  {conversation.title || 'Unknown User'}
                </h3>

                {conversation.lastMessage && (
                  <span className="shrink-0 text-[11px] text-[#8E8A9E]">
                    {new Date(
                      conversation.lastMessage.createdAt
                    ).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>

              <p className="mt-1 truncate text-sm text-[#A1A1AA]">
                {conversation.lastMessage?.content ||
                  'No messages yet'}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default ConversationList
'use client'

import React from 'react'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { conversationSchema } from '../../../backend/src/conversations/schema/conversation.zod.schema'
// import { conversationSchema } from '@/schemas/conversation'
import {Conversation} from '@repo/trpc/conversation'

// type Conversation = z.infer<typeof conversationSchema>

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
        console.log(conversation,'this is the conv')
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
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 shadow-inner bg-[#17171C]">
              {conversation.conversationParticipants[0]?.user.image || conversation.avatarUrl ? (
                <CldImage
                  src={
                    conversation.conversationParticipants[0]!.user.image! ||
                    conversation.avatarUrl!
                  }
                  alt={
                    conversation.title ||
                    conversation.conversationParticipants[0]!.user.name!
                  }
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#7849FB]/10 flex items-center justify-center select-none">
                  <span className="text-xl font-bold text-[#9D7BFF] tracking-wider">
                    {(conversation.title || conversation.conversationParticipants[0]?.user.name || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-white md:text-base">
                  {conversation.title ?? conversation.conversationParticipants[0]!.user.name}
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
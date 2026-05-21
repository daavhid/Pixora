'use client'

import React from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { conversationSchema } from '../../../backend/src/conversations/schema/conversation.zod.schema'
import { z } from 'zod/v4'
import ConversationList from './ConversationList'
import { CldImage } from 'next-cloudinary'

export const dummyConversations: z.infer<
  typeof conversationSchema
>[] = [
  {
    id: 'conv_7',
    type: 'dm',
    avatarUrl: 'https://res.cloudinary.com/dw9vmzsd4/image/upload/c_crop,g_north_west,x_0,y_977,w_3376,h_1899/c_fill,w_800,q_auto,f_auto/c_limit,w_1920/v1778593068/pixora/xtsq3tur4ekbuo8dz9re?_a=BAVMn6B00',
    title: 'Daniel Craig',
    conversationParticipants: [
      { id: 'user_1' },
      { id: 'user_12' },
    ],
    createdById: 'user_12',
    lastMessage: {
      id: 'msg_7',
      content: 'Did you finish the assignment?',
      createdAt: new Date().toISOString(),
      senderId: 'user_12',
    },
  },

  {
    id: 'conv_8',
    type: 'dm',
    avatarUrl: 'https://res.cloudinary.com/dw9vmzsd4/image/upload/c_crop,g_north_west,x_0,y_977,w_3376,h_1899/c_fill,w_800,q_auto,f_auto/c_limit,w_1920/v1778593068/pixora/xtsq3tur4ekbuo8dz9re?_a=BAVMn6B00',
    title: 'Mia Carter',
    conversationParticipants: [
      { id: 'user_1' },
      { id: 'user_13' },
    ],
    createdById: 'user_13',
    lastMessage: {
      id: 'msg_8',
      content: 'Send me the playlist 🎵',
      createdAt: new Date().toISOString(),
      senderId: 'user_1',
    },
  },

  {
    id: 'conv_9',
    type: 'dm',
    avatarUrl: 'https://res.cloudinary.com/dw9vmzsd4/image/upload/c_crop,g_north_west,x_0,y_977,w_3376,h_1899/c_fill,w_800,q_auto,f_auto/c_limit,w_1920/v1778593068/pixora/xtsq3tur4ekbuo8dz9re?_a=BAVMn6B00',
    title: 'Chris Evans',
    conversationParticipants: [
      { id: 'user_1' },
      { id: 'user_14' },
    ],
    createdById: 'user_14',
    lastMessage: {
      id: 'msg_9',
      content: 'Bro that match was insane 😭',
      createdAt: new Date().toISOString(),
      senderId: 'user_14',
    },
  },

  {
    id: 'conv_10',
    type: 'dm',
    avatarUrl: 'https://res.cloudinary.com/dw9vmzsd4/image/upload/c_crop,g_north_west,x_0,y_977,w_3376,h_1899/c_fill,w_800,q_auto,f_auto/c_limit,w_1920/v1778593068/pixora/xtsq3tur4ekbuo8dz9re?_a=BAVMn6B00',
    title: 'Olivia Brown',
    conversationParticipants: [
      { id: 'user_1' },
      { id: 'user_15' },
    ],
    createdById: 'user_15',
    lastMessage: {
      id: 'msg_10',
      content: 'Are we still meeting tomorrow?',
      createdAt: new Date().toISOString(),
      senderId: 'user_15',
    },
  },

  {
    id: 'conv_11',
    type: 'dm',
    avatarUrl: 'https://res.cloudinary.com/dw9vmzsd4/image/upload/c_crop,g_north_west,x_0,y_977,w_3376,h_1899/c_fill,w_800,q_auto,f_auto/c_limit,w_1920/v1778593068/pixora/xtsq3tur4ekbuo8dz9re?_a=BAVMn6B00',
    title: 'Noah Smith',
    conversationParticipants: [
      { id: 'user_1' },
      { id: 'user_16' },
    ],
    createdById: 'user_16',
    lastMessage: {
      id: 'msg_11',
      content: 'I just pushed the latest update to GitHub.',
      createdAt: new Date().toISOString(),
      senderId: 'user_16',
    },
  },
]

const MessageLayout = () => {
  const [activeConversationId, setActiveConversationId] =
    React.useState<string | undefined>(
      dummyConversations[0]?.id
    )

  const activeConversation = dummyConversations.find(
    (conversation) =>
      conversation.id === activeConversationId
  )

  return (
    <div className="grid h-screen grid-cols-12 overflow-hidden bg-[#0A0A0C]">
      {/* Sidebar */}
      <aside className="col-span-4 flex h-full flex-col border-r border-white/10 bg-[#0F0F12]">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-bold text-white">
            Messages
          </h2>

          <p className="mt-1 text-sm text-[#8E8A9E]">
            Chat with your friends
          </p>

          {/* Search */}
          <div className="relative mt-5">
            <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8A9E]" />

            <input
              type="text"
              id="search-messages"
              placeholder="Search conversations"
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#17171C] pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-[#6E6A7E] focus:border-[#7849FB]/60 focus:ring-2 focus:ring-[#7849FB]/20"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-3">
          <ConversationList
            conversations={dummyConversations}
            activeConversationId={
              activeConversationId
            }
            onSelect={(conversation) => {
              setActiveConversationId(
                conversation.id
              )
            }}
          />
        </div>
      </aside>

      {/* Chat Area */}
      <main className="col-span-8 flex h-full flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b border-white/10 bg-[#0F0F12] px-6 py-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <CldImage
                  src={
                    activeConversation.avatarUrl ||
                    'https://res.cloudinary.com/dw9vmzsd4/image/upload/c_crop,g_north_west,x_0,y_977,w_3376,h_1899/c_fill,w_800,q_auto,f_auto/c_limit,w_1920/v1778593068/pixora/xtsq3tur4ekbuo8dz9re?_a=BAVMn6B00'
                  }
                  alt={
                    activeConversation.title ||
                    'Avatar'
                  }
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  {activeConversation.title}
                </h2>

                <p className="text-sm text-[#8E8A9E]">
                  Active now
                </p>
              </div>
            </div>

            {/* Empty State */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full">
                <CldImage
                  src={
                    activeConversation.avatarUrl ||
                    'https://i.pravatar.cc/150'
                  }
                  alt={
                    activeConversation.title ||
                    'Avatar'
                  }
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="mt-6 text-3xl font-bold text-white">
                {activeConversation.title}
              </h3>

              <p className="mt-2 max-w-md text-[#8E8A9E]">
                Start chatting with{' '}
                {activeConversation.title}.
              </p>

              <button className="mt-6 rounded-full bg-gradient-to-r from-[#7849FB] to-[#9D7BFF] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                Send Message
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[#8E8A9E]">
              Select a conversation
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default MessageLayout
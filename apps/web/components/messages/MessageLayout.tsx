'use client'

import React, { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTRPC } from '@/utils/trpc'
import { useUser } from '@/hooks/useUser'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { FaRegSquarePlus } from "react-icons/fa6";
import { RiLoader2Line } from 'react-icons/ri'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import { Conversation } from '@repo/trpc/conversation'
import ConversationList from './ConversationList'
import ConversationMessages from './ConversationMessage'
import NewConversationDialog from './NewConversationDialog'
import PreConversationDialog, { PreConversationUser } from './PreConversationDialog'

// ─── No selection state ───────────────────────────────────────────────────────
const NoConversationSelected = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6 select-none">
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-[#7849FB]/10 blur-xl scale-150" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#131317] shadow-xl shadow-black/50">
        <span className="text-2xl">💬</span>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-white">No conversation selected</p>
      <p className="text-xs text-[#4A4658] max-w-[200px] leading-relaxed">
        Pick a conversation or start a new one
      </p>
    </div>
  </div>
)

// ─── Chat header ──────────────────────────────────────────────────────────────
const ChatHeader = ({ conversation }: { conversation: Conversation }) => {
  const participant = conversation.conversationParticipants[0]
  const name        = conversation.title ?? participant?.user.name
  const image       = participant?.user.image ?? conversation.avatarUrl

  return (
    <div className="flex items-center gap-4 border-b border-white/[0.05] bg-[#0C0C0F] px-6 py-4 shrink-0">
      {/* Avatar */}
      <div className="relative h-10 w-10 overflow-hidden rounded-full shrink-0 border border-white/[0.08] bg-[#131317]">
        {image ? (
          <CldImage src={image} alt={name ?? ''} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7849FB]/30 to-[#9D7BFF]/10">
            <span className="text-sm font-bold text-[#9D7BFF]">
              {name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Online dot */}
        {conversation.status === 'accepted' && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0C0C0F]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-white truncate text-sm leading-tight">{name}</h2>
        <p className={cn('text-[11px] mt-0.5 font-medium',
          conversation.status === 'pending'  ? 'text-amber-400'
          : conversation.status === 'rejected' ? 'text-red-400'
          : 'text-emerald-400'
        )}>
          {conversation.status === 'pending'  ? 'Pending request'
          : conversation.status === 'rejected' ? 'Request declined'
          : 'Active now'}
        </p>
      </div>
    </div>
  )
}

// ─── Sidebar skeleton ─────────────────────────────────────────────────────────
const ConversationSkeleton = () => (
  <div className="flex flex-col gap-1 p-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded-md bg-white/[0.04] animate-pulse" />
          <div className="h-2.5 w-40 rounded-md bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

// ─── Main layout ──────────────────────────────────────────────────────────────
const MessageLayout = () => {
  const trpc        = useTRPC()
  const sessionData = useUser()
  const myId        = sessionData?.user.id

  const [search, setSearch]                     = useState('')
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>()
  const [openNewConvoDialog, setOpenNewConvoDialog]     = useState(false)
  const [openPreConvoDialog, setOpenPreConvoDialog]     = useState(false)
  const [selectedRecipient, setSelectedRecipient]       = useState<PreConversationUser | null>(null)

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(
    trpc.conversation.getConversations.infiniteQueryOptions(
      { limit: 20, cursor: undefined },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.cursor : undefined,
      }
    )
  )

  const conversations: Conversation[] =
    data?.pages.flatMap((page) => page.conversations) ?? []

  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = c.title ?? c.conversationParticipants[0]?.user.name ?? ''
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  return (
    <div className="grid h-screen grid-cols-12 overflow-hidden bg-[#09090C]">

      {/* ── Sidebar ── */}
      <aside className="col-span-4 flex h-full flex-col border-r border-white/[0.05] bg-[#0C0C0F]">

        {/* Header */}
        <div className="px-5 py-5 shrink-0 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
              <p className="mt-0.5 text-xs text-[#4A4658]">
                {conversations.length > 0
                  ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`
                  : 'No conversations yet'}
              </p>
            </div>

            {/* Compose */}
            <button
              onClick={() => setOpenNewConvoDialog(true)}
              title="New conversation"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                'border border-white/[0.08] bg-[#131317] text-[#6E6A7E]',
                'transition-all duration-150',
                'hover:border-[#7849FB]/40 hover:bg-[#7849FB]/10 hover:text-[#9D7BFF]',
                'active:scale-95'
              )}
            >
              <FaRegSquarePlus className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A4658] text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className={cn(
                'h-10 w-full rounded-xl',
                'border border-white/[0.06] bg-[#131317]',
                'pl-9 pr-4 text-sm text-white',
                'outline-none transition-all',
                'placeholder:text-[#4A4658]',
                'focus:border-[#7849FB]/40 focus:ring-1 focus:ring-[#7849FB]/15'
              )}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div
          className="flex-1 overflow-y-auto py-2"
          onScroll={(e) => {
            const el = e.currentTarget
            const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
            if (near && hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
        >
          {isLoading ? (
            <ConversationSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 select-none">
              <p className="text-xs text-[#4A4658] font-medium">
                {search ? 'No results found' : 'No conversations yet'}
              </p>
              {!search && (
                <button
                  onClick={() => setOpenNewConvoDialog(true)}
                  className="mt-1 text-xs text-[#7849FB] hover:text-[#9D7BFF] transition-colors font-semibold"
                >
                  Start one →
                </button>
              )}
            </div>
          ) : (
            <ConversationList
              conversations={filtered}
              activeConversationId={activeConversationId}
              onSelect={(c) => setActiveConversationId(c.id)}
            />
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <RiLoader2Line className="animate-spin text-[#7849FB] w-4 h-4" />
            </div>
          )}
        </div>
      </aside>

      {/* ── Chat area ── */}
      <main className="col-span-8 flex h-full flex-col overflow-hidden bg-[#0C0C0F]">
        {activeConversation ? (
          <>
            <ChatHeader conversation={activeConversation} />
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <ConversationMessages
                key={activeConversation.id}
                conversation={activeConversation}
              />
            </div>
          </>
        ) : (
          <NoConversationSelected />
        )}
      </main>

      {/* ── Compose dialogs ── */}
      {myId && (
        <>
          <NewConversationDialog
            open={openNewConvoDialog}
            onOpenChange={setOpenNewConvoDialog}
            userId={myId}
            onSelectUser={(recipient) => {
              setSelectedRecipient(recipient)
              setOpenNewConvoDialog(false)
              setOpenPreConvoDialog(true)
            }}
            onExistingConversation={(recipient) => {
              const existingConversation = data?.pages
                .flatMap((page) => page.conversations)
                .find((conversation) =>
                  conversation.conversationParticipants.some(
                    (participant) => participant.user.id === recipient.id
                  )
                )

              if (existingConversation) {
                setActiveConversationId(existingConversation.id)
                return
              }

              setSelectedRecipient(recipient)
              setOpenNewConvoDialog(false)
              setOpenPreConvoDialog(true)
            }}
          />
          <PreConversationDialog
            open={openPreConvoDialog}
            onOpenChange={setOpenPreConvoDialog}
            recipient={selectedRecipient}
            onBack={() => {
              setOpenPreConvoDialog(false)
              setOpenNewConvoDialog(true)
            }}
            onConversationReady={(conversationId) => {
              setActiveConversationId(conversationId)
            }}
          />
        </>
      )}
    </div>
  )
}

export default MessageLayout
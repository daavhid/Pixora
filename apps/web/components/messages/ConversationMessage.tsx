'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/utils/trpc'
import { useUser } from '@/hooks/useUser'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import {
  LuCheckCheck,
  LuChevronDown,
  LuClock3,
  LuRefreshCw,
} from 'react-icons/lu'
import { RiLoader2Line } from 'react-icons/ri'
import { Conversation } from '@repo/trpc/conversation'
import { MessageInputBox } from './PreConversationDialog'
import { LucideXCircle } from 'lucide-react'

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

const formatTime = (date: Date | string) =>
  new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDateDivider = (date: Date | string) => {
  const d = new Date(date)

  const today = new Date()

  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// ───────────────────────────────────────────────────────────────────────────────
// Conversation View State
// ───────────────────────────────────────────────────────────────────────────────

type ConversationViewState =
  | 'accepted'
  | 'incoming_request'
  | 'outgoing_request'
  | 'rejected_can_reaccept'  // Current user can re-accept (they are the receiver who rejected)
  | 'rejected_blocked'        // Current user is blocked (they are the sender whose request was rejected)

const getConversationViewState = (
  conversation: Conversation,
  currentUserId?: string
): ConversationViewState => {
  if (!currentUserId) return 'accepted'

  // Since conversationParticipants only contains the OTHER user,
  // we need to infer current user's status from the conversation status
  // and who sent the last message
  
  const otherParticipant = conversation.conversationParticipants[0]
  const lastMessage = conversation.lastMessage
  
  // Case 1: Conversation is accepted
  if (conversation.status === 'accepted') {
    return 'accepted'
  }

  // Case 2: Conversation is rejected
  if (conversation.status === 'rejected') {
    // If the current user sent the last message, they are the sender
    // and their request was rejected (blocked)
    if (lastMessage?.senderId === currentUserId) {
      return 'rejected_blocked'
    }
    // If the current user did NOT send the last message, they are the receiver
    // who rejected the conversation (can re-accept)
    return 'rejected_can_reaccept'
  }

  // Case 3: Conversation is pending
  if (conversation.status === 'pending') {
    // If current user sent the last message, they are the sender (outgoing request)
    if (lastMessage?.senderId === currentUserId) {
      return 'outgoing_request'
    }
    // Otherwise, they are the receiver (incoming request)
    return 'incoming_request'
  }

  return 'accepted'
}

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  content: string
  createdAt: Date | string
  isOptimistic?: boolean

  sender: {
    id: string
    name: string | null
    image?: string | null
  }

  messageAttachments?: {
    id: string
    url: string
    type: string
    width?: number | null
    height?: number | null
  }[]
}

// ───────────────────────────────────────────────────────────────────────────────
// Date Divider
// ───────────────────────────────────────────────────────────────────────────────

const DateDivider = ({ date }: { date: Date | string }) => (
  <div className="flex items-center gap-4 my-6 px-6 select-none">
    <div className="flex-1 h-px bg-white/[0.04]" />

    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#3A3848] shrink-0">
      {formatDateDivider(date)}
    </span>

    <div className="flex-1 h-px bg-white/[0.04]" />
  </div>
)

// ───────────────────────────────────────────────────────────────────────────────
// Avatar
// ───────────────────────────────────────────────────────────────────────────────

const SenderAvatar = ({
  sender,
}: {
  sender: Message['sender']
}) => (
  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/[0.07] bg-[#131317] shadow-md">
    {sender.image ? (
      <CldImage
        src={sender.image}
        alt={sender.name ?? ''}
        fill
        className="object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7849FB]/30 to-[#9D7BFF]/10">
        <span className="text-[10px] font-bold text-[#9D7BFF]">
          {sender.name?.charAt(0).toUpperCase()}
        </span>
      </div>
    )}
  </div>
)

// ───────────────────────────────────────────────────────────────────────────────
// Message Bubble
// ───────────────────────────────────────────────────────────────────────────────

const MessageBubble = ({
  message,
  isMine,
  isFirst,
  isLast,
  showAvatar,
}: {
  message: Message
  isMine: boolean
  isFirst: boolean
  isLast: boolean
  showAvatar: boolean
}) => {
  const mineRadius = cn(
    'rounded-2xl',
    !isFirst && !isLast ? 'rounded-r-sm' : '',
    isFirst && !isLast ? 'rounded-br-sm' : '',
    !isFirst && isLast
      ? 'rounded-tr-sm rounded-br-sm'
      : ''
  )

  const theirRadius = cn(
    'rounded-2xl',
    !isFirst && !isLast ? 'rounded-l-sm' : '',
    isFirst && !isLast ? 'rounded-bl-sm' : '',
    !isFirst && isLast
      ? 'rounded-tl-sm rounded-bl-sm'
      : ''
  )

  return (
    <div
      className={cn(
        'flex items-end gap-2.5 px-5 group',
        isMine ? 'flex-row-reverse' : 'flex-row',
        isLast ? 'mb-3' : 'mb-0.5'
      )}
    >
      <div className="w-8 shrink-0 self-end">
        {!isMine && showAvatar && (
          <SenderAvatar sender={message.sender} />
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[68%]',
          isMine ? 'items-end' : 'items-start'
        )}
      >
        {!isMine && isFirst && (
          <span className="text-[11px] font-semibold text-[#4A4658] pl-1 select-none">
            {message.sender.name}
          </span>
        )}

        {message.messageAttachments &&
          message.messageAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {message.messageAttachments.map((att) => (
                <div
                  key={att.id}
                  className="relative w-52 h-52 overflow-hidden rounded-2xl border border-white/[0.07] shadow-2xl shadow-black/50"
                >
                  <CldImage
                    src={att.url}
                    alt="attachment"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

        {message.content && (
          <div
            className={cn(
              'relative px-4 py-2.5 text-[13.5px] leading-relaxed transition-all duration-200',
              isMine ? mineRadius : theirRadius,

              isMine
                ? [
                    'bg-gradient-to-br from-[#7849FB] to-[#6035E0]',
                    'text-white shadow-lg shadow-[#7849FB]/15',
                    message.isOptimistic && 'opacity-50',
                  ]
                : [
                    'bg-[#1A1A21] text-[#D4D0E0]',
                    'border border-white/[0.06] shadow-sm',
                  ]
            )}
          >
            {isMine && (
              <div className="absolute top-0 inset-x-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            )}

            <p className="break-words whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}

        {isLast && (
          <div
            className={cn(
              'flex items-center gap-1 px-1 select-none',
              isMine ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <time className="text-[10px] font-medium text-[#3A3848] tracking-wide">
              {formatTime(message.createdAt)}
            </time>

            {isMine &&
              (message.isOptimistic ? (
                <RiLoader2Line className="h-2.5 w-2.5 text-[#3A3848] animate-spin" />
              ) : (
                <LuCheckCheck className="h-3 w-3 text-[#9D7BFF]" />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Incoming Request Banner
// ───────────────────────────────────────────────────────────────────────────────

const IncomingRequestBanner = ({
  conversation,
  onAccept,
  onDecline,
  isLoading,
}: {
  conversation: Conversation
  onAccept: () => void
  onDecline: () => void
  isLoading: boolean
}) => {
  const participant = conversation.conversationParticipants[0]

  const name = conversation.title ?? participant?.user.name
  const image = participant?.user.image ?? conversation.avatarUrl

  return (
    <div className="mx-5 mt-4 mb-1 rounded-2xl border border-white/[0.07] bg-[#0F0F14] p-4 shadow-xl shadow-black/40 shrink-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/[0.07] bg-[#131317]">
          {image ? (
            <CldImage
              src={image}
              alt={name ?? ''}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7849FB]/30 to-[#9D7BFF]/10">
              <span className="text-sm font-bold text-[#9D7BFF]">
                {name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-white">
            {name}
          </p>

          <p className="text-[11px] text-[#4A4658] mt-0.5">
            Sent you a message request
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center rounded-xl py-2.5 text-xs font-bold bg-gradient-to-r from-[#7849FB] to-[#6035E0] text-white shadow-md shadow-[#7849FB]/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <RiLoader2Line className="animate-spin h-3.5 w-3.5" />
          ) : (
            'Accept'
          )}
        </button>

        <button
          onClick={onDecline}
          disabled={isLoading}
          className="flex-1 rounded-xl py-2.5 text-xs font-bold border border-white/[0.07] bg-[#17171C] text-[#6E6A7E] transition-all hover:text-white hover:bg-white/[0.04] active:scale-[0.98] disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Outgoing Request Banner
// ───────────────────────────────────────────────────────────────────────────────

const OutgoingRequestBanner = () => (
  <div className="mx-5 mt-4 mb-1 rounded-2xl border border-[#7849FB]/10 bg-[#111116] p-4 shadow-xl shadow-black/40">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7849FB]/10 border border-[#7849FB]/10">
        <LuClock3 className="h-4 w-4 text-[#9D7BFF]" />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          Waiting for response
        </p>

        <p className="text-[11px] text-[#6E6A7E] mt-0.5">
          Your message request is pending acceptance
        </p>
      </div>
    </div>
  </div>
)

// ───────────────────────────────────────────────────────────────────────────────
// Re-accept Banner (for receivers who previously rejected)
// ───────────────────────────────────────────────────────────────────────────────

const ReacceptConversationBanner = ({
  conversation,
  onReaccept,
  isLoading,
}: {
  conversation: Conversation
  onReaccept: () => void
  isLoading: boolean
}) => {
  const participant = conversation.conversationParticipants[0]
  
  const name = conversation.title ?? participant?.user.name
  const image = participant?.user.image ?? conversation.avatarUrl

  return (
    <div className="mx-5 mt-4 mb-1 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 shadow-xl shadow-black/40 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-amber-500/20 bg-[#131317]">
          {image ? (
            <CldImage
              src={image}
              alt={name ?? ''}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/30 to-amber-500/10">
              <span className="text-sm font-bold text-amber-500">
                {name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-white">
            {name}
          </p>
          <p className="text-[11px] text-amber-500/70 mt-0.5 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-amber-500/50" />
            You declined this conversation
          </p>
        </div>
      </div>

      <button
        onClick={onReaccept}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <RiLoader2Line className="animate-spin h-3.5 w-3.5" />
            <span>Re-accepting...</span>
          </>
        ) : (
          <>
            <LuRefreshCw className="h-3.5 w-3.5" />
            <span>Re-accept Conversation</span>
          </>
        )}
      </button>
      
      <p className="text-[10px] text-center text-amber-500/40 mt-3">
        You can re-accept to continue messaging
      </p>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Blocked Banner (for senders whose request was rejected)
// ───────────────────────────────────────────────────────────────────────────────

const BlockedConversationBanner = () => (
  <div className="mx-5 mt-4 mb-1 rounded-2xl border border-red-500/10 bg-red-500/5 p-4 shadow-xl shadow-black/40">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/10">
        <LucideXCircle className="h-4 w-4 text-red-500" />
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          Conversation declined
        </p>

        <p className="text-[11px] text-red-400/70 mt-0.5">
          The recipient declined your message request
        </p>
      </div>
    </div>
  </div>
)

// ───────────────────────────────────────────────────────────────────────────────
// Skeletons
// ───────────────────────────────────────────────────────────────────────────────

const MessageSkeleton = () => (
  <div className="flex flex-col gap-5 px-6 py-6">
    {[
      { mine: false, w: 180 },
      { mine: false, w: 240 },
      { mine: true, w: 160 },
      { mine: true, w: 210 },
      { mine: false, w: 130 },
    ].map((item, i) => (
      <div
        key={i}
        className={cn(
          'flex items-end gap-2.5',
          item.mine
            ? 'flex-row-reverse'
            : 'flex-row'
        )}
      >
        {!item.mine && (
          <div className="w-8 h-8 rounded-full bg-white/[0.03] animate-pulse shrink-0" />
        )}

        <div
          className="h-10 rounded-2xl animate-pulse border border-white/[0.02]"
          style={{
            width: item.w,

            background: item.mine
              ? 'linear-gradient(135deg,rgba(120,73,251,0.10),rgba(96,53,224,0.06))'
              : 'rgba(255,255,255,0.025)',
          }}
        />
      </div>
    ))}
  </div>
)

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 select-none px-6 py-16">
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl bg-[#7849FB]/8 blur-xl scale-150" />

      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.05] bg-[#131317] shadow-xl shadow-black/50">
        <span className="text-xl">💬</span>
      </div>
    </div>

    <p className="text-xs font-semibold text-[#6E6A7E] mt-1">
      No messages yet
    </p>

    <p className="text-[11px] text-[#3A3848] text-center max-w-[160px] leading-relaxed">
      Send a message to start the conversation
    </p>
  </div>
)

// ───────────────────────────────────────────────────────────────────────────────
// Scroll Button
// ───────────────────────────────────────────────────────────────────────────────

const ScrollToBottomBtn = ({
  visible,
  onClick,
}: {
  visible: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      'absolute bottom-[88px] right-5 z-20',
      'flex h-8 w-8 items-center justify-center rounded-full',
      'border border-white/[0.07] bg-[#17171C] text-[#9D7BFF]',
      'shadow-xl shadow-black/50 backdrop-blur-sm',
      'transition-all duration-300',

      visible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-3 pointer-events-none'
    )}
  >
    <LuChevronDown className="h-4 w-4" />
  </button>
)

// ───────────────────────────────────────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────────────────────────────────────

const ConversationMessages = ({
  conversation,
}: {
  conversation: Conversation
}) => {
  const trpc = useTRPC()
  const sessionData = useUser()
  const queryClient = useQueryClient()

  const myId = sessionData?.user.id

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const viewState = getConversationViewState(conversation, myId)
  
  const isIncomingRequest = viewState === 'incoming_request'
  const isOutgoingRequest = viewState === 'outgoing_request'
  const isRejectedCanReaccept = viewState === 'rejected_can_reaccept'
  const isRejectedBlocked = viewState === 'rejected_blocked'

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery(
    trpc.conversation.getInfiniteMessages.infiniteQueryOptions(
      {
        conversationId: conversation.id,
        limit: 30,
      },
      {
        getNextPageParam: (p) =>
          p.hasNextPage ? p.cursor : undefined,
      }
    )
  )

  // Unified mutation for accepting, rejecting, and re-accepting
  const {
    mutate: toggleRequest,
    isPending: isTogglingRequest,
  } = useMutation(
    trpc.conversation.toggleConversationRequest.mutationOptions({
      onMutate: async ({ conversationId, action }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.conversation.getConversations.infiniteQueryKey({
            limit: 20,
            cursor: undefined,
          })
        })

        // Snapshot previous value
        const previousConversations = queryClient.getQueryData(
          trpc.conversation.getConversations.infiniteQueryKey({
            limit: 20,
            cursor: undefined,
          })
        )

        // Optimistically update the conversation
        queryClient.setQueryData(
          trpc.conversation.getConversations.infiniteQueryKey({
            limit: 20,
            cursor: undefined,
          }),
          (old: any) => {
            if (!old) return old
            
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                conversations: page.conversations.map((conv: any) =>
                  conv.id === conversationId
                    ? { 
                        ...conv, 
                        status: action === 'accepted' ? 'accepted' : 'rejected',
                      }
                    : conv
                ),
              })),
            }
          }
        )

        return { previousConversations }
      },
      
      onSuccess: () => {
        // Invalidate and refetch conversations
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.getConversations.infiniteQueryKey({
            limit: 20,
            cursor: undefined,
          })
        })
        
        // Invalidate messages
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.getInfiniteMessages.infiniteQueryKey({
            conversationId: conversation.id,
            limit: 30,
          })
        })
      },
      
      onError: (err, variables, context) => {
        if (context?.previousConversations) {
          queryClient.setQueryData(
            trpc.conversation.getConversations.infiniteQueryKey({
              limit: 20,
              cursor: undefined,
            }),
            context.previousConversations
          )
        }
        console.error('Failed to toggle conversation request:', err)
      },
    })
  )

  const messages: Message[] = (
    data?.pages.flatMap((p) => p.messages) ?? []
  ).reverse()

  useEffect(() => {
    const hasNew = messages.length > prevCountRef.current
    const lastIsMine = messages[messages.length - 1]?.sender.id === myId

    if (hasNew && (lastIsMine || isAtBottom)) {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
      })
    }

    prevCountRef.current = messages.length
  }, [messages.length, myId, isAtBottom])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    if (el.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = el.scrollHeight
      fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight
          }
        })
      })
    }

    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBot = dist < 80
    setIsAtBottom(atBot)
    setShowScrollBtn(!atBot)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { mutate: send, isPending: isSending } = useMutation(
    trpc.conversation.sendMessage.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = trpc.conversation.getInfiniteMessages.infiniteQueryKey({
          conversationId: conversation.id,
          limit: 30,
        })

        await queryClient.cancelQueries({ queryKey })

        const snapshot = queryClient.getQueryData(queryKey)

        const optimistic: Message = {
          id: `opt_${Date.now()}`,
          content: variables.content,
          createdAt: new Date().toISOString(),
          isOptimistic: true,
          sender: {
            id: sessionData?.user?.id ?? '',
            name: sessionData?.user?.name ?? null,
            image: sessionData?.user?.image ?? null,
          },
        }

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old
          const pages = [...old.pages]
          if (pages[0]) {
            pages[0] = {
              ...pages[0],
              messages: [optimistic, ...pages[0].messages],
            }
          }
          return { ...old, pages }
        })

        return { snapshot, queryKey }
      },

      onError: (_e, _v, ctx) => {
        if (ctx?.snapshot) {
          queryClient.setQueryData(ctx.queryKey, ctx.snapshot)
        }
      },

      onSettled: (_d, _e, _v, ctx) => {
        if (ctx?.queryKey) {
          queryClient.invalidateQueries({ queryKey: ctx.queryKey })
        }
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.getConversations.infiniteQueryKey({
            limit: 20,
            cursor: undefined,
          }),
        })
      },
    })
  )

  const handleSend = useCallback(
    (text: string) => {
      // Get the other participant (the only one in conversationParticipants)
      const otherParticipant = conversation.conversationParticipants[0]
      
      if (!otherParticipant?.user.id) {
        console.error('No other participant found')
        return
      }
      
      send({
        content: text,
        conversation: {
          type: 'dm',
          participants: [otherParticipant.user.id],
        },
      })
    },
    [send, conversation]
  )

  const handleReaccept = useCallback(() => {
    toggleRequest({
      conversationId: conversation.id,
      action: 'accepted',
    })
  }, [toggleRequest, conversation.id])

  const grouped = messages.reduce<
    {
      date: string
      messages: Message[]
    }[]
  >((acc, msg) => {
    const key = new Date(msg.createdAt).toDateString()
    const last = acc[acc.length - 1]
    if (last && last.date === key) {
      last.messages.push(msg)
    } else {
      acc.push({ date: key, messages: [msg] })
    }
    return acc
  }, [])

  // Debug logging
  console.log('Conversation State:', {
    viewState,
    conversationStatus: conversation.status,
    myId,
    lastMessageSenderId: conversation.lastMessage?.senderId,
    isRejectedCanReaccept,
    isRejectedBlocked,
    isIncomingRequest,
    isOutgoingRequest
  })

  return (
    <div className="flex flex-col h-full bg-[#0C0C0F] relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,rgba(120,73,251,0.05),transparent)]"
      />

      {/* Incoming request banner - for receiver when status is pending */}
      {isIncomingRequest && (
        <IncomingRequestBanner
          conversation={conversation}
          onAccept={() =>
            toggleRequest({
              conversationId: conversation.id,
              action: 'accepted',
            })
          }
          onDecline={() =>
            toggleRequest({
              conversationId: conversation.id,
              action: 'rejected',
            })
          }
          isLoading={isTogglingRequest}
        />
      )}

      {/* Outgoing request banner - for sender when waiting for response */}
      {isOutgoingRequest && (
        <OutgoingRequestBanner />
      )}

      {/* Re-accept banner - for receiver who previously rejected */}
      {isRejectedCanReaccept && (
        <ReacceptConversationBanner
          conversation={conversation}
          onReaccept={handleReaccept}
          isLoading={isTogglingRequest}
        />
      )}

      {/* Blocked banner - for sender whose request was rejected */}
      {isRejectedBlocked && (
        <BlockedConversationBanner />
      )}

      {/* Messages container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-10 py-2"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <RiLoader2Line className="animate-spin text-[#7849FB] w-4 h-4" />
          </div>
        )}

        {isLoading && <MessageSkeleton />}

        {!isLoading && messages.length === 0 && <EmptyState />}

        {grouped.map((group) => (
          <div key={group.date}>
            <DateDivider date={group.messages[0]!.createdAt} />
            {group.messages.map((msg, idx) => {
              const isMine = msg.sender.id === myId
              const prev = group.messages[idx - 1]
              const next = group.messages[idx + 1]
              const isFirst = !prev || prev.sender.id !== msg.sender.id
              const isLast = !next || next.sender.id !== msg.sender.id
              const showAvatar = !isMine && isLast

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  isFirst={isFirst}
                  isLast={isLast}
                  showAvatar={showAvatar}
                />
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottomBtn
        visible={showScrollBtn}
        onClick={() =>
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
          })
        }
      />

      {/* Message input */}
      <div className="relative z-10 shrink-0">
        <MessageInputBox
          onSend={handleSend}
          isPending={isSending}
          placeholder={
            isRejectedBlocked
              ? 'Conversation declined'
              : isIncomingRequest
              ? 'Accept request to reply'
              : isOutgoingRequest
              ? 'Waiting for response...'
              : isRejectedCanReaccept
              ? 'Re-accept to send messages'
              : 'Message...'
          }
          disabled={isIncomingRequest || isRejectedBlocked || isRejectedCanReaccept}
          disabledReason={
            isRejectedBlocked
              ? 'The recipient declined your request'
              : isIncomingRequest
              ? 'Accept the request to reply'
              : isRejectedCanReaccept
              ? 'Re-accept the conversation to start messaging'
              : undefined
          }
        />
      </div>
    </div>
  )
}

export default ConversationMessages
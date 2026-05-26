'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useTRPC } from '@/utils/trpc'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LuSend, LuPaperclip, LuArrowLeft } from 'react-icons/lu'
import { RiLoader2Line } from 'react-icons/ri'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PreConversationUser {
  id: string
  name: string | null
  image: string | null
}

interface PreConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: PreConversationUser | null
  onBack?: () => void
  /**
   * Called after the first message is sent successfully.
   * The parent should set this as the active conversation
   * so the chat area switches to the real conversation immediately.
   */
  onConversationReady: (conversationId: string) => void
}

// ─── Shared MessageInputBox (exported — used in ConversationMessages too) ─────
export interface MessageInputBoxProps {
  onSend: (text: string) => void
  isPending: boolean
  placeholder?: string
  disabled?: boolean
  disabledReason?: string
  autoFocus?: boolean
}

export const MessageInputBox = ({
  onSend,
  isPending,
  placeholder = 'Message...',
  disabled,
  disabledReason,
  autoFocus,
}: MessageInputBoxProps) => {
  const [text, setText]   = useState('')
  const textareaRef       = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 80)
    }
  }, [autoFocus])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isPending || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, isPending, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
  }

  if (disabled) {
    return (
      <div className="px-5 py-4 border-t border-white/[0.05] text-center">
        <p className="text-xs text-[#4A4658] font-medium">
          {disabledReason ?? 'You cannot send messages here'}
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4 pt-3 border-t border-white/[0.05]">
      <div
        className={cn(
          'flex items-end gap-3 rounded-2xl px-4 py-3',
          'border border-white/[0.08] bg-[#131317]',
          'transition-all duration-200',
          'focus-within:border-[#7849FB]/40',
          'focus-within:ring-1 focus-within:ring-[#7849FB]/15',
          'focus-within:bg-[#15151B]',
        )}
      >
        <button
          type="button"
          className="mb-0.5 shrink-0 text-[#4A4658] transition-colors hover:text-[#9D7BFF] active:scale-90"
        >
          <LuPaperclip size={17} />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-[#4A4658] outline-none leading-relaxed max-h-[140px] py-0.5"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className={cn(
            'mb-0.5 shrink-0 rounded-xl p-1.5 transition-all duration-150 active:scale-95',
            text.trim() && !isPending
              ? 'bg-gradient-to-br from-[#7849FB] to-[#6035E0] text-white hover:opacity-90 shadow-md shadow-[#7849FB]/20'
              : 'text-[#4A4658] cursor-not-allowed'
          )}
        >
          {isPending
            ? <RiLoader2Line className="h-4 w-4 animate-spin" />
            : <LuSend size={14} />
          }
        </button>
      </div>
      <p className="mt-1.5 text-right text-[10px] text-[#3A3848] select-none tracking-wide">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}

// ─── Optimistic bubble ────────────────────────────────────────────────────────
interface LocalMessage {
  id: string
  content: string
  status: 'sending' | 'sent' | 'error'
}

const OptimisticBubble = ({
  message,
  onRetry,
}: {
  message: LocalMessage
  onRetry: (m: LocalMessage) => void
}) => (
  <div
    className={cn('flex justify-end', message.status === 'error' && 'cursor-pointer')}
    onClick={() => message.status === 'error' && onRetry(message)}
  >
    <div className="flex flex-col items-end gap-1 max-w-[72%]">
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl rounded-br-sm text-[13.5px] leading-relaxed transition-all duration-300 relative overflow-hidden',
          message.status === 'sending' && 'bg-gradient-to-br from-[#7849FB]/50 to-[#6035E0]/50 text-white/60',
          message.status === 'sent'    && 'bg-gradient-to-br from-[#7849FB] to-[#6035E0] text-white shadow-lg shadow-[#7849FB]/20',
          message.status === 'error'   && 'bg-red-500/10 border border-red-500/20 text-red-300',
        )}
      >
        {message.status === 'sent' && (
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
        {message.content}
      </div>
      <div className="flex items-center gap-1 px-1">
        {message.status === 'sending' && <RiLoader2Line className="h-2.5 w-2.5 animate-spin text-[#4A4658]" />}
        {message.status === 'error'   && <span className="text-[10px] text-red-400">Failed · tap to retry</span>}
        {message.status === 'sent'    && <span className="text-[10px] text-[#4A4658]">Sent</span>}
      </div>
    </div>
  </div>
)

// ─── Intro screen ─────────────────────────────────────────────────────────────
const ConversationIntro = ({ recipient }: { recipient: PreConversationUser }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">

    {/* Glowing avatar ring */}
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7849FB] to-[#9D7BFF] opacity-30 blur-xl scale-150" />
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#7849FB]/40 shadow-lg shadow-[#7849FB]/20">
        {recipient.image ? (
          <CldImage src={recipient.image} alt={recipient.name ?? ''} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7849FB]/40 to-[#9D7BFF]/20">
            <span className="text-2xl font-bold text-[#9D7BFF]">
              {recipient.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>

    <div className="space-y-1">
      <p className="text-base font-semibold text-white">{recipient.name}</p>
      <p className="text-xs text-[#6E6A7E]">
        @{recipient.name?.toLowerCase().replace(/\s/g, '')}
      </p>
    </div>

    {/* Decorative divider */}
    <div className="flex items-center gap-3 w-full max-w-[200px]">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[10px] text-[#4A4658] tracking-widest uppercase">new chat</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>

    <p className="text-xs text-[#4A4658] max-w-[220px] leading-relaxed">
      Send your first message to start a conversation with{' '}
      <span className="text-[#6E6A7E]">{recipient.name}</span>
    </p>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────
const PreConversationDialog = ({
  open,
  onOpenChange,
  recipient,
  onBack,
  onConversationReady,
}: PreConversationDialogProps) => {
  const trpc        = useTRPC()
  const queryClient = useQueryClient()
  const bottomRef   = useRef<HTMLDivElement>(null)

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([])

  // Reset when dialog opens for a new recipient
  useEffect(() => {
    if (open) setLocalMessages([])
  }, [open, recipient?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages.length])

  const { mutateAsync: sendMessage, isPending } = useMutation(
    trpc.conversation.sendMessage.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.getConversations
            .infiniteQueryKey({ limit: 20, cursor: undefined }),
        })
        // Close dialog and switch to the real conversation — no router.push needed
        onOpenChange(false)
        onConversationReady(data.conversationId)
      },
    })
  )

  const handleSend = useCallback(async (text: string) => {
    if (!recipient) return
    const tempId = `temp_${Date.now()}`

    setLocalMessages((prev) => [...prev, { id: tempId, content: text, status: 'sending' }])

    try {
      await sendMessage({
        content: text,
        conversation: {
          type: 'dm',
          // Backend checks for existing conversation first — no duplicate risk
          participants: [recipient.id],
        },
      })
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m))
      )
    } catch {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m))
      )
    }
  }, [recipient, sendMessage])

  const handleRetry = useCallback((message: LocalMessage) => {
    setLocalMessages((prev) => prev.filter((m) => m.id !== message.id))
    handleSend(message.content)
  }, [handleSend])

  if (!recipient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col p-0 gap-0 overflow-hidden',
          'max-w-md w-full',
          'bg-[#0C0C0F] border border-white/[0.08] rounded-3xl',
          'shadow-2xl shadow-black/70',
        )}
        style={{ height: '560px' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] shrink-0">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6E6A7E] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LuArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* Avatar */}
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-[#131317]">
            {recipient.image ? (
              <CldImage src={recipient.image} alt={recipient.name ?? ''} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7849FB]/30 to-[#9D7BFF]/10">
                <span className="text-[10px] font-bold text-[#9D7BFF]">
                  {recipient.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {recipient.name}
            </p>
            <p className="text-[11px] text-[#4A4658]">
              @{recipient.name?.toLowerCase().replace(/\s/g, '')}
            </p>
          </div>

          {/* "New" pill */}
          <span className="shrink-0 rounded-full border border-[#7849FB]/30 bg-[#7849FB]/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-[#9D7BFF]">
            New
          </span>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {localMessages.length === 0 ? (
            <ConversationIntro recipient={recipient} />
          ) : (
            <>
              {/* Intro hint above first message */}
              <p className="text-center text-[10px] text-[#4A4658] pb-2">
                This conversation hasn't been created yet — it will be once your message is sent.
              </p>
              {localMessages.map((msg) => (
                <OptimisticBubble key={msg.id} message={msg} onRetry={handleRetry} />
              ))}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInputBox
          onSend={handleSend}
          isPending={isPending}
          placeholder={`Message ${recipient.name?.split(' ')[0] ?? ''}...`}
          autoFocus={open}
        />
      </DialogContent>
    </Dialog>
  )
}

export default PreConversationDialog
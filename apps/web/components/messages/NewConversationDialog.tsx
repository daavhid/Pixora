'use client'

import React, { useState, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/utils/trpc'
import { PreConversationUser } from './PreConversationDialog'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { RiLoader2Line } from 'react-icons/ri'
import { LuMessageSquarePlus } from 'react-icons/lu'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FollowUser {
  id: string
  name: string | null
  image: string | null
}

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSelectUser: (user: PreConversationUser) => void
  onExistingConversation?: (user: PreConversationUser) => void
}

// ─── User row ─────────────────────────────────────────────────────────────────
const UserRow = ({
  user,
  onClick,
}: {
  user: FollowUser
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left',
      'transition-all duration-150',
      'hover:bg-white/[0.05] active:scale-[0.98]',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      'group'
    )}
  >
    {/* Avatar */}
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-[#131317]">
      {user.image ? (
        <CldImage src={user.image} alt={user.name ?? ''} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7849FB]/30 to-[#9D7BFF]/10">
          <span className="text-sm font-bold text-[#9D7BFF]">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="truncate text-sm font-semibold text-white leading-tight">
        {user.name}
      </p>
      <p className="text-xs text-[#4A4658] truncate">
        @{user.name?.toLowerCase().replace(/\s/g, '')}
      </p>
    </div>

    {/* Arrow icon */}
    <LuMessageSquarePlus
      className="h-4 w-4 text-[#4A4658] group-hover:text-[#9D7BFF] transition-colors shrink-0"
    />
  </button>
)

// ─── Tab ──────────────────────────────────────────────────────────────────────
const Tab = ({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-200 relative',
      active ? 'text-white' : 'text-[#4A4658] hover:text-[#6E6A7E]'
    )}
  >
    {label}
    {count > 0 && (
      <span className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
        active ? 'bg-[#7849FB]/20 text-[#9D7BFF]' : 'bg-white/[0.04] text-[#4A4658]'
      )}>
        {count}
      </span>
    )}
    {active && (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r from-[#7849FB] to-[#9D7BFF]" />
    )}
  </button>
)

// ─── Empty ────────────────────────────────────────────────────────────────────
const Empty = ({ tab, search }: { tab: string; search: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-14 select-none">
    <p className="text-xs text-[#4A4658]">
      {search ? `No results for "${search}"` : `No ${tab} yet`}
    </p>
  </div>
)

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonRows = () => (
  <div className="flex flex-col gap-0.5 px-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.04] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-28 rounded-md bg-white/[0.04] animate-pulse" />
          <div className="h-2.5 w-20 rounded-md bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────
const NewConversationDialog = ({
  open,
  onOpenChange,
  userId,
  onSelectUser,
  onExistingConversation,
}: NewConversationDialogProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [tab, setTab]       = useState<'followers' | 'following'>('followers')
  const [search, setSearch] = useState('')

  // ── Followers ─────────────────────────────────────────────────────────────
  const {
    data: followersData,
    isLoading: followersLoading,
    fetchNextPage: fetchMoreFollowers,
    hasNextPage: hasMoreFollowers,
    isFetchingNextPage: fetchingMoreFollowers,
  } = useInfiniteQuery(
    trpc.user.getInfiniteFollowers.infiniteQueryOptions(
      { limit: 20, userId, cursor: undefined },
      {
        enabled: open,
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.cursor : undefined,
      }
    )
  )

  // ── Following ─────────────────────────────────────────────────────────────
  const {
    data: followingData,
    isLoading: followingLoading,
    fetchNextPage: fetchMoreFollowing,
    hasNextPage: hasMoreFollowing,
    isFetchingNextPage: fetchingMoreFollowing,
  } = useInfiniteQuery(
    trpc.user.getInfiniteFollowing.infiniteQueryOptions(
      { limit: 20, userId, cursor: undefined },
      {
        enabled: open,
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.cursor : undefined,
      }
    )
  )

  const handleSelect = async (targetUser: FollowUser) => {
    const { queryKey, queryFn } = trpc.conversation.getConversation.queryOptions(
      { participants: [targetUser.id], type: 'dm' }
    )

    try {
      const exists = await queryClient.fetchQuery({ queryKey, queryFn })

      if (exists) {
        onOpenChange(false)
        onExistingConversation?.({
          id: targetUser.id,
          name: targetUser.name,
          image: targetUser.image ?? null,
        })
        return
      }
    } catch {
      // If the existence check fails, continue with normal recipient selection.
    }

    onSelectUser({ id: targetUser.id, name: targetUser.name, image: targetUser.image ?? null })
    onOpenChange(false)
  }

  

  const followers: FollowUser[] = useMemo(() =>
    followersData?.pages.flatMap((p) =>
      p.followers.map((f) => ({
        id:    f.follower.id,
        name:  f.follower.name ?? null,
        image: f.follower.image ?? null,
      }))
    ) ?? [],
  [followersData])

  const following: FollowUser[] = useMemo(() =>
    followingData?.pages.flatMap((p) =>
      p.following.map((f) => ({
        id:    f.following.id,
        name:  f.following.name ?? null,
        image: f.following.image ?? null,
      }))
    ) ?? [],
  [followingData])

  const activeList     = tab === 'followers' ? followers : following
  const isLoading      = tab === 'followers' ? followersLoading   : followingLoading
  const isFetchingMore = tab === 'followers' ? fetchingMoreFollowers : fetchingMoreFollowing
  const hasMore        = tab === 'followers' ? hasMoreFollowers    : hasMoreFollowing
  const fetchMore      = tab === 'followers' ? fetchMoreFollowers  : fetchMoreFollowing

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activeList
    return activeList.filter((u) => u.name?.toLowerCase().includes(q))
  }, [activeList, search])

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (near && hasMore && !isFetchingMore) fetchMore()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md w-full p-0 gap-0 overflow-hidden',
          'bg-[#0F0F12] border border-white/10 rounded-3xl',
          'shadow-2xl shadow-black/60'
        )}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7849FB] to-[#9D7BFF]">
              <LuMessageSquarePlus className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-base font-bold text-white tracking-tight">
              New Message
            </DialogTitle>
          </div>
          <p className="text-xs text-[#4A4658] mt-2 pl-0.5">
            Choose someone from your network
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pt-4">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A4658] text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className={cn(
                'h-11 w-full rounded-2xl',
                'border border-white/10 bg-[#17171C]',
                'pl-10 pr-4 text-sm text-white',
                'outline-none transition-all',
                'placeholder:text-[#4A4658]',
                'focus:border-[#7849FB]/50 focus:ring-2 focus:ring-[#7849FB]/15'
              )}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-5 mt-4 flex border-b border-white/[0.05]">
          <Tab
            label="Followers"
            count={followers.length}
            active={tab === 'followers'}
            onClick={() => setTab('followers')}
          />
          <Tab
            label="Following"
            count={following.length}
            active={tab === 'following'}
            onClick={() => setTab('following')}
          />
        </div>

        {/* List */}
        <div
          className="overflow-y-auto px-2 py-2"
          style={{ maxHeight: '340px' }}
          onScroll={handleListScroll}
        >
          {isLoading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <Empty tab={tab} search={search} />
          ) : (
            filtered.map((user) => (
              <UserRow key={user.id} user={user} onClick={() => handleSelect(user)} />
            ))
          )}

          {isFetchingMore && (
            <div className="flex justify-center py-3">
              <RiLoader2Line className="h-4 w-4 animate-spin text-[#7849FB]" />
            </div>
          )}
        </div>

        <div className="h-3" />
      </DialogContent>
    </Dialog>
  )
}

export default NewConversationDialog
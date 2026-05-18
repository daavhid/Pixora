import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/utils/trpc'
import { CldImage } from 'next-cloudinary'
import { Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import { UserProfile } from '@repo/trpc/user'

const ShowFollow = ({
  open,
  setOpen,
  followName,
  user,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  followName: 'following' | 'followers'
  user: UserProfile
}) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const isOwnProfile = user.isSelf

  const followersQuery = useInfiniteQuery(
    trpc.user.getInfiniteFollowers.infiniteQueryOptions(
      {
        limit: 10,
        userId: user.id,
        cursor: undefined,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.cursor : undefined,
        enabled: open && followName === 'followers',
      }
    )
  )

  const followingQuery = useInfiniteQuery(
    trpc.user.getInfiniteFollowing.infiniteQueryOptions(
      {
        limit: 10,
        userId: user.id,
        cursor: undefined,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.cursor : undefined,
          enabled: open ,
      }
    )
  )

  const followersKey =
    trpc.user.getInfiniteFollowers.infiniteQueryKey({
      limit: 10,
      userId: user.id,
      cursor: undefined,
    })

  const followingKey =trpc.user.getInfiniteFollowing.infiniteQueryKey({
      limit: 10,
      userId: user.id,
      cursor: undefined,
    })

  const userProfileQueryKey =trpc.user.getUserById.queryKey({userId: user.id,})

  const infiniteUsersKey =
    trpc.user.getInfiniteUsersToFollow.infiniteQueryKey()

  const activeKey =
    followName === 'followers'
      ? followersKey
      : followingKey

  const toggleFollowMutation = useMutation(
    trpc.user.toggleFollow.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: activeKey,
          }),
          queryClient.invalidateQueries({
            queryKey: userProfileQueryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: infiniteUsersKey,
          }),
        ])
      },
    })
  )

  const toggleFollow = async (targetUserId: string) => {
    await toggleFollowMutation.mutateAsync({
      targetUserId,
    })
  }

  const activeQuery =
    followName === 'followers'
      ? followersQuery
      : followingQuery

  const list =
    activeQuery.data?.pages.flatMap((page: any) =>
      followName === 'followers'
        ? page.followers
        : page.following
    ) ?? []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-[#121214] border-white/10 text-white p-0 overflow-hidden gap-0 shadow-2xl">

        {/* Header */}
        <DialogHeader className="p-6 border-b border-white/5 bg-[#1a1a1c]/50 backdrop-blur-md">
          <DialogTitle className="text-xl font-semibold capitalize flex items-center gap-2">
            <Users className="size-5 text-[#7849FB]" />
            {followName}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">

          {activeQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-[#7849FB]" />
              <p className="text-sm text-zinc-500">
                Loading {followName}...
              </p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Users className="size-12 mb-4 opacity-20" />
              <p>No {followName} yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item: any) => {
                console.log(item,'this is the item')
                const listedUser =
                  followName === 'followers'
                    ? item.follower
                    : item.following

                const isLoading =
                  toggleFollowMutation.isPending &&
                  toggleFollowMutation.variables?.targetUserId ===
                    listedUser.id

                const shouldShowFollowBack =
                  !item.isFollowing &&
                  followName === 'followers' &&
                  isOwnProfile

                return (
                  <div
                    key={listedUser.id}
                    className="group flex items-center justify-between rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] px-3 py-3 transition-all"
                  >
                    {/* Left */}
                    <Link
                      href={`/profile/${listedUser.id}`}
                      className="flex items-center gap-4 min-w-0"
                    >
                      {/* Avatar */}
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-[#7849FB]/20">
                        {listedUser.image ? (
                          <CldImage
                            src={listedUser.image}
                            alt={listedUser.name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#7849FB] to-[#45269b]">
                            <span className="font-bold text-white">
                              {listedUser.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="min-w-0">
                        <p className="trun text-sm font-semibold text-white">
                          {listedUser.name}
                           
                        </p>

                        <p className="truncate text-xs text-zinc-500">
                          @
                          {listedUser.name
                            ?.toLowerCase()
                            .replace(/\s/g, '')}
                        </p>
                      </div>
                    </Link>

                    {/* Action */}
                    {item.isSelf ? (
                      <Link
                        href={`/profile/${listedUser.id}`}
                        className="flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
                      >
                        You
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() =>
                          toggleFollow(listedUser.id)
                        }
                        className={`
                          h-8 rounded-full px-4 text-xs font-bold transition-all
                          
                          ${
                            item.isFollowing
                              ? 'border border-white/15 bg-transparent text-zinc-300 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400'
                              : 'bg-[#7849FB] text-white hover:bg-[#6d3ff5]'
                          }
                        `}
                      >
                        {isLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : item.isFollowing ? (
                          <>
                            <span className="group-hover:hidden">
                              Following
                            </span>

                            <span className="hidden group-hover:inline">
                              Unfollow
                            </span>
                          </>
                        ) : shouldShowFollowBack ? (
                          'Follow Back'
                        ) : (
                          'Follow'
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Load More */}
          {activeQuery.hasNextPage && (
            <Button
              onClick={() => activeQuery.fetchNextPage()}
              disabled={activeQuery.isFetchingNextPage}
              variant="ghost"
              className="mt-4 w-full text-zinc-400 hover:text-white"
            >
              {activeQuery.isFetchingNextPage ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Load More'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShowFollow
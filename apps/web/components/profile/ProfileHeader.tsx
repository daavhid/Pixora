'use client'

import Image from 'next/image'
import React from 'react'
import { Button } from '../ui/button'
import { UserProfile } from '@repo/trpc/user'
import { formatCount } from '@/utils/formatCount'
import { EditProfileDialog } from './EditProfileDialog'
import { useTRPC } from '@/utils/trpc'
import { useInfiniteQuery } from '@tanstack/react-query'
import ShowFollow from './ShowFollow'
import { CldImage } from 'next-cloudinary'

const ProfileHeader = ({ user }: { user: UserProfile }) => {
  const [open, setOpen] = React.useState(false)
  const [openfollowDialog, setOpenFollowDialog] = React.useState(false)
  const [followName, setFollowName] = React.useState<
    'followers' | 'following'
  >('followers')

  const trpc = useTRPC()

  useInfiniteQuery(
    trpc.user.getInfiniteFollowers.infiniteQueryOptions(
      {
        limit: 10,
        userId: user.id,
        cursor: undefined,
      },
      {
        getNextPageParam: (lastPage) =>
          lastPage.hasNextPage ? lastPage.cursor : undefined,
      }
    )
  )

  const showFollow = (followName: 'following' | 'followers') => {
    setOpenFollowDialog(true)
    setFollowName(followName)
  }

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0C]">
        {/* Cover */}
        <div className="relative h-52 md:h-72 w-full">
          <Image
            src="/Cover Photo.png"
            alt="cover"
            fill
            priority
            className="object-cover"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Content */}
        <div className="relative px-5 md:px-10 pb-8">
          {/* Avatar */}
          <div className="absolute -top-16 md:-top-20 left-5 md:left-10">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-[#0A0A0C] p-2 shadow-2xl">
              <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-[#151518]">
                <CldImage
                  src={user.image || 'https://i.pravatar.cc/150'}
                  alt="avatar"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Edit button */}
          <div className="min-h-[60px] flex justify-end pt-4">
            {user.isSelf && (
              <Button
                onClick={() => setOpen(true)}
                className="rounded-full px-6 py-5 bg-gradient-to-r from-[#CDBDFF] to-[#7849FB] text-[#370096] font-semibold hover:opacity-90 transition"
              >
                Edit Profile
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className=" mt-8 md:mt-10">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-2xl capitalize md:text-4xl font-semibold text-white tracking-tight">
                  {user.name}
                </h2>
                <p className="truncate  text-zinc-500">
                    @
                    {user.name
                      ?.toLowerCase()
                      .replace(/\s/g, '')}
                </p>
              </div>

              <p className="max-w-2xl text-sm md:text-base text-[#B7B4C7] leading-relaxed">
                {user.bio || 'No bio yet'}
              </p>

              <p className="text-sm text-[#8E8A9E] capitalize">
                📍 {user.location || 'No location set'}
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">
                  {formatCount(user.postsCount)}
                </span>
                <span className="text-sm text-[#8E8A9E]">Posts</span>
              </div>

              <button
                onClick={() => showFollow('followers')}
                className="flex flex-col text-left hover:opacity-80 transition"
              >
                <span className="text-2xl font-bold text-white">
                  {formatCount(user.followersCount)}
                </span>
                <span className="text-sm text-[#8E8A9E]">Followers</span>
              </button>

              <button
                onClick={() => showFollow('following')}
                className="flex flex-col text-left hover:opacity-80 transition"
              >
                <span className="text-2xl font-bold text-white">
                  {formatCount(user.followingCount)}
                </span>
                <span className="text-sm text-[#8E8A9E]">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditProfileDialog
        open={open}
        onOpenChange={setOpen}
        user={user}
      />

      <ShowFollow
        open={openfollowDialog}
        setOpen={setOpenFollowDialog}
        followName={followName}
        user={user}
      />
    </>
  )
}

export default ProfileHeader
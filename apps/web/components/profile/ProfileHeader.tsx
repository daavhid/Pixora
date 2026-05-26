'use client'

import Image from 'next/image'
import React from 'react'
import { Button } from '../ui/button'
import { UserProfile } from '@repo/trpc/user'
import { formatCount } from '@/utils/formatCount'
import { EditProfileDialog } from './EditProfileDialog'
import ShowFollow from './ShowFollow'
import { CldImage } from 'next-cloudinary'
import PreConversationDialog, { PreConversationUser } from '../messages/PreConversationDialog'
import { LuMessageSquare } from 'react-icons/lu'

const ProfileHeader = ({ user }: { user: UserProfile }) => {
  const [open, setOpen]                           = React.useState(false)
  const [openFollowDialog, setOpenFollowDialog]   = React.useState(false)
  const [openMessageDialog, setOpenMessageDialog] = React.useState(false)
  const [openPreConvoDialog, setOpenPreConvoDialog] = React.useState(false)
  const [selectedRecipient, setSelectedRecipient] = React.useState<PreConversationUser | null>(null)
  const [followName, setFollowName]               = React.useState<'followers' | 'following'>('followers')

  const showFollow = (name: 'following' | 'followers') => {
    setOpenFollowDialog(true)
    setFollowName(name)
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

          {/* Action buttons */}
          <div className="min-h-[60px] flex items-center justify-end gap-2 pt-4">
            {user.isSelf ? (
              // Own profile — edit only
              <Button
                onClick={() => setOpen(true)}
                className="rounded-full px-6 py-5 bg-gradient-to-r from-[#CDBDFF] to-[#7849FB] text-[#370096] font-semibold hover:opacity-90 transition"
              >
                Edit Profile
              </Button>
            ) : (
              // Someone else's profile — message button
              <Button
                onClick={() => {
                  setSelectedRecipient({
                    id: user.id,
                    name: user.name!,
                    image: user.image ?? null,
                  })
                  setOpenPreConvoDialog(true)
                }}
                variant="outline"
                className="flex items-center gap-2 rounded-full px-6 py-5 border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 transition"
              >
                <LuMessageSquare className="h-4 w-4" />
                Message
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="mt-8 md:mt-10">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-2xl capitalize md:text-4xl font-semibold text-white tracking-tight">
                  {user.name}
                </h2>
                <p className="truncate text-zinc-500">
                  @{user.name?.toLowerCase().replace(/\s/g, '')}
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

      {/* Edit profile dialog — own profile only */}
      <EditProfileDialog
        open={open}
        onOpenChange={setOpen}
        user={user}
      />

      {/* Follow list dialog */}
      <ShowFollow
        open={openFollowDialog}
        setOpen={setOpenFollowDialog}
        followName={followName}
        user={user}
      />

      {/* Direct message dialog — other profiles only */}
      {!user.isSelf && (
        <PreConversationDialog
          open={openPreConvoDialog}
          onOpenChange={setOpenPreConvoDialog}
          recipient={selectedRecipient}
          onBack={() => {
            setOpenPreConvoDialog(false)
          }}
        />
      )}
    </>
  )
}

export default ProfileHeader
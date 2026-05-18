
'use client'
import Aside from '@/components/dashboard/Aside'

import ProfileBody from '@/components/profile/ProfileBody'

import ProfileHeader from '@/components/profile/ProfileHeader'

import ProfilePageSkeleton from '@/components/profile/ProfileSkeleton'

// import { ProfilePageSkeleton } from '@/components/profile/ProfileSkeleton'

import { useUser } from '@/hooks/useUser'

import { useTRPC } from '@/utils/trpc'

import { useQuery } from '@tanstack/react-query'

import React from 'react'



// ─── Error state ──────────────────────────────────────────────────────────────

const ProfileError = () => (

  <div className="flex min-h-screen items-center justify-center bg-[#0A0A0C]">

    <div className="flex flex-col items-center gap-3 text-center">

      <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10">

        <span className="text-2xl">⚠</span>

      </div>

      <p className="text-sm font-medium text-white/70">Failed to load profile</p>

      <p className="text-xs text-white/30">Please try refreshing the page</p>

    </div>

  </div>

)



// ─── Page ─────────────────────────────────────────────────────────────────────

const ProfileClient = ({userId}:{userId:string}) => {

//   const sessionData = useUser()

  const trpc = useTRPC()



  const {

    data: profileData,

    isLoading,

    isError,

  } = useQuery(

    trpc.user.getUserById.queryOptions(

      { userId: userId ?? '' },

      { enabled: !!userId }

    )

  )



  // ── Loading — session not ready or query in flight ─────────────────────────

  // Show skeleton while either the session is resolving OR the query is fetching.

  // This prevents a flash of the error state before sessionData is available.

  if (!userId || isLoading) {

    return <ProfilePageSkeleton />

  }



  if (isError) {

    return <ProfileError />

  }



  // ── Resolved ───────────────────────────────────────────────────────────────

  return (

    <div className="grid min-h-screen grid-cols-12 bg-[#0A0A0C] pb-6 relative">

      <div className="col-span-8 space-y-4">

        <ProfileHeader user={profileData!} />

        <ProfileBody user={profileData!} />

      </div>

      <div className="col-span-4 h-80 bg-[#09090B]/80 rounded-lg p-4 sticky top-0">

        <Aside />

      </div>

    </div>

  )

}



export default ProfileClient
'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// ─── Shimmer primitive ────────────────────────────────────────────────────────
const Shimmer = ({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) => (
  <div
    style={style}
    className={cn(
      'relative overflow-hidden rounded-md bg-white/4',
      'before:absolute before:inset-0',
      'before:-translate-x-full',
      'before:animate-[shimmer_1.6s_infinite]',
      'before:bg-linear-to-r',
      'before:from-transparent before:via-white/6 before:to-transparent',
      className
    )}
  />
)

// ─── ProfileHeader skeleton ───────────────────────────────────────────────────
const ProfileHeaderSkeleton = () => (
  <div className="relative w-full">
    {/* Cover image */}
    <Shimmer className="h-44 w-full rounded-none rounded-t-xl md:h-56" />

    {/* Avatar + name row */}
    <div className="px-5 pb-5">
      <div className="flex items-end justify-between">
        {/* Avatar */}
        <Shimmer className="-mt-10 size-20 rounded-full border-4 border-[#0A0A0C] md:-mt-12 md:size-24" />

        {/* Action buttons placeholder */}
        <div className="mb-1 flex gap-2">
          <Shimmer className="h-8 w-20 rounded-full" />
          <Shimmer className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Name + handle */}
      <div className="mt-3 space-y-2">
        <Shimmer className="h-5 w-36 rounded-md" />
        <Shimmer className="h-3.5 w-24 rounded-md" />
      </div>

      {/* Bio lines */}
      <div className="mt-4 space-y-2">
        <Shimmer className="h-3 w-full rounded-md" />
        <Shimmer className="h-3 w-4/5 rounded-md" />
      </div>

      {/* Stats row */}
      <div className="mt-5 flex gap-6">
        {[60, 48, 56].map((w, i) => (
          <div key={i} className="space-y-1.5">
            <Shimmer className="h-4 w-8 rounded-md" />
            <Shimmer className={`h-3 rounded-md`} style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ─── ProfileBody skeleton ─────────────────────────────────────────────────────
const ProfileBodySkeleton = () => (
  <div className="px-5 space-y-4">
    {/* Tab bar */}
    <div className="flex gap-4 border-b border-white/6 pb-1">
      {[72, 56, 64].map((w, i) => (
        <Shimmer key={i} className="h-3.5 rounded-md" style={{ width: w }} />
      ))}
    </div>

    {/* Post grid */}
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 9 }).map((_, i) => (
        <Shimmer key={i} className="aspect-square w-full rounded-sm" />
      ))}
    </div>
  </div>
)

// ─── Aside skeleton ───────────────────────────────────────────────────────────
const AsideSkeleton = () => (
  <div className="space-y-4">
    <Shimmer className="h-4 w-28 rounded-md" />
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3 w-24 rounded-md" />
            <Shimmer className="h-2.5 w-16 rounded-md" />
          </div>
          <Shimmer className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  </div>
)

// ─── Full page skeleton ───────────────────────────────────────────────────────
export const ProfilePageSkeleton = () => (
  <div className="grid min-h-screen grid-cols-12 bg-[#0A0A0C] pb-6">
    <div className="col-span-8 space-y-4">
      <ProfileHeaderSkeleton />
      <ProfileBodySkeleton />
    </div>
    <div className="col-span-4 h-80 rounded-lg bg-[#09090B]/80 p-4 sticky top-6">
      <AsideSkeleton />
    </div>
  </div>
)

export default ProfilePageSkeleton
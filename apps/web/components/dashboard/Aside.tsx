'use client'
import Image from 'next/image';
import Link from 'next/link'
import React,{useState} from 'react'
import { CldImage } from "next-cloudinary"
import { Button } from '../ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/utils/trpc';

const footerLinks = ["About", "Help", "Privacy", "Terms", "Language"];

const Aside = () => {
    const queryClient = useQueryClient()
    const trpc = useTRPC()
    const {data} = useInfiniteQuery(trpc.user.getInfiniteUsersToFollow.infiniteQueryOptions(
        {
            cursor:undefined,
            limit:10,
            userId:null
        },
        {
            getNextPageParam:(lastPage)=>(
                lastPage.hasNextPage ? lastPage.cursor : undefined
            )
        }
    ))
    const infiniteArtistKey = trpc.user.getInfiniteUsersToFollow.infiniteQueryKey()
    const followersKey =
    trpc.user.getInfiniteFollowers.infiniteQueryKey({limit:10})

  const followingKey =trpc.user.getInfiniteFollowing.infiniteQueryKey({
    limit:10,
  })
    const toggleFollowMutation = useMutation(trpc.user.toggleFollow.mutationOptions())
    const [isSubmitting,setIsSubmitting] = useState(false)

    const userProfileQueryKey = trpc.user.getUserById.queryKey()

    const toggleFollow = (targetUserId:string) => {
        setIsSubmitting(true)
        toggleFollowMutation.mutateAsync({
            targetUserId
        },
    {
        onSuccess() {
            queryClient.invalidateQueries({queryKey:infiniteArtistKey})
            queryClient.invalidateQueries({queryKey:userProfileQueryKey})
            queryClient.invalidateQueries({queryKey:followersKey})
            queryClient.invalidateQueries({queryKey:followingKey})
            setIsSubmitting(false)
        },
    })
    }

    const recommendedArtists = data?.pages.flatMap(page=>page.users) ?? []
    return (
        <aside className='space-y-6 w-full max-w-xs'>
            <div className='flex justify-between items-center'>
                <h2 className='text-white font-bold'>Recommended Artists</h2>
                <Link href='#' className='text-[#BA9EFF] text-sm hover:underline transition-all'>
                    view all
                </Link>
            </div>

            <div className='space-y-8'>
                {recommendedArtists.map((artist) => (
                    <div key={artist.id} className='flex justify-between items-center group'>
                        <div className='flex items-center gap-3'>
                            {/* Avatar Container */}
                            <div className='relative size-11 rounded-xl overflow-hidden border border-[#7849FB]/20'>
                                {
                                    artist?.image && artist?.name ? (
                
                                    <CldImage
                                        src={artist?.image}
                                        alt={artist?.name}
                                        preload
                                        fill
                                        className="object-cover"
                                    />
                                    ):(
                                    <div className='w-full h-full bg-linear-to-br from-[#7849FB] to-[#45269b] flex items-center justify-center'>
                                        <span className='text-white font-bold'>{artist?.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    )
                                }
                            </div>

                            {/* Name & Role */}
                            <div>
                                <div className='flex items-center gap-1'>
                                    <p className='text-white font-medium text-sm'>{artist.name}</p>
                                </div>
                                <p className='text-[#71717A] text-xs font-light'>Designer</p>
                            </div>
                        </div>

                        {/* Follow Toggle */}
                        <Button
                            onClick={() => toggleFollow(artist.id)}
                            disabled={isSubmitting}
                            variant="outline"
                            className={`rounded-full px-4 h-8 text-xs transition-colors bg-transparent border-[#ffffff]/10 text-white hover:bg-white/5 hover:text-white
                            }`}
                        >
                            {'Follow'}
                        </Button>
                    </div>
                ))}
            </div>
            {/* Footer Section */}
            <footer className='pt-4 border-t border-white/5'>
                <div className='flex flex-wrap gap-x-4 gap-y-2 mb-4'>
                    {footerLinks.map((link) => (
                        <Link 
                            key={link} 
                            href="#" 
                            className='text-[#71717A] text-sm hover:text-white transition-colors'
                        >
                            {link}
                        </Link>
                    ))}
                </div>
                <p className='text-[#71717A] text-xs'>
                    &copy; 2026 Pixora Digital Atelier
                </p>
            </footer>
        </aside>
    );
};

export default Aside;
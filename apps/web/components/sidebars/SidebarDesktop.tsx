
'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React, { Fragment } from 'react'
import { GoHomeFill } from "react-icons/go";
import { IoCompassOutline } from "react-icons/io5";
import { FiMessageSquare } from "react-icons/fi";
import { IoIosNotifications } from "react-icons/io";
import { FaRegUser } from "react-icons/fa"
import { usePathname } from 'next/navigation'



export const sidebarMenu = [
  {
    route:'/',
    pathName:'Feed',
    icon:GoHomeFill
  },
  {
    route:'/explore',
    pathName:'Explore',
    icon:IoCompassOutline

  },
  {
    route:'/messages',
    pathName:'Messages',
    icon:FiMessageSquare
  },
  {
    route:'/notifications',
    pathName:'Notification',
    icon:IoIosNotifications
  },
  {
    route:'/profile',
    pathName:'Profile',
    icon:FaRegUser
  }
] 
const SidebarDesktop = () => {
  
  const pathName = usePathname()
  return (
    <div className='w-64 h-screen fixed top-0 left-0 bg-[#09090B]/80 hidden md:flex flex-col  py-8 px-4'>
        <div className='px-6 pb-8'>
            <h1 className='text-4xl font-extrabold bg-repeat bg-linear-to-t  from-[#8B5CF6] via-[#22D3EE] via-30% to-[#7C3AED]  bg-clip-text text-transparent'>Pixora</h1>
            <p className='text-[#71717A] text-md'>The Digital Curator</p>
        </div>
        <div className='flex flex-col space-y-2'>
          {sidebarMenu.map((menu,index)=>{
            const isActive = pathName === menu.route
            return (
                <Link key={index} href={menu.route} className={cn('relative ', isActive ?'text-[#EDE9FE] bg-linear-to-r from-[#7C3AED]/20 to-[#7C3AED]/0 ':'text-[#71717A]','items-center space-x-4 px-6 py-3 rounded-lg hover:bg-[#71717A]/20 transition-colors duration-200')} >
                  <div className='flex items-center space-x-4'>
                    <menu.icon  className='text-xl'/>
                    <span className={cn('text-md',isActive ? 'font-semibold':'font-medium')}>{menu.pathName}</span>
                  </div>
                  <span className={cn('absolute top-0 left-0 h-full w-1 bg-[#8B5CF6]',isActive ?'inline-flex':'hidden')}></span>
                </Link>
            )
          }
          )}
        </div>
        
    </div>
  )
}

export default SidebarDesktop
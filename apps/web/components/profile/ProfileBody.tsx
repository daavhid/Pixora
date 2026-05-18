'use client'
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MdOutlineWidgets } from "react-icons/md";
import { IoPlayCircleOutline } from "react-icons/io5";
import { FaRegBookmark } from "react-icons/fa";
import PostCards from './PostCards';
import { User, UserProfile } from '@repo/trpc/user';
import SavedPost from './SavedPost';

const tabs = [
  {
    value:'posts',
    label:'Posts',
    icon:MdOutlineWidgets
  },
  {
    value:'media',
    label:'Media',
    icon:IoPlayCircleOutline
  },
  {
    value:'saved',
    label:'Saved',
    icon:FaRegBookmark
  }
]


const ProfileBody = ({user}:{user: UserProfile}) => {
  return (
    <div className='w-full'>
      <div className=' w-full'>
        <Tabs defaultValue="account" className="">
          <TabsList  className='bg-[#1A191B]/60 w-3/4 h-12! space-x-2  flex mx-auto text-white justify-center'>
          {
            tabs
              .filter(tab => tab.value !== 'saved' || user.isSelf)
              .map((tab,index)=>(
                
                <TabsTrigger key={index}  value={tab.value} className={'data-active:bg-[#ffffff]/10 hover:text-white hover:bg-[#ffffff]/5 data-active:hover:data-active:bg-[#ffffff]/10 data-active:text-white data-active:font-medium text-[#ADAAAB] '} >
                  <span className="flex items-center justify-center text-5xl!">
                    <tab.icon />
                  </span> {tab.label}
                </TabsTrigger>
              ))
          }
          </TabsList>
          <TabsContent value="posts">
            <PostCards user={user}/>
          </TabsContent>
          <TabsContent value="media">Change your password here.</TabsContent>
          {
            user.isSelf &&
            <TabsContent value="saved">
              <SavedPost user={user}/>
            </TabsContent>
          }
        </Tabs>
      </div>
    </div>
  )
}

export default ProfileBody
import Aside from '@/components/dashboard/Aside'
import Feed from '@/components/dashboard/feeds/Feed'
import Stories from '@/components/dashboard/stories/Stories'
import React from 'react'

const page = () => {
  return (
    <div className='px-8 py-6 grid grid-cols-12  min-h- relative'>
      <div className='col-span-8  space-y-8'>
        <Stories/>
        <Feed/>
      </div>
      <div className='col-span-4 h-fit bg-[#09090B]/80  rounded-lg p-4 sticky top-6'>
        <Aside/>
      </div>
      
      
    </div>
  )
}

export default page
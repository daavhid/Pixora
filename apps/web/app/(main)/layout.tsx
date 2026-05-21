import React from 'react'
import SidebarDesktop from "@/components/sidebars/SidebarDesktop";

const layout = ({children}:{children:React.ReactNode}) => {
  return (
    <div className=''>
        <SidebarDesktop/>
        <div className="ml-64">
            {children}
        </div>
    </div>
  )
}

export default layout
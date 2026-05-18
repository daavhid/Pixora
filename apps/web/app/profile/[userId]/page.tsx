import ProfileClient from '@/components/profile/ProfileClient'
import React, { Fragment } from 'react'

const page = async ({params}:{params:Promise<{userId:string}>}) => {
    const {userId} = await params
  return (
    <div>
      <ProfileClient userId={userId}/>
    </div>
    // <Fragment>
    // </Fragment>
  )
}

export default page
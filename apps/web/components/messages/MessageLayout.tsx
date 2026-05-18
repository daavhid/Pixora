import React from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'

const MessageLayout = () => {
  return (
    <div className='grid grid-cols-12 min-h-screen w-full'>
        <div className='col-span-4'>
            <h2>Messages</h2>
            <div>
                <FaMagnifyingGlass />
                <input type="text" name="search " id="search-messages" placeholder='Search Conversation '/>
            </div>
        </div>
        <div className='col-span-8'> second col</div>
    </div>
  )
}

export default MessageLayout
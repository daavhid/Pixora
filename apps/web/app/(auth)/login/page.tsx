import LoginForm from '@/components/auth/LoginForm'
import React from 'react'

const loginPage = () => {
  return (
    <div className='w-full max-w-lg p-4'>
        <div className=' p-4 mx-auto  text-center'>
            <h1 className='text-3xl font-semibold'>Sign in to your account</h1>
            <p className='text-muted-foreground font-light'>Don't have an account? <a href="/signup" className='font-bold'>Sign up</a></p>
        </div>
        <LoginForm />
    </div>
  )
}

export default loginPage
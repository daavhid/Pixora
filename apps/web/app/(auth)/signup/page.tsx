import SignUpForm from '@/components/auth/signUpForm'
import React from 'react'

const signupPage = () => {
  return (
    <div className='w-full max-w-lg p-4 '>
      <div className=' p-4 mx-auto  text-center'>
          <h1 className='text-4xl font-semibold'>Create your account</h1>
          <p className='text-muted-foreground font-light'>Already have an account? <a href="/login" className='font-bold'>Sign In</a></p>
      </div>
      <SignUpForm />
    </div>
  )
}

export default signupPage
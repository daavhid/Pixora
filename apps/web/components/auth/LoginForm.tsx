'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from '../ui/button'
import { Controller, useForm } from 'react-hook-form'
import { loginData, loginSchema } from '@/lib/auth/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { authError,login } from '@/lib/auth/client'
import FormError from './FormError'
import { useRouter } from 'next/navigation'

const LoginForm = () => {
    const [isSubmitting,setIsSubmitting] = useState(false)
    const [error,setError] = useState<authError | null>(null)
    const router = useRouter()


    const form  = useForm<loginData>({
        resolver:zodResolver(loginSchema),
        defaultValues: {
            email:'',
            password:''
        }
    })

    const onSubmitHandler = async(data:loginData) => {
        setIsSubmitting(true)
        setError(null)
        try {
           const user =  await login(data)
           if(user){
            router.push('/')
           }
        } catch (error) {
            setError(error? error as authError : {
                code:'unknown_error',
                message:'An unknown error occurred. Please try again.',
                status:500,
                statusText:'Internal Server Error'
            })
            
        }finally{
            setIsSubmitting(false)
        
        }
    }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Sign In </CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSubmitHandler)}>
                {error && <FormError error={error?.message} className='p-3 text-center capitalize rounded-md mb-4'/>}
                <FieldGroup>
                    <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                placeholder="Enter your email"
                                autoComplete="off"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                    <Controller
                        name="password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                type='password'
                                aria-invalid={fieldState.invalid}
                                placeholder="Create a password"
                                autoComplete="off"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                    <Button  type='submit' className='w-full py-6 ' disabled={isSubmitting}>
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </Button>
                </FieldGroup>
                
            </form>
        </CardContent>
    </Card>
  )
}

export default LoginForm
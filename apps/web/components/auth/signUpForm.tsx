'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Controller, useForm } from 'react-hook-form'
import { signUpData, signUpSchema } from '@/lib/auth/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from '../ui/button'
import { authError, signUp } from '@/lib/auth/client'
import FormError from './FormError'
import { useRouter } from 'next/navigation'

const SignUpForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error,setError] = useState<authError | null>(null)
    const router = useRouter()

    const form = useForm<signUpData>({
        resolver:zodResolver(signUpSchema),
        defaultValues: {
            name:'',
            email:'',
            password:'',
            confirmPassword:''
        }
    })

    

    const onSubmitHandler = async(data:signUpData) => {
        setIsSubmitting(true)
        setError(null)
        try{
            const userData = await signUp(data)
            if(userData)router.push('/');

            
        }catch(error :unknown){
            setError(error? error as authError : {
                code:'unknown_error',
                message:'An unknown error occurred. Please try again.',
                status:500,
                statusText:'Internal Server Error'
            })
            console.log(error,'this is the error')
        }finally{
            setIsSubmitting(false)
            form.reset()
        }
    }
  return (
    <Card>
        <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={form.handleSubmit(onSubmitHandler)}>
                {error && <FormError error={error?.message} className='p-3 text-center capitalize rounded-md mb-4'/>}
                <FieldGroup>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                aria-invalid={fieldState.invalid}
                                placeholder="Enter your full name"
                                autoComplete="off"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
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
                    <Controller
                        name="confirmPassword"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                type='password'
                                aria-invalid={fieldState.invalid}
                                placeholder="Confirm your password"
                                autoComplete="off"
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                    <Button  type='submit' className='w-full py-6' disabled={isSubmitting}>
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </FieldGroup>
                
            </form>
        </CardContent>
    </Card>
  )
}


export default SignUpForm
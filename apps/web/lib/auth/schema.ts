import * as z from 'zod'

export const signUpSchema = z.object({
    name: z.string().min(3,'Name must be atleast 3 characters'),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8,'Password must be atleast 8 characters'),
    confirmPassword: z.string(),
}).refine(data=> data.password === data.confirmPassword,{
    message:'Password do not match',
    path:['confirmPassword']
})

export const loginSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8,'Password must be atleast 8 characters'),
})

export type signUpData = z.infer<typeof signUpSchema>
export type loginData = z.infer<typeof loginSchema>
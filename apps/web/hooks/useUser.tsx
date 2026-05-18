'use client'
import { authClient } from '@/lib/auth/client'

export const useUser = () => {
    const { 
        data, 
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession() 
    
    if (!data) return null
    return {user:data.user,isPending,error,session:data.session}
}


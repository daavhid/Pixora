
import { createAuthClient } from "better-auth/react"
import { loginData, loginSchema, signUpData, signUpSchema } from "@/lib/auth/schema";



type AuthClient = ReturnType<typeof createAuthClient>;

export const authClient: AuthClient = createAuthClient({
    basePath: `api/auth`,
});



export interface authError{
	message: string; // e.g., "Invalid email or password"
	status: number; // HTTP status code
	statusText: string; // HTTP status text
	code ? : string; // Error code for programmatic handling
}

export const signUp = async (formData:signUpData)=> {
    
    const { data, error } = await authClient.signUp.email({
        email: formData.email ,
        password: formData.password,
        name: formData.name,
        callbackURL:'/login'
    });

    if (error){
        throw error
    }
    return data;

}
export const login = async (formData:loginData) => {
    const { data, error } = await authClient.signIn.email({
        email: formData.email ,
        password: formData.password,
    });
    if (error) {
        throw error
    }
    return data;

}




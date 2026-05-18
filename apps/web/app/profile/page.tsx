'use client'


import { useUser } from "@/hooks/useUser";
import { redirect } from "next/navigation";

export default  function ProfileRedirectPage() {
  // 1. Fetch the logged-in user session on the server
  const sessionData = useUser()

  // 2. If they aren't logged in, send them to sign-in
  if (!sessionData || !sessionData?.user) {
    redirect("/login");
  }

  // 3. ✨ THE MAGIC TRICK: Bounce them to their unique dynamic route
  redirect(`/profile/${sessionData?.user.id}`);
}
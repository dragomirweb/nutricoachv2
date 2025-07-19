import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();
  const router = useRouter();
  
  const isAuthenticated = !!session;
  const user = session?.user;
  
  const logout = useCallback(async () => {
    try {
      await signOut();
      router.push("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    }
  }, [router]);
  
  return {
    session,
    user,
    isAuthenticated,
    isPending,
    error,
    logout,
    refetch,
  };
}

export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isPending } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isPending, router, redirectTo]);
  
  return { isAuthenticated, isPending };
}

export function useRequireGuest(redirectTo = "/dashboard") {
  const { isAuthenticated, isPending } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isPending, router, redirectTo]);
  
  return { isAuthenticated: !isAuthenticated, isPending };
}

export function useSessionActivity() {
  const { session } = useAuth();
  
  useEffect(() => {
    if (!session) return;
    
    const updateActivity = () => {
      fetch("/api/auth/activity", {
        method: "POST",
        credentials: "include",
      }).catch(console.error);
    };
    
    const interval = setInterval(updateActivity, 5 * 60 * 1000);
    
    const handleUserActivity = () => {
      if (document.visibilityState === "visible") {
        updateActivity();
      }
    };
    
    document.addEventListener("visibilitychange", handleUserActivity);
    window.addEventListener("focus", handleUserActivity);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleUserActivity);
      window.removeEventListener("focus", handleUserActivity);
    };
  }, [session]);
}
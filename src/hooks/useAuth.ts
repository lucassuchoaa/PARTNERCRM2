import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/auth";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      // Buscar usuário do localStorage
      const user = await getCurrentUser();
      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}

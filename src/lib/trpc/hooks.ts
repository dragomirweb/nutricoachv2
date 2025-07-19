/**
 * Custom hooks for common tRPC operations
 */

import { api } from "./client";
import { useCallback } from "react";

/**
 * Hook for handling tRPC mutations with toast notifications
 * This is a placeholder implementation. For actual use, you would
 * directly use the mutation hooks from api with toast notifications
 */
export function useMutationWithToast() {
  // This function serves as documentation for the pattern
  // In practice, use mutations directly like:
  // const mutation = api.meals.create.useMutation({
  //   onSuccess: () => toast.success("Success!"),
  //   onError: () => toast.error("Error!")
  // });
  return null;
}

/**
 * Hook for invalidating queries after mutations
 */
export function useInvalidate() {
  const utils = api.useUtils();

  const invalidateAll = useCallback(() => {
    utils.invalidate();
  }, [utils]);

  const invalidateQueries = useCallback(
    (queryKeys: string[]) => {
      // In practice, you would invalidate specific queries like:
      // utils.meals.list.invalidate();
      // utils.user.getProfile.invalidate();
      queryKeys.forEach(() => {
        // This is a simplified implementation
        utils.invalidate();
      });
    },
    [utils]
  );

  return { invalidateAll, invalidateQueries };
}

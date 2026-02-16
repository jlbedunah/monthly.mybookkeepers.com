import useSWR from "swr";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionName: string | null;
  subscriptionAmount: string | null;
  lastSyncedAt: string | null;
}

export function useSubscriptionStatus() {
  const { data, error, isLoading, mutate } = useSWR<SubscriptionStatus>("/api/subscription");
  return { subscription: data, error, isLoading, mutate };
}

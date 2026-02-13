import useSWR from "swr";
import type { MonthlyPackageSummary } from "@/lib/types";

export function useBookkeeperMonths(clientId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MonthlyPackageSummary[]>(
    clientId ? `/api/bookkeeper/clients/${clientId}/months` : null
  );
  return { months: data || [], error, isLoading, mutate };
}

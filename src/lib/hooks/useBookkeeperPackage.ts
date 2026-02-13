import useSWR from "swr";
import type { MonthlyPackage } from "@/lib/types";

export function useBookkeeperPackage(
  clientId: string | null,
  monthId: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<MonthlyPackage>(
    clientId && monthId
      ? `/api/bookkeeper/clients/${clientId}/months/${monthId}`
      : null
  );
  return { pkg: data, error, isLoading, mutate };
}

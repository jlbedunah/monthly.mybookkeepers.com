import useSWR from "swr";
import type { MonthlyPackageSummary } from "@/lib/types";

export function useMonthlyHistory() {
  const { data, error, isLoading, mutate } = useSWR<MonthlyPackageSummary[]>(
    "/api/months"
  );
  return { history: data || [], error, isLoading, mutate };
}

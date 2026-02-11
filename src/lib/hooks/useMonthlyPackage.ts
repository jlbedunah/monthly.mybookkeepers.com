import useSWR from "swr";
import type { MonthlyPackage } from "@/lib/types";

export function useMonthlyPackage(packageId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MonthlyPackage>(
    packageId ? `/api/months/${packageId}` : null
  );
  return { pkg: data, error, isLoading, mutate };
}

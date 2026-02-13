import useSWR from "swr";
import type { BookkeeperClient } from "@/lib/types";

export function useBookkeeperClients(search: string, filter: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (filter) params.set("filter", filter);
  const qs = params.toString();
  const key = `/api/bookkeeper/clients${qs ? `?${qs}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<BookkeeperClient[]>(key);
  return { clients: data || [], error, isLoading, mutate };
}

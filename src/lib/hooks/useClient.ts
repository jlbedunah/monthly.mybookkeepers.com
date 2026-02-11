import useSWR from "swr";
import type { Client } from "@/lib/types";

export function useClient() {
  const { data, error, isLoading, mutate } = useSWR<Client>("/api/user");
  return { client: data, error, isLoading, mutate };
}

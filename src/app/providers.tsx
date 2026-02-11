"use client";

import { SWRConfig } from "swr";
import { Toaster } from "react-hot-toast";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
      {children}
      <Toaster position="top-right" />
    </SWRConfig>
  );
}

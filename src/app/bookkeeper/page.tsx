"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BookOpen, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientListTable } from "@/components/bookkeeper/ClientListTable";
import { triggerSubscriptionSync } from "@/lib/api";
import toast from "react-hot-toast";
import type { BookkeeperClient } from "@/lib/types";

export default function BookkeeperPage() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSelectClient = (client: BookkeeperClient) => {
    router.push(`/bookkeeper/${client.id}`);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await triggerSubscriptionSync();
      toast.success(
        `Synced ${result.totalSubscriptions} subscriptions, ${result.matchedUsers} matched`
      );
      // Refresh the page to reload client list with updated statuses
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sync failed"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">
              MyBookkeepers.com
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Bookkeeper
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            isLoading={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Sync Subscriptions
          </Button>
        </div>
        <ClientListTable onSelectClient={handleSelectClient} />
      </main>
    </div>
  );
}

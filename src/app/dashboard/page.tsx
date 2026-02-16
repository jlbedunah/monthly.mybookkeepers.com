"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientInfoCard } from "@/components/dashboard/ClientInfoCard";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { StatementList } from "@/components/dashboard/StatementList";
import { SubmitButton } from "@/components/dashboard/SubmitButton";
import { MonthlyHistory } from "@/components/dashboard/MonthlyHistory";
import { useClient } from "@/lib/hooks/useClient";
import { useMonthlyPackage } from "@/lib/hooks/useMonthlyPackage";
import { useMonthlyHistory } from "@/lib/hooks/useMonthlyHistory";
import { useSubscriptionStatus } from "@/lib/hooks/useSubscriptionStatus";
import { createMonth } from "@/lib/api";
import type { MonthlyPackageSummary } from "@/lib/types";

export default function DashboardPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);

  const { client, mutate: mutateClient } = useClient();
  const { pkg, mutate: mutatePkg } = useMonthlyPackage(currentPackageId);
  const { history, mutate: mutateHistory } = useMonthlyHistory();
  const { subscription } = useSubscriptionStatus();

  const ensurePackage = useCallback(
    async (month: number, year: number) => {
      // Check history for existing package
      const existing = history.find(
        (h: MonthlyPackageSummary) => h.month === month && h.year === year
      );
      if (existing) {
        setCurrentPackageId(existing.id);
        return;
      }

      // Create new package
      try {
        const result = await createMonth(month, year);
        const newPkg = result as { id: string };
        setCurrentPackageId(newPkg.id);
        mutateHistory();
      } catch {
        // If 409, the package exists — refetch history
        mutateHistory();
      }
    },
    [history, mutateHistory]
  );

  useEffect(() => {
    ensurePackage(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, ensurePackage]);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleHistorySelect = (item: MonthlyPackageSummary) => {
    setSelectedMonth(item.month);
    setSelectedYear(item.year);
    setCurrentPackageId(item.id);
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

      <main className="mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            {subscription?.hasActiveSubscription === false && client?.billingEmail && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  Subscription payment overdue — please update your payment method to continue service.
                </p>
              </div>
            )}
            {subscription?.hasActiveSubscription === true && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
                <span className="text-sm text-green-700">
                  Subscription{subscription.subscriptionName ? `: ${subscription.subscriptionName}` : ""}
                  {subscription.subscriptionAmount ? ` — $${subscription.subscriptionAmount}/mo` : ""}
                </span>
              </div>
            )}
            {client && !client.billingEmail && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-600">
                  Add your billing email in your profile to check subscription status.
                </p>
              </div>
            )}

            <ClientInfoCard client={client} onUpdate={mutateClient} />

            <MonthSelector
              month={selectedMonth}
              year={selectedYear}
              onChange={handleMonthChange}
            />

            {pkg && (
              <>
                <StatementList
                  pkg={pkg}
                  onUpdate={() => {
                    mutatePkg();
                    mutateHistory();
                  }}
                />
                <SubmitButton
                  pkg={pkg}
                  onSubmit={() => {
                    mutatePkg();
                    mutateHistory();
                  }}
                />
              </>
            )}
          </div>

          <div>
            <MonthlyHistory
              history={history}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

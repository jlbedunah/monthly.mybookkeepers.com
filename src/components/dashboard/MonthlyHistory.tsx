"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "./StatusBadge";
import { MONTHS } from "@/lib/constants";
import { clsx } from "clsx";
import type { MonthlyPackageSummary } from "@/lib/types";
import { History } from "lucide-react";

interface MonthlyHistoryProps {
  history: MonthlyPackageSummary[];
  selectedMonth: number;
  selectedYear: number;
  onSelect: (item: MonthlyPackageSummary) => void;
}

export function MonthlyHistory({
  history,
  selectedMonth,
  selectedYear,
  onSelect,
}: MonthlyHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">History</h3>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {history.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">No months yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item) => {
              const isSelected =
                item.month === selectedMonth && item.year === selectedYear;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={clsx(
                    "flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-gray-50",
                    isSelected && "bg-red-50"
                  )}
                >
                  <div>
                    <p
                      className={clsx(
                        "text-sm font-medium",
                        isSelected ? "text-red-700" : "text-gray-900"
                      )}
                    >
                      {MONTHS[item.month - 1]} {item.year}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.statementCount} statement
                      {item.statementCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

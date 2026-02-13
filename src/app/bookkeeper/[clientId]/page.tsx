"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, BookOpen, LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatusUpdateControl } from "@/components/bookkeeper/StatusUpdateControl";
import { DownloadButton } from "@/components/bookkeeper/DownloadButton";
import { useBookkeeperMonths } from "@/lib/hooks/useBookkeeperMonths";
import { useBookkeeperPackage } from "@/lib/hooks/useBookkeeperPackage";
import { MONTHS } from "@/lib/constants";
import type { MonthlyPackageSummary, PackageStatus, InstitutionType } from "@/lib/types";

const INST_TYPE_LABELS: Record<InstitutionType, string> = {
  bank: "Bank",
  credit_card: "Credit Card",
  loan: "Loan",
  other: "Other",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const { months, isLoading: monthsLoading, mutate: mutateMonths } =
    useBookkeeperMonths(clientId);
  const { pkg, isLoading: pkgLoading, mutate: mutatePkg } =
    useBookkeeperPackage(clientId, selectedMonthId);

  // Auto-select first month when months load
  if (!selectedMonthId && months.length > 0) {
    setSelectedMonthId(months[0].id);
  }

  const handleMonthSelect = (item: MonthlyPackageSummary) => {
    setSelectedMonthId(item.id);
  };

  const handleStatusUpdate = () => {
    mutatePkg();
    mutateMonths();
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
        <button
          onClick={() => router.push("/bookkeeper")}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div className="min-w-0 space-y-6">
            {pkgLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : pkg ? (
              <>
                {/* Package header with controls */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {MONTHS[pkg.month - 1]} {pkg.year}
                      </h2>
                      <DownloadButton
                        clientId={clientId}
                        monthId={pkg.id}
                        statementCount={pkg.statements.length}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StatusUpdateControl
                      clientId={clientId}
                      monthId={pkg.id}
                      currentStatus={pkg.status}
                      onUpdate={handleStatusUpdate}
                    />
                  </CardContent>
                </Card>

                {/* Statement list (read-only) */}
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-gray-700">
                      Statements ({pkg.statements.length})
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {pkg.statements.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <FileText className="mb-2 h-8 w-8" />
                        <p className="text-sm">No statements uploaded yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500">
                              <th className="pb-3 pr-4 font-medium">Institution</th>
                              <th className="pb-3 pr-4 font-medium">Account</th>
                              <th className="pb-3 pr-4 font-medium">Type</th>
                              <th className="pb-3 pr-4 font-medium">File</th>
                              <th className="pb-3 font-medium text-right">Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pkg.statements.map((stmt) => (
                              <tr
                                key={stmt.id}
                                className="border-b border-gray-100"
                              >
                                <td className="py-3 pr-4 font-medium text-gray-900">
                                  {stmt.institutionName}
                                </td>
                                <td className="py-3 pr-4 text-gray-700">
                                  ****{stmt.accountLast4}
                                </td>
                                <td className="py-3 pr-4 text-gray-700">
                                  {INST_TYPE_LABELS[stmt.institutionType as InstitutionType] ?? stmt.institutionType}
                                </td>
                                <td className="py-3 pr-4 text-gray-700">
                                  {stmt.fileName}
                                </td>
                                <td className="py-3 text-right text-gray-500">
                                  {formatFileSize(stmt.fileSize)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <FileText className="mb-2 h-8 w-8" />
                    <p className="text-sm">Select a month to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Months sidebar */}
          <div>
            <Card>
              <CardHeader>
                <h3 className="text-sm font-medium text-gray-700">Monthly History</h3>
              </CardHeader>
              <CardContent>
                {monthsLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : months.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No monthly packages yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {months.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => handleMonthSelect(m)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            selectedMonthId === m.id
                              ? "bg-red-50 ring-1 ring-red-200"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {MONTHS[m.month - 1]} {m.year}
                            </span>
                            <StatusBadge status={m.status as PackageStatus} />
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {m.statementCount} statement{m.statementCount !== 1 ? "s" : ""}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

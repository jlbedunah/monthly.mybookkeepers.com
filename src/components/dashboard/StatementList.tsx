"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "./StatusBadge";
import { AddStatementModal } from "./AddStatementModal";
import { Trash2, Plus, FileText, ExternalLink } from "lucide-react";
import { deleteStatement } from "@/lib/api";
import toast from "react-hot-toast";
import type { MonthlyPackage } from "@/lib/types";

interface StatementListProps {
  pkg: MonthlyPackage;
  onUpdate: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  credit_card: "Credit Card",
  loan: "Loan",
  other: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  bank: "bg-red-100 text-red-800",
  credit_card: "bg-purple-100 text-purple-800",
  loan: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatementList({ pkg, onUpdate }: StatementListProps) {
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canEdit = pkg.status === "need_statements";

  const handleDelete = async (statementId: string) => {
    setDeletingId(statementId);
    try {
      await deleteStatement(pkg.id, statementId);
      toast.success("Statement deleted");
      onUpdate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">Statements</h3>
              <StatusBadge status={pkg.status} />
            </div>
            {canEdit && (
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Statement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pkg.statements.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No statements uploaded yet</p>
              {canEdit && (
                <p className="mt-1 text-xs text-gray-400">
                  Click &quot;Add Statement&quot; to upload your bank and credit card
                  statements
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3">Institution</th>
                    <th className="px-6 py-3">Acct #</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">File</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Date</th>
                    {canEdit && <th className="px-6 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pkg.statements.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {s.institutionName}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        ••••{s.accountLast4}
                      </td>
                      <td className="px-6 py-3">
                        <Badge className={TYPE_COLORS[s.institutionType]}>
                          {TYPE_LABELS[s.institutionType]}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-500"
                        >
                          {s.fileName}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {formatFileSize(s.fileSize)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(s.uploadedAt).toLocaleDateString()}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s.id)}
                            isLoading={deletingId === s.id}
                            disabled={!!deletingId}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddStatementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        packageId={pkg.id}
        onSuccess={() => {
          setShowModal(false);
          onUpdate();
        }}
      />
    </>
  );
}

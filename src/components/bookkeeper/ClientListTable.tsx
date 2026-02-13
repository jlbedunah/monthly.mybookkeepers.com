"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useBookkeeperClients } from "@/lib/hooks/useBookkeeperClients";
import type { BookkeeperClient, PackageStatus } from "@/lib/types";

interface ClientListTableProps {
  onSelectClient: (client: BookkeeperClient) => void;
}

const FILTER_OPTIONS = [
  { value: "", label: "All clients" },
  { value: "categorizing", label: "Categorizing" },
  { value: "need_statements", label: "Need statements" },
  { value: "reconciling", label: "Reconciling" },
  { value: "no_uploads", label: "No uploads" },
];

export function ClientListTable({ onSelectClient }: ClientListTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((handleSearch as { timer?: ReturnType<typeof setTimeout> }).timer);
    (handleSearch as { timer?: ReturnType<typeof setTimeout> }).timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const { clients, isLoading } = useBookkeeperClients(debouncedSearch, filter);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <Select
            options={FILTER_OPTIONS}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="mb-2 h-8 w-8" />
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Client</th>
                  <th className="pb-3 pr-4 font-medium">Company</th>
                  <th className="pb-3 pr-4 font-medium">Latest Status</th>
                  <th className="pb-3 pr-4 font-medium text-right">Statements</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => onSelectClient(client)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="py-3 pr-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.name ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {client.companyName ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {client.latestPackageStatus ? (
                        <StatusBadge status={client.latestPackageStatus as PackageStatus} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-700">
                      {client.statementCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

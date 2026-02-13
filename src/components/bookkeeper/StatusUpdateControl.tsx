"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updatePackageStatus } from "@/lib/api";
import type { PackageStatus } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "need_statements", label: "Need Statements" },
  { value: "categorizing", label: "Categorizing" },
  { value: "categorized", label: "Categorized" },
  { value: "reconciling", label: "Reconciling" },
  { value: "reconciled", label: "Reconciled" },
  { value: "finished", label: "Finished" },
];

interface StatusUpdateControlProps {
  clientId: string;
  monthId: string;
  currentStatus: PackageStatus;
  onUpdate: () => void;
}

export function StatusUpdateControl({
  clientId,
  monthId,
  currentStatus,
  onUpdate,
}: StatusUpdateControlProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const hasChanged = status !== currentStatus;

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updatePackageStatus(clientId, monthId, { status });
      toast.success("Status updated");
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-end gap-3">
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => setStatus(e.target.value as PackageStatus)}
      />
      {hasChanged && (
        <Button size="sm" onClick={handleSave} isLoading={isUpdating}>
          Save
        </Button>
      )}
    </div>
  );
}

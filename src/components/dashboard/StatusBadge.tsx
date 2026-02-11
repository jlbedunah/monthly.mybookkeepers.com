import { Badge } from "@/components/ui/Badge";
import { STATUS_CONFIG } from "@/lib/constants";
import type { PackageStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: PackageStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={config.color}>
      {config.emoji} {config.label}
    </Badge>
  );
}

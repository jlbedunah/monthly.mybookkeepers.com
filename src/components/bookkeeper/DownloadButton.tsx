"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { downloadStatements } from "@/lib/api";

interface DownloadButtonProps {
  clientId: string;
  monthId: string;
  statementCount: number;
}

export function DownloadButton({
  clientId,
  monthId,
  statementCount,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadStatements(clientId, monthId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      isLoading={isDownloading}
      disabled={statementCount === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Download ZIP ({statementCount} files)
    </Button>
  );
}

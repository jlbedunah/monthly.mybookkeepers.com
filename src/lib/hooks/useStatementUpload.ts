import { useState, useCallback } from "react";
import { uploadStatement } from "@/lib/api";

export function useStatementUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (packageId: string, formData: FormData) => {
      setIsUploading(true);
      setProgress(0);
      try {
        const result = await uploadStatement(packageId, formData, setProgress);
        return result;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    []
  );

  return { upload, progress, isUploading };
}

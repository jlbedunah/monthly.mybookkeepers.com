"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { clsx } from "clsx";
import { ALLOWED_FILE_EXTENSIONS } from "@/lib/constants";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, accept, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelect(file);
    },
    [disabled, onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={clsx(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        isDragging
          ? "border-red-400 bg-red-50"
          : "border-gray-300 hover:border-gray-400",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Upload className="mb-2 h-8 w-8 text-gray-400" />
      <p className="text-sm text-gray-600">
        Drag & drop your file here, or{" "}
        <label className="cursor-pointer font-medium text-red-600 hover:text-red-500">
          browse
          <input
            type="file"
            className="hidden"
            accept={accept || ALLOWED_FILE_EXTENSIONS.join(",")}
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
              e.target.value = "";
            }}
          />
        </label>
      </p>
      <p className="mt-1 text-xs text-gray-400">
        PDF, CSV, PNG, JPG up to 10MB
      </p>
    </div>
  );
}

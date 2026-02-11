"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useStatementUpload } from "@/lib/hooks/useStatementUpload";
import { FileText, X } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";

interface AddStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  onSuccess: () => void;
}

const INSTITUTION_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "credit_card", label: "Credit Card" },
  { value: "loan", label: "Loan" },
  { value: "other", label: "Other" },
];

export function AddStatementModal({
  isOpen,
  onClose,
  packageId,
  onSuccess,
}: AddStatementModalProps) {
  const [institutionName, setInstitutionName] = useState("");
  const [accountLast4, setAccountLast4] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { upload, progress, isUploading } = useStatementUpload();

  const { data: institutions } = useSWR<string[]>(
    isOpen ? "/api/institutions" : null
  );

  const filteredSuggestions = (institutions || []).filter((name) =>
    name.toLowerCase().includes(institutionName.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setInstitutionName("");
      setAccountLast4("");
      setInstitutionType("");
      setFile(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !institutionName || !accountLast4 || !institutionType) {
      toast.error("Please fill in all fields and select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("institutionName", institutionName);
    formData.append("accountLast4", accountLast4);
    formData.append("institutionType", institutionType);

    try {
      await upload(packageId, formData);
      toast.success("Statement uploaded");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Statement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="institution"
            label="Institution Name"
            placeholder="e.g., Chase Bank"
            value={institutionName}
            onChange={(e) => {
              setInstitutionName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            required
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onMouseDown={() => {
                    setInstitutionName(name);
                    setShowSuggestions(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          id="accountLast4"
          label="Last 4 of Account #"
          placeholder="e.g., 1234"
          value={accountLast4}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
            setAccountLast4(val);
          }}
          maxLength={4}
          inputMode="numeric"
          pattern="\d{4}"
          required
        />

        <Select
          id="type"
          label="Account Type"
          value={institutionType}
          onChange={(e) => setInstitutionType(e.target.value)}
          options={INSTITUTION_TYPES}
          required
        />

        {file ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <DropZone onFileSelect={setFile} disabled={isUploading} />
        )}

        {isUploading && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Uploading... {progress}%
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isUploading} disabled={!file}>
            Upload Statement
          </Button>
        </div>
      </form>
    </Modal>
  );
}

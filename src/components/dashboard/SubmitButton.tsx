"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Send } from "lucide-react";
import { submitPackage } from "@/lib/api";
import toast from "react-hot-toast";
import type { MonthlyPackage } from "@/lib/types";

interface SubmitButtonProps {
  pkg: MonthlyPackage;
  onSubmit: () => void;
}

export function SubmitButton({ pkg, onSubmit }: SubmitButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (pkg.status !== "need_statements") return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitPackage(pkg.id);
      toast.success("Statements sent to your bookkeeper!");
      setShowConfirm(false);
      onSubmit();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => setShowConfirm(true)}
          disabled={pkg.statements.length === 0}
        >
          <Send className="mr-2 h-4 w-4" />
          Send to MyBookkeepers.com
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="Submit Statements"
        message={`You're about to submit ${pkg.statements.length} statement(s) to your bookkeeper. Once submitted, you won't be able to add or remove statements for this month.`}
        confirmLabel="Submit"
        isLoading={isSubmitting}
      />
    </>
  );
}

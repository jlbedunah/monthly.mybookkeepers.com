"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MONTHS } from "@/lib/constants";

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const handlePrev = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-3 shadow-sm">
      <Button variant="ghost" size="sm" onClick={handlePrev}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="min-w-[200px] text-center text-lg font-semibold text-gray-900">
        {MONTHS[month - 1]} {year}
      </h2>
      <Button variant="ghost" size="sm" onClick={handleNext}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

import { BookOpen } from "lucide-react";
import { SubscriptionForm } from "@/components/subscription/SubscriptionForm";

export default function StartMonthlyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-600">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Start Your Monthly Bookkeeping
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            $189/month — Cancel anytime
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <SubscriptionForm />
        </div>
      </div>
    </div>
  );
}

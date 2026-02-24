"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle } from "lucide-react";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Accept: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { dataLayer: Record<string, any>[]; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function fbq(...args: any[]): void;
}

interface AcceptResponse {
  opaqueData?: { dataDescriptor: string; dataValue: string };
  messages: {
    resultCode: "Ok" | "Error";
    message: Array<{ code: string; text: string }>;
  };
}

export function SubscriptionForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // TODO: Restore Accept.js loading when re-enabling Authorize.net
  // useEffect(() => {
  //   if (typeof window !== "undefined" && typeof Accept !== "undefined") {
  //     setScriptLoaded(true);
  //     return;
  //   }
  //   const script = document.createElement("script");
  //   script.src = "https://js.authorize.net/v1/Accept.js";
  //   script.charset = "utf-8";
  //   script.onload = () => setScriptLoaded(true);
  //   document.head.appendChild(script);
  // }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!name || !email || !companyName || !phone || !address || !zip || !cardNumber || !expDate || !cvv) {
        setError("Please fill out all fields.");
        return;
      }

      setIsLoading(true);

      // TODO: Restore Accept.js tokenization when re-enabling Authorize.net
      // For now, skip tokenization and send directly to our API without payment processing
      try {
        const res = await fetch("/api/start-monthly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            companyName,
            phone,
            address,
            zip,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong. Please try again.");
          setIsLoading(false);
          return;
        }

        setSuccess(true);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "purchase",
          value: 1,
          currency: "USD",
        });
        if (typeof fbq === "function") {
          fbq("track", "Purchase", { value: 1.00, currency: "USD" });
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, companyName, phone, address, zip, cardNumber, expDate, cvv]
  );

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          You&apos;re all set!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Check your email at <strong>{email}</strong> for a link to log in to
          your bookkeeping portal.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Full Name"
        placeholder="John Smith"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="john@yourcompany.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="companyName"
        label="Company Name"
        placeholder="Smith Consulting LLC"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      />
      <Input
        id="phone"
        label="Phone Number"
        type="tel"
        placeholder="(555) 123-4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        autoComplete="tel"
      />
      <Input
        id="address"
        label="Billing Address"
        placeholder="123 Main St"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        autoComplete="street-address"
      />
      <Input
        id="zip"
        label="ZIP Code"
        placeholder="75092"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        required
        autoComplete="postal-code"
      />

      <hr className="border-gray-200" />

      <Input
        id="cardNumber"
        label="Card Number"
        placeholder="4111 1111 1111 1111"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        required
        autoComplete="cc-number"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="expDate"
          label="Expiration"
          placeholder="MM/YY"
          value={expDate}
          onChange={(e) => setExpDate(e.target.value)}
          required
          autoComplete="cc-exp"
        />
        <Input
          id="cvv"
          label="CVV"
          placeholder="123"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          required
          autoComplete="cc-csc"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isLoading}
      >
        Subscribe — $1 to Start
      </Button>

      <p className="text-center text-xs text-gray-400">
        Secure payment processed by Authorize.net
      </p>
    </form>
  );
}

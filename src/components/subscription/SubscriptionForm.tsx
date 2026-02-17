"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle } from "lucide-react";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Accept: any;
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
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof Accept !== "undefined") {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.authorize.net/v1/Accept.js";
    script.charset = "utf-8";
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!scriptLoaded || typeof Accept === "undefined") {
        setError("Payment system is loading. Please try again.");
        return;
      }

      // Check if AcceptCore.js has finished loading
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).isReady) {
        setError("Payment system is still initializing. Please wait a moment and try again.");
        return;
      }

      if (!name || !email || !companyName || !cardNumber || !expDate || !cvv) {
        setError("Please fill out all fields.");
        return;
      }

      // Parse expiration MM/YY
      const expParts = expDate.replace(/\s/g, "").split("/");
      if (expParts.length !== 2 || !expParts[0] || !expParts[1]) {
        setError("Expiration date must be MM/YY format.");
        return;
      }
      const [expMonth, expYear] = expParts;

      setIsLoading(true);

      // Fetch credentials from server at runtime (same pattern as working cart)
      let clientKey: string;
      let apiLoginID: string;
      try {
        const credRes = await fetch("/api/authorize-client-key");
        const credData = await credRes.json();
        if (!credRes.ok || !credData.clientKey) {
          setError("Payment system unavailable. Please try again later.");
          setIsLoading(false);
          return;
        }
        clientKey = credData.clientKey;
        apiLoginID = credData.apiLoginID;
      } catch {
        setError("Failed to initialize payment. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log("Accept.js credentials:", {
        apiLoginID: apiLoginID?.substring(0, 4) + "****",
        clientKey: clientKey?.substring(0, 4) + "****",
        apiLoginIDLen: apiLoginID?.length,
        clientKeyLen: clientKey?.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isReady: (window as any).isReady,
      });

      // Tokenize card via Accept.js (2-arg format per Accept.js source)
      const secureData = {
        authData: { clientKey, apiLoginID },
        cardData: {
          cardNumber: cardNumber.replace(/\s/g, ""),
          month: expMonth,
          year: expYear.length === 2 ? `20${expYear}` : expYear,
          cardCode: cvv,
        },
      };

      const timeout = setTimeout(() => {
        setError("Payment request timed out. Please try again.");
        setIsLoading(false);
      }, 15000);

      try {
        Accept.dispatchData(secureData, async (response: AcceptResponse) => {
          clearTimeout(timeout);

          if (response.messages.resultCode === "Error") {
            const msgs = response.messages.message.map(
              (m: { code: string; text: string }) => `[${m.code}] ${m.text}`
            );
            console.error("Accept.js error:", response.messages.message);
            setError(msgs.join(". "));
            setIsLoading(false);
            return;
          }

          // Send to our API
          try {
            const res = await fetch("/api/start-monthly", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                email,
                companyName,
                opaqueData: response.opaqueData,
              }),
            });

            const data = await res.json();

            if (!res.ok) {
              setError(data.error || "Something went wrong. Please try again.");
              setIsLoading(false);
              return;
            }

            setSuccess(true);
          } catch {
            setError("Network error. Please try again.");
          } finally {
            setIsLoading(false);
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        console.error("Accept.js dispatch error:", err);
        setError(
          `Failed to process card: ${err instanceof Error ? err.message : String(err)}`
        );
        setIsLoading(false);
      }
    },
    [name, email, companyName, cardNumber, expDate, cvv, scriptLoaded]
  );

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          You're all set!
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
        disabled={!scriptLoaded}
      >
        Subscribe — $189/mo
      </Button>

      <p className="text-center text-xs text-gray-400">
        Secure payment processed by Authorize.net
      </p>
    </form>
  );
}

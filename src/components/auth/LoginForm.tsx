"use client";

import { useState, useEffect } from "react";
import { signIn, getProviders } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, CheckCircle } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    getProviders().then((providers) => {
      if (providers?.credentials) setIsMock(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isMock) {
        const result = await signIn("credentials", {
          email,
          redirect: false,
        });
        if (result?.ok) {
          window.location.href = "/dashboard";
        } else {
          setError("Login failed. Please try again.");
        }
      } else {
        const result = await signIn("resend", {
          email,
          redirect: false,
        });
        if (result?.error) {
          setError("Failed to send magic link. Please try again.");
        } else {
          setSent(true);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We sent a sign-in link to <strong>{email}</strong>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Click the link in the email to sign in. It may take a minute to
          arrive.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-4 text-sm text-red-600 hover:text-red-500"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        label="Email address"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        error={error}
      />
      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        <Mail className="mr-2 h-4 w-4" />
        {isMock ? "Sign in (demo)" : "Send magic link"}
      </Button>
      {isMock && (
        <p className="text-center text-xs text-amber-600">
          Mock mode — enter any email to sign in instantly
        </p>
      )}
    </form>
  );
}

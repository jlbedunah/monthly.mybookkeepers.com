"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateUser } from "@/lib/api";
import toast from "react-hot-toast";
import type { UpdateUserInput } from "@/lib/validations";

export function OnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserInput>();

  const onSubmit = async (data: UpdateUserInput) => {
    setIsLoading(true);
    try {
      await updateUser(data);
      toast.success("Profile saved!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="name"
        label="Your Name"
        placeholder="John Smith"
        error={errors.name?.message}
        {...register("name", { required: "Name is required" })}
      />
      <Input
        id="companyName"
        label="Company Name"
        placeholder="Smith Consulting LLC"
        error={errors.companyName?.message}
        {...register("companyName", { required: "Company name is required" })}
      />
      <Input
        id="qboName"
        label="QuickBooks Online Company Name (optional)"
        placeholder="Same as company name if unsure"
        {...register("qboName")}
      />
      <Input
        id="phone"
        label="Phone Number (optional)"
        placeholder="(555) 123-4567"
        {...register("phone")}
      />
      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        Continue to Dashboard
      </Button>
    </form>
  );
}

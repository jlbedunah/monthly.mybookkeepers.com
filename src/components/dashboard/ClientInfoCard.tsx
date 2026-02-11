"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pencil, X } from "lucide-react";
import { updateUser } from "@/lib/api";
import toast from "react-hot-toast";
import type { Client } from "@/lib/types";
import type { UpdateUserInput } from "@/lib/validations";
import type { KeyedMutator } from "swr";

interface ClientInfoCardProps {
  client: Client | undefined;
  onUpdate: KeyedMutator<Client>;
}

export function ClientInfoCard({ client, onUpdate }: ClientInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<UpdateUserInput>({
    defaultValues: {
      name: client?.name || "",
      companyName: client?.companyName || "",
      qboName: client?.qboName || "",
      phone: client?.phone || "",
    },
  });

  if (!client) {
    return (
      <Card>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (data: UpdateUserInput) => {
    setIsSaving(true);
    try {
      await updateUser(data);
      await onUpdate();
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                id="edit-name"
                label="Name"
                {...register("name", { required: true })}
              />
              <Input
                id="edit-company"
                label="Company"
                {...register("companyName", { required: true })}
              />
              <Input
                id="edit-qbo"
                label="QBO Name"
                {...register("qboName")}
              />
              <Input
                id="edit-phone"
                label="Phone"
                {...register("phone")}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={isSaving}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <span className="text-gray-500">Name:</span>{" "}
              <span className="font-medium text-gray-900">{client.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Company:</span>{" "}
              <span className="font-medium text-gray-900">
                {client.companyName}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>{" "}
              <span className="font-medium text-gray-900">{client.email}</span>
            </div>
            {client.qboName && (
              <div>
                <span className="text-gray-500">QBO:</span>{" "}
                <span className="font-medium text-gray-900">
                  {client.qboName}
                </span>
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-medium text-gray-900">
                  {client.phone}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset({
                name: client.name || "",
                companyName: client.companyName || "",
                qboName: client.qboName || "",
                phone: client.phone || "",
              });
              setIsEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

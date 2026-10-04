"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { MapPin, Plus } from "lucide-react";
import { savedAddressSchema, COUNTRIES } from "@/lib/validation/schemas";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { Alert, EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/providers/toast-provider";
import { AddressFields } from "@/features/checkout/address-fields";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "./actions";
import type { Address } from "@/types/domain";

type Values = z.input<typeof savedAddressSchema>;

function AddressForm({ address, onDone }: { address: Address | null; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(savedAddressSchema),
    defaultValues: address
      ? {
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? "",
          city: address.city,
          province: address.province ?? "",
          postalCode: address.postalCode ?? "",
          country: address.country,
          isDefault: address.isDefault,
        }
      : { country: "PK", isDefault: false },
  });

  const country = useWatch({ control, name: "country" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const res = await saveAddressAction(values, address?.id);
    if (!res.ok) {
      for (const [k, v] of Object.entries(res.fieldErrors ?? {})) if (v?.[0]) setError(k as keyof Values, { message: v[0] });
      return setFormError(res.error);
    }
    toast({ message: res.message ?? "Address saved" });
    onDone();
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 p-5 md:p-7">
      {error && <Alert tone="error">{error}</Alert>}
      <AddressFields bind={(name) => ({ props: register(name), error: errors[name]?.message })} idPrefix="book" country={country} />
      <Checkbox label="Set as default address" {...register("isDefault")} />
      <Button type="submit" block loading={isSubmitting}>
        Save address
      </Button>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Address | null | "new">(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast({ tone: "error", message: res.error ?? "Something went wrong" });
      else {
        toast({ message: res.message ?? "Saved" });
        router.refresh();
      }
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-[32px]">Addresses</h1>
        <Button variant="secondary" size="sm" icon={<Plus className="size-4" strokeWidth={1.5} />} onClick={() => setEditing("new")}>
          Add address
        </Button>
      </div>

      {addresses.length ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2" aria-busy={pending}>
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col border border-line p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="font-ui text-[15px] font-medium">
                  {a.firstName} {a.lastName}
                </p>
                {a.isDefault && <span className="rounded-full bg-sage px-3 py-1 font-ui text-[11px] uppercase tracking-[0.12em]">Default</span>}
              </div>
              <address className="mt-2 flex-1 not-italic leading-relaxed text-ink-2">
                {a.addressLine1}
                {a.addressLine2 && (
                  <>
                    <br />
                    {a.addressLine2}
                  </>
                )}
                <br />
                {[a.city, a.province, a.postalCode].filter(Boolean).join(", ")}
                <br />
                {COUNTRIES.find((c) => c.code === a.country)?.name ?? a.country}
                <br />
                {a.phone}
              </address>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-ui text-[13px]">
                <button type="button" className="underline underline-offset-4" onClick={() => setEditing(a)}>
                  Edit
                </button>
                {!a.isDefault && (
                  <button type="button" className="underline underline-offset-4" disabled={pending} onClick={() => run(() => setDefaultAddressAction(a.id))}>
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  className="text-sale underline underline-offset-4"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Remove this address?")) run(() => deleteAddressAction(a.id));
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<MapPin className="size-6" strokeWidth={1.2} />} title="No saved addresses" action={<Button onClick={() => setEditing("new")}>Add an address</Button>}>
          Save your delivery details for a faster checkout.
        </EmptyState>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} side="right" title={editing && editing !== "new" ? "Edit address" : "Add address"}>
        {editing !== null && <AddressForm key={editing === "new" ? "new" : editing.id} address={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}

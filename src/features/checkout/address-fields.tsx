"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { Input, Select } from "@/components/ui/field";
import { COUNTRIES, PROVINCES, type AddressInput } from "@/lib/validation/schemas";

export type AddressFieldBinding = (name: keyof AddressInput) => { props: UseFormRegisterReturn; error?: string };

/** Reusable address form fields (checkout shipping/billing and account address book). */
export function AddressFields({ bind, idPrefix, country }: { bind: AddressFieldBinding; idPrefix: string; country?: string }) {
  const f = (name: keyof AddressInput) => bind(name);
  const isPk = !country || country === "PK";
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Input id={`${idPrefix}-first`} label="First name" required autoComplete="given-name" error={f("firstName").error} {...f("firstName").props} />
      <Input id={`${idPrefix}-last`} label="Last name" required autoComplete="family-name" error={f("lastName").error} {...f("lastName").props} />
      <Input id={`${idPrefix}-line1`} label="Address" required autoComplete="address-line1" placeholder="House no., street, area" containerClassName="sm:col-span-2" error={f("addressLine1").error} {...f("addressLine1").props} />
      <Input id={`${idPrefix}-line2`} label="Apartment, block, landmark (optional)" autoComplete="address-line2" containerClassName="sm:col-span-2" error={f("addressLine2").error} {...f("addressLine2").props} />
      <Input id={`${idPrefix}-city`} label="City" required autoComplete="address-level2" error={f("city").error} {...f("city").props} />
      {isPk ? (
        <Select id={`${idPrefix}-province`} label="Province" error={f("province").error} {...f("province").props}>
          <option value="">Select province</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      ) : (
        <Input id={`${idPrefix}-province`} label="State / region" autoComplete="address-level1" error={f("province").error} {...f("province").props} />
      )}
      <Input id={`${idPrefix}-postal`} label="Postal code (optional)" autoComplete="postal-code" inputMode="text" error={f("postalCode").error} {...f("postalCode").props} />
      <Select id={`${idPrefix}-country`} label="Country" required autoComplete="country" error={f("country").error} {...f("country").props}>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input id={`${idPrefix}-phone`} label="Phone" required type="tel" autoComplete="tel" placeholder="+92 300 1234567" containerClassName="sm:col-span-2" hint="For delivery updates from our courier." error={f("phone").error} {...f("phone").props} />
    </div>
  );
}

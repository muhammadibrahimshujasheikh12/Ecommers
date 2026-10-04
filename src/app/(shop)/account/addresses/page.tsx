import type { Metadata } from "next";
import { AddressBook } from "@/features/account/address-book";
import { getMyAddresses } from "@/lib/data/account";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const addresses = await getMyAddresses();
  return <AddressBook addresses={addresses} />;
}

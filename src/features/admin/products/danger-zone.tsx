"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { Panel } from "@/features/admin/ui";
import { cellInputClasses } from "./form-bits";
import { deleteProductAction, setProductsStatusAction } from "./actions";
import type { AdminProductDetail } from "./model";
import { ConfirmDialog } from "./confirm-dialog";

/** Archive / restore and permanent delete (only for products no order includes). */
export function DangerZone({ product, dirty }: { product: Pick<AdminProductDetail, "id" | "name" | "status" | "deleteBlockedReason">; dirty: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"archive" | "delete" | null>(null);
  const [typed, setTyped] = useState("");
  const archived = product.status === "archived";

  const close = () => {
    if (pending) return;
    setDialog(null);
    setTyped("");
  };

  function setStatus(status: "archived" | "draft") {
    startTransition(async () => {
      const res = await setProductsStatusAction([product.id], status);
      if (!res.ok) {
        toast({ tone: "error", message: res.error });
        return;
      }
      setDialog(null);
      toast({
        message: status === "archived" ? `${product.name} archived. It’s hidden from the store.` : `${product.name} restored as a draft.`,
      });
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteProductAction(product.id);
      if (!res.ok) {
        toast({ tone: "error", message: res.error });
        return;
      }
      setDialog(null);
      toast({ message: `${product.name} deleted.` });
      router.replace("/admin/products");
    });
  }

  const unsaved = dirty ? <p className="font-medium text-charcoal">You have unsaved changes on this page; they’ll be discarded.</p> : null;

  return (
    <Panel title="Archive or delete" className="border-[#e8cfc8]">
      <div className="space-y-5 text-[14px] text-ink-2">
        <div>
          <p>{archived ? "Archived products are hidden from the store and can’t be bought. Restore it as a draft to edit and publish it again." : "Archiving hides the product from the store and stops new orders, while keeping it for order history and reports."}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            disabled={pending}
            onClick={() => (archived ? setStatus("draft") : setDialog("archive"))}
            icon={archived ? <ArchiveRestore aria-hidden className="size-4" strokeWidth={1.5} /> : <Archive aria-hidden className="size-4" strokeWidth={1.5} />}
          >
            {archived ? "Restore as draft" : "Archive product"}
          </Button>
        </div>
        <div className="border-t border-line pt-5">
          <p>{product.deleteBlockedReason ?? "Deleting removes the product, its variants and photos for good. This can’t be undone."}</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-3 -ml-3 text-sale hover:bg-blush"
            disabled={pending || Boolean(product.deleteBlockedReason)}
            onClick={() => setDialog("delete")}
            icon={<Trash2 aria-hidden className="size-4" strokeWidth={1.5} />}
          >
            Delete permanently
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === "archive"}
        title={`Archive ${product.name}?`}
        confirmLabel="Archive product"
        tone="default"
        pending={pending}
        onConfirm={() => setStatus("archived")}
        onClose={close}
      >
        <p>It will disappear from the store, search and shoppers’ bags straight away. You can restore it at any time.</p>
        {unsaved}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "delete"}
        title={`Delete ${product.name}?`}
        confirmLabel="Delete permanently"
        pending={pending}
        confirmDisabled={typed.trim() !== product.name.trim()}
        onConfirm={remove}
        onClose={close}
      >
        <p>This permanently removes the product with its variants, photos, reviews and collection links. It can’t be undone.</p>
        {unsaved}
        <div>
          <label htmlFor="confirm-delete-name" className="mb-1.5 block font-ui text-[13px] font-medium text-charcoal">
            Type <strong className="font-semibold">{product.name}</strong> to confirm
          </label>
          <input id="confirm-delete-name" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={cellInputClasses(false, "h-11")} />
        </div>
      </ConfirmDialog>
    </Panel>
  );
}

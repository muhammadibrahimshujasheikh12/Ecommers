import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { StoreHeader } from "@/components/layout/store-header";
import { CartDrawer } from "@/features/cart/cart-drawer";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AnnouncementBar />
      <StoreHeader />
      <main id="main" tabIndex={-1} className="min-h-[60vh] outline-none">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}

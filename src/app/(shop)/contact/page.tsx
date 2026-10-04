import { ContentPage, contentPageMetadata } from "@/features/content/content-page";

const SLUG = "contact";

export const generateMetadata = () => contentPageMetadata(SLUG);

export default function Page() {
  return <ContentPage slug={SLUG} />;
}

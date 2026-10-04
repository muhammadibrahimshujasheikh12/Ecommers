import { ContentPage, contentPageMetadata } from "@/features/content/content-page";

const SLUG = "privacy-policy";

export const generateMetadata = () => contentPageMetadata(SLUG);

export default function Page() {
  return <ContentPage slug={SLUG} />;
}

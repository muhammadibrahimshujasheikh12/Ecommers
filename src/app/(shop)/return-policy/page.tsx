import { ContentPage, contentPageMetadata } from "@/features/content/content-page";

const SLUG = "return-policy";

export const generateMetadata = () => contentPageMetadata(SLUG);

export default function Page() {
  return <ContentPage slug={SLUG} />;
}

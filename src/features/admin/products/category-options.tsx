import type { AdminCategoryOption } from "./model";

/** Categories in tree order: each top-level category followed by its sub-categories. */
export function orderCategories(categories: AdminCategoryOption[]): { category: AdminCategoryOption; depth: number }[] {
  const ids = new Set(categories.map((c) => c.id));
  const out: { category: AdminCategoryOption; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (parentId: string | null, depth: number) => {
    for (const c of categories) {
      const isRoot = parentId === null ? c.parentId === null || !ids.has(c.parentId) : c.parentId === parentId;
      if (!isRoot || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ category: c, depth });
      if (depth < 4) walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** <option>s for a category <select>; hidden categories are labelled. */
export function CategoryOptions({ categories }: { categories: AdminCategoryOption[] }) {
  return (
    <>
      {orderCategories(categories).map(({ category, depth }) => (
        <option key={category.id} value={category.id}>
          {`${"   ".repeat(depth)}${depth ? "– " : ""}${category.name}${category.isActive ? "" : " (hidden)"}`}
        </option>
      ))}
    </>
  );
}

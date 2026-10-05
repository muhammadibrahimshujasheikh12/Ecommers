import { expect, test, type Page } from "@playwright/test";

/*
 * Products admin, demo store only. The test creates its own product, so the
 * shared demo catalogue the other specs rely on is left as it was: the new
 * product starts as a draft, goes live briefly, is archived and then deleted.
 */

async function enterDemoAdmin(page: Page) {
  await page.goto("/admin");
  const enter = page.getByRole("button", { name: "Enter demo admin" });
  if (!(await enter.isVisible())) test.skip(true, "Needs the demo store (no Supabase project)");
  await enter.click();
  await page.waitForURL((u) => new URL(u).pathname === "/admin");
}

test("admin products: create a draft, publish, manage inventory, archive and delete", async ({ page }) => {
  await enterDemoAdmin(page);
  const suffix = Date.now().toString(36);
  const name = `E2E Kurta ${suffix}`;
  const slug = `e2e-kurta-${suffix}`;
  const sku = `E2E-${suffix.toUpperCase()}`;

  // List
  await page.goto("/admin/products");
  await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /Showing 1–20 of \d+ products/ })).toBeVisible();
  await page.getByRole("link", { name: "Add product" }).click();
  await page.waitForURL("**/admin/products/new");

  // New product form: the handle follows the name and is checked for uniqueness.
  await page.getByRole("textbox", { name: "Name", exact: true }).fill(name);
  await expect(page.getByRole("textbox", { name: "URL handle" })).toHaveValue(slug);
  await expect(page.getByText("Available", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Product SKU" }).fill(sku);
  await page.getByRole("combobox", { name: "Category" }).selectOption({ label: "Luxury Pret" });
  await page.getByRole("textbox", { name: "Price (PKR)" }).fill("15950");
  await page.getByRole("textbox", { name: "Compare-at price (PKR)" }).fill("14000");

  // Inline validation
  await page.getByRole("button", { name: "Create product" }).click();
  await expect(page.getByText("Compare-at price must be higher than the price, or empty")).toBeVisible();
  await page.getByRole("textbox", { name: "Compare-at price (PKR)" }).fill("18950");

  // Variants: one colour in five sizes, then one size sold out.
  await page.getByRole("textbox", { name: "Colour", exact: true }).fill("Ivory");
  await page.getByRole("textbox", { name: "Stock each" }).fill("4");
  await page.getByRole("button", { name: "Add 5 sizes" }).click();
  await expect(page.getByRole("textbox", { name: /^Stock, variant \d+$/ })).toHaveCount(5);
  await page.getByRole("textbox", { name: "Stock, variant 2" }).fill("0");
  await expect(page.getByRole("region", { name: "Variants" }).getByText("Out", { exact: true })).toBeVisible();

  // Images come from the bundled library in the demo store.
  await page.getByRole("button", { name: "Choose from library" }).click();
  const library = page.getByRole("dialog", { name: "Image library" });
  await library.locator("ul button:not([disabled])").nth(0).click();
  await library.locator("ul button:not([disabled])").nth(1).click();
  await library.getByRole("button", { name: "Add 2 images" }).click();
  await expect(page.getByText("Main", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  const editUrl = page.url();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Draft/ })).toBeChecked();

  // Drafts are not on the storefront.
  await page.goto(`/product/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/couldn’t find that page/);

  // Publish
  await page.goto(editUrl);
  await page.getByRole("radio", { name: /^Active/ }).check();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product saved.").first()).toBeVisible();
  await expect(page.getByText("All changes saved.")).toBeVisible();

  await page.goto(`/product/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Rs. 15,950").first()).toBeVisible();

  // Inventory: set every variant to 1 unit (5 in total = low stock).
  await page.goto(editUrl);
  await page.getByRole("textbox", { name: "Set all stock to" }).fill("1");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("textbox", { name: "Stock, variant 2" })).toHaveValue("1");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product saved.").first()).toBeVisible();

  await page.goto(`/admin/products?q=${sku}&stock=low`);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await expect(row.getByText("Low", { exact: true })).toBeVisible();

  // Quick actions from the list: feature, then archive (hidden from the store again).
  const featured = row.getByRole("button", { name: `Featured: ${name}` });
  await featured.click();
  await expect(featured).toHaveAttribute("aria-pressed", "true");
  await row.getByRole("combobox", { name: `Status of ${name}` }).selectOption("archived");
  await expect(page.getByText(`${name} set to archived.`)).toBeVisible();
  await page.goto(`/product/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/couldn’t find that page/);

  // Delete for good (allowed: created here and never ordered); needs the name typed.
  await page.goto(editUrl);
  await page.getByRole("button", { name: "Delete permanently" }).click();
  const confirm = page.getByRole("dialog", { name: `Delete ${name}?` });
  await expect(confirm.getByRole("button", { name: "Delete permanently" })).toBeDisabled();
  await confirm.getByRole("textbox").fill(name);
  await confirm.getByRole("button", { name: "Delete permanently" }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/admin/products");
  await page.goto(`/admin/products?q=${sku}`);
  await expect(page.getByRole("heading", { name: "No products match these filters" })).toBeVisible();
});

test("admin products: filters, and sample products can only be archived", async ({ page }) => {
  await enterDemoAdmin(page);

  await page.goto("/admin/products?status=active&stock=out");
  await expect(page.getByRole("link", { name: /^Active/, exact: false }).first()).toHaveAttribute("aria-current", "page");
  const rows = page.getByRole("region", { name: "Products" }).locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allInnerTexts()) expect(text).toContain("Out of stock");

  await page.goto("/admin/products?q=zarrin");
  await page.getByRole("link", { name: "Zarrin", exact: false }).first().click();
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Zarrin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete permanently" })).toBeDisabled();
  await expect(page.getByText(/Archive it instead/)).toBeVisible();
});

test("admin products are not reachable without admin access", async ({ page }) => {
  await page.goto("/admin/products");
  const demo = await page.getByRole("button", { name: "Enter demo admin" }).isVisible();
  if (!demo) test.skip(true, "Needs the demo store (no Supabase project)");
  await expect(page.getByRole("region", { name: "Products" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Demo store admin");
});

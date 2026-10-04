import { expect, test } from "@playwright/test";

test("search overlay suggestions and results page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).click();
  const search = page.getByRole("dialog", { name: "Search" });
  await search.getByRole("searchbox", { name: "Search products" }).fill("luxury");
  await expect(search.getByText(/Products matching/)).toBeVisible();
  await expect(search.locator('a[href^="/product/"]').first()).toBeVisible();
  await search.getByRole("searchbox", { name: "Search products" }).fill("lawn");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/shop?q=lawn");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Results for/);
});

test("filters, sorting and pagination are URL-driven", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("complementary", { name: "Filters" }).getByRole("button", { name: "M", exact: true }).click();
  await page.waitForURL(/size=M/);
  await page.getByRole("combobox", { name: "Sort products" }).selectOption("price_asc");
  await page.waitForURL(/sort=price_asc/);
  const prices = (await page.locator("main article p span:first-child").allInnerTexts()).map((p) => Number(p.replace(/[^0-9]/g, ""))).filter(Boolean);
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
  await expect(page.getByRole("link", { name: "Remove filter M" })).toBeVisible();

  await page.goto("/shop");
  await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "2", exact: true }).click();
  await page.waitForURL(/page=2/);
});

test("compare up to four products", async ({ page }) => {
  for (const slug of ["mehtab", "zarrin", "neelofar"]) {
    await page.goto(`/product/${slug}`);
    await page.getByRole("button", { name: "Add to compare" }).click();
  }
  await page.goto("/compare");
  await expect(page.locator("thead th")).toHaveCount(3);
  await page.getByRole("button", { name: "Remove Neelofar from comparison" }).click();
  await expect(page.locator("thead th")).toHaveCount(2);
});

test("order tracking requires the matching email", async ({ page }) => {
  await page.goto("/track-order");
  await page.getByRole("textbox", { name: "Order number" }).fill("AQ-100001");
  await page.getByRole("textbox", { name: "Email used for the order" }).fill("someone.else@example.com");
  await page.getByRole("button", { name: "Track" }).click();
  await expect(page.getByText(/couldn't find an order/)).toBeVisible();
  await page.getByRole("textbox", { name: "Email used for the order" }).fill("hira.a@example.com");
  await page.getByRole("button", { name: "Track" }).click();
  await expect(page.getByRole("heading", { name: "Order AQ-100001" })).toBeVisible();
});

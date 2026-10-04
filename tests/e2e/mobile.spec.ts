import { expect, test } from "@playwright/test";

test("mobile navigation, filter drawer and quick add", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await menu.getByText("Ready to Wear", { exact: true }).click();
  await expect(menu.getByRole("link", { name: "3 Piece" })).toBeVisible();
  await menu.getByRole("button", { name: "Close" }).click();

  await page.goto("/category/ready-to-wear");
  await page.getByRole("button", { name: /^Filter/ }).click();
  const filters = page.getByRole("dialog", { name: "Filter" });
  await filters.getByRole("button", { name: "M", exact: true }).click();
  await page.waitForURL(/size=M/);
  await filters.getByRole("button", { name: /Show \d+ results?/ }).click();

  await page.getByRole("button", { name: /^Quick add/ }).first().click();
  const sheet = page.getByRole("dialog", { name: "Select size" });
  await sheet.locator("button:not([disabled])").filter({ hasText: /^(XS|S|M|L|XL)$/ }).first().click();
  await expect(page.getByRole("button", { name: /Shopping bag, [1-9]/ })).toBeVisible();
});

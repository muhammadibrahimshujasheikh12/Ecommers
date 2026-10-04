import { expect, test } from "@playwright/test";

const password = "Lahore2026";

test("register → account → address → order → verified review → sign out/in", async ({ page }) => {
  const email = `e2e.${Date.now()}@example.com`;

  // Guest wishlist is kept in localStorage and merged on sign-up.
  await page.goto("/product/zarrin");
  await page.getByRole("button", { name: /Save Zarrin to wishlist/ }).first().click();

  // Account pages are protected
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Forders/);

  await page.goto("/register");
  await page.getByRole("textbox", { name: "First name" }).fill("Nadia");
  await page.getByRole("textbox", { name: "Last name" }).fill("Iqbal");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/account");
  await expect(page.getByText("Hello, Nadia")).toBeVisible();
  await expect(page.getByRole("link", { name: /Wishlist, 1 items/ })).toBeVisible();

  // Address book
  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Add address" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add address" });
  await dialog.locator("#book-first").fill("Nadia");
  await dialog.locator("#book-last").fill("Iqbal");
  await dialog.locator("#book-line1").fill("42-B, Block 5, Clifton");
  await dialog.locator("#book-city").fill("Karachi");
  await dialog.locator("#book-province").selectOption("Sindh");
  await dialog.locator("#book-phone").fill("+92 321 5551234");
  await dialog.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("42-B, Block 5, Clifton")).toBeVisible();

  // Buy Now with the saved address
  await page.goto("/product/zarrin");
  await page.locator("fieldset button:not([disabled])").filter({ hasText: /^(XS|S|M|L|XL)$/ }).first().click();
  await page.getByRole("button", { name: "Buy Now" }).click();
  await page.waitForURL("**/checkout");
  await page.getByRole("textbox", { name: "Phone", exact: true }).fill("+92 321 5551234");
  await page.getByRole("button", { name: "Continue to shipping" }).click();
  await expect(page.getByRole("radio", { name: /Nadia Iqbal/ })).toBeChecked();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.waitForURL("**/checkout/confirmation/**");
  await page.getByRole("link", { name: "View order in your account" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Order AQ-\d+/);

  // Verified purchase review is published immediately
  await page.goto("/product/zarrin#reviews");
  await page.locator("#reviews label").filter({ hasText: "5 stars" }).click();
  await page.getByRole("textbox", { name: "Review title" }).fill("Beautiful lavender");
  await page.getByRole("textbox", { name: "Your review" }).fill("Lovely raw silk, fits true to size and the colour is exactly as shown.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("Thank you! Your review is now live.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Update review" })).toBeVisible();

  // Sign out → wrong password → sign in
  await page.goto("/account/profile");
  await page.getByRole("button", { name: "Sign out of this device" }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/");
  await page.goto("/login?next=/account/orders");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  // The demo store (no Supabase project) accepts any password by design.
  const demoStore = await page.getByRole("complementary", { name: "Demo store" }).isVisible();
  if (!demoStore) {
    await page.locator('input[name="password"]').fill("wrong-password1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("The email or password you entered is incorrect.")).toBeVisible();
  }
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/account/orders");
  await expect(page.locator("main li").filter({ hasText: /AQ-\d+/ })).toHaveCount(1);
});

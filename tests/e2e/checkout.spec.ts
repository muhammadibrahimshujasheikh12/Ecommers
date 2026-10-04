import { expect, test } from "@playwright/test";

test.describe("guest shopping journey", () => {
  test("product → bag → multi-step checkout → confirmation", async ({ page }) => {
    await page.goto("/product/gul-e-nar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gul-e-Nar");

    // Size is required
    await page.getByRole("button", { name: "Add to Bag" }).first().click();
    await expect(page.getByText("Please select a size.")).toBeVisible();

    await page.locator("fieldset button:not([disabled])").filter({ hasText: /^(XS|S|M|L|XL)$/ }).first().click();
    await page.getByRole("button", { name: "Add to Bag" }).first().click();
    const drawer = page.getByRole("dialog", { name: /Your bag/ });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Checkout" }).click();

    // 1. Information
    await page.waitForURL("**/checkout");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(`guest.${Date.now()}@example.com`);
    await page.getByRole("textbox", { name: "Phone", exact: true }).fill("+92 300 1234567");
    await page.getByRole("button", { name: "Continue to shipping" }).click();

    // 2. Shipping — validation then a valid address
    await page.getByRole("button", { name: "Continue to payment" }).click();
    await expect(page.getByText("First name is required")).toBeVisible();
    await page.locator("#ship-first").fill("Ayesha");
    await page.locator("#ship-last").fill("Khan");
    await page.locator("#ship-line1").fill("House 12, Street 4, DHA Phase 5");
    await page.locator("#ship-city").fill("Lahore");
    await page.locator("#ship-province").selectOption("Punjab");
    await page.locator("#ship-phone").fill("+92 300 1234567");
    await page.getByRole("button", { name: "Continue to payment" }).click();

    // 3. Payment
    await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
    await page.getByRole("button", { name: "Review order" }).click();

    // 4. Review — coupon is priced by the server
    await page.locator("#checkout-coupon").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/WELCOME10 applied/)).toBeVisible();
    await page.getByRole("checkbox", { name: /I agree/ }).check();
    await page.getByRole("button", { name: /Place order/ }).click();

    // 5. Confirmation
    await page.waitForURL("**/checkout/confirmation/**");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Your order (is confirmed|has been placed)/);
    await expect(page.getByText(/AQ-\d{6}/).first()).toBeVisible();
    await expect(page.getByText("Discount (WELCOME10)")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("button", { name: /Shopping bag, 0 items/ })).toBeVisible();
  });

  test("invalid coupon and empty states", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your bag is empty" })).toBeVisible();
    await page.goto("/shop?color=Nonexistent");
    await expect(page.getByText("No products match these filters")).toBeVisible();
    await page.goto("/product/does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/couldn’t find that page/);
  });
});

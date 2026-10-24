import { expect, test, type Page } from "@playwright/test";

/*
 * Admin: dashboard, orders and customers, in the demo store (no Supabase).
 * With Supabase the /admin gate has no "Enter demo admin" button and these
 * tests are skipped.
 */

const SEEDED_ORDER_ID = "f8364d16-16f1-50ab-a702-d3bdaa4339b8"; // AQ-100001

async function skipUnlessDemo(page: Page) {
  await page.goto("/admin");
  const demo = await page.getByRole("button", { name: "Enter demo admin" }).isVisible();
  test.skip(!demo, "Demo admin only — the app is running with Supabase.");
}

async function enterDemoAdmin(page: Page) {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Enter demo admin" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
}

/** Places a guest order through the real checkout and returns its number. */
async function placeGuestOrder(page: Page, email: string): Promise<string> {
  await page.goto("/product/gul-e-nar");
  await page.locator("fieldset button:not([disabled])").filter({ hasText: /^(XS|S|M|L|XL)$/ }).first().click();
  await page.getByRole("button", { name: "Add to Bag" }).first().click();
  await page.getByRole("dialog", { name: /Your bag/ }).getByRole("link", { name: "Checkout" }).click();
  await page.waitForURL("**/checkout");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Phone", exact: true }).fill("+92 300 1234567");
  await page.getByRole("button", { name: "Continue to shipping" }).click();
  await page.locator("#ship-first").fill("Ayesha");
  await page.locator("#ship-last").fill("Khan");
  await page.locator("#ship-line1").fill("House 12, Street 4, DHA Phase 5");
  await page.locator("#ship-city").fill("Lahore");
  await page.locator("#ship-province").selectOption("Punjab");
  await page.locator("#ship-phone").fill("+92 300 1234567");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.waitForURL("**/checkout/confirmation/**");
  const text = await page.getByText(/AQ-\d{6,}/).first().innerText();
  const number = text.match(/AQ-\d{6,}/)?.[0];
  expect(number).toBeTruthy();
  return number!;
}

test("admin pages show the gate, never order data, to non-admins", async ({ page }) => {
  await skipUnlessDemo(page);
  for (const path of ["/admin/orders", `/admin/orders/${SEEDED_ORDER_ID}`, "/admin/customers"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Demo store admin" })).toBeVisible();
    await expect(page.getByText("AQ-100001")).toHaveCount(0);
    await expect(page.getByText("hira.a@example.com")).toHaveCount(0);
  }
});

test("order workflow: find, update status, payment and notes; the customer sees it", async ({ page }) => {
  await skipUnlessDemo(page);
  const email = `admin.e2e.${Date.now()}@example.com`;
  const orderNumber = await placeGuestOrder(page, email);
  await enterDemoAdmin(page);

  // Dashboard reflects real orders, and the range is URL-driven.
  await expect(page.getByRole("region", { name: "Key figures" }).getByText("Revenue")).toBeVisible();
  await page.getByRole("navigation", { name: "Date range" }).getByRole("link", { name: "7 days" }).click();
  await page.waitForURL(/range=7/);
  await expect(page.getByRole("group", { name: /Revenue by day/ })).toBeVisible();
  await page.getByText("Show as table").click();
  await expect(page.getByRole("region", { name: "Revenue by day table" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Orders by status" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Low stock" })).toBeVisible();

  // Find the order.
  await page.goto("/admin/orders");
  await page.getByRole("searchbox", { name: "Search" }).fill(orderNumber);
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForURL(/q=AQ-/);
  await expect(page.getByRole("status").filter({ hasText: "Showing 1–1 of 1 order" })).toBeVisible();
  await page.getByRole("link", { name: orderNumber, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Order ${orderNumber}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Items (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: email })).toBeVisible();
  await expect(page.getByText("Guest checkout")).toBeVisible();

  // Status, with a note the customer will see.
  await page.getByRole("combobox", { name: "Move to" }).selectOption("processing");
  await page.getByRole("textbox", { name: "Note for the customer" }).fill("Packed with care in Lahore");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Order marked as processing.")).toBeVisible();
  await expect(page.getByText("Packed with care in Lahore")).toBeVisible();

  // Payment, logged as an internal note.
  await page.getByRole("combobox", { name: "Payment status" }).selectOption("paid");
  await page.getByRole("textbox", { name: "Payment reference" }).fill("TX-E2E-1");
  await page.getByRole("button", { name: "Save payment" }).click();
  await expect(page.getByText("Payment marked as paid.")).toBeVisible();
  await expect(page.getByText(/Payment marked paid \(was pending\)/)).toBeVisible();

  // Internal note, with validation first.
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Write a note first.")).toBeVisible();
  await page.getByRole("textbox", { name: "Add an internal note" }).fill("Called the customer to confirm the address.");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Note added.")).toBeVisible();
  await expect(page.getByText("Called the customer to confirm the address.")).toBeVisible();

  // Cancelling asks first; backing out changes nothing.
  await page.getByRole("combobox", { name: "Move to" }).selectOption("cancelled");
  await page.getByRole("button", { name: "Update status" }).click();
  const dialog = page.getByRole("dialog", { name: `Cancel order ${orderNumber}?` });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep as is" }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Update status" }).click();
  await dialog.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("Order marked as cancelled.")).toBeVisible();
  await expect(page.getByText(/This order is cancelled\./)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Move to" })).toHaveCount(0);

  // The customer's tracking page shows the admin's latest status and note.
  await page.goto("/track-order");
  await page.getByRole("textbox", { name: "Order number" }).fill(orderNumber);
  await page.getByRole("textbox", { name: "Email used for the order" }).fill(email);
  await page.getByRole("button", { name: "Track" }).click();
  const result = page.locator("section").filter({ has: page.getByRole("heading", { name: `Order ${orderNumber}` }) });
  await expect(result.getByText("Cancelled").first()).toBeVisible();
  await expect(result.getByText("Packed with care in Lahore")).toBeVisible();

  // Filters: the cancelled order is found by status + search.
  await page.goto(`/admin/orders?status=cancelled&q=${encodeURIComponent(email)}`);
  await expect(page.getByRole("link", { name: orderNumber, exact: true })).toBeVisible();
  await page.goto(`/admin/orders?status=delivered&q=${encodeURIComponent(email)}`);
  await expect(page.getByText("No orders match these filters.")).toBeVisible();

  // Customers: the guest is listed by email and links back to the order.
  await page.goto(`/admin/customers?q=${encodeURIComponent(email)}`);
  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row.getByText("Guest")).toBeVisible();
  await row.getByRole("link", { name: "Ayesha Khan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ayesha Khan" })).toBeVisible();
  await expect(page.getByRole("link", { name: orderNumber, exact: true })).toBeVisible();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("admin screens fit the width; tables scroll inside their panel", async ({ page }) => {
    await skipUnlessDemo(page);
    await enterDemoAdmin(page);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.goto("/admin/orders");
    await expect(page.getByRole("region", { name: "Orders" })).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.goto(`/admin/orders/${SEEDED_ORDER_ID}`);
    await expect(page.getByRole("heading", { level: 1, name: "Order AQ-100001" })).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(1);
    await page.goto("/admin/customers");
    await expect(page.getByRole("region", { name: "Customers" })).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(1);
  });
});

import { z } from "zod";

/*
 * Shared validation. The same schemas run in the browser (React Hook Form,
 * for instant feedback) and on the server (Server Actions, authoritative).
 */

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254));

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, "Enter a valid phone number, e.g. +92 300 1234567");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    firstName: trimmed(1, 80, "First name"),
    lastName: trimmed(1, 80, "Last name"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    marketing: z.boolean().default(false),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const changePasswordSchema = resetPasswordSchema;

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------
export const profileSchema = z.object({
  firstName: trimmed(1, 80, "First name"),
  lastName: trimmed(1, 80, "Last name"),
  phone: z.union([phoneSchema, z.literal("")]).optional(),
});

export const COUNTRIES = [
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
] as const;

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const addressSchema = z.object({
  firstName: trimmed(1, 80, "First name"),
  lastName: trimmed(1, 80, "Last name"),
  phone: phoneSchema,
  addressLine1: trimmed(3, 200, "Address"),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: trimmed(2, 80, "City"),
  province: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .max(16)
    .regex(/^[A-Za-z0-9\s-]*$/, "Enter a valid postal code")
    .optional()
    .or(z.literal("")),
  country: z.enum(countryCodes, { message: "Select a country" }),
});

export const savedAddressSchema = addressSchema.extend({ isDefault: z.boolean().default(false) });

export type AddressInput = z.infer<typeof addressSchema>;

// ---------------------------------------------------------------------------
// Cart & checkout
// ---------------------------------------------------------------------------
export const addToCartSchema = z.object({
  productId: z.uuid(),
  variantId: z.uuid().nullable(),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Enter a discount code")
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Codes contain letters and numbers only"),
});

export const checkoutSchema = z
  .object({
    email: emailSchema,
    phone: phoneSchema,
    marketing: z.boolean().default(false),
    savedAddressId: z.uuid().optional().or(z.literal("")),
    shipping: addressSchema,
    billingSameAsShipping: z.boolean().default(true),
    billing: addressSchema.optional(),
    saveAddress: z.boolean().default(false),
    shippingMethod: z.string().min(1, "Choose a delivery method"),
    paymentMethod: z.string().min(1, "Choose a payment method"),
    couponCode: z.string().trim().max(32).optional().or(z.literal("")),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional().or(z.literal("")),
    acceptTerms: z.literal(true, { message: "Please accept the terms to continue" }),
  })
  .refine((v) => v.billingSameAsShipping || v.billing, {
    path: ["billing"],
    message: "Enter a billing address",
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

// ---------------------------------------------------------------------------
// Reviews, newsletter, tracking
// ---------------------------------------------------------------------------
export const reviewSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1, "Select a rating").max(5),
  title: trimmed(2, 120, "Title"),
  content: trimmed(10, 2000, "Review"),
});

export const REVIEW_IMAGE_LIMIT = 3;
export const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const REVIEW_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.string().max(40).optional(),
  // Honeypot — real users never fill this hidden field.
  company: z.string().max(0).optional().or(z.literal("")),
});

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^AQ-\d{6,}$/, "Order numbers look like AQ-100245"),
  email: emailSchema,
});

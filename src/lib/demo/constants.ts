/** Cookie names for demo-mode visitor state. Safe to import from the proxy. */
export const DEMO_COOKIES = {
  user: "aq_demo_user",
  cart: "aq_demo_cart",
  addresses: "aq_demo_addresses",
  orders: "aq_demo_orders",
  wishlist: "aq_demo_wishlist",
  reviews: "aq_demo_reviews",
} as const;

export type DemoCookieName = (typeof DEMO_COOKIES)[keyof typeof DEMO_COOKIES];

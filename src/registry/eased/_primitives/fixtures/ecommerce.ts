/** E-commerce: one store, "Fern & Field", outdoor apparel. Prices in USD. */
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo, minutesAgo } from "./shared";

export type Variant = { id: string; color: string; hex: string; size: string; stock: number };
export type Product = { id: string; name: string; price: number; compareAt?: number; rating: number; reviews: number; variants: Variant[] };

const sizes = ["XS", "S", "M", "L", "XL"];
const variants = (pid: string, colors: [string, string][], stock: number[][]) =>
  colors.flatMap(([color, hex], c) => sizes.map((size, s) => ({ id: `${pid}-${c}-${size}`, color, hex, size, stock: stock[c][s] })));

export const products: Product[] = [
  {
    id: "p1",
    name: "Ridgeline Down Jacket",
    price: 248,
    compareAt: 310,
    rating: 4.7,
    reviews: 1_284,
    variants: variants("p1", [["Moss", "#4b5b3c"], ["Slate", "#4a525a"], ["Clay", "#a4613f"]], [[4, 12, 0, 7, 2], [9, 15, 21, 11, 3], [0, 2, 5, 1, 0]]),
  },
  { id: "p2", name: "Trailhead Merino Crew", price: 89, rating: 4.5, reviews: 642, variants: variants("p2", [["Oat", "#d8cdb8"], ["Navy", "#253247"]], [[18, 22, 30, 14, 6], [11, 0, 19, 9, 4]]) },
  { id: "p3", name: "Canyon Hiking Short", price: 64, rating: 4.3, reviews: 311, variants: variants("p3", [["Sand", "#c9b48f"]], [[6, 9, 14, 8, 3]]) },
  { id: "p4", name: "Basecamp 32L Pack", price: 179, rating: 4.8, reviews: 2_017, variants: [{ id: "p4-0", color: "Black", hex: "#1f1f1f", size: "One size", stock: 37 }] },
];

/** Rating histogram for the jacket (5★ first). */
export const reviewsSummary = { productId: "p1", average: 4.7, total: 1_284, counts: [1_002, 191, 52, 21, 18] };

export const cart = {
  lines: [
    { id: "l1", productId: "p1", variantId: "p1-1-M", name: "Ridgeline Down Jacket", detail: "Slate · M", price: 248, qty: 1 },
    { id: "l2", productId: "p2", variantId: "p2-0-L", name: "Trailhead Merino Crew", detail: "Oat · L", price: 89, qty: 2 },
  ],
  shipping: 0,
  taxRate: 0.0875,
  promo: { code: "FIELD15", off: 0.15 },
};

export type Order = { number: string; customer: string; total: number; items: number; status: "Unfulfilled" | "Packed" | "Shipped" | "Delivered" | "Returned" };
export const orders: TimelineEvent<Order>[] = [
  { id: "o1", at: minutesAgo(9), title: "#10482", data: { number: "#10482", customer: "Hannah Becker", total: 337, items: 2, status: "Unfulfilled" } },
  { id: "o2", at: hoursAgo(1.5), title: "#10481", data: { number: "#10481", customer: "Kwame Mensah", total: 179, items: 1, status: "Packed" } },
  { id: "o3", at: hoursAgo(6), title: "#10480", data: { number: "#10480", customer: "Isabela Rocha", total: 153, items: 2, status: "Shipped" } },
  { id: "o4", at: daysAgo(1, 13, 10), title: "#10476", data: { number: "#10476", customer: "Oliver Grant", total: 496, items: 2, status: "Delivered" } },
  { id: "o5", at: daysAgo(3, 9, 45), title: "#10461", data: { number: "#10461", customer: "Yuki Tanaka", total: 64, items: 1, status: "Returned" } },
];

/** Order #10480's shipment, for an Order Tracker. */
export const shipment = {
  carrier: "UPS",
  tracking: "1Z 999 AA1 01 2345 6784",
  eta: daysFromNow(2, 18, 0),
  steps: [
    { id: "placed", label: "Order placed", status: "complete" as const, at: hoursAgo(6) },
    { id: "packed", label: "Packed", status: "complete" as const, at: hoursAgo(4) },
    { id: "transit", label: "In transit · Louisville, KY", status: "active" as const, at: hoursAgo(1) },
    { id: "out", label: "Out for delivery", status: "pending" as const },
    { id: "delivered", label: "Delivered", status: "pending" as const },
  ],
};

/** Price distribution of the catalogue, $10 buckets from $20, for a Price Filter histogram. */
export const priceHistogram = { min: 20, step: 10, counts: [4, 9, 14, 22, 31, 27, 19, 16, 12, 9, 7, 5, 4, 3, 2, 2, 1, 1, 0, 1] };

export const promo = { headline: "End-of-season sale", endsAt: daysFromNow(1, 23, 59), off: 0.25 };

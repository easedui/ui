/**
 * E-commerce: one store, "Fern & Field", outdoor apparel. Prices in USD. Every block in the
 * pack (product card, variant picker, cart, wishlist, reviews, promo) reads from here, so the
 * demos look like one shop. Product imagery is drawn, not photographed: `art` names a
 * commerce-core `ProductArt` silhouette and each variant carries its colourway's hex.
 */
import type { TimelineEvent } from "../timeline-core/types";
import { daysAgo, daysFromNow, hoursAgo, minutesAgo } from "./shared";

/** The silhouettes commerce-core's `ProductArt` draws. */
export type ProductArtKind = "jacket" | "shell" | "crew" | "short" | "pack" | "beanie";

/** One buyable combination. `price` overrides the product's (a clearance colourway). */
export type Variant = { id: string; color: string; hex: string; size: string; stock: number; price?: number; compareAt?: number };
export type Product = {
  id: string;
  name: string;
  /** One line under the name: material or the reason to buy. */
  blurb: string;
  art: ProductArtKind;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  /** A merchandising flag shown on the card. */
  tag?: "New" | "Bestseller" | "Last chance";
  variants: Variant[];
};

const sizes = ["XS", "S", "M", "L", "XL"];
type Colorway = [color: string, hex: string, pricing?: { price: number; compareAt?: number }];
const variants = (pid: string, colors: Colorway[], stock: number[][]): Variant[] =>
  colors.flatMap(([color, hex, pricing], c) => sizes.map((size, s) => ({ id: `${pid}-${c}-${size}`, color, hex, size, stock: stock[c][s], ...pricing })));
const oneSize = (pid: string, colors: [string, string, number][]): Variant[] =>
  colors.map(([color, hex, stock], c) => ({ id: `${pid}-${c}`, color, hex, size: "One size", stock }));

export const products: Product[] = [
  {
    id: "p1",
    name: "Ridgeline Down Jacket",
    blurb: "700-fill recycled down",
    art: "jacket",
    price: 248,
    compareAt: 310,
    rating: 4.7,
    reviews: 1_284,
    tag: "Bestseller",
    // Clay is the end-of-line colourway: deeper markdown, thin stock.
    variants: variants("p1", [["Moss", "#55663f"], ["Slate", "#4a535c"], ["Clay", "#a8623f", { price: 198, compareAt: 310 }]], [[4, 12, 0, 7, 2], [9, 15, 21, 11, 3], [0, 2, 1, 0, 0]]),
  },
  {
    id: "p2",
    name: "Trailhead Merino Crew",
    blurb: "18.5 micron merino, 220 gsm",
    art: "crew",
    price: 89,
    rating: 4.5,
    reviews: 642,
    tag: "New",
    variants: variants("p2", [["Oat", "#d6c9b0"], ["Navy", "#28354b"], ["Rust", "#9a4a2c"]], [[18, 22, 30, 14, 6], [11, 0, 19, 9, 4], [5, 8, 3, 0, 2]]),
  },
  { id: "p3", name: "Canyon Hiking Short", blurb: "4-way stretch, 7″ inseam", art: "short", price: 64, rating: 4.3, reviews: 311, variants: variants("p3", [["Sand", "#c4ad86"], ["Olive", "#5f6440"]], [[6, 9, 14, 8, 3], [2, 5, 7, 4, 0]]) },
  { id: "p4", name: "Basecamp 32L Pack", blurb: "Weatherproof, fits a 16″ laptop", art: "pack", price: 179, rating: 4.8, reviews: 2_017, variants: oneSize("p4", [["Black", "#232323", 37], ["Glacier", "#7d939b", 6]]) },
  { id: "p5", name: "Summit Rib Beanie", blurb: "Lambswool, fold-over cuff", art: "beanie", price: 38, rating: 4.6, reviews: 488, variants: oneSize("p5", [["Ember", "#b4532f", 24], ["Charcoal", "#3b3d40", 41], ["Heather", "#9a9488", 0]]) },
  {
    id: "p6",
    name: "Switchback Rain Shell",
    blurb: "3-layer, 20K waterproof",
    art: "shell",
    price: 198,
    rating: 4.4,
    reviews: 527,
    tag: "Last chance",
    variants: variants("p6", [["Glacier", "#6f8a96"], ["Moss", "#55663f"]], [[1, 3, 0, 2, 1], [0, 1, 2, 0, 0]]),
  },
];

export const productById = (id: string) => products.find((p) => p.id === id)!;
export const variantById = (id: string) => products.flatMap((p) => p.variants).find((v) => v.id === id)!;
/** The price a variant actually sells at (its own, or the product's). */
export const variantPrice = (p: Product, v: Variant) => ({ price: v.price ?? p.price, compareAt: v.compareAt ?? p.compareAt });
/** A product's variants in the shape the commerce blocks take (`ProductVariant`): swatch colour and resolved price. */
export const productVariants = (p: Product) => p.variants.map((v) => ({ id: v.id, color: v.color, swatch: v.hex, size: v.size, stock: v.stock, ...variantPrice(p, v) }));

/** Rating histogram for the jacket (5★ first), and how its buyers say it fits. */
export const reviewsSummary = {
  productId: "p1",
  average: 4.7,
  total: 1_284,
  counts: [1_002, 191, 52, 21, 18],
  /** Share of fit votes: runs small, true to size, runs large. */
  fit: [0.14, 0.79, 0.07] as [number, number, number],
  /** Share of reviewers who would recommend it. */
  recommend: 0.94,
};

export type Review = {
  id: string;
  author: string;
  /** Where they wear it; stores show it under the name. */
  location: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  at: number;
  /** The variant they bought, as the store prints it. */
  bought: string;
  verified: boolean;
  helpful: number;
};

/** The jacket's most helpful reviews, mixed on purpose: mostly glowing, two fair complaints, one bad batch. */
export const reviews: Review[] = [
  { id: "r1", author: "Hannah B.", location: "Boulder, CO", rating: 5, title: "Warm enough for a January sunrise hike", body: "Wore it at 14°F on Flagstaff with just a base layer underneath and never felt the wind. Packs into its own pocket, which I didn't expect at this warmth.", at: daysAgo(3), bought: "Moss · M", verified: true, helpful: 48 },
  { id: "r2", author: "Kwame M.", location: "Toronto, ON", rating: 4, title: "Great jacket, sleeves run a touch long", body: "Loft is excellent and the hood actually fits over a beanie. Sleeves are about an inch long on me, so size down if you're between sizes.", at: daysAgo(9), bought: "Slate · L", verified: true, helpful: 31 },
  { id: "r3", author: "Isabela R.", location: "Bend, OR", rating: 5, title: "Third winter, still lofts like new", body: "I wash it twice a season with down wash and tennis balls. No leaks, no flat spots, zips still smooth.", at: daysAgo(21), bought: "Clay · S", verified: true, helpful: 112 },
  { id: "r4", author: "Oliver G.", location: "Leeds, UK", rating: 3, title: "Warm, but the shell scuffs easily", body: "Very warm for the weight. After one scramble the shoulders show pilling where my pack straps sit. Fine for town, less so for rock.", at: daysAgo(34), bought: "Slate · M", verified: true, helpful: 19 },
  { id: "r5", author: "Yuki T.", location: "Sapporo, JP", rating: 5, title: "The one I grab every morning", body: "Light enough to wear on the train, warm enough for the walk after. The Moss colour is richer in person.", at: daysAgo(46), bought: "Moss · S", verified: true, helpful: 27 },
  { id: "r6", author: "Daniel K.", location: "Minneapolis, MN", rating: 2, title: "Zip pull snapped in week two", body: "Support sent a replacement the same day, which I appreciate, but a zip shouldn't fail that quickly on a jacket at this price.", at: daysAgo(58), bought: "Slate · XL", verified: true, helpful: 14 },
  { id: "r7", author: "Priya N.", location: "Denver, CO", rating: 4, title: "Cosy and well cut", body: "Fits true to size with room for a fleece. Wish the hand pockets were fleece-lined, but that's my only gripe.", at: daysAgo(73), bought: "Moss · M", verified: false, helpful: 9 },
  { id: "r8", author: "Mateo G.", location: "Santiago, CL", rating: 1, title: "Feathers poking through", body: "Mine shed down from the seams from day one. Returned for a refund without any hassle, but disappointed.", at: daysAgo(96), bought: "Clay · L", verified: true, helpful: 6 },
];

export type CartLine = { id: string; productId: string; variantId: string; name: string; detail: string; price: number; compareAt?: number; qty: number };
export const cart = {
  lines: [
    { id: "l1", productId: "p1", variantId: "p1-1-M", name: "Ridgeline Down Jacket", detail: "Slate · M", price: 248, compareAt: 310, qty: 1 },
    { id: "l2", productId: "p2", variantId: "p2-0-L", name: "Trailhead Merino Crew", detail: "Oat · L", price: 89, qty: 2 },
    { id: "l3", productId: "p5", variantId: "p5-0", name: "Summit Rib Beanie", detail: "Ember", price: 38, qty: 1 },
  ] as CartLine[],
  shipping: 9,
  /** Orders at or over this ship free. */
  freeShippingAt: 500,
  taxRate: 0.0875,
  promo: { code: "FIELD15", off: 0.15 },
};

export type WishlistEntry = { id: string; productId: string; variantId: string; savedAt: number; /** What it cost when saved, so a drop can be shown. */ savedPrice: number };
/** Saved items: one has dropped in price since, one is down to the last few, one has sold out in the saved size. */
export const wishlist: WishlistEntry[] = [
  { id: "w1", productId: "p6", variantId: "p6-0-S", savedAt: daysAgo(12), savedPrice: 248 },
  { id: "w2", productId: "p2", variantId: "p2-2-M", savedAt: daysAgo(5), savedPrice: 89 },
  { id: "w3", productId: "p4", variantId: "p4-1", savedAt: daysAgo(2), savedPrice: 179 },
  { id: "w4", productId: "p3", variantId: "p3-1-XL", savedAt: hoursAgo(20), savedPrice: 64 },
  { id: "w5", productId: "p5", variantId: "p5-1", savedAt: hoursAgo(3), savedPrice: 38 },
];

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

/** The season's sale (ends tomorrow night) and a short flash offer, for Promo Banner. */
export const promo = {
  headline: "End-of-season sale",
  detail: "Up to 25% off outerwear and packs",
  code: "FIELD25",
  endsAt: daysFromNow(1, 23, 59),
  off: 0.25,
  flash: { headline: "Free express shipping", detail: "On orders over $500", durationMs: 14_000 },
};


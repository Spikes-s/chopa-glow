# Chopa Cosmetics — Premium Polish & Real Analytics

This is a large scope. I'll ship it in ordered, verifiable groups so each layer is stable before the next.

## Group 1 — Homepage Product Belts (Featured / Most Bought / New Arrivals / Best Reviewed)

- New `<ProductBelt />` component: CSS-transform infinite marquee (duplicated list, `translate3d` + `will-change`), direction prop (`ltr` / `rtl`), configurable speed, pause on hover/touch/focus, respects `prefers-reduced-motion`.
- Wire directions: Featured LTR, Most Bought RTL, New Arrivals LTR, Best Reviewed RTL.
- Data sources:
  - Featured: existing `display_section='featured'` query.
  - New Arrivals: newest `created_at`.
  - Most Bought: aggregate `orders.items` (jsonb) → top qty in last 30 days (SQL view or client aggregation with cache).
  - Best Reviewed: `product_reviews` avg rating desc, min 3 reviews.
- Card polish: soft float, hover glow, elevation, glass overlay — added to existing `ProductCard` behind a `beltMode` variant so grid usage stays untouched.

## Group 2 — Product Variant Image Transitions

- Update `ProductGallery` to slide-fade between images when `mainImage` prop changes (translateX + opacity). Preload the incoming image via `new Image()` before starting the transition; keep old frame visible until preload resolves — no blank frame, no flicker.
- Preserve zoom state in `ProductImageViewer` across variant swaps.

## Group 3 — Terms & Conditions scroll fix + Footer legal links

- Audit `Terms.tsx` for `overflow-hidden` / fixed-height wrappers cutting content; ensure page uses natural document scroll with bottom padding clear of sticky nav.
- Footer: add always-visible "Terms & Conditions" and "Privacy Policy" links working in light + dark themes.

## Group 4 — Categories page spacing

- Remove the "Shop All" button.
- Add top padding so heading clears the floating Back button on every viewport.

## Group 5 — Admin-editable delivery prices

- New table `delivery_locations` (name, region, price, sort_order, is_active) with GRANTs + RLS (public read, admin write).
- Seed from `src/data/deliveryLocations.ts`.
- New `DeliveryLocationsManager` admin tab (CRUD + search).
- Frontend `DeliveryLocationSelect` reads from DB with realtime subscription; falls back to seed list if fetch fails.

## Group 6 — Real analytics dashboard (realtime)

- Reuse existing tables: `page_visits`, `orders`, `products`, `user_search_history`, `product_reviews`, `profiles`.
- New SQL views / RPCs for aggregate queries (visitors today, unique/returning, page views, sessions, bounce rate, avg session, most viewed product/category, orders + revenue windows, top selling, top categories, top searches, current online = distinct sessions in last 5 min).
- Rewrite `SalesAnalytics.tsx` (and add `VisitorAnalytics` panel) to consume real data with `supabase.channel()` subscriptions on `orders`, `page_visits`, `user_search_history` for live updates. No fabricated numbers — any metric we can't compute is omitted rather than faked.
- Traffic sources / device / country: derive from `page_visits` fields (add `referrer`, `user_agent`, `country` columns if missing — migration will add nullable columns and a lightweight client capture in `usePageVisit`).

## Group 7 — Global animation, a11y, perf polish

- Tailwind keyframes: add `float`, `belt-scroll`, `slide-fade` utilities.
- Audit for `text-gray-*` / hardcoded colors → replace with semantic tokens.
- Icon-only buttons → `aria-label`.
- Image `loading="lazy"` + `decoding="async"` sweep; `fetchpriority="high"` on LCP hero.
- Route-level `React.lazy` for heavy admin panels.

## Group 8 — QA sweep

- `tsgo` typecheck.
- Playwright smoke: home belts scroll + pause on hover, variant swap fades, terms scrolls, footer links open, categories layout, admin delivery CRUD, analytics live-updates when a new order lands.
- Fix everything surfaced.

## Technical notes

- Belts use pure CSS `@keyframes` translate on a duplicated flex row — no JS `requestAnimationFrame` loop, so it's GPU-cheap and 60fps.
- Analytics views are `SECURITY INVOKER` with admin-only RLS on the underlying grants; RPCs that expose aggregates to admin dashboard use `SECURITY DEFINER` + `has_role` check.
- Delivery locations table migration includes GRANT + RLS in the same file per project rules.
- No breaking changes to checkout — `DeliveryLocationSelect` keeps the same output shape (id/name/price/address string).

## Out of scope for this pass

- Rewriting POS, VIP campaign engine, or M-Pesa integration (already stable per prior turns).
- Country/city geo-IP lookup (needs a paid service) — will show "Unknown" bucket until a provider is added.

Reply **go** to start with Group 1 + 2 (belts + variant transitions) in the next turn, or tell me to reorder.

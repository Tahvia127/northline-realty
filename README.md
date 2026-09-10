# Northline — Chicago Real Estate

An agent site with filterable listings and a map that stays in sync with the filters.

**Status:** unpublished demo. Not on GitHub Pages, not linked from the studio site.
**Built by:** Framework Studio.

---

## What this one proves

Search, filter and map UI over structured data — the thing agents actually need and the thing most agent sites do badly.

- **Five filters** — neighborhood, type, beds, status, max price — all applied together, live, with no page reload.
- **The map follows the filters.** Filter to condos and seven pins disappear; the map refits its bounds to what is left. Click a pin and the page scrolls to that listing and opens its detail panel.
- **An honest empty state** when nothing matches, rather than a blank grid.
- **A lead form** that validates name and email before it will accept a submission.

## How it works

```
data/site.json     ─┐
data/listings.json ─┤─> build.mjs ─> index.html
src/index.template ─┘
```

Listings live in `data/listings.json`: address, neighborhood, price, beds, baths, sqft, type, status, coordinates, photo, blurb and features. Add one to the array and it appears in the grid, in the filter dropdowns and on the map. Neighborhood and type dropdowns are generated from the data, so they can never drift out of sync with the listings.

`build.mjs` has zero dependencies.

## The map

[Leaflet](https://leafletjs.com) with OpenStreetMap tiles. No API key, no billing account, no per-load cost — which matters for a solo agent who does not want a Google Maps invoice.

Markers are HTML price pills rather than generic teardrops, so the map is readable at a glance. Sold listings render grey.

## Repository layout

```
data/site.json       Agent details, stats, demo notice.
data/listings.json   Every listing. The only file that changes often.
src/                 Page template with {{TOKEN}} placeholders.
build.mjs            Renders template + data. No dependencies.
assets/              Stylesheet and images.
index.html           Generated. Do not edit by hand.
```

## Running it

```bash
node build.mjs
python3 -m http.server 8000
```

The map needs a network connection for tiles.

## Design notes

- **Type:** Fraunces for display, Inter for body and UI.
- **Color:** bone `#F5F2EC`, navy `#1B2430`, clay `#9A4F2E`. Every text pairing clears WCAG AA; the muted grey was darkened from `#6C7480` to `#656C78` because the original was 4.23:1 on bone.
- **Cards are keyboard reachable** — `tabindex`, and Enter or Space opens the detail panel.
- **SEO:** `RealEstateAgent` JSON-LD.

## Before this goes to a real client

1. Replace `assets/img/` with the agent's own listing photography. Placeholders are Unsplash, under the Unsplash License.
2. Point the lead form at Formspree, a CRM, or the agent's inbox. It currently validates and confirms without sending.
3. If the brokerage has an MLS/IDX feed, `data/listings.json` is the shape to populate from it.
4. Set `demo.show` to `false` in `data/site.json`.

## A note on the data

Northline, Dana Okoye, the licence number and every listing are invented. Addresses are plausible Chicago street numbers rather than real properties, and the phone is in the reserved 555 fictional block.

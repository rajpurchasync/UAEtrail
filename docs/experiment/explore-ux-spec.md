# Explore Map — UX Specification (Locked)

**Branch:** `experiment/new-ui` · **Remote:** `purchasync/UAEtrail` only  
**Status:** Approved for implementation · **Last updated:** 2026-09-07

This document is the **single source of truth** for visitor-facing copy, emojis, badges, and CTAs on the mobile explore map. Code must implement via `src/explore/exploreCopy.ts` (Phase P0) — not ad-hoc strings in components.

---

## Payment rule (global)

- **No online payment / no checkout links** on map, sheet, or join modal.
- Show labels only: `Free` · `Paid · AED {n}` · `Shared · AED {n}/seat`
- Paid/shared footer note: *Payment arranged directly with the host.*

---

## Map pin emojis

| Source | Kind | Emoji | Notes |
|--------|------|-------|-------|
| activity | hiking | 🥾 | |
| activity | camping | 🏕️ | |
| activity | event | 🏃 | |
| activity | carpool | 🚗 | From pin; to pin uses 🏁 (Phase P2) |
| venue | hiking | ⛰️ | Label: **Hiking Spot** |
| venue | camping | ⛺ | Label: **Camping Spot** |
| shop | shop | 🛍️ | |
| agency | agency | 🏢 | Phase P4 |
| demand | any | 🙋 | Phase P5 |

---

## Headline templates (supply)

| Type | Headline | Subtitle |
|------|----------|----------|
| Hiking activity | `{FirstName} is going Hiking on {WeekdayDate}` | `{locationName}` or region |
| Camping activity | `{FirstName} is going Camping on {WeekdayDate}` | same |
| Event activity | `{FirstName} is hosting “{Title}” on {WeekdayDate}` | same |
| Carpool activity | `{FirstName} is carpooling {From} → {To} on {WeekdayDate}` | seats / shared label |
| Hiking venue | **Hiking Spot** | Trail name |
| Camping venue | **Camping Spot** | Camp name |
| Shop | `{ShopName}` | region or product count |
| Tour agency | `{AgencyName}` | region |

## Headline templates (demand — Phase P5)

| Type | Headline | Subtitle |
|------|----------|----------|
| Participant intent | `{FirstName} wants to go “{Title}”` | `{PreferredDate} · {PreferredTime}` |

---

## Badges & metadata

| Field | Rule |
|-------|------|
| Price badge | `Free` if price = 0; `Paid · AED {n}` if activity paid; `Shared · AED {n}/seat` if carpool shared |
| Spots (activities) | `{going} going · {left} left` or `{total} spots` |
| Payment note | Show only when paid/shared |

---

## CTAs

| Item type | Primary | Secondary |
|-----------|---------|-----------|
| Hiking / Camping / Event activity | Request to join | View details |
| Carpool activity | Request to join | View details |
| Hiking / Camping venue | View details | — |
| Shop | View shop | — |
| Tour agency | View agency | — |
| Demand post | Join this plan | View details |
| Activity/demand group (member) | Open group chat | — |

---

## Filter pills (order)

`All` · `Hiking` · `Camping` · `Events` · `Carpool` · `Shop` · `Looking` (demand — Phase P5)

List sheet (Activities button): activities + demand only; no shop on list by default.

---

## FAB (+) chooser (Phase P5+)

1. **Host an activity** → host create flow (requires approved Become a Host profile)
2. **I want to go** → demand create flow (any signed-in participant)

---

## UI alignment checklist (every PR)

- [ ] Headline from `exploreCopy` — not inline strings
- [ ] Map pin emoji matches table above
- [ ] List row headline === sheet headline
- [ ] No checkout / pay links
- [ ] Offline payment note on paid/shared
- [ ] Venues use Spot labels, not host names
- [ ] Events use “hosting”, not “wants to”
- [ ] Carpool shows from → to when Phase P2 done
- [ ] Host gate on publish only, not browse

---

## Open decisions (confirm before Phase P2/P4/P6)

1. **Carpool map:** two pins (from 🚗 + to 🏁) vs one pin + text for MVP?
2. **Activity groups:** reuse existing Groups wall vs new lightweight chat?
3. **Business tenant:** one mode (shop **or** agency) vs both allowed?

Record answers here when confirmed:

| # | Decision | Answer |
|---|----------|--------|
| 1 | Carpool pins | Two pins (from 🚗 + to 🏁) with dashed route line |
| 2 | Group UI | _TBD_ |
| 3 | Business mode | _TBD_ |

# Explore Map — UX Specification (Locked)

**Branch:** `experiment/new-ui` · **Remote:** `purchasync/UAEtrail` only  
**Status:** Approved for implementation · **Last updated:** 2026-09-07

**Product north star:** [`../NORTHSTAR.md`](../NORTHSTAR.md) — explore is where users **find people and plans to get outside together**. Card copy should feel social and actionable (“{Name} is going…”, “{Name} wants to go…”), not like a trail database.

**Create / FAB spec:** [`../CREATE_FLOW.md`](../CREATE_FLOW.md) — canonical for + button, organize/find/add, Event vs Activity, participation modes, Going from.

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
| activity | rideshare | 🚗 | From pin; to pin uses 🏁 (Phase P2) |
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
| Rideshare activity | `{FirstName} is offering rideshare {From} → {To} on {WeekdayDate}` | seats / shared label |
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
| Hiking / Camping activity (`approval`) | Request to join | View details |
| Event activity (`approval`) | Request to join | View details |
| Event activity (`rsvp`) | **I'm going** | View details |
| Generic buddy activity (`approval`) | Request to join | View details |
| Rideshare activity | Request to join | View details |
| Hiking / Camping venue | View details | — |
| Shop | View shop | — |
| Tour agency | View agency | — |
| Demand post | Request to join | Message |
| Activity/demand group (member) | Open group chat | — |

**Participation modes:** See [`../CREATE_FLOW.md`](../CREATE_FLOW.md). When `participationMode: rsvp`, primary CTA is **I'm going** (no host approve queue). When `approval`, use **Request to join** (current behavior).

---

## Filter pills (Activities layer)

**Map + list (same model):** `All` · `Hiking` · `Camping` · `Rideshare` · `Others` · `Shops` (shops filter switches panel context — see [`NAVIGATION.md`](../NAVIGATION.md)).

**Others drill-down (E8):** sub-pills **Events** vs **Activities** (`subtype` URL). When **Activities** is selected, topic pills (**Climb**, **Run**, **Workshop**, **Social**) filter on `outingCategory: activities` + `outingTopic` — not title search.

**Places layer:** Trails · Spots · Shops — venue catalog only; no scheduled activity pins.

List sheet: Organize + Demand on Activities; venues/shops on Places per panel.

---

## FAB (+) chooser

**Canonical spec:** [`../CREATE_FLOW.md`](../CREATE_FLOW.md). Summary:

**Header:** `I would like to…`

| Level 1 | Level 2 |
|---------|---------|
| **Organize** | Hiking · Camping · Event · Rideshare · Activity |
| **Find** | Rideshare · Hiking · Camping · Activities |
| **Add** | Camping Spots · Hiking Trails · Shops · Others |

- **Organize** → host create flow (approved host). **Activity** = generic buddy (free-text run/jog/…); **Event** = default RSVP.
- **Find** → demand create flow (any signed-in member).
- **Add** → place contribute flow (location pin, not Going from).

### Legacy (pre-2026-09 — remove when FAB PR ships)

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
- [ ] Rideshare shows from → to when Phase P2 done
- [ ] Host gate on publish only, not browse

---

## Open decisions (confirm before Phase P2/P4/P6)

1. **Rideshare map:** two pins (from 🚗 + to 🏁) vs one pin + text for MVP?
2. **Activity groups:** reuse existing Groups wall vs new lightweight chat?
3. **Business tenant:** one mode (shop **or** agency) vs both allowed?

Record answers here when confirmed:

| # | Decision | Answer |
|---|----------|--------|
| 1 | Rideshare pins | Two pins (from 🚗 + to 🏁) with dashed route line |
| 2 | Group UI | **Reuse `social_groups` wall** — activity crew is `type: activity`; thread UI in **Messages** (`/messages?group=`). See [`../COMMUNICATION.md`](../COMMUNICATION.md). |
| 3 | Business mode | _TBD_ |

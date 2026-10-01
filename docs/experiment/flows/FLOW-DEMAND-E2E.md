# Demand (Find) — end-to-end

**Compose:** `find.hiking` · `find.camping` · `find.event` · `find.rideshare` (FLOW-06–09)  
**Code:** `CreateDemandFlow` · `demandFlow.ts` · `demandWizardSteps.tsx`

---

## 1. Member creates demand

| Stage | What happens |
|-------|----------------|
| **Wizard** | Type → title → when → destination/area → party size → **audience** (restrictions only — no public/private) → pins → transport (hiking/camping/carpool) → **Review** |
| **Review** | Summary + per-step **Edit** chips → **Submit** (not “Publish”) |
| **API** | `POST /me/participant-intents` → `status: active` |
| **Map** | Always **public** when a pin is set · no public/private toggle on find/demand flows · no pin → off-map notice |
| **After submit** | **Success sheet** (same pattern as organize publish) · **View** reloads map · focuses pin · opens peek when visible on map |

**Requester peek:** **Manage plan** · **Remove request** (cancels intent). Optional **Link rideshare** when host gate allows.

---

## 2. Others discover demand

The **poster is the host** for this plan — not a third-party organizer.

| Viewer | Peek footer |
|--------|-------------|
| **Guest** | Sign-in gate on **Request to join** / **Message** |
| **Signed-in member** | **Request to join** · **Message** (DM requester) |
| **Requester** | **Manage plan** · **Delete** · optional **Link rideshare** |

**API:** `POST /me/participant-intents/:intentId/requests` — poster approves in `ParticipantIntentManageSheet`.

**Not on demand pins:** Check-in (published activities only, when joiners exist). **Not used:** “Propose plan” / fulfill by another host.

---

## 3. Poster publishes an outing

| Stage | What happens |
|-------|----------------|
| **Organize** | Poster uses FAB **Organize** (or rideshare link from their demand) with draft prefill when applicable |
| **Publish** | New activity; poster is host · `participationMode` drives **I'm going** / **Request to join** for the public activity |
| **Link demand** | Optional `participantIntentId` on publish → `fulfill` marks intent `fulfilled` and sets `convertedActivityId` |

---

## 4. Published activity (after organize)

| Action | Who | Notes |
|--------|-----|--------|
| **Message** | Host | Activity group chat |
| **Delete** | Host | Cancel/delete activity |
| **Link rideshare** | Host | FLOW-04 wizard or paste URL |
| **Check in attendees** | Host | **Only if ≥1 joiner** |
| **I'm going / Request** | Members | From `participationMode` on activity |

Private organize plans: [PRIVATE-ORGANIZE-PLANS](./PRIVATE-ORGANIZE-PLANS.md) (link-only peek, RSVP).

---

## Gaps / later

- Carry approved demand joiners into activity crew on publish.
- Cancel / withdraw demand join request from explore peek.
- Check-in UX deep-dive (console panel).

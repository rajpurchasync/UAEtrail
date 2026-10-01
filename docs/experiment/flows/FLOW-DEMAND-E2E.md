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

**Requester peek:** **Remove request** (cancels intent, drops pin). No self-message.

---

## 2. Others discover demand

| Viewer | Peek footer |
|--------|-------------|
| **Guest** | Sign-in gate on message / propose |
| **Signed-in member** | **Message** (DM requester) |
| **Approved host** (`canPublish`) | **Propose plan** → organize wizard prefill from demand |
| **Requester** | **Delete** · **Link rideshare** (approved host — FLOW-04 prefill from request; no check-in) |

**Not on demand pins:** Check-in (published activities only, when joiners exist).

---

## 3. Host fulfills → published activity

| Stage | What happens |
|-------|----------------|
| **Propose plan** | `createDraftFromDemand` · `participantIntentId` on publish |
| **Organize wizard** | Same as FLOW-01/02/03/05 for chosen kind |
| **Publish** | `publishOrganizeActivity` · `POST …/participant-intents/:id/fulfill` links activity |
| **Demand row** | `status: fulfilled` · `convertedActivityId` · removed from active map list |
| **Success** | `OrganizePublishSuccessSheet` — **View on map** · optional **Link rideshare** (public parents) |

---

## 4. Published activity (after fulfill or direct organize)

| Action | Who | Notes |
|--------|-----|--------|
| **Message** | Host | Activity group chat |
| **Delete** | Host | Cancel/delete activity |
| **Link rideshare** | Host | FLOW-04 wizard or paste URL |
| **Check in attendees** | Host | **Only if ≥1 joiner** (`slotsAvailable < slotsTotal` or participant previews) |
| **I'm going / Request** | Members | From `participationMode` on activity |

Private organize plans: [PRIVATE-ORGANIZE-PLANS](./PRIVATE-ORGANIZE-PLANS.md) (link-only peek, RSVP).

---

## Gaps / later

- Check-in UX deep-dive (console panel) — gated in peek until first joiner ships.

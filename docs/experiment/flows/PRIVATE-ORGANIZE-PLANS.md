# Private organize plans (FLOW-01 · 02 · 03 · 05)

Applies to **hiking, camping, events, and general activities** — **not** standalone rideshare (FLOW-04; always public + approval) and **not** find/demand (FLOW-06–09; always public on the map when pinned).

| Rule | Behavior |
|------|----------|
| Map | `joinMode: private` — **excluded** from public explore map payload |
| Discovery | Host + anyone **signed in** with the **share link** (`/activity/:id` or `/explore?pin=activity:…`) |
| Guests | Lock screen / sign-in — no browse or join without account |
| Join | **`participationMode: rsvp` only** — **I'm going**; no request-to-join / approval queue |
| Publish success | **View on map** opens **link-only peek** (ephemeral pin); no Post-publish rideshare CTAs |
| Host peek | Full host actions; optional **Link rideshare** (linked ride stays its own public pin) |

Wizard: audience step sets `{ joinMode: 'private', participationMode: 'rsvp' }` and hides public-only audience chips.

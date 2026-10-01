# Trips — managing what you publish

**Audience:** Anyone who **organizes** on the map (host-approved publish) or posts **looking for** demand.  
**Canonical entity:** Activity (organize) · Participant intent (find). See [`DOMAIN.md`](./DOMAIN.md).

## Implementation status (experiment-ui)

| Item | Status |
|------|--------|
| Hosted manage sheet (`HostActivityManageSheet`) | Done — Trips Hosted, `/host/activities` |
| Shared host actions (`useOrganisationActivityHostActions`) | Done |
| Join decline reason + note (host → guest) | Done |
| Explore host peek → Trips manage / check-in | Done |
| My plans list + `MemberDemandManageSheet` | Done — `GET /me/participant-intents` |
| Invite crew (`ActivityInviteSharePanel` / sheet) | Done — detail, manage sheet, explore peek, Trips joined/hosted, org table |
| Edit demand intent (PATCH) | Done — `PATCH /me/participant-intents/:id` + **Edit plan** in manage sheet |
| `GET /host/requests?activityId=` filter | Done — manage sheet loads per-activity requests |
| Invite / share published activities | Done — plain `/activity/:id` link; private plans need sign-in to view |
| Edit demand map pins (My plans) | Done — **Edit plan** → `MemberDemandLocationEditor` |

## Surfaces

| Surface | Use |
|--------|-----|
| **`/trips` → Hosted** | Mobile-first manage sheet per outing |
| **`/host/activities`** | Full console (same actions + table) |
| **`/explore`** | Publish / edit via compose wizard |

## Organized activities (hike, camp, event, rideshare, generic activity)

**Entry:** Trips → Hosted → tap row → **Manage outing** sheet.

| Capability | Hike / camp / event | Rideshare | Draft |
|------------|---------------------|-----------|--------|
| Edit / publish | ✓ | ✓ | ✓ |
| Duplicate / reorganize | ✓ | ✓ | duplicate only |
| Join requests (approval mode) | ✓ | if approval | — |
| Group chat | ✓ (approved crew + host) | ✓ | host only |
| Check-in roster | ✓ | — | — |
| Link / create rideshare on parent | ✓ | — | — |
| Cancel / delete | ✓ | ✓ | delete draft |

Code: `HostActivityManageSheet`, `useOrganisationActivityHostActions`, `hostActivityManageCapabilities`.

## Looking for (demand / Find)

Not hosted under org tenant — **member intents** (`POST /me/participant-intents`).  
**Trips → My plans / Self:** `GET /me/participant-intents` → list → **Manage plan** sheet (`MemberDemandManageSheet`).  
**Explore map** owner peek remains available (delete, offer rideshare if host).

| Capability | Demand owner |
|------------|----------------|
| Edit / cancel intent | Trips manage sheet + API (`PATCH` / cancel) |
| Offer / link rideshare | Host gate + organize rideshare |
| Join requests | N/A (not an activity) |
| Group chat | N/A until converted to organize |

## Inviting people

| Channel | Who | Behavior |
|--------|-----|----------|
| **Share link** | Host, participants, anyone on `/activity/:id` | WhatsApp, copy link, email, native share — guests can **view**; **Join free** to participate |
| **Connections** | Signed-in host / participant | DM with activity link (`ActivityInviteSharePanel`) |
| **Family / friends groups** | Signed-in | Post link on group wall |
| **Trips / org console** | Host org members | Share icon on hosted rows + full panel in manage sheet |
| **Explore map** | Host + confirmed joiners | **Invite your crew** on peek → same panel |
| **Activity group chat** | Host + approved crew | In-app thread after join (not a public invite URL) |

## Messaging

- **Group chat:** Host + **approved** participants (`activity-group-chat` service).
- **Pending requesters:** Request note only until host approves.
- **DM policy:** `chat-policy.ts` (buddies, host↔participant links).

Future: optional `groupChatPolicy` on activity (host-only vs crew).

## Deep links

- `/trips?role=hosted&peek=<activityId>` — open manage sheet  
- `/trips?role=hosted&checkin=<activityId>` — manage sheet → check-in  
- `/trips?role=self&peek=<intentId>` — My plans manage sheet  
- Explore `pin=demand:<intentId>` + `compose=organize:rideshare` — offer carpool (hosts)  

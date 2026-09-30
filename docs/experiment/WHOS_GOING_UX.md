# Who's going? — people, trips, privacy, messaging

**Branch:** `experiment-ui` · **Status:** Partial (People/Trips UI + buddies; **Follow** for map notifications without buddy)

**Related:** [`explore-browse-taxonomy.md`](./explore-browse-taxonomy.md) · `apps/api/src/services/profile-viewer-access.ts` · `apps/api/src/services/chat-policy.ts`

---

## Product intent

**Who's going?** is the social entry on Explore: see **your crew (friends)**, **outings with people joining**, and **who is on those trips** — without bypassing **private profiles** or **buddy-only messaging** expectations on this surface.

North star: *find your people · get outside · go together* — not a public member directory.

---

## Today (shipped)

| Piece | Behavior |
|-------|----------|
| Map button | Face pile from `participantPreviews` on upcoming activities |
| List (`view=going`) | Activity rows only, sorted by join count; `showJoining` avatars on each row |
| Friends | `GET /me/buddies` — **not** shown inside Who's going |
| Private profile | `GET /members/:id` → `visibilityState: 'private'` when viewer lacks access (`resolveProfileViewerAccess`) |
| Message | `canMessageUser` allows **accepted buddies** **or** shared activity / join-request links (`chat-policy.ts`) |

Gap: one flat **trip list**; no **People** segment; row avatars are not privacy-aware; Message is not surfaced here but global chat is looser than “friends only.”

---

## Target UX (two segments)

### Segment A — **People** (friends)

- List **accepted buddies** (`BuddySummaryDTO` from `/me/buddies`).
- Optional badges: “Joining [trip title]” when a friend is on an upcoming published activity (server-derived).
- Row actions:
  - **Message** — only if `areBuddies` (always true in this list).
  - Tap avatar/name → member profile when viewer may see it (`visibilityState === 'full'`).

### Segment B — **Trips** (current list, refined)

- Keep activity-centric list (hosted outings with joiners).
- Under each trip: **joining strip** — avatars + count, same as today.
- Per person chip:
  - **View profile** — only if API says viewer can see full profile; else show **Private member** (no navigation to full page, or profile page shows existing lock state).
  - **Message** — **not** shown unless viewer and target are **accepted buddies**.
  - **Add buddy** — when `BuddyRelationshipDTO.canSendRequest` (reuse `MemberProfile` patterns).

Guests: People segment prompts sign-in; Trips may stay browse-only with limited previews per `PARTICIPANT_PRIVACY`.

---

## Privacy rules (reuse server truth)

Do **not** invent client-side privacy. For each `userId` shown in Who's going:

1. Call existing **`resolveProfileViewerAccess`** (or a batch wrapper) for `(viewerId, targetId)`.
2. Expose to UI:
   - `canViewProfile: boolean` → link to `/member/:id` only when true.
   - `displayName` / `avatarUrl` — use **redacted preview** when `canViewProfile` is false (e.g. “Member” + generic avatar), consistent with map member discovery (`shouldHideFromMapMemberDiscovery` for private non-hosts).

**Private profile:** viewer without buddy / group / activity link sees **no full profile** — align with `MemberProfile` lock copy (“Log in if you are friends…”).

---

## Messaging rules (Who's going surface)

| Viewer state | Message CTA |
|--------------|-------------|
| Not logged in | Hidden → Join / Log in |
| Logged in, not buddies | Hidden; show **Add buddy** (or Accept request) |
| Accepted buddies | **Message** → existing DM thread |

**Note:** Platform `canMessageUser` still allows messaging via **shared activity** without buddies. For **Who's going UI**, treat messaging as **buddy-only** unless product later tightens `chat-policy.ts` globally. Server should still enforce `assertCanMessageUser` on send.

---

## API sketch (recommended)

Add authenticated aggregate (keeps explore map payload small):

`GET /api/v1/me/explore/whos-going`

Query: same date window as explore list (`date` preset), optional `q`.

Response:

```ts
type WhosGoingPersonRow = {
  userId: string;
  displayName: string;        // redacted if !canViewProfile
  avatarUrl: string | null;
  canViewProfile: boolean;
  areBuddies: boolean;
  canSendBuddyRequest: boolean;
  buddyRequestId?: string;    // incoming/outgoing pending
  joiningActivityId?: string;
  joiningActivityTitle?: string;
};

type WhosGoingTripRow = {
  activity: ExploreMapItemDTO; // or slim card
  joinedCount: number;
  participants: WhosGoingPersonRow[]; // capped, privacy-filtered
};

{
  friends: WhosGoingPersonRow[];
  trips: WhosGoingTripRow[];
}
```

Implementation notes:

- **friends:** `listBuddiesForUser(viewerId)` + join to upcoming participations.
- **trips:** query published activities in date window with participants; map previews through `toParticipantPreviews` + per-viewer access.
- Batch profile access in one handler to avoid N+1.

Until this exists, UI can **compose** client-side: `getMeBuddies()` + current `whosGoingListItems` — but **privacy must be server-validated** before showing avatars/names from raw `participantPreviews`.

---

## Frontend changes (`experiment-ui`)

1. **`ExploreBrowseListMode`:** extend or add sub-tab `whosGoingSegment: 'people' | 'trips'` (URL `view=going&segment=people`).
2. **`ExploreBrowsePanel`:** segmented control under Who's going header; People list component (`ExploreWhosGoingPeopleRow`).
3. **`ExploreListRow` / joining strip:** pass `viewerId`, fetch or receive `canViewProfile` / buddy flags per preview (disable profile tap, show Add buddy).
4. **Map button:** optional — prefer face pile from **friends joining** first, then global joiners (product choice).

---

## Phasing

| Phase | Deliverable |
|-------|-------------|
| **1** | UI segments People \| Trips; People from `getMeBuddies`; buddy-only Message; no profile link without full visibility |
| **2** | `GET /me/explore/whos-going` with batch privacy |
| **3** | Friend badges on trips; map face pile uses same roster |
| **4** | (Optional) Product decision: restrict `chat-policy` to buddies-only for cold DMs |

---

## Exit criteria

- Friends appear in Who's going without using Activities/Places tabs.
- Private members never expose full profile from this flow.
- Message only offered to accepted buddies on this surface.
- Trips + joining counts remain the primary discovery path for new people to meet.

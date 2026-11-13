# Hiking Community App: Detail Pages Plan

A plan for the seven detail views (Hike, Camping trip, Event, Rideshare, Trail, Camp spot, Gear shop), with a gap analysis of missing information and layouts for mobile, tablet and desktop.

## 1. What we are designing

The screenshots show seven page types. They fall into two families that should share one design system but have different section sets.

| Family | Page types | Core purpose |
| --- | --- | --- |
| **Activities** (time-bound) | Social hike (free), Guided hike (paid), Camping trip, Event, Rideshare | Decide, then join or request a spot |
| **Places** (permanent) | Trail, Camp spot, Facility (gear shop, and later parking, water points, huts) | Learn, trust, then plan a trip or visit |

The two families link to each other. An Activity happens at a Place, and a Place lists its scheduled Activities. A Rideshare is attached to an Activity. These links are the backbone of the navigation.

**Design principles**

1. **The hero answers "what, when, how much, am I in?" in three seconds.** Everything else is below it.
2. **One section, one job.** Each section is a distinct card or band with a title, so the page scans as blocks rather than a long form.
3. **Facts before prose.** Key facts are chips and stat tiles. Descriptions come second.
4. **Trust and safety are first-class.** Host verification, gear, difficulty, weather and emergency info are never buried.
5. **One primary action per state.** Request to join, Joined, Waitlist, Full, Cancelled and Completed each change the action area. Nothing else competes with it.
6. **Same section library everywhere.** A section built once is reused across page types.

## 2. Missing information (gap analysis)

This is the most important finding of the review. The screenshots show what exists today. The lists below show what users will need but cannot currently find. Items marked **(P1)** are launch-critical, **(P2)** should follow soon after.

### 2.1 Gaps that affect every Activity page

- **Description is empty or placeholder.** The Camping page has an empty "About this activity" heading. The Event page shows "Format: event", which tells the user nothing. **(P1)**
- **Capacity and spots left.** Only the hike shows "1/20". Camping, Event and paid trips need spots left, a waitlist and a minimum-to-run threshold. **(P1)**
- **Start and end time, and duration.** Only a start time is shown for most. Users need the end time and the approximate return time, especially for families. **(P1)**
- **Meeting point before joining.** It is hidden until RSVP. A coarse area (for example "Dubai Marina, near the mall") should be public, with the exact pin unlocked after joining. **(P1)**
- **Price clarity.** The paid trip shows "AED 180" but not whether it is per person or per car, what is included, what is not, or the deposit. The screen also says payment is arranged outside the app, so state the payment method and the deadline. **(P1)**
- **Cancellation and refund policy, and what happens if the host cancels.** **(P1)**
- **Weather and heat advisory for the event date.** This matters in the UAE, where summer heat and flash floods are real safety factors. **(P1)**
- **Participant list or avatars** (with privacy control) and who is joining from the user's network. **(P2)**
- **Fitness level, minimum age, pets and accessibility.** The "Kids welcome" chip is the only audience signal. **(P1)**
- **Gear list and rental.** Only the hike has one, and it is duplicated: "Instructions" and "Activity details" repeat the same three bullets. Camping needs a tent, sleeping bag and food list, plus what the host supplies. **(P1)**
- **Emergency contact and on-trail check-in or SOS process.** **(P1)**
- **Waiver or terms acceptance** for paid and guided trips. **(P2)**
- **Language of the guide or host.** **(P2)**
- **Add to calendar, share and save.** Share exists, the others do not. **(P2)**
- **Status.** Draft, Published, Full, Cancelled, Completed and Rescheduled need clear visible states. **(P1)**
- **Photos.** None of the activity pages has a hero image or gallery. **(P1)**
- **Operator and guide credentials** (certifications, first-aid, licence number, years of experience). Today they show only a name and "5.0 · 1 host review", where one review is a weak trust signal. **(P1)**

### 2.2 Gaps by page type

| Page | Missing information |
| --- | --- |
| **Hike** (social or guided) | Trail map preview; start and end coordinates; pace (km/h); elevation profile; terrain; water refill points; what to do if it rains; carpool links from the page; whether the hike is a repeat or a one-off; "Joined" state should show how to leave. |
| **Camping trip** | Check-in and check-out times; duration in nights; tent or pitch provided or BYO; food and cooking (BBQ stand rule exists only on the place page); campfire rules; toilets and water on site; vehicle requirement (4x4 is on the place page, not on the trip); itinerary day by day; what the AED 180 covers; number of tents or pitches. |
| **Event** | Duration and end time; agenda; capacity; host type; why "Free" is in the title as well as in a chip (redundant); description; what to bring; whether food or drinks are sold. |
| **Rideshare** | Return trip; departure flexibility; luggage rules (partly present); vehicle plate and driver verification; seat contribution per seat versus total; pickup time versus hike time (5:00 AM versus 6:00 AM, which needs a buffer note); route duration and distance; women-only or gender preference option; smoking and pets; driver reviews are empty (needs verification badge instead). |
| **Trail** | Map and GPX preview (only a download button now); start and end coordinates; trail type (loop, out-and-back, point-to-point); surface; elevation profile; water and shade points; cell coverage; dogs allowed; permits or fees; parking details; best time of day; hazards (flash flood, snakes, heat); open or closed status and last-verified date; nearest hospital; photo gallery; GPS coordinates for emergencies. |
| **Camp spot** | Price per night or permit; capacity (tents, people); amenities (toilets, water, power, showers); rules (fire, noise, waste); check-in and out; coordinates and what3words style pin; nearest fuel and shops; cell coverage; wildlife or sand-driving advice; booking method for self-guided camping; photo gallery; "No ratings yet" needs a better empty state. |
| **Gear shop (Facility)** | Opening hours; address and map (the Location tab exists but nothing is shown); phone, website, WhatsApp; brands and categories; rental availability; photos; deals for community members; delivery. |

### 2.3 Data and consistency issues

- Naming differs between pages: "Kids welcome" (activity) and "Child-friendly" (place). Pick one term and one rule for what it means.
- "Operator" versus "Host" versus "Guide" are used inconsistently. Define them: Operator is a business, Host is an individual organiser, Guide is a person leading on the day.
- Duration appears on the Trail (4 hrs) but not on the Hike that uses it, so derive it automatically.
- The Trail guide text is markdown with raw `##` headings that show as plain text. Render it properly.
- Rating logic: a trail shows "5.0 · 1 ratings", which should read "1 rating" and show a low-confidence note until there are more.
- Reviews are gated behind check-in on activities but open on places. That is fine, but explain it with one short line on each page.
- Pro-gated content (guide, GPX) needs a visible, friendly locked preview rather than appearing only as "Included with Pro".

## 3. Page anatomy

Every detail page follows the same five-zone anatomy.

1. **Hero banner.** Image or map, title, type badge, key facts, primary action (on desktop and tablet).
2. **Key facts strip.** The three to five facts that decide the choice, as stat tiles.
3. **Content sections.** Distinct cards, ordered by importance for that page type.
4. **Trust and social sections.** Host, participants and reviews.
5. **Action area.** A sticky bottom bar on mobile, and a side panel or hero button on tablet and desktop.

### 3.1 Hero banner spec (top of every page)

| Element | Activities | Places |
| --- | --- | --- |
| Background | Cover photo, with a map snapshot fallback | Cover photo carousel (up to 5), swipe on mobile |
| Overlays | Type badge (Hiking, Camping, Event, Rideshare), status pill (Open, Full, Cancelled), and an alert banner directly under the hero when a hazard is active | Type badge, "Verified" or "Open now" pill |
| Title | Large, 2 lines max | Large, 2 lines max |
| Subtitle | Place name with region, linking to the Place page | Region and sub-region (for example "RAK · Wadi Shawka") |
| Date block | Date tile (day, month, weekday) plus time range | None |
| Chips | Price, kids welcome, difficulty, spots left | Difficulty, child-friendly, best season |
| Quick stats | Distance, elevation, duration or nights | Length, elevation, duration (trail), capacity (camp) |
| Actions | Back, Share, Save | Back, Share, Save |

A dark gradient sits at the bottom of the image so text always passes contrast. If there is no image, use a generated topographic pattern in the type's accent colour. Never show an empty grey box.

## 4. Section library and order per page

Each section is a card with an icon, a title and optional "edit" or "see all" action. Section order is the key difference between page types.

| # | Hike | Camping trip | Event | Rideshare | Trail | Camp spot | Gear shop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hero | Hero | Hero | Hero | Hero | Hero | Hero |
| 2 | Key facts | Key facts | Key facts | Route and times | Key facts | Key facts | Key facts (hours, rating) |
| 3 | Where and meeting point | Where and stay | Where | Linked activity | About | About | About |
| 4 | About | About | About | Car and seat details | Map and elevation | Amenities | Products and services |
| 5 | Itinerary | Itinerary | Agenda | Host and driver | Getting there | Getting there | Location and hours |
| 6 | What to bring | Packing and provided | What to bring | Rules | Safety and conditions | Rules and safety | Contact |
| 7 | Host and guide | Host and guide | Host | Costs | Facilities nearby | Facilities nearby | Reviews |
| 8 | Participants | Participants | Participants | Reviews | Scheduled outings | Scheduled outings | None |
| 9 | Cost and policy | Cost and policy | Policy | n/a | Reviews | Reviews | None |
| 10 | Reviews | Reviews | Reviews | n/a | Guide (Pro) | Guide (Pro) | None |

Exact definitions of the shared sections:

- **Key facts.** Stat tiles in a grid (2 columns on mobile, 4 on desktop). Each tile has an icon, a label and a value.
- **Where and meeting point.** Map thumbnail, area name, and exact pin locked until joined, with "Get directions" and "Copy coordinates".
- **About.** Short description, with "read more" after 4 lines.
- **Itinerary.** Vertical timeline with times.
- **What to bring.** Icon checklist grouped as Mandatory and Recommended (for example water 3 L, headlamp), deduplicated, with "provided by host" tags.
- **Host and guide.** Avatar, name, host type (community host, tour operator or pro guide), verification badge with licence expiry for operators and pro guides, rating, response time, "Message host".
- **Participants.** Avatars with "x of y going", waitlist count.
- **Cost and policy.** Price breakdown, included and excluded, who collects the money, payment method, host-set cancellation policy (the host handles refunds), waiver.
- **Safety and conditions.** Active alert banner (flash flood, extreme heat, closure), forecast for the activity date, hazards, permits and 4x4 versus AWD requirement, mobile coverage by carrier (Etisalat and du), emergency contact, last-verified date.
- **Scheduled outings.** Upcoming activities at this place, as compact cards.
- **Reviews.** Rating summary, histogram, sort, and a review form (when eligible).
- **Guide (Pro).** Rendered markdown, GPX download, locked preview for non-Pro users.

### 4.1 Facility pages by subtype

Facilities have ten subtypes in two groups. Both groups use the same page template and hero, and differ in the sections they show. This replaces the single "Gear shop" column in the table above.

| Group | Subtypes | Sections after the hero |
| --- | --- | --- |
| **Amenities** | Water station, fountain, pond, rest area, toilets, parking | Key facts (working status, free or paid, last checked), About, Location and directions, Photos, Nearby trails and camps, Report a problem |
| **Commercial** | Cafe, gas station, gear rental, shop | Key facts (open now, hours, rating), About, Products and services, Offer (referral), Location and hours, Contact, Reviews |

**Rules for amenities**

- Water stations, fountains and toilets show a status: Working, Not working or Unknown, with the date it was last checked. A dry water station on a trail is a safety issue, so the status sits in the key facts, not in the body.
- A pond is marked seasonal, with the months it usually holds water.
- Parking shows fee, surface and approximate capacity.
- Users can report a problem (for example "water station is dry"). Reports go to the review queue and update `amenityState` after a curator confirms. This is a P2 feature, and the field is ready now.

**Rules for commercial facilities**

- No payment in the app. The page shows contact buttons (call, WhatsApp, website, directions) and an optional referral offer.
- The referral button is clearly labelled "Partner" and opens the partner link. The click is recorded without slowing navigation (13.8).
- Gear rental can list rental items with a daily price, as plain text, for planning only.
- "Open now" is computed in the browser from `hours` and Gulf Standard Time.

**Where facilities appear elsewhere:** Trail and Camp spot pages show the five nearest facilities in "Facilities nearby" with an icon per subtype. These come from the embedded `nearby` list, so the page needs no extra query. Tapping one opens the facility page.

## 5. Layouts

### 5.1 Mobile (up to 767px): hero plus bottom action bar

Single column. The hero takes about 40% of the viewport. The action bar is fixed at the bottom with safe-area padding.

```
┌─────────────────────────────┐
│ ‹  Hiking            ♡  ⤴   │  ← translucent top bar over hero
│                             │
│       [ cover photo ]       │
│                             │
│ [Hiking] [Moderate]         │
│ Wadi Shawka Community Hike  │
│ Wadi Shawka Loop · RAK      │
│ ┌──┐ Mon 16 Nov · 7:00 AM   │
│ │16│ Free · Kids welcome    │
│ └──┘                        │
├─────────────────────────────┤
│ [8 km] [450 m] [4 h] [1/20] │  ← key facts, horizontally scrollable
├─────────────────────────────┤
│ ▸ WHERE & MEETING POINT     │  ← section card
│   map · directions          │
├─────────────────────────────┤
│ ▸ ABOUT                     │
├─────────────────────────────┤
│ ▸ ITINERARY                 │
├─────────────────────────────┤
│ ▸ WHAT TO BRING             │
├─────────────────────────────┤
│ ▸ HOST & GUIDE              │
├─────────────────────────────┤
│ ▸ GOING (1/20)              │
├─────────────────────────────┤
│ ▸ COST & POLICY             │
├─────────────────────────────┤
│ ▸ REVIEWS                   │
├─────────────────────────────┤
│ [ Request to join ] [ 💬 ]  │  ← sticky action bar
└─────────────────────────────┘
```

**Mobile rules**

- Top bar is transparent over the hero and turns solid after scrolling past it. The title then moves into the bar.
- Sections are cards with 16px padding and 12px gaps. Long sections (itinerary, reviews, guide) are collapsible. The first two sections are open by default.
- Section jump chips (Overview, Details, Host, Reviews) sit just under the hero and stick under the top bar while scrolling.
- The action bar holds one primary button and one or two secondary icon buttons (message, save). It hides on scroll down only if the page has a long form, and reappears on scroll up.
- Tap targets are at least 44px.

### 5.2 Tablet (768px to 1023px): two columns, no bottom bar

The hero is full width and about 320px high. Below it, a 12-column grid splits content into a main column (7 columns) and a secondary column (5 columns). Actions live in the hero and in a card in the secondary column, as in a normal web page.

```
┌───────────────────────────────────────────────┐
│ ‹ Back                         ♡ Save   ⤴ Share│
│              [ wide cover photo ]             │
│ [Hiking] [Moderate]                           │
│ Wadi Shawka Community Hike     [Request to join]│
│ Wadi Shawka Loop · RAK                         │
├───────────────────────────────────────────────┤
│ [8 km] [450 m] [4 h] [1/20 going] [Free]      │
├─────────────────────────┬─────────────────────┤
│ ABOUT                   │ SIGN-UP CARD        │
│                         │ Free · 19 spots     │
│ ITINERARY               │ [Request to join]   │
│                         ├─────────────────────┤
│ WHAT TO BRING           │ WHERE & MEETING     │
│                         │ map                 │
│ COST & POLICY           ├─────────────────────┤
│                         │ HOST & GUIDE        │
│ REVIEWS                 ├─────────────────────┤
│                         │ GOING               │
└─────────────────────────┴─────────────────────┘
```

**Tablet rules**

- The sign-up card in the secondary column is not sticky on portrait, and sticky (top: 16px) on landscape.
- The primary button in the hero appears only when the sign-up card is scrolled out of view.
- Touch targets stay at 44px. Hover states are not required.

### 5.3 Desktop (1024px and up): centered container with sticky side panel

Max content width is 1200px, centred. The hero spans the container with rounded corners. A 8/4 column split follows, with the right panel sticky.

```
┌───────────────────────────────────────────────────────────────┐
│ Home › Hikes › Wadi Shawka Community Hike         ⤴ Share ♡    │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ [photo carousel / map]                                    │ │
│ │ [Hiking] [Moderate]  [Free] [Kids welcome]                │ │
│ │ Wadi Shawka Community Hike                    ┌──┐        │ │
│ │ Wadi Shawka Loop · RAK                        │16│ Mon    │ │
│ │ 8 km · 450 m · 4 h · 7:00–11:00 AM            └──┘        │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ ┌───────────────────┐│
│ │ KEY FACTS  (4 tiles in a row)        │ │ SIGN-UP (sticky)  ││
│ ├──────────────────────────────────────┤ │ Free · 19 left    ││
│ │ ABOUT                                │ │ [Request to join] ││
│ ├──────────────────────────────────────┤ │ [Message host]    ││
│ │ ITINERARY            │ WHAT TO BRING │ │ Add to calendar   ││
│ ├──────────────────────────────────────┤ ├───────────────────┤│
│ │ WHERE & MAP                          │ │ HOST & GUIDE      ││
│ ├──────────────────────────────────────┤ ├───────────────────┤│
│ │ COST & POLICY                        │ │ GOING             ││
│ ├──────────────────────────────────────┤ ├───────────────────┤│
│ │ REVIEWS                              │ │ WEATHER           ││
│ └──────────────────────────────────────┘ └───────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

**Desktop rules**

- The right column is sticky below the header and contains the primary action, so there is no bottom bar.
- Short sections can sit side by side in a two-up grid inside the main column (for example Itinerary and What to bring).
- Section anchors appear as a tab strip under the hero (Overview, Details, Host, Reviews) with scroll-spy highlighting.
- Keyboard focus styles, tab order that follows the visual order, and Esc to close modals are required.

### 5.4 What changes per page type

| Page | Hero image | Right panel (desktop) or action bar (mobile) |
| --- | --- | --- |
| Hike | Cover photo or map snapshot | Join or request, party size (adults and kids), spots left, add to calendar |
| Camping trip | Camp photo | Request spot, price, nights |
| Event | Cover photo | RSVP, message host |
| Rideshare | Route map as hero (pickup to drop-off line), not a photo | Request seat, price per seat, seats left |
| Trail | Photo carousel with a "Map" tab | Arrange trip, Download GPX (Pro) |
| Camp spot | Photo carousel | Arrange trip, price per night |
| Gear shop | Storefront photo or logo banner | Directions, Call, WhatsApp, Website |

## 6. Action states

The primary action changes with state. The same logic applies to the mobile bar and the desktop panel.

| State | Primary button | Secondary |
| --- | --- | --- |
| Not joined, spots left | Request to join (or RSVP) | Message host |
| Request pending | Request sent (disabled style) | Cancel request |
| Joined | You're in (shows meeting pin, chat) | Open group chat, Leave |
| Full | Join waitlist | Message host |
| Cancelled | Cancelled (disabled) | See similar |
| Completed, not reviewed | Write a review | Share photos |
| Host viewing own page | Manage activity | Edit, Check in guests |
| Not signed in | Sign in to join | none |
| Pro-locked guide | Unlock with Pro | Preview |

**Paid activities.** The button stays "Request to join". The cost card says "Pay the host directly" and shows the host's payment method and deadline. The app never takes the money. The host marks a participant as paid, which is stored in `participations.payment`. When in-app payments arrive later, the same button becomes "Pay and join", switched by `price.collectedBy`.

## 7. Modern theme and design tokens

Keep the existing green brand as the base and add a calm, outdoorsy palette.

| Token | Value | Use |
| --- | --- | --- |
| Primary | Forest green, around #0F8F5F | Primary buttons, links, active states |
| Accent by type | Hiking green, camping amber, event violet, rideshare blue, shop orange | Type badge and section icons only |
| Surface | #FFFFFF, with #F6F8F7 page background | Cards on soft background |
| Text | #0F1B16 primary, #5B6B64 secondary | Contrast at least 4.5:1 |
| Radius | 16px cards, 999px chips | Rounded, friendly |
| Elevation | Single soft shadow, 1px hairline border | Cards stay light |
| Type scale | Display 28/32, title 20/24, body 15/22, caption 12/16 | One family (for example Inter or Plus Jakarta Sans) |
| Spacing | 4px base grid, 16px card padding, 12 to 24px gaps | Consistent rhythm |
| Dark mode | Same tokens remapped | Required from day one |

Section distinction comes from three consistent cues: a card surface, a small icon with an uppercase section label, and a 24px gap between cards. Do not use full-width borders and bare headings, which make pages read like a long form.

## 8. States and edge cases

- **Loading:** skeleton hero and three skeleton cards, never a spinner on a blank page.
- **Empty sections:** hide sections that have no data (such as Itinerary) rather than showing blank headings. For Reviews, show a friendly empty state with the reason ("Reviews open after check-in").
- **Offline:** cache the last viewed Joined activity and trail guide for use on the trail.
- **Long text:** clamp titles to 2 lines, descriptions to 4 lines with "Read more".
- **Locked content:** show a blurred preview with a clear unlock reason.
- **RTL (Arabic):** mirror layouts, keep numerals consistent, test hero overlays.
- **Accessibility:** alt text for hero images, WCAG AA contrast, focus order, reduced-motion respect.
- **Time zones:** show Gulf Standard Time and avoid ambiguity in date tiles.

## 9. Component plan

Build once, reuse everywhere.

1. `DetailPageShell` (handles breakpoints, hero slot, main and side columns, action area)
2. `HeroBanner` (variants: photo, map, logo)
3. `ChipRow`, `StatTile`, `StatGrid`
4. `SectionCard` (icon, title, collapse, action)
5. `MapPreview` (with directions, locked pin state)
6. `Timeline` (itinerary), `Checklist` (what to bring)
7. `PersonCard` (host, guide, driver with verification)
8. `AvatarStack` (participants)
9. `PriceBreakdown`, `PolicyList`
10. `WeatherCard`, `SafetyCard`
11. `ReviewSummary`, `ReviewList`, `ReviewForm`
12. `ActionBar` (mobile) and `ActionPanel` (tablet and desktop), driven by one state machine
13. `MarkdownGuide` (renders guide content, handles Pro lock)
14. `ScheduledOutingCard`

## 10. Delivery phases

| Phase | Scope | Outcome |
| --- | --- | --- |
| 1 | Design tokens, shell, hero, section card, action states | Foundation, Hike page working on all three breakpoints |
| 2 | Remaining Activity pages (Camping, Event, Rideshare) | All time-bound pages |
| 3 | Place pages (Trail, Camp spot, Gear shop) with maps, galleries | All permanent pages |
| 4 | Data additions from the gap list (P1 first) | Pages become genuinely useful, not just reformatted |
| 5 | Weather, offline, RTL, accessibility audit, analytics | Release polish |

Backend work for Phase 4 should start in parallel with Phase 1, because several P1 items (capacity, cancellation policy, meeting-point privacy, photos, host credentials) need new fields.

## 11. Decisions and open questions

The team answered the five main questions. The answers are built into sections 4.1, 6, 13.8, 14 and 16.

| Question | Decision | What changed in the plan |
| --- | --- | --- |
| Is payment outside the app? | Guides and tour operators collect activity fees directly. The app charges only for Pro membership. The database is ready for in-app activity payments later. Shops take no payment, only referral marketing. | Cost and policy says who collects the money and that the host handles refunds. New `price.collectedBy`, `participations.payment`, a reserved `payments` collection, shop `referral` settings and `referral_clicks` (13.8). |
| Kids welcome and child-friendly | The creator, guide or admin decides. Each activity has a Kids welcome flag, with an optional minimum age. | One flag on activities (`audience.kidsWelcome`, `audience.minAge`). Places use `kidsFriendly`, set by a curator. No automatic rule. |
| Who can host | Community members, tour operators and professional guides can all create. Operators and pro guides need document verification because they can charge. Community members lead free or shared-cost events. | `hostType`, a verification workflow with private documents, and a publish rule: only verified operators and pro guides can publish paid activities (13.8, 14.4). |
| Facility types | Water stations, fountains, pond, rest area, cafe, parking, toilets, gas station, gear rental, shop. | `FacilityType` with ten values in two page groups, amenities and commercial (4.1, 13.8). |
| Pro paywall | Only the trail guide and the GPX file for now. | Map and elevation profile stay free. Only `place_guides` and the GPX download check for Pro. |

**Still open**

1. Do we need an organiser view of these pages (manage, check-in) in the first release?
2. Which documents exactly are required from operators and pro guides? Confirm with legal and the tourism authority of each emirate.
3. What happens to existing paid trips from operators who are not yet verified? Hide them after a cutoff date, or keep them with a "Verification in progress" badge?
4. Is there a cap on shared cost for community hosts (for example fuel and entry fees only)?
5. How are referral partners shown and measured: a "Partner" label, the commission model, and how a referral is attributed?
6. How is Pro billed on iOS and Android? App store rules may require in-app purchase for memberships.
7. Who writes the refund wording shown with host-set cancellation policies, so it is clear the host, not the app, handles refunds?

## 12. Review of the Gemini plan

Gemini's plan is strong on guide-level safety fields and on a Cursor build order. It is thin on data, page states, trust signals and the non-trail pages (event, shop). I adopted 12 points, changed 4 and rejected 1.

| Gemini point | Verdict | Where it lands in this plan |
| --- | --- | --- |
| Mobile network coverage per carrier (Etisalat, du) | Adopted | `safety.coverage` on Trail and Camp spot. Values: none, patchy, full, unknown. Shown in Safety and as a key-facts tile. |
| Weather widget and hazard banner | Changed | Alert banner under the hero, driven by an `alerts` collection. Weather is a forecast for the activity date, cached, not "real-time". |
| Interactive elevation profile | Adopted | Profile built from the GPX file and stored in the place\_tracks collection. Chart appears on Trail and Hike pages in "Map and elevation". |
| Permit and regulation tags, 4x4 versus AWD | Adopted | `safety.permit`, `campfireAllowed`, and `access.vehicle` (any, awd, 4x4\_low\_range). |
| Exact GPS and plus codes with copy button | Adopted | Coordinates plus plus code on places. A meeting point's exact pin stays locked until the user joins. |
| Fitness requirement beyond difficulty | Adopted | `audience.fitness` plus a one-line `audience.fitnessNote`, shown as a key-facts tile. |
| Icon gear checklist, mandatory versus recommended | Adopted | `gear` array on the activity. It also fixes the duplicated Instructions and Activity details lists. |
| Cancellation and refund policy | Adopted | Policy presets (flexible, moderate, strict) in the Cost and policy section. |
| Vertical timeline for the itinerary | Adopted | `itinerary` array rendered as a timeline. |
| Emergency contact for lost participants | Adopted | Emergency contact fields on the activity, UAE emergency numbers on places. |
| Rideshare luggage space and round trip with wait time | Adopted | `luggage`, `direction`, `returnAt`, `returnWaitMin`. |
| Party size selector in the desktop action card | Adopted | Adults and kids counts, stored on the join record. On mobile it opens as a sheet from the primary button. |
| Sticky action card and fixed mobile bar | Adopted | Already in sections 5 and 6. |
| Alternating white and off-white section bands | Changed | Cards on a soft page background instead. Bands break when sections hide on empty data and look like a landing page. |
| Accordions for About and Itinerary on mobile | Changed | Collapse only long sections (itinerary, reviews, guide). About uses "Read more". |
| Breakpoint at 768px and `md:hidden` bar | Changed | Tablet now starts at 768px, so Tailwind's `md` and `lg` match the plan. |
| Looping video hero | Rejected for v1 | Costs data, battery and load time on trails with weak signal. Use the photo carousel, revisit later. |

**What Gemini does not cover, and this plan keeps:** the gear shop and event pages, host verification and credentials, participant lists, page states (full, cancelled, completed), empty and locked states, RTL and accessibility, and the data inconsistencies in section 2.3.

**New components from Gemini's ideas** (added to the list in section 9): `AlertBanner`, `ElevationChart`, `CoverageBadge`, `GearChecklist`, `PartySizeSelect`, `FitnessTile`.

**Build order for Cursor** (replaces Gemini's three phases):

1. Tokens, `DetailPageShell`, `HeroBanner`, `SectionCard`, `StatTile`.
2. The data contract: TypeScript types and mock fixtures built from the seed records in section 14, so every page renders real-looking data from day one.
3. Shared sections, one prompt each: Where, Itinerary, Gear, Host, Cost and policy, Safety, Reviews.
4. Action state machine, then `ActionBar` and `ActionPanel`.
5. Page assemblies in this order: Hike, Camping, Event, Rideshare, Trail, Camp spot, Gear shop.
6. Map and elevation chart last, since they need the GPX data.

## 13. Database model for MongoDB

The data is modelled around what each page reads, so one detail page costs one small query. This replaces the earlier relational draft. Field names are camelCase. The code is TypeScript types, which you can paste into Cursor and adapt to Mongoose or the native driver.

### 13.1 Design rules

1. **Embed what is bounded and always shown with the parent.** Gear (max 30), itinerary (max 20), gallery (max 8 to 12), going preview (max 8), nearby facilities (max 10).
2. **Reference what is unbounded or changes often.** Participations, reviews, alerts.
3. **Copy small snapshots instead of joining.** A list card needs the place name, host name and rating, so store them on the activity (subset pattern). No `$lookup` or `populate` on hot paths.
4. **Keep counters on the parent.** `counts.going` and `rating.count` are updated with `$inc`, never computed by counting on read.
5. **Move heavy and private data into their own collections.** GPX tracks, elevation profiles, guide markdown, exact meeting pins and plate numbers are never in the main document.
6. **Cap document size.** Target 12 KB per activity and 10 KB per place. Reject writes above 64 KB in the app. The 16 MB MongoDB limit is not our budget.
7. **One collection per family with a `type` or `kind` field** (polymorphic pattern), so one set of indexes serves all page types.
8. **Version every document** with `schemaVersion`, so old and new shapes can coexist during migration.

### 13.2 Collections

| Collection | Holds | Size and growth |
| --- | --- | --- |
| `activities` | Hikes, camping trips, events, rideshares | Main browse collection |
| `activity_private` | Exact meeting pin, notes, emergency contact, plate number. `_id` equals the activity id. | One small doc per activity, returned only to joined users |
| `places` | Trails, camp spots, facilities | Small, read-heavy |
| `place_tracks` | Simplified route line and elevation profile. `_id` equals the place id. | Loaded only when the map section is visible |
| `place_guides` | Guide markdown, Pro-gated. `_id` equals the place id. | Loaded only on request |
| `organizers` | Operators and individual hosts, with verification and credentials | Small |
| `participations` | Who joined which activity | Unbounded, indexed |
| `reviews` | Reviews for any target | Unbounded, paged |
| `alerts` | Hazard alerts with start and end | Small, short-lived |
| `weather_cache` | Forecast per grid cell and date, with TTL | Self-cleaning |
| `catalogs` | Gear, amenity, hazard lists and cancellation policy presets | Tiny, held in server memory |

### 13.3 Shared types

```ts
import { ObjectId } from 'mongodb';

export type GeoPoint = { type: 'Point'; coordinates: [lng: number, lat: number] };

// Images live on a CDN. Store only the key and size; build srcset URLs on the client.
export type ImageRef = {
  key: string;      // e.g. 'places/wadi-shawka/cover.jpg'
  w: number; h: number;   // required, prevents layout shift
  blur: string;     // blurhash, under 40 chars
  alt: string;
};

// Update sum, count and hist with $inc, then refresh avg in a second pipeline update (section 16.4). avg is stored so lists can sort by rating.
export type Rating = { sum: number; count: number; avg: number; hist: Record<'1' | '2' | '3' | '4' | '5', number> };

export type Coverage = 'none' | 'patchy' | 'full' | 'unknown';
export type Confidence = 'migrated' | 'inferred' | 'host_confirmed' | 'curator_verified';
```

### 13.4 Activities

```ts
export type ActivityType = 'hike' | 'camping' | 'event' | 'rideshare';

export interface ActivityDoc {
  _id: ObjectId;
  schemaVersion: 2;
  type: ActivityType;
  slug: string;                       // unique
  status: 'draft' | 'published' | 'full' | 'cancelled' | 'completed' | 'rescheduled';
  cancelledReason?: string;

  title: string;
  summary: string;                    // max 160 chars, used on cards
  description: string;                // required before publish

  startAt: Date;                      // UTC
  endAt?: Date;
  durationMin?: number;
  tz: 'Asia/Dubai';
  activeUntil: Date;                  // endAt, or startAt + durationMin, or startAt + 12 h. Drives the active counts
  geoRef: GeoRef;                     // section 18. For rideshare, the union of the pickup and dropoff chains

  cover: ImageRef;
  gallery: ImageRef[];                // max 8

  // Snapshot of the place, refreshed by a background job when the place changes
  place?: { id: ObjectId; kind: 'trail' | 'camp_spot' | 'facility'; name: string; slug: string; region: string };

  // Public and coarse. Round coordinates to 2 decimals (about 1 km). The exact pin is in activity_private.
  area: { label: string; geo: GeoPoint };

  host: { id: ObjectId; name: string; avatarKey?: string; hostType: HostType; verified: boolean; ratingSum: number; ratingCount: number };
  guides: { id: ObjectId; name: string; avatarKey?: string }[];   // max 5

  capacity?: number;
  minParticipants?: number;
  waitlist: boolean;
  counts: { going: number; waitlisted: number; pending: number };
  goingPreview: { userId: ObjectId; name: string; avatarKey?: string }[];   // max 8

  price: {
    mode: 'free' | 'shared_cost' | 'paid';   // paid needs a verified operator or pro guide
    amount: number; currency: 'AED';
    unit: 'person' | 'vehicle' | 'group' | 'seat';
    deposit?: number; deadline?: Date;
    collectedBy: 'host' | 'platform';   // v1 is always 'host'. 'platform' is reserved for in-app payments later
    paymentMethod: 'arranged_with_host' | 'cash' | 'bank_transfer' | 'other';
    includes: string[]; excludes: string[];     // max 12 each
  };
  policyKey: 'flexible' | 'moderate' | 'strict' | 'custom';
  customPolicy?: string;

  audience: {
    kidsWelcome: boolean; minAge?: number; petsAllowed: boolean; womenOnly: boolean;
    fitness: 'easy' | 'moderate' | 'challenging' | 'expert' | 'unknown';
    fitnessNote?: string;             // for example 'Able to walk 8 km'
    languages: string[];
    accessibility?: string;
  };

  // Copied from the trail at publish time so cards never need the place document
  stats?: { distanceKm?: number; gainM?: number; difficulty?: 'easy' | 'moderate' | 'hard' };

  gear: { key: string; label?: string; spec?: string; level: 'mandatory' | 'recommended' | 'provided' }[];   // max 30
  itinerary: { at?: string; offsetMin?: number; step: 'meet' | 'start' | 'break' | 'summit' | 'camp' | 'end'; title: string; note?: string }[];   // max 20
  rainPlan?: string;
  waiverRequired: boolean;

  details: HikeDetails | CampingDetails | EventDetails | RideshareDetails;   // discriminated by type

  confidence?: Record<string, Confidence>;   // per field, used by the migration
  needsReview: string[];                     // field names a curator must confirm
  createdAt: Date; updatedAt: Date;
}

export type HikeDetails = { type: 'hike'; pace: 'relaxed' | 'steady' | 'fast' };

export type CampingDetails = {
  type: 'camping'; nights: number; checkIn?: string; checkOut?: string;
  shelter: 'bring_own' | 'tent_provided' | 'pitch_only';
  meals: 'none' | 'bring_own' | 'provided';
  campfireAllowed: boolean;
  vehicle: 'any' | 'awd' | '4x4_low_range' | 'unknown';
};

export type EventDetails = {
  type: 'event'; format: 'meetup' | 'workshop' | 'talk' | 'clean_up' | 'social'; foodAvailable: boolean;
};

export type RideshareDetails = {
  type: 'rideshare';
  direction: 'one_way' | 'round_trip'; returnAt?: string; returnWaitMin?: number;
  seatsTotal: number; pricePerSeat: number;
  luggage: 'none' | 'daypack' | 'large_gear'; luggageNote?: string;
  vehicle: { make: string; model: string; year: number; color: string };   // plate is in activity_private
  smokingAllowed: boolean;
  routeKm?: number; routeMin?: number;
  pickup: { label: string; geo: GeoPoint }; dropoff: { label: string; geo: GeoPoint };
  linkedActivityId?: ObjectId;
};

// activity_private: _id equals the activity id. Returned only when a participation is approved or joined.
export interface ActivityPrivateDoc {
  _id: ObjectId;
  exactGeo: GeoPoint; meetingNotes?: string;
  emergencyContact: { name: string; phone: string };
  plateNumber?: string; chatId?: string;
}
```

Spots left is `capacity - counts.going`, computed in the API response, not stored.

### 13.5 Places

```ts
export interface PlaceDoc {
  _id: ObjectId;
  schemaVersion: 2;
  kind: 'trail' | 'camp_spot' | 'facility';
  slug: string;                               // unique
  status: 'open' | 'closed' | 'seasonal';
  name: string;
  // the old region field is replaced by geoRef below  // for example RAK, Wadi Shawka
  location: GeoPoint;                         // 2dsphere indexed
  plusCode?: string;
  geoRef: GeoRef;                             // country, state, area and venue chain, section 18
  visibility: 'public' | 'pending' | 'hidden';   // user-submitted pins start as 'pending' and are not counted
  attachedTo?: { kind: 'place' | 'activity'; id: ObjectId; km?: number }[];   // facilities only, max 5

  summary: string; description: string;
  cover: ImageRef; gallery: ImageRef[];       // max 12
  rating: Rating;
  kidsFriendly: boolean;
  seasons: ('winter' | 'summer' | 'year_round' | 'spring' | 'autumn')[];

  access: { vehicle: 'any' | 'awd' | '4x4_low_range' | 'unknown'; note?: string; parking?: string };

  safety: {
    coverage: { etisalat: Coverage; du: Coverage };
    hazards: string[];                        // keys from catalogs
    permit: { required: boolean | null; info?: string; feeAed?: number };   // null means unknown
    emergency?: { hospital?: string; hospitalKm?: number; notes?: string };
    lastVerifiedAt?: Date; verifiedBy?: ObjectId;
  };
  activeAlerts: { id: ObjectId; type: string; severity: 'info' | 'warning' | 'danger'; title: string; endsAt: Date }[];   // max 3, kept in sync by a job

  amenities: string[];                        // keys from catalogs
  nearby: { placeId?: ObjectId; kind: FacilityType | 'other'; name: string; distanceKm?: number; note?: string }[];   // max 10

  upcoming: { count: number; next?: { id: ObjectId; title: string; startAt: Date } };   // denormalised

  trail?: {
    trailType: 'loop' | 'out_and_back' | 'point_to_point';
    difficulty: 'easy' | 'moderate' | 'hard';
    lengthKm: number; gainM: number; maxElevM?: number; durationMin: number;
    surface: string[]; dogsAllowed: boolean | null;
    // water points are facilities attached to the trail with a km marker (section 18)   // max 10
    bestTime?: string;
    startGeo?: GeoPoint; endGeo?: GeoPoint;
    hasTrack: boolean;                        // tells the client whether to fetch place_tracks
  };
  camp?: {
    pricePerNightAed?: number; bookingMode: 'self_guided' | 'booking_required' | 'operator';
    capacityTents?: number; capacityPeople?: number;
    campfireAllowed: boolean | null; noiseHours?: string; rules: string[];
    checkIn?: string; checkOut?: string;
    nearestFuel?: { name: string; km: number };
  };
  facility?: {
    facilityType: FacilityType;   // ten values, see 13.8
    address?: string;
    hours?: Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', [open: string, close: string][]>>;
    phone?: string; whatsapp?: string; email?: string; website?: string;
    categories: string[]; brands: string[];
    rental: boolean; delivery: boolean; memberDiscount?: string;
    referral?: { enabled: boolean; url: string; code?: string; offerText?: string; partnerId?: string; startsAt?: Date; endsAt?: Date };   // referral marketing only, no in-app payment
    amenityState?: { working: 'working' | 'not_working' | 'unknown'; seasonal: boolean; free: boolean; checkedAt?: Date };   // for water, toilets, rest areas, parking, pond
  };

  confidence?: Record<string, Confidence>;
  needsReview: string[];
  createdAt: Date; updatedAt: Date;
}

// Heavy, loaded when the map or elevation section scrolls into view
export interface PlaceTrackDoc {
  _id: ObjectId;                              // equals the place id
  gpxKey?: string;                            // file on the CDN, downloaded through a signed URL
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number];
  polyline: string;                           // encoded polyline, simplified to 500 points or fewer
  profile: [km: number, elevM: number][];     // simplified to 200 points or fewer
}

// Pro-gated, loaded on request
export interface PlaceGuideDoc { _id: ObjectId; markdown: string; updatedAt: Date }
```

### 13.6 Supporting collections

```ts
export interface OrganizerDoc {
  _id: ObjectId; slug: string; hostType: HostType; name: string; avatarKey?: string;
  verification: VerificationState; licenceNo?: string; licenceExpiresAt?: Date;
  canCharge: boolean;   // true only for a verified tour operator or pro guide
  certifications: string[]; yearsExperience?: number; languages: string[];
  responseTimeMin?: number; tripsLed: number; rating: Rating;
}

export interface ParticipationDoc {
  _id: ObjectId; activityId: ObjectId; userId: ObjectId;
  status: 'requested' | 'approved' | 'waitlisted' | 'joined' | 'checked_in' | 'cancelled';
  adults: number; kids: number; showInList: boolean; createdAt: Date;
  payment: { status: 'not_required' | 'pending' | 'paid' | 'refunded' | 'partial_refund'; amount?: number; paidAt?: Date; ref?: string };   // v1: the host marks it, no money moves in the app
}

export interface ReviewDoc {
  _id: ObjectId; targetType: 'activity' | 'place' | 'organizer'; targetId: ObjectId; userId: ObjectId;
  user: { name: string; avatarKey?: string; isPro: boolean };   // snapshot
  rating: 1 | 2 | 3 | 4 | 5; body: string;
  attended: boolean;                          // true when participation was checked_in
  createdAt: Date;
}

export interface AlertDoc {
  _id: ObjectId; placeId?: ObjectId; activityId?: ObjectId;
  type: 'flash_flood' | 'extreme_heat' | 'closure' | 'road' | 'other';
  severity: 'info' | 'warning' | 'danger'; title: string; body?: string;
  startsAt: Date; endsAt: Date; sourceUrl?: string;
}

export interface WeatherCacheDoc { _id: string; data: unknown; expiresAt: Date }   // _id like '25.20:55.27|2026-11-16'
```

The `catalogs` collection holds gear, amenity and hazard entries (`key`, `labelEn`, `labelAr`, `iconKey`) and the cancellation presets (`key`, `freeCancelHours`, `refundPctAfter`, `hostCancelText`). The server loads it into memory at start and serves it with a long cache header, so documents store only keys.

### 13.7 Fields and the gaps they close

Every P1 gap in section 2 has a home above: description and capacity (`description`, `capacity`, `counts`), times (`startAt`, `endAt`), price clarity (`price`, `policyKey`), fitness (`audience.fitness`), gear and itinerary (`gear`, `itinerary`), host trust (`organizers.verification`), safety (`place.safety`, `alerts`), coverage by carrier (`safety.coverage`), permits and vehicle (`safety.permit`, `access.vehicle`), emergency (`activity_private.emergencyContact`), rideshare luggage and return trip (`RideshareDetails`), and photos (`cover`, `gallery`).

### 13.8 Model changes from the team's decisions

The types referenced in 13.4 to 13.6 (`HostType`, `VerificationState`, `FacilityType`) are defined here, together with the new collections.

**Host types and who can charge**

| Host type | Who | Can charge | Verification | Badge on the page | Allowed `price.mode` |
| --- | --- | --- | --- | --- | --- |
| `community` | Any member | No | Email and phone only | Community host | `free`, `shared_cost` |
| `tour_operator` | A business | Yes, once verified | Documents for the business and a named contact | Verified operator | `free`, `shared_cost`, `paid` |
| `pro_guide` | An individual professional | Yes, once verified | Documents for the person | Verified guide | `free`, `shared_cost`, `paid` |

The **guide on the day** is a person listed in `guides[]` on an activity. It may be the host or an employee of the operator. Terms used across the app: *host* creates the activity, *operator* is a business, *guide* leads on the day.

```ts
export type HostType = 'community' | 'tour_operator' | 'pro_guide';

export type VerificationState = {
  status: 'none' | 'pending' | 'verified' | 'rejected' | 'expired' | 'pending_migration';
  submittedAt?: Date; reviewedAt?: Date; reviewedBy?: ObjectId;
  verifiedUntil?: Date;            // earliest expiry among the accepted documents
  rejectionReason?: string;
};

// Private. Never returned by public endpoints. Admins get short-lived signed URLs.
// Confirm the exact required document list with legal and each emirate's tourism authority.
export interface VerificationDocDoc {
  _id: ObjectId; organizerId: ObjectId;
  docType: 'emirates_id' | 'passport' | 'trade_licence' | 'tourism_permit' | 'insurance' | 'first_aid' | 'guide_certification' | 'other';
  fileKey: string;                 // private bucket, not the public CDN
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt?: Date; reviewedBy?: ObjectId; createdAt: Date;
}
```

- `organizer.canCharge` is true only when `hostType` is not `community` and `verification.status` is `verified`. A nightly job sets `status` to `expired` when `verifiedUntil` passes, which clears `canCharge`.
- The publish check is simple: `price.mode === 'paid'` requires `canCharge`. Everything else stays open to every host.
- Verification UI scope: a host submission flow, an admin review queue (index `verification_queue`), and the badge. Forms come later with the creation forms.

**Payments: ready now, switched on later**

In v1 the host collects money directly. The app only records who is paid, so nothing in the activity document changes when in-app payments arrive.

```ts
// Participation already has payment (13.6). v1: the host marks it paid. No money moves in the app.
// Later: set price.collectedBy to 'platform' and create a PaymentDoc on join.
// This collection is reserved and empty at launch. Amounts are integer fils (1 AED = 100 fils).
export interface PaymentDoc {
  _id: ObjectId; activityId: ObjectId; participationId: ObjectId; userId: ObjectId; payeeOrganizerId: ObjectId;
  amountFils: number; currency: 'AED'; feeFils?: number;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'partially_refunded' | 'failed';
  provider: string; providerRef: string;
  createdAt: Date; updatedAt: Date;
}
```

- The cancellation policy is a host-set preset (`policyKey`). The page says the host handles refunds. The app does not move refund money in v1.
- Pro membership is the only thing the app charges for, so it needs its own fields on the user:

```ts
export type UserMembership = {
  plan: 'free' | 'pro'; proUntil?: Date;
  source?: 'web' | 'app_store' | 'play_store'; providerRef?: string;
};   // embedded as users.membership
```

**Pro gating (decision 5):** only the trail guide (`place_guides`) and the GPX file (`place_tracks.gpxKey`, served by a signed URL) check `membership.plan === 'pro'` and `proUntil`. The map, polyline and elevation profile are free, so the `/track` endpoint needs no Pro check.

**Facility types (decision 4)**

```ts
export type FacilityType =
  | 'water_station' | 'fountain' | 'pond' | 'rest_area' | 'toilet' | 'parking'      // amenities
  | 'cafe' | 'gas_station' | 'gear_rental' | 'shop';                                // commercial

export const AMENITY_TYPES: FacilityType[] = ['water_station', 'fountain', 'pond', 'rest_area', 'toilet', 'parking'];
```

Fields apply by group. Amenities use `amenityState` (working, seasonal, free, checkedAt) and need no hours or contact. Commercial types use `hours`, contact fields, `categories`, `brands`, `rental`, `delivery`, `memberDiscount` and `referral`. All facilities use the same `places` collection and indexes.

**Shop referrals: marketing without payment**

```ts
export interface ReferralClickDoc {
  _id: ObjectId; placeId: ObjectId; partnerId?: string; userId?: ObjectId;
  source: { kind: 'activity' | 'place' | 'search'; id?: ObjectId };
  createdAt: Date;
}
```

- The client sends the click with `navigator.sendBeacon` to `POST /referrals/click`, which writes and returns at once. It never delays the user's navigation to the partner.
- **Shipped (Nov 2026, minimal slice):** `POST /api/referrals/click` accepts `{ entityKind: 'facility', entityId, destinationUrl }`, verifies `destinationUrl` matches `facilities.partnerReferralUrl`, writes `referral_clicks`, returns **204**; facility consumer detail uses `sendBeacon` + `fetch(keepalive)` fallback. TTL + `referral_daily` rollup and shop-scope payloads remain deferred per below.
- Clicks expire after 400 days (TTL index). A nightly job rolls them up into `referral_daily` (`_id` as `placeId|yyyy-mm-dd`, `clicks`) for reports, so reports read a few small documents, not raw clicks.
- The page shows the offer as "Partner", so users know it is marketing.

**Kids rules (decision 2)**

- `audience.kidsWelcome` on an activity is set by the creator, guide or an admin. `audience.minAge` is optional. The app applies no automatic rule.
- `kidsFriendly` on a place is set by a curator. The label is "Kids welcome" on activities and "Child-friendly" on places, because one is a host's choice and the other is a site assessment.

**New collections and fields at a glance**

| Name | Purpose | Notes |
| --- | --- | --- |
| `verification_documents` | Private operator and guide documents | Admin-only, signed URLs |
| `payments` | In-app activity payments | Reserved, empty at launch |
| `referral_clicks` | Shop referral events | TTL 400 days |
| `referral_daily` | Daily click totals per shop | Written by the nightly rollup |
| `users.membership` | Pro plan and expiry | Embedded on the user |
| `organizers.canCharge`, `organizers.verification` | Who may publish paid activities | Indexed for the admin queue |
| `participations.payment` | Host-marked payment state | v1 only records it |

## 14. Seeding and migrating old entries in MongoDB

Old documents are upgraded in place in four steps: add defaults, backfill what current data already tells us, flag what it does not, then let curators fill the rest until the creation and editing forms exist. Safety fields are never guessed. Documents without `schemaVersion: 2` are treated as old.

### 14.1 Rules

- **Additive first.** New fields are optional or have a safe default. Publish-time validation applies only to new records.
- **Never invent safety data.** Coverage is `unknown`, permit is `null`, hazards are empty with a `needsReview` entry. Pages show "Not yet verified", not a guess.
- **Track confidence.** `confidence` records how each backfilled value was obtained. `needsReview` lists what a curator must confirm.
- **Scripts are idempotent.** Each script filters on `schemaVersion: { $ne: 2 }` or on a missing field, so a re-run changes nothing. Print a dry-run report first and back up the collections.
- **Write in batches.** Use `bulkWrite` with 500 to 1000 operations and `ordered: false`. Run off-peak. Do not rewrite every document in one `updateMany` on a live system.
- **Parse old free text once.** The Instructions and Activity details lists become one `gear` array. Itinerary bullets become `itinerary` entries. "Fuel & shop \~10 km toward Kalba" becomes a `nearby` entry with `distanceKm: 10`.
- **Split heavy data out.** Move any embedded GPX, polyline or guide markdown into `place_tracks` and `place_guides`, and set `trail.hasTrack`.

### 14.2 Seed values for the seven records we have

| Record | Seeded from current data | Left for a curator (`needsReview`) |
| --- | --- | --- |
| Al Ain dune camp weekend (camping) | `startAt` 22 Nov 2026 15:00 Gulf time; `price.amount` 180, unit person (inferred); `audience.kidsWelcome` true; `price.paymentMethod` arranged\_with\_host; `place` snapshot of Al Ain Desert Camp; host and guide kept | Description, `endAt`, `details.nights`, `capacity`, shelter, meals, policy, `price.includes` |
| Wadi Shawka Community Hike | `startAt` 16 Nov 2026 07:00; `endAt` 11:00 (from the itinerary); price 0; `capacity` 20; `kidsWelcome` true; 3 `itinerary` entries; 3 `gear` entries (water 1.5 L, trail shoes, sun protection, all mandatory, duplicates removed); `area.label` Wadi Shawka Dam parking; `audience.fitness` moderate (inferred from trail difficulty); `stats` copied from the trail | Exact pin in `activity_private`, emergency contact, rain plan, policy |
| Desert Sunset Meetup | `startAt` 27 Nov 2026 15:00; price 0; `kidsWelcome` true; `details.format` meetup (replaces the text "event"); `place` snapshot of Fossil Rock Desert Camp; host Omar Al Hosani | Description, `endAt`, `capacity` |
| Rideshare Dubai Marina to Jebel Jais | `startAt` 12 Nov 2026 05:00; `seatsTotal` 4; `pricePerSeat` 35; vehicle Toyota Land Cruiser 2019 blue; roof-rack note in `luggageNote`, `luggage` daypack; `smokingAllowed` false; pickup and dropoff labels; `linkedActivityId` Jebel Jais Group Hike | `direction` (set one\_way, flagged), `returnAt`, plate number, `routeKm`, `routeMin`, pickup and dropoff coordinates |
| Wadi Shawka Loop (trail) | `trail.lengthKm` 8; difficulty moderate; `durationMin` 240; `gainM` 450; `trailType` loop; `kidsFriendly` true; seasons winter and year\_round; `access.vehicle` any (inferred); `nearby`: toilet at dam car park, fuel and shop 10 km toward Kalba; guide moved to `place_guides`; GPX parsed into `place_tracks`; rating 5.0 from 1 rating | `safety.coverage`, hazards, permit, `dogsAllowed`, `waterPoints`, coordinates, gallery |
| Al Ain Desert Camp (camp spot) | Sand surface; `bookingMode` self\_guided; `kidsFriendly` true; seasons winter; remote access; `campfireAllowed` false with raised BBQ stands in `rules`; "4x4 advised after rain" in `access.note` | Price, capacity, toilets and water in `amenities`, check-in times, coordinates, coverage, gallery |
| Desert Trail Outfitters (gear shop) | `kind` facility; `facilityType` shop (referral off until a partner agreement exists); region Dubai; categories (trail running shoes, hydration packs, camping essentials) | Hours, address, phone, WhatsApp, coordinates, website, gallery |

Seed these so the front end can be built against real-looking fixtures from day one. Everything in the right column stays `unknown` or empty and appears in the review queue.

**Hosts, operators and price modes.** Seed these so existing paid trips keep working while verification starts.

| Record | Seeded as | Note |
| --- | --- | --- |
| UAE Adventure Co | `hostType` tour\_operator; `verification.status` pending\_migration; `canCharge` false; the 5.0 rating from 1 review is kept | Operator of the Al Ain dune camp (AED 180) and the Wadi Shawka hike |
| Fatima Al Mazrouei | A `guides[]` entry on both activities. No organizer record unless she hosts on her own. | Listed as guide on the day |
| Omar Al Hosani (Desert Explorer) | `hostType` community; verification none; `canCharge` false | Hosts the free meetup and the rideshare, so no change in rights |

Price modes for the seven records: Wadi Shawka hike and Desert Sunset Meetup are `free`. The rideshare (AED 35 per seat) is `shared_cost`. The Al Ain dune camp (AED 180) is `paid`, hosted by an operator in `pending_migration`.

The AED 180 trip stays visible with a "Verification in progress" badge. A cutoff date, which is open question 3 in section 11, decides when unverified paid trips are hidden. The script never sets `canCharge` to true. Only an admin approval does.

### 14.3 Migration steps

1. **Add JSON Schema validation in warn mode.** `validationLevel: 'moderate'` and `validationAction: 'warn'`, so old documents keep working and violations are only logged.
2. **Create the new indexes** from section 16. On MongoDB 4.2 and later index builds no longer block, but still run them off-peak and watch cache and disk.
3. **Load the catalogs.** Gear, amenity and hazard lists (English and Arabic labels, icon keys), cancellation presets, and UAE emergency numbers (999 police, 998 ambulance, 997 fire; confirm before release).
4. **Run the backfill as a dry run.** Review the report, then run it.
5. **Split heavy data** into `place_tracks`, `place_guides` and `activity_private`. Spot-check all seven records.
6. **Build the review queue.** An admin list of documents where `needsReview` is not empty, sorted by missing P1 fields, with CSV import so curators can fill values before the forms ship.
7. **Ship the API with the new fields.** Old clients ignore unknown fields. The UI hides empty sections and shows "Not yet verified" only for safety fields.
8. **Flip validation to `error`** for new writes once the review queue is under control. Old documents stay grandfathered until their next edit.
9. **Remove old fields** after one release in which nothing reads them, using `$unset` in batches.

Backfill pattern (mongosh), one example you can copy for each rule:

```js
// Idempotent. Re-running changes nothing.
const cursor = db.activities.find({ schemaVersion: { $ne: 2 } }, { _id: 1, type: 1, startTime: 1 });
let ops = [];
while (cursor.hasNext()) {
  const d = cursor.next();
  ops.push({
    updateOne: {
      filter: { _id: d._id, schemaVersion: { $ne: 2 } },
      update: {
        $set: {
          schemaVersion: 2,
          tz: 'Asia/Dubai',
          waitlist: false,
          waiverRequired: false,
          'audience.fitness': 'unknown',
          'audience.petsAllowed': false,
          'audience.womenOnly': false,
          'counts.going': 0, 'counts.waitlisted': 0, 'counts.pending': 0,
          gear: [], itinerary: [], gallery: [],
          needsReview: ['description', 'endAt', 'capacity', 'policyKey', 'cover'],
        },
      },
    },
  });
  if (ops.length === 500) { db.activities.bulkWrite(ops, { ordered: false }); ops = []; }
}
if (ops.length) db.activities.bulkWrite(ops, { ordered: false });

// Then recompute counters once from the source of truth
db.participations.aggregate([
  { $match: { status: { $in: ['joined', 'approved', 'checked_in'] } } },
  { $group: { _id: '$activityId', going: { $sum: '$adults' } } },
  { $merge: { into: 'activities', on: '_id', whenMatched: [{ $set: { 'counts.going': '$$new.going' } }], whenNotMatched: 'discard' } },
]);
```

### 14.4 Required before a new record can be published

- **All activities:** description, `startAt` and `endAt`, `capacity`, `price` with unit, `policyKey`, `audience.fitness`, `area`, an emergency contact in `activity_private`, a cover image.
- **Camping adds:** nights, shelter, meals, vehicle.
- **Rideshare adds:** direction, seats, price per seat, luggage, vehicle description.
- **Trail and camp spot:** `location`, `status`, `lastVerifiedAt`, coverage (unknown allowed), hazards (empty allowed), a cover image.
- **Facility:** address, hours, one contact method.

**Paid activities add:** the organizer has `canCharge: true`. Community hosts can publish only `free` or `shared_cost` activities. Rideshare seat contributions are `shared_cost`.

### 14.5 Open questions

1. Do the existing documents already store dates as `Date` in UTC, or as strings? The backfill assumes `Date`.
2. Which driver or ODM is used (Mongoose or the native driver)? Prompts in section 17 assume Mongoose-style models and can be switched.
3. Is the cluster MongoDB Atlas? That enables Atlas Search and the Performance Advisor, which section 16 recommends.
4. Who curates the safety fields for the first launch? Someone needs to own the review queue.
5. Do we already hold coordinates and GPX files for the existing places, or must they be collected?
6. Does any paid trip charge per vehicle or per group instead of per person?

## 15. Performance plan

Speed is the top priority, so every detail page loads in tiers: a small cacheable shell first, then each heavy section only when it is about to be seen. Hikers often have weak signal, so small payloads matter more here than on most apps. The budgets below are proposed targets to confirm with real devices, then enforced in CI.

### 15.1 Budgets

| Area | Target | How it is enforced |
| --- | --- | --- |
| Largest Contentful Paint | 2.5 s or less on a mid-range Android phone over 4G | Lighthouse CI on every pull request |
| Layout shift (CLS) | 0.1 or less | Image `w` and `h`, reserved space for every skeleton |
| Interaction (INP) | 200 ms or less | No long tasks above 50 ms on the detail route |
| Detail shell API | 150 ms p95 server time, 25 KB or less gzipped | Load test and response size check |
| Section APIs (reviews, participants, track) | 200 ms p95 each | Same |
| JavaScript on first load of a detail route | 150 KB or less gzipped | Bundle size limit in CI |
| Hero image | 90 KB or less on mobile (800 px wide), 200 KB or less on desktop (1600 px) | Image CDN transforms to AVIF or WebP |
| List card payload | 1.2 KB or less per card, 20 cards per page | Projection test |
| Document size | Activity 12 KB, place 10 KB, hard limit 64 KB | Validation on write |

### 15.2 Tiered loading

The tiers decide which request carries which data. A heavy object never travels with the shell.

| Tier | When it loads | What it contains | Source |
| --- | --- | --- | --- |
| 0. Shell | Immediately, one request, CDN-cacheable | Title, status, dates, cover, key facts, price, host snapshot, counts, going preview, gear, itinerary, active alerts, `needsReview` flags | `activities` or `places` with a projection |
| 1. Personal state | Right after the shell, tiny request, never cached publicly | Joined or saved state, participation status, whether the user is Pro | `participations` by `(activityId, userId)` |
| 2. Near the viewport | When the section is about 1 screen away (IntersectionObserver) | Reviews (10, cursor paged), full participant list (20), weather for the date | `reviews`, `participations`, `weather_cache` |
| 3. On interaction or visibility | Map scrolled into view, or a tap | Map library, `place_tracks` (polyline and profile), guide markdown (Pro), GPX through a signed URL, gallery images 2 and up | `place_tracks`, `place_guides`, CDN |
| 4. After joining | Once the participation is approved | Exact pin, meeting notes, emergency contact, plate number, group chat | `activity_private` |

Why this works: tier 0 is the only thing the user waits for, tier 1 keeps tier 0 cacheable for everyone, and tier 4 is redacted on the server, so private data cannot leak from a cached page.

### 15.3 Heavy objects and how each is kept light

| Heavy object | Rule |
| --- | --- |
| Photos | Store the CDN key, `w`, `h` and a blurhash. Serve `srcset` with 400, 800, 1200 and 1600 px in AVIF with a WebP fallback. Only the hero loads eagerly with high fetch priority. Gallery images use `loading="lazy"`. Show the blurhash while loading. |
| Maps | Show a static map image first (a single small image with the pin). Load the interactive map library only on tap or when the section is 1 screen away. Never put the map library in the initial bundle. |
| Elevation chart | Draw it as a plain SVG path from `profile` (200 points or fewer). Do not add a chart library for this one chart. Fetch `place_tracks` only when the section is near the viewport. |
| GPX file | Never inline. Simplify the route to 500 points with Douglas-Peucker when ingesting. The full file is a signed CDN download, behind the Pro check. |
| Guide markdown | Separate collection, fetched on request, rendered with a small markdown renderer loaded on demand. |
| Participants | The shell carries `counts` and 8 preview avatars. The full list is paged and loaded on tap. |
| Reviews | Cursor pagination, 10 per page. The shell carries `rating` only. |
| Weather | A forecast for the activity date only, cached by grid cell and date for 60 minutes in `weather_cache` with a TTL. Never call the weather provider from the client. |
| Icons and fonts | Import icons one by one so they tree-shake. One font family, subset, `font-display: swap`, preload the primary weight. |
| Lists | 20 per page with cursor pagination and a projection that returns only the card fields. Virtualise long lists. |

### 15.4 Server and API

- **Always use a projection.** No `SELECT *` equivalent, and no `populate` or `$lookup` on hot paths. If a page needs a joined field, denormalise it.
- **Two endpoints per page type, not one big one:** `GET /activities/:slug` (shell) and small section endpoints (`/reviews`, `/participants`, `/weather`, `/me/state`).
- **Cache the shell.** `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` plus an `ETag`. User-specific data is never in the shell, so the same cached copy serves everyone. Place pages change rarely and can use `s-maxage=300`.
- **Compression.** Brotli for JSON and text on the CDN or server.
- **Use cursor pagination** on `(startAt, _id)`, never `skip`. Offsets get slower as pages grow.
- **Connection pool.** One shared `MongoClient` per process, `maxPoolSize` sized to the instance, never created per request. Read list endpoints from secondaries (`secondaryPreferred`), and read joins and the user's own state from the primary.
- **Catalogs in memory.** Gear, amenity, hazard and policy lists are loaded at start and refreshed on change. Zero queries per request.
- **Atomic counters.** Join, leave and review use `$inc` guarded by a filter (section 16), so counts never need a re-count.
- **Fan-out in the background.** When a place or host is renamed, a job updates the snapshots on activities in batches. This is rare, so it never touches the read path.
- **Rate limit** join, review and search endpoints.

### 15.5 Front end

- **Skeletons that match final size** for the hero, key facts and every lazy section, so nothing jumps.
- **Load sections lazily.** Use dynamic imports for map, elevation, review form and markdown renderer. Use `content-visibility: auto` with `contain-intrinsic-size` on below-the-fold sections.
- **Data cache.** A query cache such as React Query or SWR, with a 60 s stale time for activity shells, 5 min for places, and request de-duplication.
- **Prefetch on intent.** Prefetch the shell when a card enters the viewport on fast connections, or on pointer hover or touch start. Respect `navigator.connection.saveData`.
- **Optimistic actions.** Join, save and rate update the UI at once and roll back on failure.
- **Debounce search** at 250 ms and cancel the previous request.
- **No large objects in global state or context.** Keep the shell in the query cache and pass only ids.
- **Offline for joined trips.** Cache the shell, itinerary, gear list, polyline and guide of activities the user has joined (under 2 MB) in the service worker, so they open on the trail without signal.
- **Third-party scripts** (analytics, maps) load after the main content and never block rendering.

### 15.6 Monitoring

- **Real user monitoring** of LCP, CLS and INP for the detail routes, split by device class and network.
- **MongoDB profiler** with `slowms` at 100, and Atlas Performance Advisor if on Atlas. Review weekly.
- **Explain checks in CI.** Tests assert that each key query uses an `IXSCAN`, and that `totalDocsExamined` is close to `nReturned` (section 16).
- **Budgets fail the build.** Bundle size, Lighthouse scores and response sizes are checked on every pull request.
- **Index hygiene.** Check `$indexStats` monthly and drop indexes that are never used, because every index slows writes.

## 16. MongoDB indexes, queries and write patterns

Each index below exists for one named query. Compound indexes follow the ESR rule: Equality fields first, then the Sort field, then Range fields. Every index slows writes and uses memory, so nothing is added without a query that needs it.

### 16.1 Which query uses which index

| Page or feature | Query shape | Index |
| --- | --- | --- |
| Activity detail by link | `slug` equals | `activities.slug_unique` |
| Browse upcoming activities by type | `status` in published or full, `type`, `startAt` from now, sort `startAt, _id` | `activities.browse_upcoming` |
| Activities near me | `status`, `area.geo` within radius, `startAt` range | `activities.near_upcoming` |
| Scheduled outings on a trail or camp page | `place.id`, `status`, `startAt` from now | `activities.by_place_upcoming` |
| Host profile, their trips | `host.id`, sort `startAt` descending | `activities.by_host` |
| Rides linked to a hike | `details.linkedActivityId`, sort `startAt` | `activities.rides_for_activity` (partial, rideshare only) |
| Curator review queue | `needsReview` not empty, sort `updatedAt` | `activities.needs_review` (partial) |
| Place detail by link | `slug` equals | `places.slug_unique` |
| Browse trails and camps | `kind`, `status`, `geoRef.stateId`, sort `rating.avg` descending | `places.browse` |
| Places near me | `kind`, `location` within radius | `places.near` |
| Trail filters | `trail.difficulty`, `trail.lengthKm` range | `places.trail_filter` (partial, trails only) |
| Shop directory | `facility.facilityType`, `geoRef.stateId` | `places.facility_filter` (partial, facilities only) |
| Is this user joined, and my trips | `activityId, userId` and `userId, status` | `participations.*` |
| Participant list, paged | `activityId`, `status`, sort `createdAt` | `participations.by_activity` |
| Reviews, paged | `targetType, targetId`, sort `createdAt` descending | `reviews.by_target` |
| One review per user | `targetType, targetId, userId` | `reviews.one_per_user` (unique) |
| Active alerts for a place | `placeId`, `endsAt` after now | `alerts.by_place` |
| Weather cache expiry | automatic | `weather_cache.ttl` |
| Search by name | text on title, summary, place name | Atlas Search, or a text index as the fallback |

### 16.2 Index script (mongosh)

Run it once off-peak. Names are explicit so they are easy to find in `$indexStats`.

```js
// ---------- activities ----------
const A = db.activities;
A.createIndex({ slug: 1 }, { name: 'slug_unique', unique: true });
A.createIndex({ status: 1, type: 1, startAt: 1, _id: 1 }, { name: 'browse_upcoming' });
A.createIndex({ status: 1, 'area.geo': '2dsphere', startAt: 1 }, { name: 'near_upcoming' });
A.createIndex({ 'place.id': 1, status: 1, startAt: 1 }, { name: 'by_place_upcoming' });
A.createIndex({ 'host.id': 1, startAt: -1 }, { name: 'by_host' });
A.createIndex(
  { 'details.linkedActivityId': 1, startAt: 1 },
  { name: 'rides_for_activity', partialFilterExpression: { type: 'rideshare' } }
);
A.createIndex(
  { updatedAt: 1 },
  { name: 'needs_review', partialFilterExpression: { 'needsReview.0': { $exists: true } } }
);

// ---------- places ----------
const P = db.places;
P.createIndex({ slug: 1 }, { name: 'slug_unique', unique: true });
P.createIndex({ kind: 1, status: 1, 'geoRef.stateId': 1, 'rating.avg': -1 }, { name: 'browse' });
P.createIndex({ kind: 1, location: '2dsphere' }, { name: 'near' });
P.createIndex(
  { 'trail.difficulty': 1, 'trail.lengthKm': 1 },
  { name: 'trail_filter', partialFilterExpression: { kind: 'trail' } }
);
P.createIndex(
  { 'facility.facilityType': 1, 'geoRef.stateId': 1 },
  { name: 'facility_filter', partialFilterExpression: { kind: 'facility' } }
);
P.createIndex(
  { updatedAt: 1 },
  { name: 'needs_review', partialFilterExpression: { 'needsReview.0': { $exists: true } } }
);

// ---------- participations ----------
const PT = db.participations;
PT.createIndex({ activityId: 1, userId: 1 }, { name: 'one_per_user', unique: true });
PT.createIndex({ userId: 1, status: 1, createdAt: -1 }, { name: 'by_user' });
PT.createIndex({ activityId: 1, status: 1, createdAt: 1 }, { name: 'by_activity' });

// ---------- reviews ----------
const R = db.reviews;
R.createIndex({ targetType: 1, targetId: 1, createdAt: -1 }, { name: 'by_target' });
R.createIndex({ targetType: 1, targetId: 1, userId: 1 }, { name: 'one_per_user', unique: true });
R.createIndex({ userId: 1, createdAt: -1 }, { name: 'by_user' });

// ---------- alerts, weather, organizers ----------
db.alerts.createIndex(
  { placeId: 1, endsAt: 1 },
  { name: 'by_place', partialFilterExpression: { placeId: { $exists: true } } }
);
db.alerts.createIndex(
  { activityId: 1, endsAt: 1 },
  { name: 'by_activity', partialFilterExpression: { activityId: { $exists: true } } }
);
db.weather_cache.createIndex({ expiresAt: 1 }, { name: 'ttl', expireAfterSeconds: 0 });
db.organizers.createIndex({ slug: 1 }, { name: 'slug_unique', unique: true });
db.organizers.createIndex({ 'verification.status': 1, 'verification.submittedAt': 1 }, { name: 'verification_queue' });   // admin review queue
db.verification_documents.createIndex({ organizerId: 1, createdAt: -1 }, { name: 'by_organizer' });
db.referral_clicks.createIndex({ placeId: 1, createdAt: -1 }, { name: 'by_place' });
db.referral_clicks.createIndex({ createdAt: 1 }, { name: 'ttl_400d', expireAfterSeconds: 34560000 });   // roll up to daily counts before expiry
db.payments.createIndex({ activityId: 1, createdAt: -1 }, { name: 'by_activity' });   // reserved, empty at launch
db.payments.createIndex({ userId: 1, createdAt: -1 }, { name: 'by_user' });
db.users.createIndex({ 'membership.proUntil': 1 }, { name: 'pro_expiry', partialFilterExpression: { 'membership.plan': 'pro' } });
// Facilities near a trail use places.near (kind + location), no extra index needed.

// ---------- text search fallback (only if not using Atlas Search) ----------
A.createIndex({ title: 'text', summary: 'text', 'place.name': 'text' }, { name: 'text', weights: { title: 5, 'place.name': 3, summary: 1 } });
P.createIndex({ name: 'text', summary: 'text' }, { name: 'text', weights: { name: 5, summary: 1 } });
```

Notes:

- Prefer Atlas Search with an autocomplete mapping on `title`, `name` and `place.name` if the cluster is Atlas. It supports typos and prefixes, and a text index does not.
- Only one text index is allowed per collection.
- Add more filter indexes (difficulty, season, price) only after real filters appear in the slow-query log.
- Round the public `area.geo` to 2 decimals so one index entry serves a neighbourhood and the exact pin stays private.

### 16.3 Query patterns

```js
// Card projection. Cards never receive description, gear, itinerary or gallery.
const CARD = {
  slug: 1, type: 1, title: 1, status: 1, startAt: 1, endAt: 1, cover: 1,
  'place.name': 1, 'place.region': 1, 'area.label': 1,
  price: 1, 'audience.kidsWelcome': 1, 'audience.fitness': 1, stats: 1,
  capacity: 1, 'counts.going': 1, 'host.name': 1, 'host.verified': 1,
};

// Cursor pagination, no skip. The last row's startAt and _id come back as the next cursor.
function upcomingPage(type, now, cursor) {
  const q = { status: { $in: ['published', 'full'] }, type, startAt: { $gte: now } };
  if (cursor) {
    q.$or = [
      { startAt: { $gt: cursor.startAt } },
      { startAt: cursor.startAt, _id: { $gt: cursor._id } },
    ];
  }
  return db.activities.find(q, { projection: CARD }).sort({ startAt: 1, _id: 1 }).limit(21);   // 21 to detect a next page
}

// Near me within 30 km, upcoming only
db.activities.find({
  status: 'published',
  startAt: { $gte: new Date() },
  'area.geo': { $geoWithin: { $centerSphere: [[55.27, 25.2], 30 / 6378.1] } },
}, { projection: CARD }).limit(20);
```

### 16.4 Write patterns

These keep counters correct under concurrent joins without a transaction.

```js
// Join: reserve spots atomically, mark the activity full when capacity is reached.
const n = adults + kids;
const res = await activities.updateOne(
  {
    _id, status: 'published',
    $or: [
      { capacity: { $exists: false } },
      { $expr: { $lte: [{ $add: ['$counts.going', n] }, '$capacity'] } },
    ],
  },
  [
    { $set: { 'counts.going': { $add: ['$counts.going', n] } } },
    { $set: { status: { $cond: [{ $and: [{ $gt: ['$capacity', 0] }, { $gte: ['$counts.going', '$capacity'] }] }, 'full', '$status'] } } },
  ]
);
if (res.modifiedCount === 0) { /* full: offer the waitlist */ }

try {
  await participations.insertOne({ activityId: _id, userId, status: 'joined', adults, kids, showInList: true, createdAt: new Date() });
} catch (e) {
  if (e.code === 11000) {                         // already joined: release the spots we reserved
    await activities.updateOne({ _id }, { $inc: { 'counts.going': -n } });
  } else throw e;
}

// Keep the 8-avatar preview without growing the document
await activities.updateOne(
  { _id, 'goingPreview.7': { $exists: false } },
  { $push: { goingPreview: { userId, name, avatarKey } } }
);

// Review: the unique index blocks a second review. Then update the aggregate.
await reviews.insertOne(review);
await places.updateOne({ _id: placeId }, {
  $inc: { 'rating.sum': stars, 'rating.count': 1, [`rating.hist.${stars}`]: 1 },
});
await places.updateOne({ _id: placeId }, [
  { $set: { 'rating.avg': { $round: [{ $divide: ['$rating.sum', '$rating.count'] }, 1] } } },
]);
```

### 16.5 Validation (warn first)

```js
db.runCommand({
  collMod: 'activities',
  validationLevel: 'moderate',          // checks only inserts and updates of valid docs
  validationAction: 'warn',             // switch to 'error' after the backfill
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['type', 'slug', 'status', 'title', 'startAt', 'schemaVersion'],
    properties: {
      type: { enum: ['hike', 'camping', 'event', 'rideshare'] },
      status: { enum: ['draft', 'published', 'full', 'cancelled', 'completed', 'rescheduled'] },
      gear: { bsonType: 'array', maxItems: 30 },
      itinerary: { bsonType: 'array', maxItems: 20 },
      gallery: { bsonType: 'array', maxItems: 8 },
      goingPreview: { bsonType: 'array', maxItems: 8 },
    },
  } },
});
```

### 16.6 Test that indexes are really used

```ts
// Run in CI against a seeded test database.
async function expectIndexed(col, filter, sort, limit = 20) {
  const plan = await col.find(filter).sort(sort).limit(limit).explain('executionStats');
  const s = plan.executionStats;
  expect(JSON.stringify(plan.queryPlanner.winningPlan)).toContain('IXSCAN');
  expect(JSON.stringify(plan.queryPlanner.winningPlan)).not.toContain('COLLSCAN');
  expect(s.totalDocsExamined).toBeLessThanOrEqual(s.nReturned * 3 + 5);   // reads about what it returns
}
```

Add one `expectIndexed` test per row in 16.1, so a future change that breaks an index fails the build.

## 17. Cursor rules and copy-paste prompts

Paste the rules file into `.cursor/rules/performance.mdc` so every prompt inherits the performance constraints. Then run the prompts in order, one per Cursor chat. Each assumes this whole plan is attached as context. They assume a TypeScript API on Node with MongoDB and a React front end. If you use Next.js, Flutter or the native driver instead of Mongoose, say so in the first line of the prompt.

### 17.1 Rules file

```markdown
---
description: Performance and data rules for the hiking community app
alwaysApply: true
---

# Performance rules (top priority)
- Detail pages load in tiers: a small cacheable shell first, then lazy sections. Never put heavy data in the shell.
- Heavy objects (GPX, polyline, elevation profile, guide markdown, full participant list, full review list, gallery beyond the cover) are separate requests, fetched only when their section nears the viewport.
- The map library and markdown renderer are dynamic imports and never part of the initial bundle. Draw the elevation chart as inline SVG, no chart library.
- Every image has width, height, alt text and a blurhash. Only the hero loads eagerly. Everything else is lazy.
- Reserve space with skeletons that match final size, so layout shift stays under 0.1.
- Budgets: first-load JS under 150 KB gzipped per detail route, shell API response under 25 KB gzipped, LCP under 2.5 s on mid-range Android over 4G.

# MongoDB rules
- Always use a projection. Never use populate or $lookup on a request path. Denormalise a small snapshot instead.
- No unbounded arrays inside a document. Respect the caps: gear 30, itinerary 20, gallery 8 (places 12), goingPreview 8, nearby 10.
- Use cursor pagination on (startAt, _id). Never use skip.
- Counters change only with atomic $inc or a pipeline update. Never read, add, then write.
- Private data (exact pin, plate number, emergency contact) lives in activity_private and is returned only to approved participants.
- Only a verified tour operator or pro guide (organizer.canCharge) may publish an activity with price.mode 'paid'. Community hosts publish 'free' or 'shared_cost' only.
- Only the trail guide and the GPX file are Pro-gated. Map, polyline and elevation profile are free.
- Every new query needs a matching index from the plan and an expectIndexed test. No COLLSCAN on any request path.
- Use one shared MongoClient per process. Never create a client per request.
- Counts for any level (country, state, area, venue, point) are read from geo_stats by _id. Never count by scanning on a request path. Ad hoc filters use an index-backed countDocuments, cached for 15 s.
- Every pin carries geoRef. Any write that changes a counted field emits geo_outbox deltas in the same transaction. Counters are changed only by the outbox worker.

# Code rules
- TypeScript strict. Field names camelCase. Types come from the plan, sections 13.3 to 13.6.
- Empty sections are hidden, not shown blank. Safety fields with unknown values show "Not yet verified".
- Every list card uses the card projection and shows at most the card fields.
```

### 17.2 Prompts, in order

**Prompt 1: types and models**

```text
Using sections 13.3 to 13.6 of the attached plan, create TypeScript types and Mongoose schemas (or native driver
collection helpers if we don't use Mongoose) for: activities, activity_private, places, place_tracks, place_guides,
organizers, participations, reviews, alerts, weather_cache, catalogs, verification_documents,
referral_clicks, payments (reserved, empty at launch) and the membership fields on users, plus the HostType,
VerificationState and FacilityType types from 13.8.
Rules: camelCase, schemaVersion 2, enforce the array caps from the plan, use the discriminated union for
activity details by type, and use ObjectId for ids. Add Zod (or equivalent) request validators for create and update.
Do not write any API yet. Output only the models, types and validators, plus a short README of the caps.
```

**Prompt 2: indexes, validation and index tests**

```text
Using section 16 of the attached plan, create:
1) scripts/create-indexes.ts that creates every index in 16.2 idempotently with the exact names given;
2) scripts/set-validators.ts that applies the JSON Schema validators in warn mode, as in 16.5, for activities and places;
3) tests/indexes.test.ts with one expectIndexed test per row of table 16.1, against a seeded test database,
   asserting IXSCAN, no COLLSCAN, and totalDocsExamined <= nReturned * 3 + 5.
Do not add any index that is not in the plan.
```

**Prompt 3: seed and backfill**

```text
Using section 14 of the attached plan, create:
1) seed/catalogs.ts: gear, amenity, hazard catalogs (English and Arabic labels, iconKey) and the cancellation presets;
2) seed/fixtures.ts: the seven records in table 14.2, with confidence and needsReview set as described;
3) scripts/backfill-v2.ts: an idempotent, batched (500 ops, ordered false) backfill for existing documents with a
   --dry-run flag that prints a diff report and counts, per the pattern in 14.3;
4) scripts/split-heavy-data.ts: moves embedded GPX, polyline and guide markdown into place_tracks and place_guides,
   simplifies the route to 500 points and the profile to 200 points, and sets trail.hasTrack.
Never invent safety data: unknown values stay unknown and are added to needsReview.
```

**Prompt 4: shell endpoints**

```text
Implement GET /activities/:slug, GET /places/:slug, GET /activities (list) and GET /places (list) following sections
15.2 and 15.4 and 16.3 of the attached plan.
Requirements: projections only (no populate, no $lookup); the shell contains no private data and no per-user data;
spots left computed in the response; Cache-Control public s-maxage=60 stale-while-revalidate=300 for activities
and s-maxage=300 for places, with ETag; cursor pagination on (startAt, _id) with 21-row fetch to detect a next page;
list cards use the CARD projection. Use a shared MongoClient and read lists from secondaryPreferred.
Add tests that assert response size for the Hike fixture is under 25 KB gzipped.
```

**Prompt 5: section and write endpoints**

```text
Implement: GET /activities/:id/participants (cursor, 20), GET /:targetType/:id/reviews (cursor, 10), GET /places/:id/track,
GET /places/:id/guide (Pro only), GET /places/:id/gpx (Pro only, short-lived signed URL; /track stays free), GET /weather?lat&lng&date (cached in weather_cache, 60 min TTL, server side only),
GET /me/state?activityId (joined, saved, pro), GET /activities/:id/private (approved participants only).
Write paths: POST /activities/:id/join, POST /activities/:id/leave, POST /reviews, using exactly the atomic patterns
in section 16.4 (no read-modify-write). Reviews are allowed only after a checked_in participation for activities.
Rate limit join, review and search. Add concurrency tests: 50 parallel joins on a capacity-10 activity must end with
counts.going == 10 and status 'full'.
```

**Prompt 6: front-end foundation**

```text
Using sections 3, 5, 6, 7 and 15.5 of the attached plan, build DetailPageShell, HeroBanner, StatTile/StatGrid,
SectionCard, ChipRow, SkeletonSection and an Image component.
Requirements: layout is a single column with a fixed bottom ActionBar under 768px; two columns with a sticky
ActionPanel from 768px (tablet, 7/5) and 1024px (desktop, 8/4), no bottom bar there; the Image component takes
key, w, h, blurhash and alt, renders AVIF/WebP srcset (400, 800, 1200, 1600), eager only for the hero; skeletons
match final heights; design tokens from section 7; dark mode; RTL-safe spacing with logical properties.
Use Tailwind breakpoints md and lg. No data fetching yet, use the fixtures.
```

**Prompt 7: lazy sections**

```text
Build these sections with the loading rules in 15.2 and 15.3: WhereSection (static map image first, interactive map
loaded by dynamic import on tap or near viewport), ElevationChart (inline SVG from profile, no chart library),
GearChecklist (icons, grouped Mandatory / Recommended / Provided), ItineraryTimeline, ReviewsSection (10 per page,
cursor), ParticipantsSection (8 preview avatars, full list on tap), WeatherCard, AlertBanner, SafetySection,
CostPolicySection, HostCard, GuideSection (Pro lock with preview).
Use IntersectionObserver with a 1-screen rootMargin to trigger fetches. Use content-visibility auto with
contain-intrinsic-size on below-the-fold sections. Query cache: 60 s stale time for shells, 5 min for places.
```

**Prompt 8: page assemblies and action states**

```text
Assemble the seven pages (Hike, Camping, Event, Rideshare, Trail, Camp spot, Gear shop) with the section order in
the table in section 4 and the hero spec in 3.1. Implement the action state machine from section 6 for
ActionBar (mobile) and ActionPanel (tablet and desktop), including the party-size selector (adults and kids) and
optimistic join with rollback. Hide empty sections. Show "Not yet verified" for unknown safety fields only.
```

**Prompt 9: performance gates**

```text
Add: Lighthouse CI with budgets from 15.1 (LCP, CLS, INP proxy, JS size) run against the Hike and Trail pages on a
throttled mobile profile; a bundle size check (150 KB gzipped for first load of a detail route) that fails the build;
web-vitals reporting to our analytics split by device and connection; a script that prints MongoDB slow queries
(profiler slowms 100) and $indexStats unused indexes. Fail CI if any budget is exceeded.
```

**Prompt 10: hosts, verification, paid-activity rule and referrals**

```text
Using sections 4.1 and 13.8 of the attached plan, implement:
1) organizer verification: statuses none, pending, verified, rejected, expired, pending_migration; private
   document records in verification_documents (never returned by public endpoints, signed URLs for admins only);
   admin endpoints for the verification queue with approve and reject actions that set organizers.canCharge;
2) a publish rule: price.mode 'paid' requires organizer.canCharge; community hosts can publish only 'free' or
   'shared_cost'; return a clear error code so the creation form can explain it later;
3) participations.payment: the host can mark a participant paid or refunded; no money moves through the app;
4) facility pages by subtype (ten FacilityType values, amenity and commercial groups) with amenityState and the
   referral settings; POST /referrals/click writes to referral_clicks fire-and-forget (navigator.sendBeacon),
   never blocking the user's navigation;
5) Pro membership fields on users, and a guard that checks them for the guide and GPX endpoints only.
```

**Prompt 11: geographic hierarchy and counters (write side)**

```text
Using section 18 of the attached plan, implement: the geo_nodes, geo_stats and geo_outbox collections and types;
geoRef on places and activities; the in-memory tree and the point-in-polygon resolver (fallback: nearest area
center within 30 km, else the 'other' area of the state, flagged needsReview); counters.ts with countersFor,
scopesFor and deltaFor plus unit tests (create, delete, status change, move between areas, retag venue,
attach to a trail, expiry); a transactional helper that writes a pin and its outbox deltas together; the
coalescing worker with batch claiming and the idempotent flush from 18.4; the expiry sweeper; the nightly
reconcile with a drift report; and the indexes in 18.7. Counters change only through the worker.
```

**Prompt 12: hierarchy read API and caches (back end)**

```text
Using sections 18.3, 18.6 and 18.8, implement the endpoints GET /geo/tree, /geo/:id/summary, /geo/counts,
/geo/:id/facilities, /geo/:id/activities, /points/:id/facilities, /geo/resolve and /map/pins. Add the in-process
tree, an LRU of composed summaries (30 s), Redis (60 s, 15 s for ad hoc facet counts) with stale-while-revalidate,
singleflight per key, ETag from stats rev and treeVersion, and Redis pub/sub invalidation driven by the worker
(evict the changed scope and its parent). A summary on a cache hit must do zero database reads.
```

**Prompt 13: hierarchy front end**

```text
Using sections 18.6 and 18.9, build: the GeoStore (byId, byPath, children, counts, names) loaded from the static
tree JSON, persisted in IndexedDB and revalidated with ETag; level pages for country, state, area and venue
using DetailPageShell (hero with breadcrumb, count tiles by facility and activity type, children list with
mini counts, tabs for Facilities, Places, Activities and Map); the Find bar (what: facility or activity type,
where: any node) that shows the count and list; and the map that switches between state bubbles, area bubbles,
venue bubbles and individual pins by zoom as in 18.9. Navigating down a level must render instantly from the
store, using the parent's child counts as placeholder data.
```

### 17.3 Definition of done for every page

- [ ] First load meets the budgets in 15.1 on the throttled mobile profile.
- [ ] Shell response is cacheable and contains no private or per-user data.
- [ ] No heavy object (map library, track, guide, full lists) is in the initial request or bundle.
- [ ] Every query on the page is covered by an `expectIndexed` test.
- [ ] Counters change only through atomic updates, and a concurrency test proves it.
- [ ] Empty, loading, locked, full, cancelled and error states are implemented.
- [ ] Works at 360 px, 768 px and 1280 px wide, in light and dark mode, and in RTL.

## 18. Geographic hierarchy and fast aggregation

Every pin stores its full place chain, and every level keeps live counters, so a count for any level is one keyed read, not a scan. Pins can be added at any time: the write resolves the chain, records a small delta, and a worker folds deltas into the counters within about a second. The design below serves counts from memory, keeps writes cheap, and corrects itself every night.

### 18.1 The five levels

| Level | Name | Stored in | Example | Own page |
| --- | --- | --- | --- | --- |
| 1 | Country | `geo_nodes` | United Arab Emirates | Yes |
| 2 | State (emirate) | `geo_nodes` | Ras Al Khaimah | Yes |
| 3 | Area | `geo_nodes` | Hatta, Jebel Jais, Nad Al Sheba | Yes |
| 4 | Venue | `geo_nodes` | Wadi Shawka Dam, a desert camp site | Yes (the venue guide) |
| 5 | Pin: place, event or facility | `places` and `activities` | Wadi Shawka Loop, a toilet, a Dubai Marina to Jebel Jais ride | Existing detail pages |

**Rules**

- Levels 1 to 4 are slow-changing nodes, curator-managed, a few hundred in total. Level 5 grows fast. Users can suggest pins, and every trail, camp spot and area is approved by an admin before it goes live (section 20).
- A venue is a named site that holds several pins, for example a wadi park with a trail, a parking lot, toilets and a water station. A lone trail or camp spot with nothing around it can sit directly under an area, so `venueId` is optional.
- Each pin stores `geoRef`, its whole chain, resolved when it is written. A question about any level is then one equality on an indexed array.
- **Facilities carry two optional tags.** A venue tag, and attachments to map points: a trail, a camp spot or an activity, with an optional `km` along a trail. A facility's area comes from its own coordinates. Its venue comes from the tag, or from its first attachment if there is no tag.
- **What is counted.** A place counts when it is `public` and not `closed`. An activity counts while it is `published` or `full` and has not ended. Pending user submissions are not counted until approved.
- **Unknown area.** A pin outside every area polygon goes to the "Other" area of its state and is flagged `needsReview`. When a curator adds the right area, a re-resolve job moves those pins (18.5).

### 18.2 Schemas

```ts
export type GeoLevel = 1 | 2 | 3 | 4;
export type GeoKind = 'country' | 'state' | 'area' | 'venue';

export interface GeoNodeDoc {
  _id: ObjectId;
  level: GeoLevel; kind: GeoKind;
  slug: string;                       // unique among siblings
  path: string;                       // 'ae/rak/jebel-jais', unique, used in URLs
  names: { en: string; ar?: string };
  parentId?: ObjectId;                // none for the country
  ancestors: ObjectId[];              // root first, excludes the node itself
  center: GeoPoint;
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number];
  geometry?: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };   // simplified to 200 points or fewer, states and areas
  radiusM?: number;                   // venues without a polygon: a circle around center
  cover?: ImageRef; summary?: string;
  childCount: number;                 // direct children, kept by the same worker
  sort: number;                       // manual order among siblings
  status: 'active' | 'hidden';
  createdAt: Date; updatedAt: Date;
}

// Added to every PlaceDoc and ActivityDoc
export type GeoRef = {
  chain: ObjectId[];                  // [countryId, stateId, areaId, venueId?], multikey indexed
  countryId: ObjectId; stateId: ObjectId; areaId: ObjectId; venueId?: ObjectId;
  path: string;                       // deepest node's path, so breadcrumbs need no lookup
};

// Live counters. One small document per node or map point.
export interface GeoStatsDoc {
  _id: ObjectId;                      // id of a geo node (levels 1 to 4) or of a map point (a place)
  scope: 'country' | 'state' | 'area' | 'venue' | 'point';
  facilities: Partial<Record<FacilityType | 'total', number>>;
  places: Partial<Record<'trail' | 'camp_spot' | 'total', number>>;
  activeActivities: Partial<Record<ActivityType | 'total', number>>;
  rev: number; updatedAt: Date;       // rev changes on every flush, used as the ETag
  batches: string[];                  // last 20 batch ids, makes a flush idempotent
}

// One row per scope per change. The worker folds rows into geo_stats and deletes them.
export interface GeoOutboxDoc {
  _id: ObjectId;                      // time ordered
  scope: ObjectId;                    // the geo_stats document to change
  inc: Record<string, number>;        // for example { 'facilities.toilet': 1, 'facilities.total': 1 }
  at: Date;
  batch?: string;                     // set when the worker claims the row
}
```

A missing counter means zero, so a document stays small and never needs every facility type listed.

| New collection | Purpose | Size and write rate |
| --- | --- | --- |
| `geo_nodes` | The four upper levels | A few hundred documents, written by curators only |
| `geo_stats` | Counters per node and per map point | One document per node or point, about 0.5 KB, written by one worker |
| `geo_outbox` | Pending counter changes | Short-lived, normally empty |
| `geo_meta` | `treeVersion` and worker leases | One or two documents |

### 18.3 How the example questions are answered

| Question | Read | Cost |
| --- | --- | --- |
| How many toilets are in the Hatta area? | Resolve `ae/dubai/hatta` in the in-memory tree. Read `geo_stats` by `_id` = the area id. Take `facilities.toilet`. | Zero database reads when cached, one keyed read otherwise |
| How many water fountains are on the trail in Jebel Jais? | Read `geo_stats` by `_id` = the trail's id. Take `facilities.fountain`. To list them: `places.find({ 'attachedTo.id': trailId, 'facility.facilityType': 'fountain' })` sorted by `attachedTo.km`. | One keyed read, and one indexed query for the list |
| How many rides are active in the Nad Al Sheba area? | Read `geo_stats` for the area. Take `activeActivities.rideshare`. To list them: `activities.find({ 'geoRef.chain': areaId, type: 'rideshare', status: { $in: ['published', 'full'] }, activeUntil: { $gt: now } })`. | One keyed read, and one indexed query for the list |
| Toilets in the whole of Dubai | Same read at the state level | One keyed read |
| Everything at a venue | Read the venue's `geo_stats`, which holds facilities, places and activities in one document | One keyed read |
| Ad hoc: working, free water stations in Hatta | Index-backed `countDocuments` on `places` using `by_chain` (18.7), cached for 15 s | One covered index count, cached |

The counters answer the common questions instantly. Rare combinations fall back to an index-backed count, so no question needs a collection scan.

### 18.4 Write path: keeping counters fast and correct

A request never updates a counter. It writes the pin and a few small outbox rows in one transaction, and a worker folds those rows into `geo_stats` in batches.

1. **Resolve.** The service finds the pin's chain with a point-in-polygon check on the in-memory area polygons. Fallback: the nearest area center within 30 km, else the state's "Other" area, flagged `needsReview`. A venue comes from the tag or from the first attachment.
2. **Compute the delta.** Pure functions compare the pin before and after the change and return the counters to add or subtract per scope. A scope is a chain node, an attached map point, or the activity's place. That is at most 9 scopes for a facility and 5 for most activities.
3. **Write once.** One transaction writes the pin and inserts one `geo_outbox` row per scope. Request latency is the pin write plus a small insert, so it stays well under 50 ms.
4. **Fold.** One leader worker claims up to 1,000 outbox rows every 500 ms, sums them per scope, and issues one `$inc` per scope. The country document is touched at most twice a second, however many pins are added, so there is no hot-document contention.
5. **Invalidate.** After each flush the worker publishes the changed scope ids. Caches evict them (18.6).

A flush is idempotent. Each batch has an id, each stats document remembers its last 20 batch ids, and a repeat of the same batch is skipped. A crash at any point replays safely.

```ts
// counters.ts: pure functions, unit tested. No database access.
type Pin = PlaceDoc | ActivityDoc;
const isPlace = (p: Pin): p is PlaceDoc => 'kind' in p;

export function counted(p: Pin, now: Date): boolean {
  if (isPlace(p)) return p.visibility === 'public' && p.status !== 'closed';
  return (p.status === 'published' || p.status === 'full') && p.activeUntil > now;   // active = not yet ended, upcoming included
}

export function countersFor(p: Pin, now: Date): Record<string, number> {
  if (!counted(p, now)) return {};
  if (isPlace(p)) {
    return p.kind === 'facility' && p.facility
      ? { 'facilities.total': 1, [`facilities.${p.facility.facilityType}`]: 1 }
      : { 'places.total': 1, [`places.${p.kind}`]: 1 };
  }
  return { 'activeActivities.total': 1, [`activeActivities.${p.type}`]: 1 };
}

export function scopesFor(p: Pin): string[] {
  const ids = p.geoRef.chain.map(String);
  if (isPlace(p)) p.attachedTo?.forEach((a) => ids.push(String(a.id)));   // a facility counts on the trail or spot it serves
  else if (p.place) ids.push(String(p.place.id));                           // an activity counts on its place
  return [...new Set(ids)];
}

export type Delta = Map<string, Record<string, number>>;   // scope id to counter changes

function contribution(p: Pin | null, now: Date): Delta {
  const out: Delta = new Map();
  if (!p) return out;
  const c = countersFor(p, now);
  if (Object.keys(c).length === 0) return out;
  for (const s of scopesFor(p)) out.set(s, c);
  return out;
}

// after minus before, per scope. Moves between areas, retags and status changes all fall out of this.
export function deltaFor(before: Pin | null, after: Pin | null, now: Date): Delta {
  const a = contribution(after, now), b = contribution(before, now);
  const out: Delta = new Map();
  for (const scope of new Set([...a.keys(), ...b.keys()])) {
    const inc: Record<string, number> = {};
    for (const [k, v] of Object.entries(a.get(scope) ?? {})) inc[k] = (inc[k] ?? 0) + v;
    for (const [k, v] of Object.entries(b.get(scope) ?? {})) inc[k] = (inc[k] ?? 0) - v;
    for (const k of Object.keys(inc)) if (inc[k] === 0) delete inc[k];
    if (Object.keys(inc).length) out.set(scope, inc);
  }
  return out;
}
```

```ts
// write.ts: the only way to create, change or delete a pin
export async function writePin(col: Collection<any>, next: Pin | null, id: ObjectId, now = new Date()) {
  await client.withSession((s) => s.withTransaction(async () => {
    const before = (await col.findOne({ _id: id }, { session: s })) as Pin | null;   // read inside the transaction, so deltas are exact
    if (next) await col.replaceOne({ _id: id }, next, { upsert: true, session: s });
    else await col.deleteOne({ _id: id }, { session: s });
    await emit(deltaFor(before, next, now), now, s);
  }));
}

export async function emit(delta: Delta, at: Date, session: ClientSession) {
  const rows = [...delta].map(([scope, inc]) => ({ scope: new ObjectId(scope), inc, at }));
  if (rows.length) await outbox.insertMany(rows, { session });
}
```

```ts
// worker.ts: one leader (lease document in geo_meta), runs every 500 ms
export async function flushOnce() {
  for (const b of await outbox.distinct('batch', { batch: { $exists: true } })) await apply(b);   // finish batches left by a crash

  const ids = (await outbox.find({ batch: { $exists: false } }, { projection: { _id: 1 } })
    .sort({ _id: 1 }).limit(1000).toArray()).map((r) => r._id);
  if (!ids.length) return;
  const batch = new ObjectId().toHexString();
  await outbox.updateMany({ _id: { $in: ids }, batch: { $exists: false } }, { $set: { batch } });   // claim
  await apply(batch);
}

async function apply(batch: string) {
  const rows = await outbox.find({ batch }).toArray();
  const sums = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const acc = sums.get(String(r.scope)) ?? {};
    for (const [k, v] of Object.entries(r.inc)) acc[k] = (acc[k] ?? 0) + (v as number);
    sums.set(String(r.scope), acc);
  }
  const ops = [...sums].map(([scope, inc]) => ({
    updateOne: {
      filter: { _id: new ObjectId(scope), batches: { $ne: batch } },     // already applied: the filter misses
      update: {
        $inc: { ...inc, rev: 1 },
        $set: { updatedAt: new Date() },
        $push: { batches: { $each: [batch], $slice: -20 } },
        $setOnInsert: { scope: scopeTypeOf(scope) },                   // from the in-memory tree, else 'point'
      },
      upsert: true,
    },
  }));
  try { await stats.bulkWrite(ops, { ordered: false }); }
  catch (e) { if (!onlyDuplicateKeyErrors(e)) throw e; }               // E11000 means that scope already has this batch
  await outbox.deleteMany({ batch });
  await bus.publish('geo:changed', [...sums.keys()]);
}
```

### 18.5 Keeping it correct

**Expiry sweeper (every 60 s).** An activity stops being active when it ends, and no write happens at that moment, so a sweeper does it. It uses the `expiry_sweep` index.

```ts
export async function sweepExpired(now = new Date()) {
  const due = await activities.find({ status: { $in: ['published', 'full'] }, activeUntil: { $lte: now } }).limit(500).toArray();
  for (const a of due) {
    await client.withSession((s) => s.withTransaction(async () => {
      const r = await activities.updateOne({ _id: a._id, status: a.status }, { $set: { status: 'completed' } }, { session: s });
      if (r.modifiedCount === 1) await emit(deltaFor(a, { ...a, status: 'completed' }, now), now, s);   // guard: only the first sweeper wins
    }));
  }
}
```

Until the sweeper runs, the counter can be up to about a minute high. The list queries already filter on `activeUntil > now`, so lists are exact at all times.

**Nightly reconcile.** Counters are rebuilt from the source with aggregation, compared with the live ones, and repaired. This catches bugs, manual edits and any missed event.

```js
// Facilities per node and type. Run similar pipelines for attachments (unwind attachedTo and group by
// attachedTo.id), for trails and camp spots (places.*), and for active activities (unwind geoRef.chain,
// then repeat with place.id). Write to a scratch collection, then compare.
db.places.aggregate([
  { $match: { kind: 'facility', visibility: 'public', status: { $ne: 'closed' } } },
  { $unwind: '$geoRef.chain' },
  { $group: { _id: { id: '$geoRef.chain', t: '$facility.facilityType' }, n: { $sum: 1 } } },
  { $group: { _id: '$_id.id', byType: { $push: { k: '$_id.t', v: '$n' } }, total: { $sum: '$n' } } },
  { $project: { facilities: { $mergeObjects: [{ $arrayToObject: '$byType' }, { total: '$total' }] } } },
  { $merge: { into: 'geo_stats_rebuild', on: '_id', whenMatched: 'merge', whenNotMatched: 'insert' } },
]);
```

1. Compare each `geo_stats_rebuild` document with `geo_stats`, treating a missing counter as zero. Documents in `geo_stats` with no rebuild counterpart should be all zero.
2. Repair differences with `$set` on the counter fields and `$inc: { rev: 1 }`.
3. Record `drift = repaired documents / total documents` as a metric. Alert above 0.1%. Drop the scratch collection.

**Admin changes to the tree.** These are rare and use the normal write path, so counters follow without a rebuild.

| Change | What happens |
| --- | --- |
| Rename a node | Update `names` and `path` on the node and its descendants, and `geoRef.path` on their pins in chunks. Bump `treeVersion`. Counters do not change. |
| Add an area | Insert the node, update the parent's `childCount`, bump `treeVersion`. A re-resolve job reads pins in that state's "Other" area inside the new polygon and rewrites their `geoRef` through `writePin`. |
| Move a venue to another area | Update the node and its descendants' `ancestors`. Rewrite the `geoRef` of its pins through `writePin`, in batches of 500. Deltas move the counts from the old chain to the new one. |
| Merge two venues | Repoint pins through `writePin`, delete the empty node, bump `treeVersion`. |
| Change a polygon | Re-resolve pins inside the changed bounding box through `writePin`. |

After any bulk change, run a targeted reconcile for the affected node ids as a safety net.

### 18.6 Caching and data structures

The upper tree is tiny and changes rarely, so both the server and the browser hold all of it in memory. Counters change often but are read by key, so they are cached briefly and evicted the moment the worker changes them. A level page on a cache hit does no database read on the server and no network request on the client.

**Back end**

| Layer | Holds | TTL | Invalidated by |
| --- | --- | --- | --- |
| Process memory: tree | All `geo_nodes`: `byId`, `byPath`, `children`, simplified polygons for the resolver. About 1 MB. | Until `treeVersion` changes | Poll of `geo_meta` every 30 s, plus a `geo:tree` message on admin edits |
| Process memory: LRU | Composed level summaries, 2,000 entries, about 12 MB | 30 s, serve stale while refreshing | `geo:changed` message from the worker |
| Redis | The same summaries as JSON. Ad hoc facet counts. Batch counts. | 60 s for summaries, 15 s for facets | Delete on `geo:changed` |
| Singleflight | One database load per key at a time, so a burst of identical requests makes one query | Request lifetime | n/a |
| CDN | Public GET responses | `s-maxage=30`, `stale-while-revalidate=120`, `ETag` from `treeVersion` and the stats `rev` | TTL, 304 on revalidation |
| MongoDB | `geo_stats` read by `_id` | n/a | n/a |

Every ancestor of a changed pin is itself a changed scope, so evicting the scope ids the worker publishes also evicts every parent summary that embeds child counts.

```ts
// geoSummary.ts
const lru = new LRUCache<string, Summary>({ max: 2000, ttl: 30_000, allowStale: true });
const inflight = new Map<string, Promise<Summary>>();
const key = (id: string) => `geo:sum:${tree.version}:${id}`;

export async function getSummary(id: string): Promise<Summary> {
  const k = key(id);
  const hit = lru.get(k);
  if (hit) return hit;                                              // zero database reads
  const cached = await redis.get(k);
  if (cached) { const v = JSON.parse(cached); lru.set(k, v); return v; }
  if (!inflight.has(k)) {
    inflight.set(k, compose(id)
      .then(async (v) => { lru.set(k, v); await redis.set(k, JSON.stringify(v), 'EX', 60); return v; })
      .finally(() => inflight.delete(k)));
  }
  return inflight.get(k)!;
}

// One keyed query for the node and all its children, at most about 60 ids
async function compose(id: string): Promise<Summary> {
  const node = tree.byId.get(id)!;
  const kids = tree.children.get(id) ?? [];
  const docs = await stats.find({ _id: { $in: [id, ...kids].map((x) => new ObjectId(x)) } }, { projection: { batches: 0 } }).toArray();
  const counts = Object.fromEntries(docs.map((d) => [String(d._id), flatten(d)]));
  return {
    node: publicNode(node), breadcrumbs: crumbs(id),
    counts: counts[id] ?? {},
    children: kids.map((c) => ({ ...publicNode(tree.byId.get(c)!), counts: counts[c] ?? {} })),
    rev: Math.max(0, ...docs.map((d) => d.rev)),
  };
}

bus.subscribe('geo:changed', (ids: string[]) => ids.forEach((i) => { lru.delete(key(i)); redis.del(key(i)); }));
```

**Front end**

| Layer | Holds | Freshness | Notes |
| --- | --- | --- | --- |
| Static tree JSON | Every node in a compact form. About 500 nodes, 12 KB gzipped. | `ETag` per `treeVersion`, stored in IndexedDB, revalidated with a conditional GET at app start | Level navigation needs no tree request |
| In-memory store | `byId`, `byPath`, `children`, `counts`, `names` as `Map`s and arrays | Session | The single source for all level pages and the map |
| Query cache | Level summaries, lists, facet counts | Summary 30 s, lists 60 s, facets 15 s, refetch on focus | `placeholderData` comes from the store, so a page renders instantly |
| Prefetch | Summaries of the first 6 visible children | On idle, on viewport entry, on hover or touch start. Max 3 in parallel. Skipped when `saveData` is on. |  |
| Map | Pins in the viewport, clustered in the browser | Per viewport | Bubbles at low zoom read counts from the store |
| Service worker | Tree JSON and the last 20 summaries | Stale-while-revalidate | Browsing works offline |

After a user adds a facility, the client adds 1 to the matching counters in the store along the chain and invalidates that summary. The worker's value replaces it within seconds.

```ts
// client/geoStore.ts: short keys keep the tree payload small
export type GeoNodeLite = { id: string; p: string | null; l: 1 | 2 | 3 | 4; s: string; n: string; a?: string; c: [number, number]; path: string };
export type GeoCounts = { fac?: Record<string, number>; pl?: Record<string, number>; act?: Record<string, number> };

export class GeoStore {
  byId = new Map<string, GeoNodeLite>();
  byPath = new Map<string, string>();
  children = new Map<string, string[]>();               // parent id to child ids in display order
  counts = new Map<string, GeoCounts>();                // node or point id to counters
  names: { k: string; id: string }[] = [];              // lowercased English and Arabic names, sorted by k
  version = 0;

  load(tree: { version: number; nodes: GeoNodeLite[] }) {
    this.version = tree.version;
    for (const n of tree.nodes) {
      this.byId.set(n.id, n);
      this.byPath.set(n.path, n.id);
      if (n.p) (this.children.get(n.p) ?? this.children.set(n.p, []).get(n.p)!).push(n.id);
      this.names.push({ k: n.n.toLowerCase(), id: n.id });
      if (n.a) this.names.push({ k: n.a, id: n.id });
    }
    this.names.sort((x, y) => (x.k < y.k ? -1 : x.k > y.k ? 1 : 0));
  }

  // Prefix search by binary search, no library, no network. 'hat' finds Hatta.
  search(prefix: string, limit = 8) {
    const q = prefix.toLowerCase();
    let lo = 0, hi = this.names.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.names[mid].k < q) lo = mid + 1; else hi = mid; }
    const out: GeoNodeLite[] = [];
    for (let i = lo; i < this.names.length && this.names[i].k.startsWith(q) && out.length < limit; i++) out.push(this.byId.get(this.names[i].id)!);
    return out;
  }

  crumbs(id: string) { const out: GeoNodeLite[] = []; for (let n = this.byId.get(id); n; n = n.p ? this.byId.get(n.p) : undefined) out.unshift(n); return out; }
}
```

**HTTP headers**

- `GET /geo/tree`: `Cache-Control: public, max-age=300, stale-while-revalidate=86400`, `ETag: "v{treeVersion}"`. It changes only when a curator edits the tree.
- `GET /geo/:id/summary` and `/geo/counts`: `Cache-Control: public, s-maxage=30, stale-while-revalidate=120`, weak `ETag` of `{treeVersion}-{maxRev}`.
- Lists and ad hoc facets: `s-maxage=15`, keyed by node, filters and cursor.

### 18.7 Indexes for the hierarchy

Add these to the script in section 16.2. The `geoRef.chain` array holds every level of a pin's chain, so one multikey index answers a question at any level. A compound index can contain only one array field, so the attachment index is separate.

```js
// ---------- geo_nodes (a few hundred documents, so these are cheap) ----------
db.geo_nodes.createIndex({ path: 1 }, { name: 'path_unique', unique: true });
db.geo_nodes.createIndex({ parentId: 1, sort: 1 }, { name: 'children' });
db.geo_nodes.createIndex({ ancestors: 1, level: 1 }, { name: 'subtree' });
db.geo_nodes.createIndex({ geometry: '2dsphere' }, { name: 'geometry', partialFilterExpression: { geometry: { $exists: true } } });
db.geo_nodes.createIndex({ center: '2dsphere' }, { name: 'center' });

// geo_stats is read by _id only. It needs no other index.
db.geo_outbox.createIndex({ batch: 1, _id: 1 }, { name: 'claim' });

// ---------- pins: a question at any level is one equality on the chain ----------
db.places.createIndex(
  { 'geoRef.chain': 1, kind: 1, 'facility.facilityType': 1, visibility: 1, status: 1, 'facility.amenityState.working': 1 },
  { name: 'by_chain' }
);
db.places.createIndex(
  { 'attachedTo.id': 1, 'facility.facilityType': 1 },
  { name: 'attached', partialFilterExpression: { kind: 'facility' } }
);
db.activities.createIndex({ 'geoRef.chain': 1, type: 1, status: 1, startAt: 1 }, { name: 'by_chain_active' });
db.activities.createIndex({ status: 1, activeUntil: 1 }, { name: 'expiry_sweep' });
```

- `by_chain` serves counts and lists for any prefix of its keys: chain only, chain and kind, chain and facility type, and so on down to the working flag.
- `by_chain_active` returns only live activities, because the sweeper moves ended ones out of `published` and `full`. The `activeUntil` check is a cheap residual filter.
- Existing queries in 16.1 keep their indexes. `places.near` serves facilities near a trail and the map's pin queries.

### 18.8 Read API

| Endpoint | Returns | Source | Cache |
| --- | --- | --- | --- |
| `GET /geo/tree` | Compact tree of levels 1 to 4 | In-memory tree | CDN 5 min, browser IndexedDB |
| `GET /geo/:idOrPath/summary` | Node, breadcrumbs, its counters, each child with counters | `geo_stats` by `_id`, one `$in` query on a miss | LRU 30 s, Redis 60 s, CDN 30 s |
| `GET /geo/counts?ids=` | Counters for up to 50 ids | `geo_stats` | Same |
| `GET /geo/resolve?lat=&lng=` | The chain for a coordinate | In-memory polygons | CDN 1 h |
| `GET /geo/:id/facilities?type=&working=&cursor=` | Facilities under a node, 20 per page | `places.by_chain` | 15 s |
| `GET /geo/:id/places?kind=&cursor=` | Trails and camp spots under a node | `places.by_chain` | 15 s |
| `GET /geo/:id/activities?type=&cursor=` | Active activities under a node | `activities.by_chain_active` | 15 s |
| `GET /points/:id/facilities?type=` | Facilities attached to a trail, spot or activity, ordered by km | `places.attached` | 15 s |
| `GET /find?what=facility:toilet&where=<id>` | The count plus the first page of results | Counter, then the list query | 15 s |
| `GET /map/pins?bbox=&zoom=&type=` | Bubbles at low zoom, pins at high zoom | Counters or `places.near` | 15 s |

Cursor pagination follows `(startAt, _id)` for activities and `(_id)` for places. Every list response includes the node's counter for the same filter, so the count and the list never disagree visibly.

### 18.9 Level pages and the map

**Level page layout.** Levels 1 to 4 share one template built on the same page shell as the detail pages (section 3 and 5). The hero is the most important part and sits at the top on every breakpoint.

| Zone | Content |
| --- | --- |
| Hero | Cover photo, or a map snapshot of the area. Breadcrumb chips (UAE, Ras Al Khaimah, Jebel Jais). Name and level badge. One line of totals, for example "12 toilets, 5 water points, 3 active rides". |
| Count tiles | Facility types as icon tiles with counts, then trails, camp spots and active activities by type. Tiles with zero are hidden. Tapping a tile opens the filtered list, and the count is already known. |
| Find bar | What (a facility or activity type) and where (any node, with prefix search from the store). Shows the count and the list. Sticky under the hero. |
| Children | The next level as cards with mini counts. For an area, venues first, then pins that have no venue. |
| Tabs | Facilities, Places, Activities, Map |

- **Mobile:** single column. A fixed bottom action bar holds "View on map" as the primary button. "Add a facility" joins it when the creation forms ship.
- **Tablet and desktop:** two columns. The main column holds the tabs and children. A sticky side panel holds type filters with counts, a small map, and the add button. No bottom bar.
- **Venue pages** also show the venue guide, with the Pro rule for the guide text and GPX as in section 4.
- **Pin pages** (trail, camp spot, activity) get a "Facilities here" section, from the pin's own counters: "2 toilets, 3 water points", with the list ordered by km on a trail.

**Map zoom levels.** The map shows the level that fits the zoom, so it never has to draw thousands of pins.

| Zoom | Shows | Source |
| --- | --- | --- |
| 3 to 6 | One bubble per state with its total | Tree centers and counters |
| 7 to 9 | One bubble per area | Same |
| 10 to 12 | One bubble per venue, and large pins | Same |
| 13 and above | Individual pins in the viewport, at most 200, clustered in the browser | `places.near` and `activities` indexes, minimal fields |

With a type filter on (for example only toilets), bubbles show that type's counter, so the map and the page agree. If a viewport has more than 200 pins, the response says "too many" and the map keeps showing venue bubbles until the user zooms in.

### 18.10 Performance targets and tests

These are design targets for a catalogue of about 100,000 pins and 500 upper-level nodes. Confirm them with a load test before launch.

| Operation | Target | Why it holds |
| --- | --- | --- |
| Count for any node or point, cache hit | Under 1 ms, no database read | In-process LRU |
| Count, cache miss | Under 5 ms p95 | One keyed read on `_id` |
| Level page summary with about 50 children, miss | Under 20 ms p95 | One `$in` query on `_id` |
| Add or change a pin | Under 50 ms p95 | One transaction, one pin write and at most 9 small outbox rows |
| Counter visible after a write | Within 2 s at p99 | Worker flush every 500 ms |
| Counter drift after the nightly reconcile | Below 0.1% of documents | Rebuild and repair |
| Tree payload to the browser | 15 KB gzipped or less | Compact keys, 500 nodes |
| Level navigation in the browser | No network request after the first load | In-memory store |
| Worker capacity | About 2,000 outbox rows per second per leader | 1,000 rows per 500 ms batch. At 100 pin writes per second that is about 900 rows per second. Scale by partitioning scopes by hash across several workers. |

**Tests to add**

1. Unit tests of `deltaFor` for create, delete, status change to closed, expiry, move between areas, venue retag, attach and detach, and a rideshare across two areas.
2. A property test: apply 1,000 random pin operations through the worker, run the reconcile, and require zero drift.
3. Idempotency: apply the same batch twice and require unchanged counters.
4. Crash recovery: stop the worker after the claim and again after the bulk write, restart, and require correct counters.
5. Load: 200 pin writes per second for 60 seconds. Require request p95 under 50 ms, country `rev` rising at most twice a second, and an empty outbox within 2 s of stopping.
6. Cache: a summary hit makes zero database reads, and a `geo:changed` message evicts the right keys.
7. `expectIndexed` for `by_chain`, `attached`, `by_chain_active`, `expiry_sweep` and the resolver query (section 16.6).
8. Browser test with the network blocked after the first load: country to state to area to venue still renders, and `search('hat')` returns Hatta in under 1 ms.

### 18.11 Seeding existing records and rollout

Seed the upper levels first. Seven emirates and the country are fixed. Each state also gets an "Other" area for pins that fall outside every area. Hatta and Nad Al Sheba from your examples are seeded as areas under Dubai. Boundaries start as a center point with a `radiusM`, and curators replace them with polygons later.

| Pin | Chain seeded | Note |
| --- | --- | --- |
| Wadi Shawka Loop (trail) | United Arab Emirates, Ras Al Khaimah, Wadi Shawka, Wadi Shawka Dam | The venue comes from the "Wadi Shawka Dam parking" meeting point |
| Wadi Shawka Community Hike | Same chain, place is the trail | Counts on the trail, the venue, the area, the state and the country |
| Toilet at the dam car park (new facility) | Same chain, attached to Wadi Shawka Loop at km 0 | Made from the trail's "on site" facilities. Coordinates copied from the trail start and flagged `needsReview`. |
| Fuel and shop about 10 km toward Kalba | Not created | No coordinates yet. It stays as text in `nearby` until a curator adds the pins. |
| Al Ain Desert Camp (camp spot) | United Arab Emirates, Abu Dhabi, Remah Dunes, no venue | A curator decides whether the camp is a venue |
| Al Ain dune camp weekend | Chain of the camp, place is the camp spot |  |
| Fossil Rock Desert Camp and Desert Sunset Meetup | United Arab Emirates, Sharjah, Fossil Rock |  |
| Rideshare Dubai Marina to Jebel Jais | Union of Dubai, Dubai Marina, Dubai Marina Mall parking and Ras Al Khaimah, Jebel Jais, Jebel Jais Viewing Deck | Counts once in each area and each state |
| Desert Trail Outfitters (shop) | United Arab Emirates, Dubai, Other | No coordinates yet, flagged `needsReview` |

Area and venue names above are suggestions for a curator to confirm.

**Rollout steps**

1. Create the collections and the indexes in 18.7, and the `geo_meta` document.
2. Load nodes from a curator CSV (`path, level, name_en, name_ar, parent_path, lat, lng, radius_m`) with a script that validates the tree (unique slugs, correct levels, existing parents) and sets `ancestors`, `bbox`, `childCount` and `treeVersion`.
3. Backfill `geoRef` on places and activities in batches of 500 through the resolver. Unresolved pins go to the state's "Other" area with `needsReview`. Set `visibility: 'public'` on existing places. Set `activeUntil` on activities from `endAt`, else `startAt + durationMin`, else `startAt + 12 h`.
4. Create facility pins from migrated `nearby` and `waterPoints` entries that have coordinates, and add their attachments.
5. Start the worker and the sweeper, and switch every pin write to `writePin` behind a feature flag.
6. Run the reconcile twice in a row to build the first `geo_stats`. The second run should report drift near zero. A write during the first run can cause a small difference, and the second run repairs it.
7. Turn on the read API, the CDN rules and the front-end store. Release level pages behind a flag.
8. Remove the old `region` fields once nothing reads them.

### 18.12 Questions for the team

1. Who curates the tree and the area boundaries? A list of areas with centers and radii is enough to launch.
2. Can users suggest new areas and venues, with curator approval, or only facilities and places?
3. Is a state always an emirate, or will other countries come soon? The design supports any country, but each node needs English and Arabic names.
4. A rideshare counts once in each area it touches. Is that the right rule for "rides active in an area"?
5. Should a user's pending facility show on the map to that user before approval? This plan assumes yes, to them only.
6. Is Redis available? Without it the in-process cache and the CDN still work, but instances then rely on short TTLs to stay in step.

## 19. Architecture review

The plan is sound in its data model and its page structure. It is over-engineered in one place and under-specified in three. The findings below are ordered by what would cost the most to fix once the code exists. Severity: **B** blocking, **H** high, **M** medium.

### 19.1 The one change worth making before any code

**B1. The geo counter machinery is premature.** Section 18 adds an outbox, a leader-elected worker, a batch protocol, an expiry sweeper, a nightly reconcile and a drift metric, all to avoid counting documents. At 100,000 pins, `countDocuments` on `by_chain` is an index-only count that usually returns in single-digit milliseconds, and the result is cacheable for 30 to 60 seconds, which the plan already does. The counters buy little and add the worst failure mode in the system: silently wrong numbers.

Recommendation: keep the parts of section 18 that are cheap and permanent, and defer the parts that are expensive and replaceable.

| Keep in v1 | Defer until there is measured need |
| --- | --- |
| The five levels, `geo_nodes`, `geoRef` on every pin, the `path` string | `geo_outbox`, the worker, the batch protocol |
| The `by_chain`, `attached` and `by_chain_active` indexes | `geo_stats` as live counters |
| The counts API with the same response shape, served by cached index counts | The expiry sweeper's counter role, though keep the status flip |
| The caching layers, the front-end store, the level pages, the map zoom rules | The nightly reconcile and the drift metric |

The API, the cache keys and the UI do not change when counters arrive later, because the response shape is the same. Add counters when a measured p95 crosses the budget, or when one node holds more than roughly 50,000 pins. Put the count behind one function, `countsFor(scopeId, filter)`, so the swap is a single implementation change.

If you keep the counters in v1 anyway, replace the transaction-and-outbox write with **change streams** on `places` and `activities`. The worker consumes the stream with a resume token, computes the same delta from the before and after images, and applies it. That takes the transaction off the request path, removes a collection, and leaves the resume token as the only recovery state. It needs MongoDB 6.0 or later with pre-image and post-image capture enabled on both collections.

### 19.2 Blocking and high findings

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| B2 | Blocking | **Hosts control who may review them.** Reviews open only after the host checks a participant in. A host who skips check-in for an unhappy guest silences that review. Where money changes hands off-app, this removes the only trust signal the app has. | Qualify any approved or joined participant 12 hours after `activeUntil`. Keep `checked_in` as a "verified attendance" badge on the review, not as the gate. |
| B3 | Blocking | **Payment is off-app, but the app sets the expectation.** The page shows a price, takes the request and hosts the group chat. Users will hold the app responsible when a host takes money and cancels. The plan fixes the wording, not the exposure. | Settle the legal position with counsel now. At minimum: a one-line disclosure beside the primary button, a dispute contact, a host-cancellation record that affects the host's badge, and no refund wording that implies the app will act. |
| B4 | Blocking | **No moderation or deduplication for user-submitted pins.** Any member can add a facility, and nothing stops five people adding the same toilet or a shop adding itself ten times. Counts are the headline feature, so duplicates corrupt the product's main claim. | Designed in section 20: candidate search before submit, a merge model, an approval queue, and a rate limit per user. |
| H5 | High | **Meeting-point privacy is partly illusory.** `area.geo` is rounded to about 1 km and the exact pin is gated, but most activities link to a place whose `location` is public and exact. | Gate only where it is real: activities at a private or unlisted meeting point. Elsewhere say "Meet at the dam car park" openly and gate only the notes and the chat. Half-privacy costs a request and buys nothing. |
| H6 | High | **Three competing build orders.** Section 10 has five phases, section 12 has six Cursor steps and section 17 has thirteen prompts. They disagree on order and overlap in scope. | Keep section 17 as the single build order. Reduce section 10 to dated milestones and section 12 to the Gemini verdicts. |
| H7 | High | **`tz: 'Asia/Dubai'` is a literal type, yet section 18 is built for any country.** Both cannot be right. | Make `tz` a plain string with that default, and store a time zone on each state node so dates render in the pin's zone. |
| H8 | High | **Completed activities never leave the hot collection.** They keep growing the browse indexes, which also index drafts and cancelled rows that no query wants. | Add a partial filter of `status` in published or full to `browse_upcoming` and `by_chain_active`. Archive activities older than 18 months into `activities_archive`. |
| H9 | High | **No analytics taxonomy, no SLOs, no restore test.** The plan measures page speed but not product behaviour, and never proves a backup can be restored. | Define about 20 events (detail viewed, join requested, join approved, review submitted, referral click, pin submitted). Set SLOs on the shell and join endpoints. Run a restore drill before launch and once a quarter. |
| M10 | Medium | **Empty-state risk at launch.** With seven records, level pages show zeroes and the map is bare, so the product looks broken on day one. | Seed 150 to 300 real pins across three or four flagship areas, and hide nodes whose totals are all zero from navigation. |
| M11 | Medium | **Counts mix verified and unverified facts.** "12 toilets in Hatta" may be nine unconfirmed. | Show the split in the tile detail ("9 unconfirmed") and sort unverified pins last. |
| M12 | Medium | **Background jobs are assumed but unowned.** Place renames, host renames, subtree path rewrites and the `upcoming` field on places all need a job runner with retries and a dead-letter queue. | Pick one runner (BullMQ or Agenda) and list the five jobs with their schedules in a single table. |

### 19.3 Bugs in the code written in this plan

These are defects in the snippets, not matters of taste. Fix them before the prompts in section 17 are run, because Cursor will copy them faithfully.

| # | Where | Problem | Fix |
| --- | --- | --- | --- |
| D1 | 16.4, review update | `rating.sum` and `rating.count` are incremented, then `rating.avg` is set in a second update. Between the two, readers see a stale average, and two concurrent reviews can interleave. | Use one pipeline update: set sum, count and hist with `$add`, then set avg from the new values in a later stage of the same pipeline. |
| D2 | 18.4, `apply()` | The upsert filter is `{ _id, batches: { $ne: batch } }`. When the document exists and already holds that batch, the filter matches nothing, so MongoDB attempts an insert and fails on the duplicate `_id`. The code swallows E11000, which also hides real conflicts. | Create the stats document when the node or pin is created, then update without upsert and treat a zero `matchedCount` as already applied. No error swallowing. |
| D3 | 18.4, `writePin` | A multi-document transaction on every pin write requires a replica set, adds a round trip, and will not implicitly create `geo_outbox`. | Pre-create every collection in the migration. Better, follow B1 and drop the transaction. |
| D4 | 16.4, `goingPreview` | Avatars are pushed only while fewer than eight exist, and nothing refills the list when someone leaves. After churn the preview under-reports. | Rebuild the preview in the leave path, or drop it and read eight participations on demand, which is one indexed query. |
| D5 | 18.5, `sweepExpired` | It loops one document at a time with a transaction each. At a few thousand expiries it will not finish inside its 60-second window. | Flip statuses with one `updateMany`, then emit deltas from the ids it changed. With B1 applied, no deltas are needed at all. |
| D6 | 13.4 and 18.2 | `activeUntil` is set at write time from `endAt`, but nothing recomputes it when a host reschedules. | Derive it in one place, in a pre-save hook, so it cannot drift from `startAt` and `endAt`. |
| D7 | 16.2 | Both `places` and `activities` get a text index, and section 17 also suggests Atlas Search. Running both doubles the write cost for no gain. | Pick one. On Atlas, use Atlas Search and drop the text indexes. |
| D8 | 18.2 | `batches` grows to 20 strings per document and is rewritten on every flush. | It disappears with D2. If kept, store a single `lastBatch`, since batches apply in order. |

### 19.4 MongoDB review

**Indexes**

| Finding | Detail |
| --- | --- |
| Partial filters are missing where they matter most | `browse_upcoming`, `by_chain_active` and `browse` index every status, including draft, cancelled and completed, which will be most rows within a year. Partial filters on the two live statuses cut these indexes to a fraction of their size and keep them in memory. |
| Verify the multikey sort with `explain` | `by_chain_active` sorts on `startAt` while matching the multikey `geoRef.chain`. Equality on an array field should still allow an index sort, but prove it with `explain` on real data. If it does not hold, add an index keyed on the scalar `geoRef.areaId` with `type`, `status` and `startAt`. |
| `by_chain` has six keys | Six keys are justified only if queries really filter down to the working flag. Measure first. Every unused trailing key costs write throughput. |
| Index count per collection | `places` would carry eight indexes and `activities` nine. That is a real write tax. Aim for five or six, and justify each with a row in table 16.1. |
| The `$indexStats` review has no owner | Assign it, and drop unused indexes at the first monthly review after launch. |

**Operations**

- **Read preference.** Reading lists from secondaries, as 15.4 suggests, means a user can add a pin and not see it in the list. Use the primary for anything the user just changed, and secondaries only for anonymous browse traffic.
- **Pre-create every collection** a transaction touches, as part of the migration.
- **Leader election** for the worker needs a fenced lease with a monotonic token, not a timestamp, or two workers overlap across a clock skew. Another reason B1 is attractive.
- **Targeted updates.** `writePin` replaces the whole document. Edit paths should use `$set` on the changed fields instead, since activities will sit near 10 KB.
- **Sharding is not needed** at this scale, and nothing here assumes it. Say so explicitly, so nobody introduces a shard key later by surprise.
- **Connection limits.** A serverless deployment will exhaust the Atlas connection limit and contradicts the single-client rule in 15.4. If the API is serverless, the plan needs a pooled proxy.
- **Backups.** Point-in-time recovery enabled, a restore drill before launch, and a written recovery objective. None of this is in the plan yet.

### 19.5 UI/UX review

The section library and the three breakpoints are the strongest part of the plan. The problems sit in screen chrome, in states, and in what the pages promise.

| # | Finding | Fix |
| --- | --- | --- |
| U1 | **Too much fixed chrome on a phone.** A hero at 40% of the viewport, a sticky top bar, sticky jump chips and a bottom action bar leave about a third of a 667px screen for content. | Hero 32% to 36%. Drop the jump chips on pages with fewer than six sections and show them only after the hero scrolls away. Never have the top bar and the chips both solid at once. |
| U2 | **Two primary actions compete on place pages.** The bar says "Arrange trip" while the body offers "Scheduled outings", and "Arrange trip" is vague. | Make the bar action concrete: "Plan a trip here" opens a sheet with "Join an outing" (count shown) and "Create one". |
| U3 | **Inconsistent join vocabulary.** "Request to join", "RSVP", "Book spot" and "Request a spot" all appear. | Two labels only, chosen by approval mode: "Join" when approval is off, "Request to join" when it is on. |
| U4 | **The danger alert sits below the hero.** A flash-flood warning should never need scrolling to. | For danger severity, put the banner above the hero, make it sticky, and require an acknowledgement before the join action completes. Info and warning can stay where they are. |
| U5 | **"Not yet verified" will be everywhere at launch** and reads as a fault in the app rather than as missing data. | Phrase it as an invitation: "No one has checked this yet. Add what you know." Keep it to safety fields and show a completeness score on the pin. |
| U6 | **Price without payment is a trust cliff.** The user sees AED 180 and a join button, then learns payment happens elsewhere. | Put "You pay the host directly" beside the price chip, not only in the cost section, and show the method and deadline before the request is sent. |
| U7 | **The kids signal is too weak for parents.** One boolean does not answer whether a particular child can do this. | Show the minimum age, distance, gain and one line of terrain. On a card show "Kids 8+" rather than a generic chip. |
| U8 | **The Pro lock on GPX conflicts with safety.** The route map is free but the downloadable track is paid, and the track matters most where there is no signal. | Let a joined participant cache the route of an activity they joined, Pro or not. Keep Pro on the guide text and on standalone GPX downloads. |
| U9 | **Accessibility gaps.** Count tiles are icon-first, alert severity is carried by colour, and no standard is named. | Commit to WCAG 2.2 AA, give every tile a text label, pair severity colour with an icon and a word, and test the sticky bars with a screen reader. |
| U10 | **RTL is listed but not designed.** Breadcrumbs, the date tile, km markers along a trail and map controls all mirror. | Use logical properties throughout, keep Western Arabic numerals for distances, and add one Arabic screenshot per page type to the definition of done. |
| U11 | **The moment that matters most is missing.** The plan covers browse and join, but not "I am in the car at 5 am: where do I go and who do I call". | Add a Today view for joined activities: meeting pin, directions, host phone, group chat and gear list, cached offline. It is also the strongest retention feature available here. |
| U12 | **Level pages need a when filter.** The Find bar has what and where, but "rides in Nad Al Sheba" means this weekend, not ever. | Add Today, This weekend and Next 30 days, defaulting to the next 30 days for activities. |

### 19.6 Trust, safety and moderation

This is the thinnest part of the plan relative to its risk. The app puts strangers in cars and takes them into wadis and deserts.

- **Rideshare carries the most risk and the fewest controls.** A stranger's car, a 5:00 AM pickup, no driver verification, no plate until joined, and a women-only flag with no rules behind it. Decide: must drivers be ID-verified, can a rider see the driver's history, is there a trip-sharing link for a friend, and who may enable women-only?
- **The emergency flow is a field, not a feature.** The contact is stored, but nothing says what happens when a hiker does not return. Either add a check-in and check-out on the Today view, or state plainly on the page that the app does not monitor safety.
- **There is no report model.** Nothing can be reported: not a host, a pin, a review or a ride. Add a `reports` collection (type, target, reason, status) and an admin queue. App stores generally require this for user-generated content.
- **Blocking and privacy.** Users need to block another user and to hide themselves from participant lists. `showInList` exists, blocking does not.
- **Review integrity beyond B2.** Keep one review per person, show an attended badge, allow host replies, and never let a host delete a review.
- **Minors.** Children attend, so state that only an adult account books, that photos of minors need consent, and that no child creates an account.

### 19.7 Scope: what to build first

The plan as written is roughly nine to twelve months of work for a small team. The riskiest thing it could do is build all of it before anyone uses any of it. The cut below keeps every schema decision, since those are expensive to change, and defers machinery, since that is cheap to add.

| Build now | Defer | Why |
| --- | --- | --- |
| All schemas and `geoRef`, exactly as designed | Counters, outbox, worker, reconcile (B1) | Schemas are expensive to change later, machinery is not |
| Hike, Camping, Event, Rideshare, Trail, Camp spot pages | Gear shop and the six amenity facility subtypes as full pages | Facilities can be map pins with a card first |
| Join, approve, cancel, review | Waitlist, party size, waiver | Fewer states to design and test |
| Area and venue levels, with cached index counts | Country level as a page | Nobody browses by country in a one-country product |
| The Today view (U11) | Offline caching beyond the joined activity | Highest value per unit of work in this plan |
| Duplicate detection, the approval queue and reports (section 20) | Trust levels and auto-approve | Needed from the first user submission |
| Verification for operators and pro guides | Certifications and languages as filters | Required before any paid trip goes live |
| Seed 150 to 300 pins in three or four areas | A nationwide catalogue | Density in one area beats sparseness everywhere |

### 19.8 What to keep exactly as it is

- The tiered loading model in 15.2 and the budgets in 15.1. This is the part of the plan most likely to make the app feel fast, and it is correctly specified.
- The embed-versus-reference rules in 13.1, the array caps, and keeping heavy data in `place_tracks`, `place_guides` and `activity_private`.
- `geoRef.chain` as a multikey array. It is the right shape for "count at any level" whether the count comes from an index or from a counter.
- The three-breakpoint layout, with a bottom bar on mobile only and a sticky panel elsewhere.
- Cursor pagination everywhere, and the `expectIndexed` tests in 16.6. Few teams write those, and they are what keeps the plan honest a year later.
- Confidence and `needsReview` on migrated data, and the rule that safety fields are never guessed.

### 19.9 Revised order of work

This replaces the phases in section 10 and the order in section 12.

1. **Decisions.** Settle B2, B3, B4 and the questions in 14.5, 18.12 and 19.6. Two days, mostly conversations, and everything downstream depends on them.
2. **Foundation.** Schemas, `geoRef`, indexes with partial filters, validators in warn mode, fixtures. Fix D1 to D8 as you write them.
3. **Read paths.** Shell endpoints, cached counts behind `countsFor`, the front-end store, the page shell and hero.
4. **One page end to end.** The Hike page at all three breakpoints, with budgets enforced in CI. Do not start page two until the budgets pass.
5. **The rest of the pages**, then the level pages and the map.
6. **Write paths.** Join, review, pin submission, moderation, verification.
7. **The Today view and offline.**
8. **Seed and launch one area.** Measure, then decide whether counters are needed at all.

### 19.10 What I could not assess

This review is of the plan, not of a system. It cannot judge whether the budgets in 15.1 and the targets in 18.10 are achievable on your hosting, whether the team can carry nine indexes per collection on its write volume, or whether the geo tree matches how people in the UAE actually name these places. Those need a load test, a staging cluster and a conversation with two or three local hiking groups.

## 20. Submissions, duplicates and approval

Every new country, state, area, venue, trail, camp spot and facility goes through one pipeline: find candidates, let the user link to an existing one, and otherwise create a pending record for an admin. Candidate search runs on every keystroke-level step of the form and must stay under 50 ms, so it never uses a scan or a text search. It uses an equality on a pre-computed grid cell plus a normalised name key.

### 20.1 What needs approval

| Entity | Who may create | Goes live | Note |
| --- | --- | --- | --- |
| Country | Admin only | Immediately | Unique on ISO code. Users never create one. |
| State | Admin only | Immediately | Unique on ISO 3166-2 code within a country. |
| Area | User may suggest, admin creates | **Admin approval always** | Boundaries affect every pin's chain, so an area is never auto-created. |
| Venue | User may suggest, admin creates | **Admin approval always** | A venue regroups pins, so a wrong one is expensive to undo. |
| Trail | Any member | **Admin approval always** | Safety content. |
| Camp spot | Any member | **Admin approval always** | Safety content. |
| Facility, amenity group | Any member | Auto-approved once the submitter is trusted and no candidate was found, otherwise admin approval | A toilet or a water point is low risk and high volume. |
| Facility, commercial group | Any member | **Admin approval always** | Referral links and self-promotion need a human. |
| Activity | Any member, subject to section 13.8 | Immediately | Time-bound and self-correcting. Not part of this pipeline. |

Trust for the amenity group: a member becomes trusted after three approved submissions with no rejection in the last 90 days. A rejection for duplication or bad data drops them back. The rule is a configuration value, so it can be switched to "always review" on day one and relaxed later.

### 20.2 Duplicate detection

The check runs in three stages. The first two cost nothing in the database.

**Stage 1, in memory.** Countries, states, areas and venues total a few hundred nodes and already sit in the server's tree cache and in the browser's store. Their duplicate check is a loop in memory with zero database reads, and it also runs in the browser, so the user sees candidates before pressing anything.

**Stage 2, one indexed query.** Trails, camp spots and facilities are looked up by grid cell. Every pin stores `cells`, an array of four geohash prefixes around its coordinates, so "what else is near here" is an equality match on an indexed array rather than a geo query.

| Precision | Cell size | Used for |
| --- | --- | --- |
| `g8` | about 38 m | Same-spot amenities |
| `g7` | about 150 m | Commercial facilities, camp spots |
| `g6` | about 1.2 km | Venues, trail starts |
| `g5` | about 4.9 km | Areas |

A cell boundary can split two pins that sit next to each other, so each pin also stores the eight neighbouring cells at its primary precision. The candidate query then matches any of nine cells in one index lookup, and no pin is missed at an edge.

**Stage 3, scoring.** Candidates are scored in memory. Distance uses the haversine formula. Name similarity uses a normalised key plus a trigram ratio.

```ts
// Normalisation makes 'Wadi Shawka Dam Parking', 'wadi shawka dam car park' and the Arabic form collapse together.
const STOP = new Set(['the', 'al', 'el', 'wadi', 'jebel', 'jabal', 'camp', 'area', 'park', 'parking', 'car', 'point', 'spot', 'trail', 'loop', 'station']);

export function nameKey(raw: string): string {
  return raw
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')      // strip Latin diacritics
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')             // Arabic alef forms to bare alef
    .replace(/\u0629/g, '\u0647').replace(/\u0649/g, '\u064a')   // ta marbuta, alef maqsura
    .replace(/[\u064b-\u0652]/g, '')                        // Arabic diacritics
    .toLowerCase().replace(/[^a-z0-9\u0600-\u06ff ]+/g, ' ')
    .split(/\s+/).filter((w) => w && !STOP.has(w))
    .sort().join(' ');                                      // word order does not matter
}
```

Thresholds by entity. `d` is metres between the two points, `s` is name similarity from 0 to 1.

| Entity | Near-certain duplicate | Possible duplicate | Extra signals |
| --- | --- | --- | --- |
| Amenity facility, same type | `d` under 25 | `d` 25 to 100 | Unnamed, so distance decides |
| Commercial facility | `d` under 150 and `s` above 0.7, or the same phone or website at any distance | `d` under 500 and `s` above 0.5 | A matching website or phone outranks distance. A chain with several branches stays separate because distance keeps them apart. |
| Camp spot | `d` under 150 | `d` 150 to 500 with `s` above 0.5 |  |
| Trail | Start points under 300 m apart and length within 15%, and at least 6 of 8 sampled route points within 150 m of the other route | Start points under 1 km apart and `s` above 0.6 | Route sampling catches the same trail mapped from a different start |
| Venue | `d` under 300 and `s` above 0.6, or the circles overlap | `d` under 1,000 |  |
| Area | `s` above 0.7 within the same state, or the boundaries overlap | `d` under 5,000 |  |
| State and country | Same ISO code | Same `nameKey` | Blocked by a unique index |

Candidate search always includes pending submissions, not only live records. Two users adding the same new water point on the same morning must find each other.

### 20.3 What the user sees

The form never blocks on a guess. It offers the cheaper action first.

1. **As the pin is dropped**, the map shows existing pins of that type nearby, so most duplicates never become submissions.
2. **Near-certain match:** "There is already a toilet about 12 m from here." The primary action is "That is the one, add my details to it", which opens an edit suggestion against the existing record instead of creating a new one. The secondary action is "No, this is a different one".
3. **Possible match:** the form shows up to five candidates with distance, a thumbnail and the name. The user picks one or chooses "None of these".
4. **The insist path.** When the user chooses "No, this is a different one" or "None of these", the form asks for one short line of why, with quick options such as "It is on the other side of the road", "The other one is closed" or "Different building". The submission is then created with `status: 'pending'` and carries the candidates it was shown, so the admin reviews the same comparison the user saw. It is never silently created, and it is never rejected by the system.
5. **Someone already suggested this.** If the closest candidate is itself pending, the user is offered "Follow this suggestion" instead. That increments `seconded` on the existing submission and notifies both users when it is approved. Two people asking for the same thing is a strong signal for the admin, not two rows of work.
6. **Trails, camp spots, areas and venues** always end at step 4 or 5, whatever the dedupe result, because they always need approval. The confirmation says so plainly, with a typical review time.

### 20.4 Schema

Submissions live in their own collection, so a pending record never touches a live index, never counts, and can be rejected without leaving anything behind. On approval the payload becomes a real document.

```ts
export type DedupeKeys = {
  nameKey: string;                 // normalised, see 20.2
  cells: string[];                 // [g8, g7, g6, g5] plus the 8 neighbours at the primary precision
  phoneKey?: string;               // digits only, last 9
  domainKey?: string;              // registrable domain of the website
  routeKey?: string;               // trails: 8 sampled points rounded to 3 decimals, joined
};

export interface SubmissionDoc {
  _id: ObjectId;
  kind: 'area' | 'venue' | 'trail' | 'camp_spot' | 'facility' | 'edit';
  facilityType?: FacilityType;
  status: 'pending' | 'approved' | 'rejected' | 'merged' | 'withdrawn';
  payload: Record<string, unknown>;          // the fields of the future place or node
  dedupe: DedupeKeys;
  geo: GeoPoint;
  geoRef?: GeoRef;                           // resolved at submit time, re-checked at approval
  targetId?: ObjectId;                       // 'edit' submissions, and the record a merge points at
  candidates: { id: ObjectId; source: 'live' | 'pending'; distanceM: number; nameScore: number; verdict: 'near_certain' | 'possible' }[];
  insisted?: { reason: string; note?: string; at: Date };   // filled when the user said it is not a duplicate
  submittedBy: ObjectId; seconded: ObjectId[];              // other users who said "this one too"
  photos: ImageRef[];
  review?: { by: ObjectId; at: Date; action: 'approve' | 'reject' | 'merge'; reason?: string; mergedInto?: ObjectId };
  createdAt: Date; updatedAt: Date;
}

// Added to PlaceDoc and GeoNodeDoc so live records can be searched the same way
export type DedupeFields = {
  dedupe: DedupeKeys;
  aliases: string[];               // every name people have used, grows on each merge, improves future matching
  mergedFrom?: ObjectId[];
};

export interface MergeDoc {
  _id: ObjectId;
  fromId: ObjectId; fromKind: 'place' | 'geo_node'; intoId: ObjectId;
  by: ObjectId; at: Date; reason?: string;
  moved: { reviews: number; photos: number; attachments: number; activities: number };
  undoneAt?: Date;
}
```

The `places` collection gains `dedupe` and `aliases`. `geo_nodes` gains the same. Nothing else changes.

### 20.5 Indexes and the candidate query

```js
// Candidate search: one equality on the cells array, narrowed by kind and type.
db.places.createIndex(
  { 'dedupe.cells': 1, kind: 1, 'facility.facilityType': 1 },
  { name: 'dedupe_cells', partialFilterExpression: { visibility: { $in: ['public', 'pending'] } } }
);
db.places.createIndex({ 'dedupe.phoneKey': 1 }, { name: 'dedupe_phone', sparse: true });
db.places.createIndex({ 'dedupe.domainKey': 1 }, { name: 'dedupe_domain', sparse: true });

// Race guard. Two identical submissions cannot both be created; the loser is routed into the duplicate flow.
db.submissions.createIndex(
  { kind: 1, facilityType: 1, 'dedupe.nameKey': 1, 'dedupe.cells.0': 1 },
  { name: 'pending_unique', unique: true, partialFilterExpression: { status: 'pending' } }
);
db.submissions.createIndex({ status: 1, kind: 1, createdAt: 1 }, { name: 'queue' });
db.submissions.createIndex({ submittedBy: 1, createdAt: -1 }, { name: 'by_user' });
db.submissions.createIndex({ 'dedupe.cells': 1, status: 1 }, { name: 'pending_near', partialFilterExpression: { status: 'pending' } });

// geo_nodes are checked in memory, but keep this for scripts and admin tools
db.geo_nodes.createIndex({ 'dedupe.nameKey': 1, parentId: 1 }, { name: 'dedupe_name' });
db.geo_nodes.createIndex({ isoCode: 1 }, { name: 'iso_unique', unique: true, sparse: true });
```

```ts
// One query against live pins, one against pending submissions, both index-only. Target: under 20 ms p95.
export async function findCandidates(input: { kind: string; facilityType?: string; geo: GeoPoint; name?: string }) {
  const cells = cellsFor(input.geo, primaryPrecision(input.kind));   // 9 cells: the pin's plus 8 neighbours
  const key = input.name ? nameKey(input.name) : '';

  const [live, pending] = await Promise.all([
    places.find(
      { 'dedupe.cells': { $in: cells }, kind: input.kind, ...(input.facilityType ? { 'facility.facilityType': input.facilityType } : {}) },
      { projection: { name: 1, location: 1, 'dedupe.nameKey': 1, aliases: 1, cover: 1, visibility: 1 }, limit: 50 }
    ).toArray(),
    submissions.find(
      { 'dedupe.cells': { $in: cells }, status: 'pending', kind: input.kind },
      { projection: { payload: 1, geo: 1, dedupe: 1, submittedBy: 1, seconded: 1 }, limit: 20 }
    ).toArray(),
  ]);

  return [...live, ...pending]
    .map((c) => score(c, input.geo, key))       // haversine plus trigram, in memory
    .filter((c) => c.verdict !== 'no')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}
```

Cost per call: two index lookups returning at most 70 small documents, then arithmetic. No geo query, no text index, no aggregation. The upper levels skip the database entirely and loop over the in-memory tree.

**Caching.** Candidate results are cached in Redis for 30 seconds keyed by `kind`, type and the primary cell, because a user dragging a pin re-queries the same cell repeatedly. The browser caches the last response and re-scores locally while the pin moves less than 20 m, so dragging does not generate requests.

### 20.6 Approval and merge

Approval is one transition that creates the live record and leaves an audit trail.

| Action | What happens |
| --- | --- |
| **Approve as new** | Create the place or node from `payload`, copy `dedupe` and set `aliases` to the submitted name, set `visibility: 'public'`, resolve `geoRef` again in case the tree changed, write the counters through the normal write path, set the submission to `approved`, and notify the submitter and anyone who seconded it. |
| **Merge into an existing record** | Append the submitted name to the target's `aliases`, apply any new fields the target lacks, move photos across, write a `MergeDoc`, set the submission to `merged`, and tell the submitter which record now holds their information. Nothing is deleted. |
| **Reject** | Record a reason from a fixed list (duplicate, not a real place, wrong location, spam, unsafe), notify the submitter with that reason, and allow one appeal. |
| **Merge two live records** | Repoint `attachedTo`, reviews, photos and activities from the loser to the winner, add its names to `aliases`, set the loser to `status: 'merged'` with `mergedInto`, keep its id serving a redirect so old links still work, and write a `MergeDoc`. Counters follow automatically, because repointing goes through the normal write path. |
| **Undo a merge** | Within 30 days, use the `MergeDoc` to restore the loser and move back only what the merge moved. |

Approving an area or a venue also triggers the re-resolve job from 18.5, so pins that were sitting in the state's "Other" area move into the new node and the counters follow.

### 20.7 Admin queue

The queue is the only screen that makes this pipeline work, so it is designed for speed rather than completeness. One reviewer should clear 50 items in a sitting.

- **Grouped, not listed.** Items that share a cell and a type are grouped, so four suggestions for the same water point are one decision.
- **Side by side.** The submission and its top candidate sit next to each other, with a small map showing both pins, the distance in metres, and only the fields that differ highlighted.
- **Four keys.** A to approve, M to merge into the highlighted candidate, R to reject with a reason, S to skip. Mouse users get the same four buttons.
- **The user's own words are shown**, because the insist reason is usually the deciding fact: "the other one is on the far side of the dam".
- **Sorted by cost of being wrong.** Trails and camp spots first, then commercial facilities, then amenities. Within a type, items with a near-certain candidate come first, because they are the fastest decisions.
- **Bulk approve** is allowed only for amenity submissions from trusted members with no candidate.
- **Every decision is reversible** for 30 days, through the merge record or by restoring the submission.

### 20.8 Counting, caching and visibility

- A pending submission is **never counted**. The counters and the cached counts in section 18 read live records only.
- The submitter sees their own pending pin on the map in a muted style with a "Waiting for review" label. Nobody else sees it, except that the dedupe flow can surface it to a second submitter as "someone already suggested this".
- Approval goes through the normal write path, so counts, caches and the level pages update within seconds, exactly as for any other new pin.
- Rejection touches nothing live, so no cache needs clearing.
- A merge produces one decrement and one increment, which cancel at every level above the two pins. Area counts do not flicker.

### 20.9 Abuse and edge cases

| Case | Handling |
| --- | --- |
| Double tap on submit | `pending_unique` rejects the second write. The client treats that error as "already submitted" rather than showing a failure. |
| Two users, same new pin, same minute | The second is offered "Follow this suggestion" from the pending candidates. If they race past it, `pending_unique` catches it and converts the second into a second on the first. |
| Spam flood | Limits: 10 submissions per user per day, 3 per hour, 1 per cell per type per day. An untrusted account's first submission is always reviewed. |
| Self-promoting shops | Commercial facilities always need approval, and the referral fields stay disabled until a partner agreement exists. |
| A chain with several branches | Distance keeps them apart. A matching domain alone never marks a duplicate, it only raises the score when the pins are also close. |
| Bad coordinates, for example the pin in the sea | Reject at submit time: the point must fall inside a known state polygon, or the form asks the user to move it. |
| Submission about a record that is merged before review | At approval the target is resolved through `mergedInto`, so the merge lands on the surviving record. |
| The tree changes while a submission waits | `geoRef` is resolved again at approval, never trusted from submit time. |
| An approved pin turns out to be a duplicate later | Use "merge two live records" in 20.6. That path exists precisely because detection will never be perfect. |

### 20.10 Tests and rollout

**Tests**

1. A fixture set of about 40 real pairs from your seed data, labelled duplicate or not, run through the scorer. Require no near-certain false positives and recall above 0.9 on near-certain pairs. Keep the set in the repository and re-run it whenever a threshold changes.
2. `nameKey` unit tests, including Arabic forms, "Wadi Shawka Dam Parking" against "wadi shawka dam car park", and word-order swaps.
3. Cell neighbour coverage: two pins 5 m apart across a cell boundary must still find each other.
4. Concurrency: 20 identical submissions in parallel produce one pending record and 19 seconds.
5. `expectIndexed` for `dedupe_cells`, `pending_near` and `queue`, with `findCandidates` under 20 ms p95 on a seeded database.
6. Merge and undo: counters, reviews, photos and attachments all land correctly, and undo restores the prior state.

**Rollout**

1. Add `dedupe` and `aliases` to `places` and `geo_nodes`, and backfill them in the same batched script as `geoRef` in 18.11.
2. Create `submissions` and `merges` with the indexes in 20.5.
3. Run the detector in **shadow mode** first: it scores every existing pin pair in a cell and writes a report, without changing anything. Tune the thresholds against that report before any user sees a candidate.
4. Ship the admin queue before the submission form. There must be somewhere for the first submission to go.
5. Ship the submission form with everything set to "always review", including amenities.
6. Turn on trusted auto-approval for amenities only after the rejection rate for trusted members stays below 5% for a month.

**Prompt 14: submissions, duplicates and approval**

```text
Using section 20 of the attached plan, implement: nameKey and cellsFor with unit tests; dedupe and aliases on
places and geo_nodes; the submissions and merges collections and the indexes in 20.5; findCandidates with the
scoring thresholds in 20.2, searching live records and pending submissions together, under 20 ms p95;
POST /submissions (with the insist reason and the candidates shown), POST /submissions/:id/second, and the
admin endpoints approve, merge, reject and undo from 20.6; the rate limits and the in-sea coordinate check
from 20.9; and a shadow-mode script that scores existing pins and writes a tuning report.
Areas, venues, trails, camp spots and commercial facilities always require approval; amenity facilities may
auto-approve only for trusted members when no candidate was found, behind a configuration flag that is off
by default. Pending records are never counted anywhere.
```

### 20.11 Questions

1. How many admins will review, and what review time should the confirmation screen promise?
2. Should a user be able to edit a live pin directly, or only through an `edit` submission? This plan assumes submissions for everyone except admins.
3. Do you want a visible reputation for contributors, for example a count of approved pins on the profile? It raises quality and costs little.
4. Is 10 submissions per user per day the right ceiling for a launch where you want contributions?
5. Who owns the rejection wording? It is the most common message the app will send to an enthusiastic user.

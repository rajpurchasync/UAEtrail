# UAE Trail — Product north star

**Canonical product concept.** All user-facing copy, surface design, and feature decisions should align with this document before shipping.

Companion docs: [`DOCS_INDEX.md`](./DOCS_INDEX.md) (canonical map), [`NAVIGATION.md`](./NAVIGATION.md) (where things live), [`LANDING.md`](./LANDING.md) (guest funnel), [`ARCHITECTURE.md`](./ARCHITECTURE.md) (implementation), [`CREATE_FLOW.md`](./CREATE_FLOW.md) (FAB + organize/find/add), [`MEMBER_MODEL.md`](./MEMBER_MODEL.md) (community vs Pro vs business host), [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) (explore card copy).

Code mirror (short strings for UI): `src/content/productNorthStar.ts`.

---

## One line

**The outdoors are better together — find your people in the UAE & GCC, make a plan, and go.**

Alternate pitches (same idea, different emphasis):

- *Don't get outside alone unless you want to.*
- *Find people to hike, camp, run, and get outdoors with — today, not someday.*
- *Your crew for whatever pulls you outside — residents, visitors, same vibe.*

---

## The problem we solve

People in the UAE & GCC want to **get outside** — hike, camp, trail run, jog, group adventures — but too often:

- They **don't have anyone to go with**
- Group chats **flake** or never become real plans
- They're **new here** (tourist, expat, visitor) and don't know the scene
- They went once but it **didn't turn into lasting connections**

The pain is **loneliness and missed connection**, not missing trail coordinates. Maps and listings help; **people and follow-through** are the product.

---

## Who it's for

| Include | Notes |
|---------|--------|
| UAE & GCC **residents** and **expats** | Core community |
| **Tourists and visitors** | Here for a week or a season — can browse and join |
| Anyone who wants **like-minded company outdoors** | Not limited to “serious hikers” |

Do **not** frame the product as “for people living in the UAE only” or “hiking and camping only.”

---

## What we promise (customer experience)

Lead with **feelings and outcomes**, not modules:

| Experience | User language |
|------------|----------------|
| **Belonging** | Find people who want the same kind of outdoor time |
| **Real plans** | Something happening near you — not vague “we should go sometime” |
| **Connect first** | Chat, align, know who's going |
| **Do it together** | Show up as a group — hike, camp, run, jog, whatever you're into |
| **Keep going** | Same crew, next outing easier |
| **Low pressure** | Browse free; join when you're ready |

**Mechanisms** (map, organizers, join requests, demand posts, buddies, group chat) exist to **deliver** these experiences. They are not the headline.

---

## Methodology (how the product works — emotionally)

Same rhythm as the best social-outdoor apps; UAE Trail's version:

1. **See what's on** — outings and outdoor plans near you  
2. **Say what you want** — if nothing fits, post what you're looking for  
3. **Connect** — chat, meet like-minded people, form a group  
4. **Go together** — show up outdoors  
5. **Stay connected** — buddies, group chat, repeat crew  

Landing teaches **promise + proof + path**. Explore **is** the product. Profile **continues** the relationship.

---

## Activity scope (copy)

Say **get outside** / **outdoor outings** / **activities that get you outdoors** — then give examples:

- Hiking, camping, trail runs, jogs, group outdoor events, carpools to trailheads, etc.

Avoid narrowing marketing to “hiking & camping platform” unless SEO metadata requires it — even then, subtitle should widen (“and outdoor crew”, “get outside together”).

---

## Surfaces and north star

| Surface | Route | North-star job |
|---------|-------|----------------|
| **Marketing** | `/` | Emotional promise + trust + proof → **Explore the map** or **Join free** |
| **Browse** | `/explore` | **Find people and plans** — map/list of what's on + FAB to organize, find, or add |
| **Entity detail** | `/activity`, `/trail`, … | **Understand the plan** → **I'm going** or **request to join** (see [`CREATE_FLOW.md`](./CREATE_FLOW.md)) |
| **Personal hub** | `/profile` | **Your crew & what's next** — up next, messages, repeat outings |
| **Publishing workspace** | `/host/*` | **Organizer / operator tools** — enable others to go together (secondary audience; not landing lead) |

**Hard rules**

- Signed-in users never stay on `/` — product home is `/explore`  
- Do not teach full marketplace mechanics on landing  
- Do not describe the product as a “trail database” or “host management tool” to consumers  

---

## Copy principles (for humans and agents)

1. **Emotion before architecture** — togetherness, crew, today-not-someday  
2. **Wide audience** — residents, expats, tourists, visitors  
3. **Wide activities** — get outside; examples, not limits  
4. **One job per section** on landing — no duplicate “verified hosts” blocks  
5. **Show proof early** — real activities beat abstract feature lists  
6. **Mechanisms in support copy** — hosts, map, join requests are *how*, not *why*  

---

## Anti-patterns (do not ship)

- “Discover trails on a live map with verified hosts” as the **lead** line  
- “For UAE residents who hike”  
- “Hiking and camping only” as product definition  
- Feature grids that read like an architecture brief  
- Three identical UI patterns stacked (trust strip clone × 3)  
- Explaining demand, buddies, host console, or shops on guest landing  

---

## When changing product or copy

1. Read this doc  
2. Ask: does this help someone **find people and get outside together**?  
3. Update `src/content/productNorthStar.ts` if canonical strings change  
4. Update surface copy (`homeMarketing.ts`, `productNorthStar.ts`, auth, profile empty states, explore coach, FAQs, SEO, store listings) in the same PR  
5. Update `LANDING.md` / `CREATE_FLOW.md` / `explore-ux-spec.md` if section jobs, FAB, or participation tone shift  

## Surface copy index

| Surface | Primary file(s) |
|---------|------------------|
| Canonical strings | `src/content/productNorthStar.ts` |
| Guest landing | `src/content/homeMarketing.ts` (+ fallback activities in `homeLanding.ts`) |
| SEO defaults | `src/config/seo.ts` |
| Auth | `SignUp.tsx`, `SignIn.tsx`, `WelcomeSignup.tsx` |
| Profile empty | `Profile.tsx` hub sections; joined upcoming on `/plan` → `PlanJoinedUpcoming.tsx` |
| Explore FAB + wizards | `CreateIntentSheet.tsx`, `hostingFlowEngine.ts`, `seekingFlowEngine.ts`, `addFlow.ts` · spec: [`CREATE_FLOW.md`](./CREATE_FLOW.md) |
| Explore chrome | `ExploreCoachMarks.tsx`, `ExploreExperience.tsx` |
| Explore cards | `packages/shared-types/src/explore-presentation.ts` |
| Activity blurbs | `src/config/activityTypes.ts` |
| FAQs | `src/content/platformFaqs.ts` |
| Store listings | `docs/PLAY_STORE_LISTING.md`, `docs/IOS_RELEASE.md` § Review notes |

---

## Related

| Doc | Role |
|-----|------|
| [`LANDING.md`](./LANDING.md) | Guest funnel sections |
| [`NAVIGATION.md`](./NAVIGATION.md) | Routes and redirects |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | System shape |
| [`DOMAIN.md`](./DOMAIN.md) | Entity glossary |
| [`CREATE_FLOW.md`](./CREATE_FLOW.md) | FAB, organize/find/add, Event vs Activity, participation |
| [`experiment/explore-ux-spec.md`](./experiment/explore-ux-spec.md) | Explore card templates |

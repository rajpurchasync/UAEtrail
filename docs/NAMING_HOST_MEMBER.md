# Naming — host, member, join, request

Use this vocabulary in **new code, files, and comments**. Legacy names may remain as aliases until removed.

**Entity & route canon (Place, Activity, `/trips`, `EntityRef`):** [`DOMAIN_CANONICALS.md`](./DOMAIN_CANONICALS.md)

## Glossary

| Term | Means | Storage / route |
|------|--------|-----------------|
| **Community host (buddy)** | Profile complete → can Organize; optional **Host** label after first map post | `GET /me/host-status`, buddy tenant `publishingPurpose: community` |
| **Pro / business host** | Agency, shop, professional guide onboarding | `/profile/pro-membership`, `host_applications` |
| **Host console** | Tenant-scoped publish/manage | `/host/*`, header `x-organisation-id` |
| **Activity join request** | Participant asks to join a **published activity** (approval mode) | `activity_requests`, `/host/requests`, `/activities/:id/requests` |
| **Demand join request** | Member asks to join someone’s **Find** post | `participant_intent_requests`, `/me/participant-intents/.../requests` |
| **Host application** | Apply to become Pro/agency/shop | `host_applications`, `POST /me/host-application` |

## Forbidden ambiguities

| Do not name / say | Use instead |
|-------------------|-------------|
| `registerHostJoinRequestRoutes` | `registerHostActivityRequestRoutes` |
| “Join request” without **activity** or **demand** | “Activity join queue” or “demand join request” |
| `isHostRole` for Organize / console / messages gates | `canPublish`, `canAccessHostConsole` from host-status |
| Link UI to `/become-host` | `PRO_MEMBERSHIP_PATH` or `/welcome` (profile incomplete) |
| Re-derive tiers in React from `UserRole` | `GET /me/host-status` |

## File naming (`apps/api/src/routes/host/`)

| File | Registers |
|------|-----------|
| `registerHostActivityRequestRoutes.ts` | Activity join queue (`/host/requests`) |
| `registerHostTeamRoutes.ts` | Tenant team CRUD |
| `registerHostDemandFulfillLegacy.ts` | Deprecated tenant fulfill → prefer `link-activity` |
| `registerMemberHostStatusRoutes.ts` | `GET /me/host-status` (member scope, lives under `routes/user/`) |

## Verification

```bash
npm run verify:host-member
```

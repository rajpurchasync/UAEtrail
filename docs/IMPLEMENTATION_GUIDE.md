# UAE Trail — Implementation Guide

> **Version**: 1.0 (Frozen)  
> **Date**: February 26, 2026  
> **Stack**: React 18 + Vite · Express + Prisma + PostgreSQL · Tailwind CSS · S3/MinIO  

---

## 1. Platform Vision

UAE Trail is a community-driven hiking & camping platform for the UAE. Users browse outdoor locations, join organized trips, connect with organizers, and shop for gear — all under a freemium membership model.

### User Roles

| Role | Description |
|------|-------------|
| **Visitor** (Hiker/Camper) | Browse locations, view events, request to join trips, manage profile, chat with organizers |
| **Organizer** (Company or Individual) | Create & manage events, publish trips, approve participants, check-in on the day, manage team |
| **Merchant** | Create shop profile, list products with images/pricing, manage inventory |
| **Platform Admin** | Govern platform: manage locations, approve organizers, moderate events, oversee all users & activity |

> A Visitor can apply to become an Organizer. Merchants are an extension (any authenticated user can set up a merchant profile — no role change needed).

### Membership Tiers

| Tier | Price | Benefits |
|------|-------|----------|
| **Free** | AED 0 | Join up to 3 trails, free community trips, basic location info, community forum |
| **Premium** | AED 99/mo or AED 999/yr | Unlimited trails, early booking access, 15% gear discount, offline maps, exclusive trails, priority support, no ads |

---

## 2. Current State (What Already Works)

### Database (15 models — all migrated & seeded)
- `User`, `Profile`, `Tenant`, `TenantMembership`, `OrganizerApplication`
- `Location`, `Event`, `EventRequest`, `EventParticipant`
- `MediaAsset`, `Notification`, `RefreshToken`, `AuditLog`
- `EmailVerificationToken`, `PasswordResetToken`

### Backend API (fully functional)
- **Auth**: register, login, refresh, logout, email verify, password reset
- **Admin**: CRUD locations, approve/reject organizer applications, moderate events, dashboard metrics
- **Organizer**: CRUD events, publish, manage join requests (approve/reject), manage team members
- **User/Public**: browse locations & events, join request flow, profile management, notifications
- **Media**: S3 presigned upload + commit

### Frontend Pages (all rendering)
- **Public**: Home, Discovery, TrailDetail, CampDetail, Calendar, TripDetail, OperatorProfile, Membership, Shop, Community, SignIn, SignUp
- **Admin Dashboard**: Overview (metrics), Locations (create+list), Organizers (applications), Events (moderation)
- **Organizer Dashboard**: Overview, Events (create+publish), Requests, Team, Profile
- **User Dashboard**: Overview, Requests, Trips, Profile

### What's Missing or Incomplete

| Area | Gap |
|------|-----|
| Admin | No user management (list/view/suspend users), no tenant oversight, location edit/deactivate UI incomplete |
| Organizer | No image upload in event creation, no participant check-in, no event edit UI, no activity type selector |
| Visitor | BookingModal is mock-only, public pages use hardcoded data instead of API, no messaging |
| Shop | Frontend-only with mock data, no backend product/merchant models |
| Community | 100% local state, no persistence |
| Membership | Static page, no payment/subscription backend |
| TenantSwitcher | Manual UUID paste instead of dropdown |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                   │
│                  localhost:5175                      │
│                                                     │
│  Public Pages ──── Dashboard Pages ──── Shop Pages  │
│       │                  │                  │       │
│       └──────── src/api/services.ts ────────┘       │
│                      │                              │
│              apiRequest(path, init)                  │
│              Bearer token from localStorage         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (JSON)
┌──────────────────────┴──────────────────────────────┐
│                  Backend (Express)                   │
│                  localhost:4000                      │
│                                                     │
│  /api/v1/auth    /api/v1/admin    /api/v1/organizer │
│  /api/v1/media   /api/v1/chat     /api/v1/shop      │
│  /api/v1/ (user/public)                             │
│       │                                             │
│  Middleware: auth → rbac → tenant → validate        │
│       │                                             │
│  Prisma ORM ──→ PostgreSQL (localhost:5432)          │
│  S3 Client ───→ MinIO/S3 (localhost:9000)            │
└─────────────────────────────────────────────────────┘
```

### Key Conventions
- **Backend**: ESM (`"type": "module"`), `.js` extensions in imports, Zod validation, `ApiError` for error responses, `AuditLog` for admin/organizer actions
- **Frontend**: React Router v7, `apiRequest<T>()` generic fetch wrapper, localStorage session, role-based `ProtectedRoute`
- **Shared types**: `packages/shared-types/src/index.ts` — DTOs used by both ends
- **Tenant context**: Organizer routes require `x-tenant-id` header; frontend stores `activeTenantId` in localStorage

---

## 4. Implementation Phases

---

### Phase 1: Schema Enhancements

**File**: `apps/api/prisma/schema.prisma`

#### 1a. Add `checkedInAt` to EventParticipant
```prisma
model EventParticipant {
  // ...existing fields...
  checkedInAt   DateTime?          // organizer marks check-in
}
```

#### 1b. Add ChatMessage model
```prisma
model ChatMessage {
  id          String   @id @default(uuid())
  senderId    String
  receiverId  String
  eventId     String?
  content     String
  readAt      DateTime?
  createdAt   DateTime @default(now())

  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  event       Event?   @relation(fields: [eventId], references: [id])
}
```

#### 1c. Add MerchantProfile model
```prisma
model MerchantProfile {
  id            String    @id @default(uuid())
  userId        String    @unique
  shopName      String
  description   String?
  logo          String?
  contactEmail  String?
  contactPhone  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  products      Product[]
}
```

#### 1d. Add Product model
```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  INACTIVE
}

model Product {
  id              String          @id @default(uuid())
  merchantId      String
  name            String
  description     String?
  images          String[]
  priceAed        Int
  discountPercent Int?
  packagingInfo   String?
  category        String
  status          ProductStatus   @default(DRAFT)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  merchant        MerchantProfile @relation(fields: [merchantId], references: [id])
}
```

#### 1e. Extend Location with submittedById
```prisma
model Location {
  // ...existing fields...
  submittedById  String?
  submittedBy    User?   @relation("SubmittedLocations", fields: [submittedById], references: [id])
}
```

#### 1f. Update User relations
```prisma
model User {
  // ...add these relations...
  sentMessages       ChatMessage[]     @relation("SentMessages")
  receivedMessages   ChatMessage[]     @relation("ReceivedMessages")
  merchantProfile    MerchantProfile?
  submittedLocations Location[]        @relation("SubmittedLocations")
}
```

**Run**: `npx prisma migrate dev --name phase1_schema`

---

### Phase 2: Backend — Admin Enhancements

**File**: `apps/api/src/routes/admin.ts`

#### 2a. User Management Endpoints (NEW)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/users` | List all users with profiles. Query: `role`, `status`, `search` (email/name), `page`, `pageSize` |
| `GET` | `/admin/users/:id` | User detail: profile, join requests, participations, tenant memberships, activity summary |
| `PATCH` | `/admin/users/:id/status` | Suspend/activate user. Body: `{ status: 'ACTIVE' \| 'SUSPENDED' }`. Audit logged |

#### 2b. Tenant Oversight Endpoints (NEW)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/tenants` | List all tenants with owner info, member count, event count, status |
| `GET` | `/admin/tenants/:id` | Full tenant detail: members, events, upcoming events, participant counts |
| `PATCH` | `/admin/tenants/:id/status` | Activate/suspend tenant. Body: `{ status: 'ACTIVE' \| 'SUSPENDED' }`. Audit logged |

#### 2c. Enhanced Location Management
- Ensure `locationPatchSchema` includes `status` field for activate/deactivate

#### 2d. Enhanced Metrics
Extend `GET /admin/metrics` to include: `totalUsers`, `activeUsers`, `totalLocations`, `totalParticipants`

---

### Phase 3: Backend — Organizer Enhancements

**File**: `apps/api/src/routes/organizer.ts`

#### 3a. Event Creation Improvements
- Ensure `eventCreateSchema` includes `images: z.array(z.string()).optional()`

#### 3b. Participant Check-in (NEW)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/organizer/events/:id/participants` | List confirmed participants with check-in status and profiles |
| `POST` | `/organizer/events/:id/participants/:participantId/checkin` | Mark checked in (`checkedInAt = now()`) |
| `DELETE` | `/organizer/events/:id/participants/:participantId/checkin` | Undo check-in (`checkedInAt = null`) |

#### 3c. Location Submission (NEW)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/organizer/locations` | Submit location for admin review (status=INACTIVE, submittedById=user). Audit logged |

#### 3d. Past Events / History

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/organizer/events/history` | Past events (startAt < now) with participant counts and check-in stats |

---

### Phase 4: Backend — Chat & Shop

#### 4a. Chat Routes (NEW file: `apps/api/src/routes/chat.ts`)

All require `requireAuth + requireVerifiedEmail`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/chat/conversations` | List distinct conversation partners with last message, unread count |
| `GET` | `/chat/messages/:userId` | Message thread with user (paginated). Marks received messages as read |
| `POST` | `/chat/messages` | Send message. Body: `{ receiverId, content, eventId? }`. Creates notification |

#### 4b. Shop Routes (NEW file: `apps/api/src/routes/shop.ts`)

**Public**:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/shop/products` | List active products. Query: `category`, `search`, `page`, `pageSize` |
| `GET` | `/shop/products/:id` | Product detail with merchant info |
| `GET` | `/shop/merchants/:id` | Public merchant profile with products |

**Merchant (auth required)**:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/shop/merchant/profile` | Own merchant profile |
| `POST` | `/shop/merchant/profile` | Create merchant profile |
| `PATCH` | `/shop/merchant/profile` | Update merchant profile |
| `GET` | `/shop/merchant/products` | List own products (all statuses) |
| `POST` | `/shop/merchant/products` | Add product |
| `PATCH` | `/shop/merchant/products/:id` | Update product (own only) |
| `DELETE` | `/shop/merchant/products/:id` | Soft-delete (set INACTIVE) |

#### 4c. Register Routers

**File**: `apps/api/src/routes/index.ts` — mount `/chat` and `/shop`

---

### Phase 5: Shared Types Updates

**File**: `packages/shared-types/src/index.ts`

Add:
```typescript
export interface ChatConversationDTO {
  userId: string; displayName: string; avatarUrl?: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number;
}
export interface ChatMessageDTO {
  id: string; senderId: string; receiverId: string;
  content: string; eventId?: string; readAt?: string; createdAt: string;
}
export interface ProductDTO {
  id: string; name: string; description?: string; images: string[];
  priceAed: number; discountPercent?: number; packagingInfo?: string;
  category: string; status: 'draft' | 'active' | 'inactive';
  merchantName: string; merchantId: string;
}
export interface MerchantProfileDTO {
  id: string; shopName: string; description?: string;
  logo?: string; contactEmail?: string; contactPhone?: string;
}
export interface UserListDTO {
  id: string; email: string; role: UserRole; status: 'active' | 'suspended';
  displayName?: string; createdAt: string;
}
export interface TenantListDTO {
  id: string; name: string; slug: string; type: TenantType;
  status: 'pending' | 'active' | 'suspended';
  ownerName: string; memberCount: number; eventCount: number;
}
export interface ParticipantDTO {
  id: string; userId: string; displayName: string; phone?: string;
  avatarUrl?: string; checkedInAt?: string; joinedAt: string;
}
```

---

### Phase 6: Frontend — API Service Layer

**File**: `src/api/services.ts`

Add all new methods:

```
// Admin - Users
getAdminUsers(filters?)            → GET /admin/users
getAdminUserDetail(id)             → GET /admin/users/:id
updateAdminUserStatus(id, status)  → PATCH /admin/users/:id/status

// Admin - Tenants
getAdminTenants()                  → GET /admin/tenants
getAdminTenantDetail(id)           → GET /admin/tenants/:id
updateAdminTenantStatus(id, st)    → PATCH /admin/tenants/:id/status

// Organizer - Check-in
getEventParticipants(tId, eId)     → GET /organizer/events/:id/participants
checkinParticipant(tId, eId, pId)  → POST /organizer/events/:id/participants/:pId/checkin
undoCheckin(tId, eId, pId)         → DELETE /organizer/events/:id/participants/:pId/checkin

// Organizer - Locations
submitLocation(tId, payload)       → POST /organizer/locations

// Organizer - History
getEventHistory(tId)               → GET /organizer/events/history

// Chat
getConversations()                 → GET /chat/conversations
getMessages(userId)                → GET /chat/messages/:userId
sendMessage(payload)               → POST /chat/messages

// Shop - Public
getShopProducts(filters?)          → GET /shop/products
getShopProductDetail(id)           → GET /shop/products/:id

// Shop - Merchant
getMerchantProfile()               → GET /shop/merchant/profile
createMerchantProfile(payload)     → POST /shop/merchant/profile
updateMerchantProfile(payload)     → PATCH /shop/merchant/profile
getMerchantProducts()              → GET /shop/merchant/products
addMerchantProduct(payload)        → POST /shop/merchant/products
updateMerchantProduct(id, data)    → PATCH /shop/merchant/products/:id
deleteMerchantProduct(id)          → DELETE /shop/merchant/products/:id
```

---

### Phase 7: Frontend — Admin Dashboard

#### 7a. AdminLocations.tsx (ENHANCE)
- Full CRUD form: name, region, activityType (Hiking/Camping), difficulty, description, images (multi-upload via presign), season checkboxes, childFriendly toggle, maxGroupSize, accessibility, featured toggle
- Edit modal: click row → pre-filled form → PATCH on save
- Status toggle: Active/Inactive button per row with confirmation
- Table columns: Name, Region, Type, Difficulty, Status, Featured, Actions

#### 7b. AdminUsers.tsx (NEW PAGE)
- Table: displayName, email, role badge, status badge, joined date, actions
- Filters: role dropdown, status dropdown, search input
- Detail modal: profile, recent requests, trip history, tenant memberships
- Actions: Suspend / Activate with confirmation
- Route: `/admin/users`

#### 7c. AdminOrganizers.tsx (ENHANCE)
- Two tabs: "Applications" (existing) + "Active Tenants" (new)
- Tenants tab: table with name, type, owner, members, events, status, actions
- Tenant detail modal: members list, events list with participant counts
- Actions: Suspend / Activate tenant

#### 7d. AdminEvents.tsx (ENHANCE)
- More columns: location, date, capacity, participants/capacity, guide, organizer
- Filters: status, date range, activity type
- Detail expand: full event info, participant list

#### 7e. AdminOverview.tsx (ENHANCE)
- New metric cards: Total Users, Active Users, Total Locations, Total Participants
- Recent activity feed from AuditLog

#### 7f. Navigation
- Add "Users" link to admin sidebar in all admin pages

---

### Phase 8: Frontend — Organizer Dashboard

#### 8a. OrganizerEvents.tsx (ENHANCE)
- Activity type selector: Hiking/Camping radio
- Image upload: multi-image via presigned URL flow (presign → S3 PUT → commit)
- Full form fields: title, description, location dropdown, startAt, endAt, meetingPoint, itinerary, requirements, priceAed (0=free), capacity, guideId
- Edit modal for existing events
- Cancel button with confirmation
- Status badges: Draft (gray), Published (green), Cancelled (red), Suspended (orange)

#### 8b. OrganizerRequests.tsx (ENHANCE)
- Organizer note text field on approve/reject
- Requester profile details: displayName, phone, bio, avatar
- Request note from visitor

#### 8c. Participant Check-in (NEW section in OrganizerEvents)
- "Manage" button on published events → participant list view
- Each row: name, avatar, phone, check-in toggle
- Status: green checkmark (checked in) / gray circle (pending)
- Summary bar: "12/15 checked in"
- Undo check-in option

#### 8d. OrganizerLocations.tsx (NEW PAGE)
- Form to submit new location (same fields as admin create)
- "Pending Admin Approval" status indicator
- List of own submitted locations with status
- Route: `/organizer/locations`

#### 8e. OrganizerHistory.tsx (NEW PAGE)
- Past events list: title, date, participant count, check-in rate
- Route: `/organizer/history`

#### 8f. TenantSwitcher Fix
- Replace UUID input with dropdown populated from `GET /me/tenants`
- Auto-select first tenant if only one

---

### Phase 9: Frontend — Visitor / User Dashboard

#### 9a. Switch Public Pages to API Data
- Remove feature flag gating in `src/api/public.ts`
- API calls as default, mock data as fallback only

#### 9b. BookingModal Fix
- Replace mock `setTimeout` with `api.createJoinRequest(eventId, note)`
- Success/error feedback, redirect to dashboard requests

#### 9c. Messages.tsx (NEW PAGE)
- Left panel: conversation list from `GET /chat/conversations`
- Right panel: message thread from `GET /chat/messages/:userId`
- Bottom: message input + send
- Unread badge on conversations
- Route: `/dashboard/messages`

#### 9d. Dashboard Enhancements
- `UserOverview.tsx`: upcoming trips prominently, unread message count
- `UserTrips.tsx`: check-in status per trip, past/upcoming tabs
- `UserRequests.tsx`: cancellation confirmed working

---

### Phase 10: Frontend — Shop

#### 10a. Shop.tsx (REWRITE)
- Fetch from `GET /shop/products` instead of mock data
- Category/search filter bar
- Product cards: image, name, price, discount badge, merchant name
- Premium discount banner retained

#### 10b. MerchantDashboard.tsx (NEW PAGE)
- Profile section: create/edit merchant profile (shopName, description, logo upload, contact)
- Products section: own products table with status badges
- Add product form: name, description, images (multi-upload), priceAed, discountPercent, packagingInfo, category
- Edit product modal
- Delete (soft) with confirmation
- Route: `/merchant/dashboard`

---

### Phase 11: Frontend — Routes & Navigation

#### 11a. New Routes in App.tsx

| Path | Component | Protection |
|------|-----------|------------|
| `/admin/users` | `AdminUsers` | `platform_admin` |
| `/dashboard/messages` | `Messages` | all authenticated |
| `/merchant/dashboard` | `MerchantDashboard` | all authenticated |
| `/organizer/locations` | `OrganizerLocations` | organizer roles |
| `/organizer/history` | `OrganizerHistory` | organizer roles |

#### 11b. Sidebar Link Updates

- **Admin**: add "Users" (`/admin/users`)
- **Organizer**: add "Locations" (`/organizer/locations`), "History" (`/organizer/history`)
- **User**: add "Messages" (`/dashboard/messages`)

---

### Phase 12: Seed Data Updates

**File**: `apps/api/prisma/seed.ts`

- Sample merchant profile for visitor user
- 3-5 sample products with images, prices, categories
- Sample chat messages between visitor and organizer
- Sample checked-in participant on existing event

---

## 5. File Change Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/routes/chat.ts` | Chat message endpoints |
| `apps/api/src/routes/shop.ts` | Product & merchant endpoints |
| `src/pages/AdminUsers.tsx` | Admin user management |
| `src/pages/Messages.tsx` | Visitor-organizer messaging |
| `src/pages/MerchantDashboard.tsx` | Merchant profile & product management |
| `src/pages/OrganizerLocations.tsx` | Organizer location submission |
| `src/pages/OrganizerHistory.tsx` | Past events with check-in stats |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/api/prisma/schema.prisma` | Add ChatMessage, MerchantProfile, Product; extend EventParticipant, Location, User |
| `apps/api/src/routes/index.ts` | Register chat & shop routers |
| `apps/api/src/routes/admin.ts` | User management + tenant oversight endpoints |
| `apps/api/src/routes/organizer.ts` | Check-in + location submission + history endpoints |
| `apps/api/prisma/seed.ts` | Merchant, products, chat, check-in seed data |
| `packages/shared-types/src/index.ts` | New DTOs |
| `src/api/services.ts` | All new API methods |
| `src/App.tsx` | New routes |
| `src/pages/index.ts` | Export new page components |
| `src/pages/AdminLocations.tsx` | Full CRUD with edit, status toggle, image upload |
| `src/pages/AdminOrganizers.tsx` | Tenants tab with oversight |
| `src/pages/AdminEvents.tsx` | Enhanced columns, filters, detail |
| `src/pages/AdminOverview.tsx` | More metrics, activity feed |
| `src/pages/OrganizerEvents.tsx` | Image upload, activity type, edit, cancel, check-in |
| `src/pages/OrganizerRequests.tsx` | Organizer note, requester profile |
| `src/pages/Shop.tsx` | API-backed product listing |
| `src/components/ui/TenantSwitcher.tsx` | Dropdown from API |
| `src/components/ui/BookingModal.tsx` | Real API call |
| `src/api/public.ts` | Remove feature flag gating |

---

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Chat is HTTP-based (not WebSocket) | Simpler initially; upgrade to real-time later |
| Merchant is a profile extension, not a role | Any user can sell without changing role |
| Organizer-submitted locations start INACTIVE | Admin quality gate for the directory |
| No payment integration yet | Pricing displayed but purchase flow deferred |
| Images via S3 presigned URLs | Reuse existing media routes |
| Public pages switch to API-first | Remove feature flag complexity |
| Product deletion is soft-delete | Set INACTIVE; preserves data integrity |

---

## 7. Estimated Effort

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Schema + migration | 30 min |
| 2 | Admin backend | 2 hrs |
| 3 | Organizer backend | 1.5 hrs |
| 4 | Chat + Shop backend | 2.5 hrs |
| 5 | Shared types | 30 min |
| 6 | Frontend API layer | 1 hr |
| 7 | Admin frontend | 3 hrs |
| 8 | Organizer frontend | 3 hrs |
| 9 | Visitor frontend | 2 hrs |
| 10 | Shop frontend | 2 hrs |
| 11 | Routes & nav wiring | 30 min |
| 12 | Seed data | 30 min |
| **Total** | | **~19 hrs** |

---

## 8. Verification Checklist

### Backend
- [ ] `npx prisma migrate dev` succeeds
- [ ] `npm run prisma:seed` completes without errors
- [ ] `npm run typecheck:api` — no TS errors
- [ ] `npm run dev:api` — server starts on port 4000
- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] Admin login → `GET /admin/users` returns user list
- [ ] Organizer login → `POST /organizer/events/:id/participants/:pid/checkin` works
- [ ] `POST /chat/messages` sends message
- [ ] `GET /shop/products` returns products
- [ ] `POST /shop/merchant/products` adds product

### Frontend
- [ ] `npm run typecheck` — no TS errors
- [ ] `npm run dev` — Vite starts on port 5175
- [ ] Admin → Users page loads with user table
- [ ] Admin → Locations → create, edit, deactivate
- [ ] Admin → Organizers → Tenants tab
- [ ] Organizer → create event with image upload
- [ ] Organizer → check-in participants
- [ ] Organizer → submit location
- [ ] Visitor → browse events → request to join
- [ ] Visitor → Messages → chat with organizer
- [ ] Shop → browse API products
- [ ] Merchant → add product

---

## 9. Future Considerations (Out of Scope)

- Real-time chat (WebSocket/SSE)
- Payment gateway (Stripe, PayTabs) for memberships & paid events
- E-commerce affiliate API for shop
- Mobile app (React Native / PWA)
- Push notifications (Firebase/APNs)
- GPX upload & offline maps
- Review/rating system
- Advanced analytics
- Email service (SendGrid/SES)
- Rate limiting & API throttling

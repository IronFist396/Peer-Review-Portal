# Database Schema Documentation

## Overview
This peer review portal uses a PostgreSQL database with three main tables: `User`, `Review`, and `SystemSettings`. The schema is managed by Prisma ORM.

---

## Tables

### `User` Table
Stores all user accounts (students and admins).

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (cuid) | Primary Key |
| `email` | String | User's email address | Unique, Required |
| `password` | String | Hashed password (bcrypt) | Required |
| `name` | String? | Full name | Optional |
| `department` | String? | Department (e.g., "CS", "Eco") | Optional |
| `year` | Int? | Academic year (1-4) | Optional |
| `isAdmin` | Boolean | Whether user is an admin | Default: false |
| `hasSubmitted` | Boolean | Whether user has submitted reviews | Default: false |
| `submittedAt` | DateTime? | When reviews were submitted | Optional |
| `hostel` | String? | Hostel assignment (e.g., "Hostel 5") | Optional |
| `pors` | String[] | Array of POR positions | Array (can be empty) |

**Relations:**
- `reviewsWritten` → Many `Review` records (as reviewer)
- `reviewsReceived` → Many `Review` records (as reviewee)

---

### `Review` Table
Stores peer review submissions. Links reviewers to reviewees with ratings.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (cuid) | Primary Key |
| `createdAt` | DateTime | Timestamp of creation | Default: now() |
| `behavior` | Int | Behavior rating (1-10) | Required |
| `social` | Int | Social skills rating (1-10) | Required |
| `academic` | Int | Academic rating (1-10) | Required |
| `feedback` | String? | Optional text feedback | Optional |
| `reviewerId` | String | User who wrote the review | Foreign Key → User.id |
| `revieweeId` | String | User being reviewed | Foreign Key → User.id |

**Constraints:**
- Unique composite index on `[reviewerId, revieweeId]` — prevents duplicate reviews for the same pair

**Relations:**
- `reviewer` → One `User` (who wrote this review)
- `reviewee` → One `User` (who is being reviewed)

---

### `SystemSettings` Table
Global system configuration (singleton table - only one row exists).

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (cuid) | Primary Key |
| `reviewsEnabled` | Boolean | Kill switch for review submissions | Default: true |
| `updatedAt` | DateTime | Last modification timestamp | Auto-updated |

**Purpose:** Central control for enabling/disabling the entire review submission system.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────┐
│              User                       │
├─────────────────────────────────────────┤
│ id (PK)                    String       │
│ email (UNIQUE)             String       │
│ password                   String       │
│ name                       String?      │
│ department                 String?      │
│ year                       Int?         │
│ isAdmin                    Boolean      │
│ hasSubmitted               Boolean      │
│ submittedAt                DateTime?    │
│ hostel                     String?      │
│ pors                       String[]     │
└─────────────────────────────────────────┘
         │                    │
         │ 1                  │ 1
         │                    │
         │ reviewsWritten     │ reviewsReceived
         │                    │
         │ *                  │ *
         ▼                    ▼
┌──────────────────────────────────────────┐
│              Review                      │
├──────────────────────────────────────────┤
│ id (PK)                     String       │
│ createdAt                   DateTime     │
│ behavior                    Int          │
│ social                      Int          │
│ academic                    Int          │
│ feedback                    String?      │
│ reviewerId (FK)             String  ─────┼──→ User.id
│ revieweeId (FK)             String  ─────┼──→ User.id
├──────────────────────────────────────────┤
│ UNIQUE (reviewerId, revieweeId)          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         SystemSettings (Singleton)       │
├──────────────────────────────────────────┤
│ id (PK)                     String       │
│ reviewsEnabled              Boolean      │
│ updatedAt                   DateTime     │
└──────────────────────────────────────────┘
     ↑
     │ Read by all routes
     │ Modified only by admins
```

---

## SQL Equivalent Queries

### Example 1: Get recommended candidates matching my hostel/department/PORs
```sql
-- First get my profile
SELECT department, hostel, pors FROM "User" WHERE id = $myId;

-- Then find matches (excluding self and admins)
SELECT u.*, 
  (SELECT COUNT(*) FROM "Review" r 
   WHERE r."revieweeId" = u.id AND r."reviewerId" = $myId) as "hasReviewed"
FROM "User" u
WHERE u.id != $myId 
  AND u."isAdmin" = false
  AND (
    u.department = $myDepartment 
    OR u.hostel = $myHostel
    OR u.pors && $myPors  -- Array overlap
  )
LIMIT 20;
```

### Example 2: Submit or update a review
```sql
-- Upsert pattern (ON CONFLICT)
INSERT INTO "Review" (id, "reviewerId", "revieweeId", behavior, social, academic, "createdAt")
VALUES (gen_random_uuid(), $reviewerId, $revieweeId, $behavior, $social, $academic, NOW())
ON CONFLICT ("reviewerId", "revieweeId")
DO UPDATE SET 
  behavior = EXCLUDED.behavior,
  social = EXCLUDED.social,
  academic = EXCLUDED.academic;
```

### Example 3: Check if user can submit (>= 5 reviews)
```sql
SELECT COUNT(*) as count
FROM "Review"
WHERE "reviewerId" = $myId;

-- If count >= 5, allow submission:
UPDATE "User"
SET "hasSubmitted" = true, "submittedAt" = NOW()
WHERE id = $myId;
```

### Example 4: Admin panel - list all users with review counts
```sql
SELECT 
  u.id,
  u.name,
  u.department,
  u.email,
  u."hasSubmitted",
  COUNT(DISTINCT rw.id) as "reviewsWritten",
  COUNT(DISTINCT rr.id) as "reviewsReceived"
FROM "User" u
LEFT JOIN "Review" rw ON rw."reviewerId" = u.id
LEFT JOIN "Review" rr ON rr."revieweeId" = u.id
WHERE u."isAdmin" = false
GROUP BY u.id, u.name, u.department, u.email, u."hasSubmitted"
ORDER BY u.name ASC;
```

### Example 5: Get all reviews for a specific user (for /admin/user/[id])
```sql
-- Reviews received (what others said about them)
SELECT 
  r.id, r.behavior, r.social, r.academic,
  reviewer.name as "reviewerName"
FROM "Review" r
JOIN "User" reviewer ON r."reviewerId" = reviewer.id
WHERE r."revieweeId" = $userId;

-- Reviews written (what they said about others)
SELECT 
  r.id, r.behavior, r.social, r.academic,
  reviewee.name as "revieweeName"
FROM "Review" r
JOIN "User" reviewee ON r."revieweeId" = reviewee.id
WHERE r."reviewerId" = $userId;
```

---

## Key Design Patterns

### 1. **One-to-Many Relations**
- Each `User` can write many `Review`s (as reviewer)
- Each `User` can receive many `Review`s (as reviewee)
- Each `Review` belongs to exactly one reviewer and one reviewee

### 2. **Unique Constraint Prevents Duplicates**
```prisma
@@unique([reviewerId, revieweeId])
```
This ensures:
- A user can review another user only once
- Updates to existing reviews use upsert pattern
- Database-level integrity (can't bypass in code)

### 3. **Filtering by Relations**
```javascript
// Include reviews where I'm the reviewer
include: {
  reviewsReceived: {
    where: { reviewerId: session.user.id }
  }
}
```
This creates efficient JOINs and filters at the database level.

### 4. **Array Matching for PORs**
```javascript
pors: { hasSome: me.pors }  // PostgreSQL array overlap
```
Uses PostgreSQL's native array operations for efficient matching.

### 5. **Counting Relations**
```javascript
_count: {
  select: { 
    reviewsWritten: true, 
    reviewsReceived: true 
  }
}
```
Prisma generates optimized COUNT subqueries instead of loading full data.

---

## Data Flow Examples

### User Login Flow
```
1. User enters email + password
2. Query: SELECT * FROM "User" WHERE email = $email
3. Compare bcrypt hash of input password with stored User.password
4. If match, create JWT session with User.id
```

### Write Review Flow
```
1. User navigates to /review/[candidateId]
2. Check: SELECT "hasSubmitted" FROM "User" WHERE id = $myId
   → If true, redirect (can't edit after submission)
3. Load existing review (if any):
   SELECT * FROM "Review" 
   WHERE "reviewerId" = $myId AND "revieweeId" = $candidateId
4. User adjusts sliders (1-10 for behavior, social, academic)
5. On submit: UPSERT into "Review" table
6. Redirect to /candidates
```

### Submit Final Reviews Flow
```
1. Dashboard shows: COUNT(*) FROM "Review" WHERE "reviewerId" = $myId
2. When count >= 5, "Submit Reviews" button becomes enabled
3. User clicks → Confirmation modal appears
4. On confirm: 
   UPDATE "User" 
   SET "hasSubmitted" = true, "submittedAt" = NOW() 
   WHERE id = $myId
5. Page reloads → Dashboard shows submitted state
6. All review/candidates pages now redirect to dashboard
```

### Admin Viewing Reviews Flow
```
1. Admin clicks "Inspect" on a user
2. Query 1 (Reviews Received):
   SELECT r.*, reviewer.name FROM "Review" r
   JOIN "User" reviewer ON r."reviewerId" = reviewer.id
   WHERE r."revieweeId" = $selectedUserId
   
3. Query 2 (Reviews Written):
   SELECT r.*, reviewee.name FROM "Review" r
   JOIN "User" reviewee ON r."revieweeId" = reviewee.id
   WHERE r."reviewerId" = $selectedUserId
   
4. Display both tables with calculated averages
```

---

## Notes

- **Prisma manages migrations**: Changes to `schema.prisma` require `npx prisma migrate dev`
- **Soft deletes not implemented**: Deleting users would break foreign key constraints
- **No audit trail**: Review edits overwrite previous values (could add `updatedAt` field)
- **Case-insensitive search**: Uses `mode: "insensitive"` in Prisma queries
- **Array fields**: `pors` uses PostgreSQL native array type for flexible multi-value storage

---

## Kill Switch System

### Overview
The **Kill Switch** is a global control mechanism that allows administrators to instantly disable all review submission functionality across the entire platform without affecting data integrity or user access.

### Architecture

#### Database Layer
```sql
-- SystemSettings table (singleton pattern)
CREATE TABLE "SystemSettings" (
  id              TEXT PRIMARY KEY,
  reviewsEnabled  BOOLEAN DEFAULT true,
  updatedAt       TIMESTAMP NOT NULL
);
```

**Key Characteristics:**
- **Singleton Pattern**: Only ONE row exists in this table at any time
- **Global Scope**: Affects all users simultaneously
- **Non-destructive**: Existing data remains intact
- **Instant Effect**: Changes propagate immediately

#### How It Works

**1. Admin Toggle Action**
```javascript
// Admin clicks button in /admin panel
POST /api/toggle-reviews
Body: { enabled: true/false }

// Server updates the single settings row
UPDATE "SystemSettings"
SET "reviewsEnabled" = $newValue, "updatedAt" = NOW()
WHERE id = (SELECT id FROM "SystemSettings" LIMIT 1);
```

**2. Protection on Every Route**
All review-related pages and APIs check this flag:

```javascript
// Pattern used everywhere
const settings = await prisma.systemSettings.findFirst();
if (settings && !settings.reviewsEnabled) {
  // Block action or redirect
}
```

**3. Protection Points**

| Route/API | Action When Disabled |
|-----------|---------------------|
| `GET /candidates` | Redirect to dashboard |
| `GET /review/[id]` | Redirect to dashboard |
| `POST /api/submit-review` | Return 403 Forbidden |
| `POST /api/submit-final` | Return 403 Forbidden |
| `GET /dashboard` | Show warning banner, disable buttons |

### Admin Panel UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Panel                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Review Submission Status                            │   │
│  │ ○ Students can currently submit and edit reviews    │   │
│  │                                       [��� Disable]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  When admin clicks button:                                  │
│  1. POST /api/toggle-reviews { enabled: false }            │
│  2. UI updates immediately (optimistic)                     │
│  3. Banner turns red, button becomes "��� Enable Reviews"   │
└─────────────────────────────────────────────────────────────┘
```

### User Experience When Disabled

**Dashboard Changes:**
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ RED WARNING BANNER                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ��� Review Submissions Currently Disabled            │   │
│  │ The review system has been temporarily disabled     │   │
│  │ by administrators. Please check back later.         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Review Someone] ← GRAYED OUT, DISABLED                    │
│  [Submit Reviews] ← GRAYED OUT, DISABLED                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Access Blocked:**
- Clicking `/candidates` → Instant redirect to dashboard
- Direct URL `/review/123` → Instant redirect to dashboard
- API calls → Return `{ error: "Review submissions are currently disabled" }`

### SQL Queries

**Admin Toggle:**
```sql
-- Check if settings exist
SELECT * FROM "SystemSettings" LIMIT 1;

-- If exists, update
UPDATE "SystemSettings"
SET "reviewsEnabled" = $newValue, "updatedAt" = NOW()
WHERE id = (SELECT id FROM "SystemSettings" LIMIT 1);

-- If not exists, create
INSERT INTO "SystemSettings" (id, "reviewsEnabled")
VALUES (gen_random_uuid(), $newValue);
```

**Route Protection Check:**
```sql
-- Every protected route executes this
SELECT "reviewsEnabled" FROM "SystemSettings" LIMIT 1;

-- If result is false → block access
-- If result is true or NULL (no record) → allow access
```

### Implementation Details

**Why Singleton Pattern?**
- Simple: Only need `findFirst()` - no WHERE clause needed
- Fast: Single-row lookups are O(1) with proper indexing
- Atomic: No race conditions when toggling
- Clear: One source of truth

**Default Behavior:**
```javascript
// If no SystemSettings row exists, default to ENABLED
settings?.reviewsEnabled ?? true
```
This ensures backward compatibility and fail-safe operation.

**Performance:**
- Single database query per page load
- Cached in React state on client (admin panel)
- No joins or complex logic
- Instant propagation (no caching layer to invalidate)

### Use Cases

**1. Emergency Stop**
Admin discovers a bug or abuse → Click disable → All submissions stop immediately

**2. Scheduled Maintenance**
Before reviewing database → Disable → Perform backup/migration → Re-enable

**3. Deadline Management**
Review period ends → Disable → Prevent late submissions

**4. Testing**
Test submission flow with restricted access → Disable for non-admins

### Security

**Authorization:**
```javascript
// Only admins can toggle
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { isAdmin: true }
});

if (!user?.isAdmin) {
  return res.status(403).json({ error: "Forbidden: Admin only" });
}
```

**No Bypass Possible:**
- Client-side checks are UI hints only
- Server enforces on EVERY API call
- Database constraints remain active
- Even direct database access respects the flag (via application layer)

### Monitoring

**Admin can see:**
- Current state (enabled/disabled) with color coding
- Last update timestamp (`updatedAt` field)
- No history tracking (could add audit log table if needed)

**To Add Audit Trail:**
```sql
CREATE TABLE "SystemSettingsHistory" (
  id           TEXT PRIMARY KEY,
  changedBy    TEXT REFERENCES "User"(id),
  oldValue     BOOLEAN,
  newValue     BOOLEAN,
  changedAt    TIMESTAMP DEFAULT NOW()
);
```

---

### Kill Switch vs. Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **SystemSettings Table** (Current) | ✅ Instant, ✅ Database-backed, ✅ Persistent | ❌ Requires migration |
| Environment Variable | ✅ Simple | ❌ Requires restart, ❌ Not runtime-toggleable |
| Feature Flag Service | ✅ Advanced controls | ❌ External dependency, ❌ Complexity |
| Hardcoded Boolean | ✅ Zero DB hits | ❌ Requires code deploy |

**Our choice:** SystemSettings table provides the best balance of simplicity, persistence, and runtime control.

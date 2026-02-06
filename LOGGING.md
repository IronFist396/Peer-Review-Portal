# Logging System Documentation

## Log Files Location
- `logs/app.log` - All logs (info, warnings, errors, user actions)
- `logs/error.log` - Errors only
- `logs/user-actions.log` - User actions only

## Auto-Rotation Settings
- **Max file size:** 10MB per file
- **Rotation:** Daily or when size limit reached
- **Compression:** Old logs compressed with gzip
- **Retention:** Maximum 10 rotated files (auto-deletes oldest)
- **No manual deletion needed!**

## Logged Events

### Authentication (lib/auth.js)
- ✅ **LOGIN** - Successful user login
  - Includes: userId, userEmail, name, timestamp
- ⚠️ **Failed login - invalid password**
  - Includes: email
- ⚠️ **Failed login - user not found**
  - Includes: email

### Search (pages/api/search.js)
- ✅ **SEARCH** - User searches for candidates
  - Includes: userId, userEmail, query, skip, take
- ❌ **SEARCH_API error** - Search failed
  - Includes: userId, query, error details

### Review Submission (pages/api/submit-review.js)
- ✅ **SUBMIT_REVIEW** - User submits/updates a review
  - Includes: userId, userEmail, revieweeId, action (create/update), ratings
- ❌ **REVIEW_API error** - Review submission failed
  - Includes: userId, revieweeId, error details

### Admin Actions

#### User Management (pages/api/admin/users.js)
- ✅ **ADMIN_USER_SEARCH** - Admin searches/filters users
  - Includes: userId, userEmail, search query, department filter
- ❌ **ADMIN_USERS_API error** - User fetch failed
  - Includes: userId, search, department, error details

#### Settings (pages/api/toggle-reviews.js)
- ✅ **ADMIN_TOGGLE_REVIEWS** - Admin enables/disables reviews
  - Includes: userId, userEmail, action (enabled/disabled), previousState
- ❌ **TOGGLE_REVIEWS_API error** - Settings update failed
  - Includes: userId, error details

## Viewing Logs

### Via Admin UI
1. Login as admin
2. Go to `/admin`
3. Click "📋 View Logs" button
4. Features:
   - Filter by type (all/errors/user-actions)
   - Auto-refresh every 5 seconds
   - Stats dashboard
   - Last 200 entries shown

### Via Server (PM2)
```bash
# View all logs
cat logs/app.log

# View only errors
cat logs/error.log

# View user actions
cat logs/user-actions.log

# Tail live logs
tail -f logs/app.log

# Search for specific user
grep "user@iitb.ac.in" logs/user-actions.log
```

## Log Format (JSON)
```json
{
  "timestamp": "2026-02-06T10:30:45.123Z",
  "level": "USER_ACTION",
  "category": "SUBMIT_REVIEW",
  "message": "User action: SUBMIT_REVIEW",
  "userId": "user-id-123",
  "userEmail": "user@iitb.ac.in",
  "revieweeId": "reviewee-id-456",
  "action": "create",
  "ratings": {...}
}
```

## Next Steps (Optional)
- Add logging to recommendations API
- Add slow query logging (>1s)
- Set up log monitoring alerts
- Export logs to external service (e.g., CloudWatch, Datadog)

# Data Normalization Strategy for CSV Seeding

## Problem
The `new.csv` file contains ~7,000 user records with inconsistent data formats:
- Departments: "CS", "cs", "Computer Science", "CSE"
- Hostels: "Hostel 5", "H5", "H-5", "hostel-5"
- PORs: "SMP", "smp", "S.M.P", "WnCC", "wncc"

## Solution: Multi-Layer Normalization

### 1. **Predefined Mapping (Best for known variations)**
```javascript
const DEPARTMENT_MAP = {
  'cs': 'Computer Science',
  'cse': 'Computer Science',
  // ...
}
```
**Pros:** Controlled, predictable
**Cons:** Requires manual mapping updates

### 2. **Case-Insensitive Deduplication**
- Store all values in lowercase Set keys
- Maintain original → canonical mapping
- Return canonical form for insertion

### 3. **Pattern-Based Normalization (for hostels)**
```javascript
// "H5" → "Hostel 5"
// "hostel-5" → "Hostel 5"
```

## Usage

### Step 1: Analyze Data Quality
```bash
npm install csv-parser
node seed-new.js --analyze
```

This will show:
- All unique departments with normalization
- All unique hostels with normalization  
- All unique PORs found
- **Duplicates that need manual review**

### Step 2: Update Mappings
Review the analysis output and add any missing mappings to:
- `DEPARTMENT_MAP`
- `POR_MAP`

### Step 3: Seed Database
```bash
node seed-new.js
```

## Handling Edge Cases

### If you find duplicates during analysis:

1. **Add to mapping**:
   ```javascript
   'smp': 'SMP',
   's.m.p.': 'SMP',
   ```

2. **Pattern matching** (for systematic variations):
   ```javascript
   if (value.match(/\bsmp\b/i)) return 'SMP'
   ```

3. **Manual review file**: Export duplicates to CSV for human decision

## Recommended Workflow

```bash
# 1. First analyze without seeding
node seed-new.js --analyze > analysis.txt

# 2. Review analysis.txt for duplicates

# 3. Update normalization maps in seed-new.js

# 4. Re-analyze to verify
node seed-new.js --analyze

# 5. Seed when clean
node seed-new.js
```

## Why This Approach is Better Than Just Sets

Your original idea (using Sets) would catch exact duplicates but **miss case variations**:
- Set would have: `{"SMP", "smp", "S.M.P"}` ❌

Our approach:
- Normalizes before insertion: `{"SMP"}` ✓
- Provides transparency (shows what changed)
- Allows human verification before DB insert
- Extensible for new patterns

## Future Improvements

1. **Fuzzy matching** for typos (e.g., "Eletrical" → "Electrical")
2. **LLM-based normalization** for ambiguous cases
3. **Interactive CLI** to resolve conflicts during seeding
4. **Export canonical reference** as JSON for frontend dropdowns

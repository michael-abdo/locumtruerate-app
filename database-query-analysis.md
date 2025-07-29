# Database Query Pattern Analysis Report

## Overview
This report analyzes database query patterns in Job.js and Application.js models to identify opportunities for DRY refactoring using centralized database utilities.

## Job.js Query Patterns

### 1. Transaction Patterns
- **Lines 47-93**: Manual transaction handling in `create()` method
- **Lines 274-341**: Manual transaction handling in `update()` method
- Pattern: `BEGIN` → queries → `COMMIT`/`ROLLBACK`

### 2. Pagination Patterns
- **Lines 173-191**: Manual pagination in `findAll()` method
  - Count query: `SELECT COUNT(*) FROM jobs`
  - Data query with `LIMIT` and `OFFSET`
  - Manual calculation of total pages

### 3. WHERE Clause Building
- Manual WHERE clause construction with conditions array
- Dynamic parameter indexing (`$1`, `$2`, etc.)
- Repeated pattern across multiple methods

### 4. Common Query Types
- SELECT with JOINs (lines 183-190, 217-236)
- INSERT with RETURNING (line 51)
- UPDATE with conditions (lines 307-318)
- DELETE operations (line 319)

## Application.js Query Patterns

### 1. Transaction Patterns
- **Lines 29-74**: Manual transaction in `create()` method
- **Lines 310-353**: Manual transaction in `updateStatus()` method
- **Lines 370-407**: Manual transaction in `delete()` method
- Similar pattern to Job.js

### 2. Pagination Patterns
- **Lines 122-154**: Manual pagination in `findByUser()` method
- **Lines 216-242**: Manual pagination in `findByJob()` method
- Identical pattern to Job.js pagination

### 3. Complex Filtering
- **Lines 745-807**: Manual filter building in `searchUserApplications()`
  - Search across multiple fields
  - Array filters (statuses, specialties)
  - Range filters (rates, dates)
  - Dynamic WHERE clause construction

### 4. Subqueries and Joins
- Multiple LEFT JOINs for related data
- Subqueries for application history
- Complex aggregations

## Duplication Analysis

### Duplicated Patterns (250+ lines)
1. **Transaction Handling** (~60 lines per model)
   - BEGIN/COMMIT/ROLLBACK boilerplate
   - Client acquisition and release
   - Error handling

2. **Pagination Logic** (~40 lines per occurrence)
   - Count queries
   - Page calculation
   - LIMIT/OFFSET application
   - Response formatting

3. **WHERE Clause Building** (~30 lines per method)
   - Condition arrays
   - Parameter indexing
   - Dynamic SQL construction

4. **Filter Building** (~80 lines in Application.js)
   - Search conditions
   - Array filters
   - Range filters
   - Date filters

## Refactoring Opportunities

### Can Use Centralized Utilities
1. ✅ All pagination logic → `executePaginatedQuery()`
2. ✅ WHERE clause building → `buildWhereClause()`
3. ✅ Transaction handling → `executeTransaction()`
4. ✅ Search conditions → `buildSearchCondition()`
5. ✅ Array filters → `buildArrayFilterCondition()`
6. ✅ Range filters → `buildRangeFilterCondition()`

### Requires Special Handling
1. ⚠️ Complex JOINs with multiple tables
2. ⚠️ Subqueries for history records
3. ⚠️ INSERT with array of values (job requirements)
4. ⚠️ Custom aggregations

## Risk Assessment

### Low Risk
- Simple SELECT queries
- Basic pagination
- Standard transactions

### Medium Risk
- Complex JOINs (may need query builder extension)
- Dynamic column selection
- Conditional updates

### High Risk
- Raw SQL with PostgreSQL-specific features
- Complex subqueries
- Stored procedure calls

## Implementation Strategy

1. **Phase 1**: Simple methods first (findById, basic pagination)
2. **Phase 2**: Transaction standardization
3. **Phase 3**: Complex search and filter methods
4. **Phase 4**: Edge cases and special queries

## Estimated Impact
- **Job.js**: ~120 lines reduction
- **Application.js**: ~130 lines reduction
- **Total**: ~250 lines eliminated

## Success Metrics
- All tests pass
- No performance degradation
- Consistent query patterns
- Improved maintainability
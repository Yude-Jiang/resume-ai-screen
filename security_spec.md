# Security Specification - ST Intelligence Recruitment

## 1. Data Invariants
- A **Job** must have an `ownerId`. Only the owner can read, update, or delete it.
- An **AnalysisResult** must have a `jobId` that points to a valid Job owned by the requester.
- **Timestamps** (`updatedAt`, `createdAt`) must be server-validated.
- **Scores** must be between 0 and 100.
- **IDs** must be valid strings.

## 2. The "Dirty Dozen" Payloads

1. **Identity Theft**: Creating a job with someone else's `ownerId`.
2. **Orphaned Result**: Creating a result for a `jobId` that doesn't exist.
3. **Cross-Tenant Access**: Reading a result for a `jobId` that belongs to another user.
4. **Shadow Field**: Adding `isAdmin: true` to a Job document.
5. **Score Injection**: Setting `overall_score` to 9999.
6. **Toxic ID**: Using a 2KB string as a `jobId`.
7. **Future Timestamp**: Setting `createdAt` to a future date instead of `request.time`.
8. **Immobility Breach**: Updating the `ownerId` of an existing job.
9. **Junk Tags**: Adding 1000 tags to a result.
10. **Blind Override**: Changing the `overall_score` (AI calculated) via a manual update instead of just the `hr_override_score`.
11. **Malicious JD**: Injecting a 10MB string into the `jd` field.
12. **Unauthorized Deletion**: Deleting a job owned by another user.

## 3. Test Runner (Draft)
```typescript
// Tests would include:
// - Create Job: success if owner matches auth.uid
// - Create Job: fail if owner mismatches
// - Read Results: success if Job.ownerId matches auth.uid
// - Update Score: success only for hr_override_score key
```

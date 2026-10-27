# Security Specification — Eclipse Chronicle: Pixel Arena

## 1. Data Invariants
1. **Strict Ownership (`PlayerProgress`)**: A document at `/playerProgress/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`, with a verified email (`request.auth.token.email_verified == true`), and where `incoming().uid == userId`.
2. **No PII Storage**: `/playerProgress/{userId}` never stores email addresses, phone numbers, or physical addresses.
3. **Immutable Creation Fields**: `uid` and `createdAt` cannot be modified after initial creation (`incoming().uid == existing().uid && incoming().createdAt == existing().createdAt`).
4. **Strict Temporal Integrity**: `createdAt` (on create) and `updatedAt` (on create and update) must equal `request.time`.
5. **Bounded Numeric & String Values**:
   - `uid`: string, `1..128` chars, matches `^[a-zA-Z0-9_\-]+$`
   - `displayName`: string, `1..60` chars
   - `bestScore`: int, `0..99999999`
   - `highestUnlockedStage`: int, `1..10`
   - `totalCoins`: int, `0..9999999`
   - `runsPlayed`: int, `0..999999`

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/playerProgress/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'user_1', token: { email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Cross-User Identity Spoofing**: `auth.uid = 'attacker_1'` writing to `/playerProgress/victim_1` -> `PERMISSION_DENIED`.
4. **Payload UID Mismatch**: `auth.uid = 'user_1'` writing `{ uid: 'user_2', ... }` to `/playerProgress/user_1` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Adding `isAdmin: true` or `extraField: 'hack'` to `/playerProgress/user_1` -> `PERMISSION_DENIED` via `hasOnly()`.
6. **Oversized DisplayName DoS**: `displayName` with 500 characters (`> 60`) -> `PERMISSION_DENIED`.
7. **Out-of-Bounds Stage Unlock**: `highestUnlockedStage: 99` (`> 10`) or `0` (`< 1`) -> `PERMISSION_DENIED`.
8. **Negative Score / Coin Poisoning**: `bestScore: -500` or `totalCoins: -10` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: `updatedAt` set to a forged past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **Immutable `createdAt` Mutation on Update**: Changing `createdAt` during an `update` operation -> `PERMISSION_DENIED`.
11. **Unauthorized Collection Listing**: `list` query on `/playerProgress` -> `PERMISSION_DENIED` (`allow list: if false;`).
12. **Unauthorized Profile Deletion**: `delete` on `/playerProgress/user_1` -> `PERMISSION_DENIED` (`allow delete: if false;`).

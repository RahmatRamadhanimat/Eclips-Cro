# Security Specification — Eclipse Chronicle: Pixel Arena

## 1. Data Invariants
1. **Strict Ownership (`PlayerProgress` & `LeaderboardEntry`)**:
   - A document at `/playerProgress/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`, with a verified email (`request.auth.token.email_verified == true`), and where `incoming().uid == userId`.
   - A document at `/leaderboardEntries/{userId}` can only be created or updated by the authenticated owner (`request.auth.uid == userId`) with a verified email (`request.auth.token.email_verified == true`) and `incoming().uid == userId`.
2. **Public Non-PII Leaderboard Read Boundary**:
   - `/leaderboardEntries/{userId}` contains strictly non-PII public game telemetry (`displayName`, `bestScore`, `highestStage`, `fastestClearTimeSec`, `dailySeed`, `dailyScore`, `bossRushWaves`, `bossRushScore`, `favoriteStance`).
   - `get` and `list` on `/leaderboardEntries/{userId}` enforce resource data bounds (`existing().bestScore >= 0 && existing().bestScore <= 99999999`).
3. **No PII Storage**: Neither `/playerProgress/{userId}` nor `/leaderboardEntries/{userId}` ever stores email addresses, phone numbers, or physical addresses.
4. **Immutable Creation Fields**: `uid` and `createdAt` cannot be modified after initial creation (`incoming().uid == existing().uid && incoming().createdAt == existing().createdAt`).
5. **Strict Temporal Integrity**: `createdAt` (on create) and `updatedAt` (on create and update) must equal `request.time`.
6. **Bounded Numeric & String Values**:
   - `uid`: string, `1..128` chars, matches `^[a-zA-Z0-9_\-]+$`
   - `displayName`: string, `1..60` chars
   - `bestScore`, `dailyScore`, `bossRushScore`: int, `0..99999999`
   - `highestUnlockedStage`, `highestStage`: int, `1..10`
   - `fastestClearTimeSec`: int, `1..86400`
   - `dailySeed`: string, `1..32` chars
   - `bossRushWaves`: int, `0..9999`
   - `favoriteStance`: string in `['dawnblade', 'astral_bow', 'chrono_scythe']`
   - `totalCoins`: int, `0..9999999`
   - `runsPlayed`: int, `0..999999`

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/playerProgress/user_1` or `/leaderboardEntries/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'user_1', token: { email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Cross-User Identity Spoofing**: `auth.uid = 'attacker_1'` writing to `/playerProgress/victim_1` or `/leaderboardEntries/victim_1` -> `PERMISSION_DENIED`.
4. **Payload UID Mismatch**: `auth.uid = 'user_1'` writing `{ uid: 'user_2', ... }` to `/leaderboardEntries/user_1` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Adding `isAdmin: true` or `extraField: 'hack'` to `/playerProgress/user_1` or `/leaderboardEntries/user_1` -> `PERMISSION_DENIED` via `hasOnly()`.
6. **Oversized DisplayName DoS**: `displayName` with 500 characters (`> 60`) -> `PERMISSION_DENIED`.
7. **Out-of-Bounds Stage Unlock**: `highestUnlockedStage: 99` (`> 10`) or `0` (`< 1`) -> `PERMISSION_DENIED`.
8. **Negative Score / Coin Poisoning**: `bestScore: -500` or `totalCoins: -10` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: `updatedAt` set to a forged past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **Immutable `createdAt` Mutation on Update**: Changing `createdAt` during an `update` operation -> `PERMISSION_DENIED`.
11. **Unauthorized Private Collection Listing**: `list` query on `/playerProgress` -> `PERMISSION_DENIED` (`allow list: if false;`).
12. **Unauthorized Profile / Leaderboard Deletion**: `delete` on `/playerProgress/user_1` or `/leaderboardEntries/user_1` -> `PERMISSION_DENIED` (`allow delete: if false;`).

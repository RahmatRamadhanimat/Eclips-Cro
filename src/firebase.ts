import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export interface CloudPlayerProgress {
  uid: string;
  displayName: string;
  bestScore: number;
  highestUnlockedStage: number;
  totalCoins: number;
  runsPlayed: number;
}

export type StanceChoiceKey = 'dawnblade' | 'astral_bow' | 'chrono_scythe';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  bestScore: number;
  highestStage: number;
  fastestClearTimeSec: number;
  dailySeed: string;
  dailyScore: number;
  bossRushWaves: number;
  bossRushScore: number;
  favoriteStance: StanceChoiceKey;
  isCloud?: boolean;
}

export async function signInWithGooglePopup(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

function sanitizeDisplayName(rawName: string | null | undefined): string {
  const trimmed = (rawName || 'Solar Warden').trim().slice(0, 60);
  return trimmed.length > 0 ? trimmed : 'Solar Warden';
}

function sanitizeDailySeed(rawSeed: string | null | undefined): string {
  const cleaned = (rawSeed || 'SOLAR-DAILY').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  return cleaned.length > 0 ? cleaned : 'SOLAR-DAILY';
}

function sanitizeStance(rawStance: string | null | undefined): StanceChoiceKey {
  if (rawStance === 'astral_bow' || rawStance === 'chrono_scythe' || rawStance === 'dawnblade') {
    return rawStance;
  }
  return 'dawnblade';
}

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  const rounded = Math.max(min, Math.min(max, Math.trunc(Math.round(val))));
  return rounded === 0 ? 0 : rounded;
}

export function subscribeToCloudProgress(
  user: User,
  onData: (progress: CloudPlayerProgress) => void
): () => void {
  const path = `playerProgress/${user.uid}`;
  const docRef = doc(db, 'playerProgress', user.uid);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData({
          uid: String(data.uid || user.uid),
          displayName: sanitizeDisplayName(data.displayName || user.displayName),
          bestScore: clampInt(Number(data.bestScore || 0), 0, 99999999),
          highestUnlockedStage: clampInt(Number(data.highestUnlockedStage || 1), 1, 10),
          totalCoins: clampInt(Number(data.totalCoins || 15), 0, 9999999),
          runsPlayed: clampInt(Number(data.runsPlayed || 0), 0, 999999),
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Logged by handleFirestoreError
      }
    }
  );
}

export async function syncPlayerProgressToCloud(
  user: User,
  progress: {
    bestScore: number;
    highestUnlockedStage: number;
    totalCoins: number;
    runsPlayed: number;
  }
): Promise<void> {
  if (!user || !user.uid) return;
  const path = `playerProgress/${user.uid}`;
  const docRef = doc(db, 'playerProgress', user.uid);

  const safeDisplayName = sanitizeDisplayName(user.displayName);
  const safeBestScore = clampInt(progress.bestScore, 0, 99999999);
  const safeHighestStage = clampInt(progress.highestUnlockedStage, 1, 10);
  const safeTotalCoins = clampInt(progress.totalCoins, 0, 9999999);
  const safeRunsPlayed = clampInt(progress.runsPlayed, 0, 999999);

  let opType: OperationType = OperationType.GET;
  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      opType = OperationType.CREATE;
      await setDoc(docRef, {
        uid: user.uid,
        displayName: safeDisplayName,
        bestScore: safeBestScore,
        highestUnlockedStage: safeHighestStage,
        totalCoins: safeTotalCoins,
        runsPlayed: safeRunsPlayed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      opType = OperationType.UPDATE;
      const existingData = existingSnap.data();
      await updateDoc(docRef, {
        displayName: safeDisplayName,
        bestScore: Math.max(clampInt(Number(existingData.bestScore || 0), 0, 99999999), safeBestScore),
        highestUnlockedStage: Math.max(
          clampInt(Number(existingData.highestUnlockedStage || 1), 1, 10),
          safeHighestStage
        ),
        totalCoins: safeTotalCoins,
        runsPlayed: Math.max(
          clampInt(Number(existingData.runsPlayed || 0), 0, 999999),
          safeRunsPlayed
        ),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    try {
      handleFirestoreError(error, opType, path);
    } catch {
      // Logged by handleFirestoreError
    }
  }
}

export function subscribeToGlobalLeaderboard(
  onEntries: (entries: LeaderboardEntry[]) => void
): () => void {
  const path = 'leaderboardEntries';
  const q = query(
    collection(db, path),
    where('bestScore', '>=', 0),
    where('bestScore', '<=', 99999999),
    orderBy('bestScore', 'desc'),
    limit(20)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          uid: String(data.uid || docSnap.id),
          displayName: sanitizeDisplayName(data.displayName),
          bestScore: clampInt(Number(data.bestScore ?? 0), 0, 99999999),
          highestStage: clampInt(Number(data.highestStage ?? 1), 1, 10),
          fastestClearTimeSec: clampInt(Number(data.fastestClearTimeSec ?? 180), 1, 86400),
          dailySeed: sanitizeDailySeed(data.dailySeed),
          dailyScore: clampInt(Number(data.dailyScore ?? 0), 0, 99999999),
          bossRushWaves: clampInt(Number(data.bossRushWaves ?? 0), 0, 9999),
          bossRushScore: clampInt(Number(data.bossRushScore ?? 0), 0, 99999999),
          favoriteStance: sanitizeStance(data.favoriteStance),
          isCloud: true,
        });
      });
      onEntries(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged by handleFirestoreError
      }
    }
  );
}

export async function submitLeaderboardEntryToCloud(
  user: User,
  entry: {
    displayName?: string;
    bestScore: number;
    highestStage: number;
    fastestClearTimeSec: number;
    dailySeed: string;
    dailyScore: number;
    bossRushWaves: number;
    bossRushScore: number;
    favoriteStance: StanceChoiceKey;
  }
): Promise<void> {
  if (!user || !user.uid) return;
  const path = `leaderboardEntries/${user.uid}`;
  const docRef = doc(db, 'leaderboardEntries', user.uid);

  const safeDisplayName = sanitizeDisplayName(entry.displayName || user.displayName);
  const safeBestScore = clampInt(entry.bestScore, 0, 99999999);
  const safeHighestStage = clampInt(entry.highestStage, 1, 10);
  const safeFastestTime = clampInt(entry.fastestClearTimeSec, 1, 86400);
  const safeDailySeed = sanitizeDailySeed(entry.dailySeed);
  const safeDailyScore = clampInt(entry.dailyScore, 0, 99999999);
  const safeBossRushWaves = clampInt(entry.bossRushWaves, 0, 9999);
  const safeBossRushScore = clampInt(entry.bossRushScore, 0, 99999999);
  const safeStance = sanitizeStance(entry.favoriteStance);

  let opType: OperationType = OperationType.GET;
  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      opType = OperationType.CREATE;
      await setDoc(docRef, {
        uid: user.uid,
        displayName: safeDisplayName,
        bestScore: safeBestScore,
        highestStage: safeHighestStage,
        fastestClearTimeSec: safeFastestTime,
        dailySeed: safeDailySeed,
        dailyScore: safeDailyScore,
        bossRushWaves: safeBossRushWaves,
        bossRushScore: safeBossRushScore,
        favoriteStance: safeStance,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      opType = OperationType.UPDATE;
      const ex = existingSnap.data();
      const prevFastest = clampInt(Number(ex.fastestClearTimeSec ?? 86400), 1, 86400);
      const nextFastest = Math.min(prevFastest, safeFastestTime);
      const sameSeed = String(ex.dailySeed || '') === safeDailySeed;
      const nextDailyScore = sameSeed
        ? Math.max(clampInt(Number(ex.dailyScore ?? 0), 0, 99999999), safeDailyScore)
        : safeDailyScore > 0
        ? safeDailyScore
        : clampInt(Number(ex.dailyScore ?? 0), 0, 99999999);
      const nextDailySeed =
        safeDailyScore > 0 || !ex.dailySeed ? safeDailySeed : sanitizeDailySeed(ex.dailySeed);

      await updateDoc(docRef, {
        displayName: safeDisplayName,
        bestScore: Math.max(clampInt(Number(ex.bestScore ?? 0), 0, 99999999), safeBestScore),
        highestStage: Math.max(clampInt(Number(ex.highestStage ?? 1), 1, 10), safeHighestStage),
        fastestClearTimeSec: nextFastest,
        dailySeed: nextDailySeed,
        dailyScore: nextDailyScore,
        bossRushWaves: Math.max(clampInt(Number(ex.bossRushWaves ?? 0), 0, 9999), safeBossRushWaves),
        bossRushScore: Math.max(
          clampInt(Number(ex.bossRushScore ?? 0), 0, 99999999),
          safeBossRushScore
        ),
        favoriteStance: safeStance,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    try {
      handleFirestoreError(error, opType, path);
    } catch {
      // Logged by handleFirestoreError
    }
  }
}

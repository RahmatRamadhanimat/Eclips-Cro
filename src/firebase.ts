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
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
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

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
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

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
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
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged by handleFirestoreError
    }
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  activateSanctumShrine,
  advanceBossRushAbyssCycle,
  applyEnemyDebuff,
  applyRelicChoice,
  applySkillChoice,
  awakenStance,
  buildRankedLeaderboard,
  buyMerchantItem,
  createEnemy,
  createInitialWorldState,
  cycleActiveFamiliar,
  detonateSolarBrazier,
  DoorDirection,
  ENEMY_ARCHETYPE_CATALOG,
  ENEMY_ARCHETYPE_KEYS,
  EnemyArchetype,
  FAMILIAR_CATALOG,
  FAMILIAR_KEYS,
  FamiliarId,
  findInteractableShrine,
  formatSpeedrunTime,
  GameMode,
  GamePhase,
  getActiveCombatLogEntries,
  getBestiaryEntry,
  getDailyChallengeConfig,
  getHealthPipStates,
  getPlayerActiveDebuffs,
  getRoomEnemyDebuffSummary,
  grantPlayerXp,
  HazardKind,
  hireOrEquipFamiliar,
  isBossOrEclipseCandidate,
  LeaderboardCategory,
  MAX_PLAYER_LEVEL,
  MAX_STAGE_LEVEL,
  pushCombatLog,
  RunSnapshot,
  SANCTUM_HAZARD_CATALOG,
  SanctumLeaderboardRecord,
  SKILL_CATALOG,
  SkillId,
  STAGE_CATALOG,
  transitionToRoom,
  triggerSolarMeltdown,
  triggerThermalShock,
  triggerTotalEclipseEvent,
  USABLE_ITEM_KEYS,
  USABLE_ITEMS,
  UsableItemId,
  useInventorySlot,
  WEAPON_EVOLUTIONS,
  WEAPON_STANCES,
  WeaponStanceId,
} from './game/rules';
import { soundEngine } from './game/audio';
import { ArenaCanvas, HudDiscreteState } from './components/ArenaCanvas';
import {
  CoinIcon,
  DebuffIcon,
  FamiliarIcon,
  SkillIcon,
  StanceIcon,
  TitleCrestEmblem,
  UsableItemIcon,
  UtilityIcon,
  VitalityHeartPip,
} from './components/GameIcons';
import {
  auth,
  formatFirebaseAuthError,
  LeaderboardEntry,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutAccount,
  submitLeaderboardEntryToCloud,
  subscribeToCloudProgress,
  subscribeToGlobalLeaderboard,
  syncPlayerProgressToCloud,
  User,
} from './firebase';

const STORAGE_BEST_SCORE_KEY = 'eclipse_chronicle_best_score_v1';
const STORAGE_UNLOCKED_STAGE_KEY = 'eclipse_chronicle_unlocked_stage_v1';
const STORAGE_RUNS_PLAYED_KEY = 'eclipse_chronicle_runs_played_v1';
const STORAGE_BESTIARY_KEY = 'eclipse_chronicle_bestiary_v1';
const STORAGE_LEADERBOARD_LOCAL_KEY = 'eclipse_chronicle_leaderboard_local_v1';

function loadBestiaryDefeated(): Partial<Record<EnemyArchetype, number>> {
  try {
    const out: Partial<Record<EnemyArchetype, number>> = {};
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('unlockall') === '1' || params.get('bestiary') === '1') {
        for (const arch of ENEMY_ARCHETYPE_KEYS) {
          out[arch] = 3;
        }
      }
    }
    const raw = localStorage.getItem(STORAGE_BESTIARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      for (const arch of ENEMY_ARCHETYPE_KEYS) {
        const val = parsed[arch];
        if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
          out[arch] = Math.max(out[arch] ?? 0, Math.round(val));
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveBestiaryDefeated(counts: Partial<Record<EnemyArchetype, number>>): void {
  try {
    localStorage.setItem(STORAGE_BESTIARY_KEY, JSON.stringify(counts));
  } catch {
    // Ignore storage errors
  }
}

function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_BEST_SCORE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_BEST_SCORE_KEY, String(Math.round(score)));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function loadRunsPlayed(): number {
  try {
    const raw = localStorage.getItem(STORAGE_RUNS_PLAYED_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveRunsPlayed(runs: number): void {
  try {
    localStorage.setItem(STORAGE_RUNS_PLAYED_KEY, String(Math.max(0, Math.round(runs))));
  } catch {
    // Ignore storage errors
  }
}

function loadHighestUnlockedStage(): number {
  try {
    const raw = localStorage.getItem(STORAGE_UNLOCKED_STAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(parsed) && parsed >= 1
      ? Math.min(MAX_STAGE_LEVEL, parsed)
      : 1;
  } catch {
    return 1;
  }
}

function saveHighestUnlockedStage(stageLevel: number): void {
  try {
    const clamped = Math.max(1, Math.min(MAX_STAGE_LEVEL, Math.round(stageLevel)));
    localStorage.setItem(STORAGE_UNLOCKED_STAGE_KEY, String(clamped));
  } catch {
    // Ignore storage errors
  }
}

function getInitialModeFromUrl(): GameMode {
  if (typeof window === 'undefined') return 'standard';
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  if (modeParam === 'daily' || modeParam === 'daily_challenge') return 'daily_challenge';
  if (modeParam === 'boss_rush' || modeParam === 'abyss') return 'boss_rush';
  return 'standard';
}

function getInitialLeaderboardOpenFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('leaderboard') === '1';
}

function loadLocalLeaderboardRecord(defaultSeed: string): SanctumLeaderboardRecord {
  try {
    const raw = localStorage.getItem(STORAGE_LEADERBOARD_LOCAL_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<SanctumLeaderboardRecord>;
      return {
        uid: p.uid || 'local_warden',
        displayName: p.displayName || 'Solar Warden (You)',
        bestScore: Math.max(0, Number(p.bestScore || loadBestScore() || 1240)),
        highestStage: Math.max(
          1,
          Math.min(MAX_STAGE_LEVEL, Number(p.highestStage || loadHighestUnlockedStage() || 1))
        ),
        fastestClearTimeSec: Math.max(1, Number(p.fastestClearTimeSec || 148)),
        dailySeed: p.dailySeed || defaultSeed,
        dailyScore: Math.max(0, Number(p.dailyScore || 0)),
        bossRushWaves: Math.max(0, Number(p.bossRushWaves || 0)),
        bossRushScore: Math.max(0, Number(p.bossRushScore || 0)),
        favoriteStance:
          p.favoriteStance === 'astral_bow' || p.favoriteStance === 'chrono_scythe'
            ? p.favoriteStance
            : 'dawnblade',
        isCurrentUser: true,
      };
    }
  } catch {
    // Ignore storage error
  }
  return {
    uid: 'local_warden',
    displayName: 'Solar Warden (You)',
    bestScore: Math.max(1240, loadBestScore()),
    highestStage: Math.max(1, loadHighestUnlockedStage()),
    fastestClearTimeSec: 148,
    dailySeed: defaultSeed,
    dailyScore: 0,
    bossRushWaves: 0,
    bossRushScore: 0,
    favoriteStance: 'dawnblade',
    isCurrentUser: true,
  };
}

function saveLocalLeaderboardRecord(rec: SanctumLeaderboardRecord): void {
  try {
    localStorage.setItem(STORAGE_LEADERBOARD_LOCAL_KEY, JSON.stringify(rec));
  } catch {
    // Ignore storage error
  }
}

function getInitialStageFromUrl(): number {
  if (typeof window === 'undefined') return 1;
  const params = new URLSearchParams(window.location.search);
  const st = parseInt(params.get('stage') || '1', 10);
  return Number.isFinite(st) && st >= 1 && st <= MAX_STAGE_LEVEL ? st : 1;
}

function getInitialFamiliarFromUrl(): FamiliarId {
  if (typeof window === 'undefined') return 'ember_wisp';
  const params = new URLSearchParams(window.location.search);
  const fam = params.get('companion') || params.get('familiar');
  if (fam === 'aegis_cherub' || fam === 'greed_imp' || fam === 'ember_wisp') {
    return fam;
  }
  return 'ember_wisp';
}

function getInitialPhaseFromUrl(): GamePhase {
  if (typeof window === 'undefined') return 'title';
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1' ||
    params.get('levelup') === '1' ||
    params.get('awakened') === '1' ||
    params.get('evolved') === '1' ||
    params.get('reactions') === '1' ||
    params.get('eclipse') !== null ||
    params.get('companion') !== null ||
    params.get('familiar') !== null ||
    params.get('mode') === 'daily' ||
    params.get('mode') === 'daily_challenge' ||
    params.get('mode') === 'boss_rush' ||
    params.get('mode') === 'abyss'
    ? 'playing'
    : 'title';
}

function buildInitialWorld(
  phase: GamePhase,
  bestScore: number,
  stageLevel: number,
  gameMode: GameMode = 'standard',
  startingFamiliar: FamiliarId = 'ember_wisp'
) {
  const world = createInitialWorldState(phase, bestScore, stageLevel, gameMode);
  hireOrEquipFamiliar(world, startingFamiliar, true);
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('levelup') === '1') {
      grantPlayerXp(world, world.player.xpToNextLevel);
    }
    if (params.get('awakened') === '1' || params.get('evolved') === '1') {
      world.player.level = Math.max(world.player.level, 5);
      world.player.maxHp = 220;
      world.player.hp = 220;
      awakenStance(world, 'dawnblade');
      awakenStance(world, 'astral_bow');
      awakenStance(world, 'chrono_scythe');
    }
    if (params.get('combatlog') === '1') {
      pushCombatLog(world, 'critical_strike', 'Critical Strike!', '1.5x Solar Finisher (-48 HP)', 6.0);
      pushCombatLog(world, 'relic_synergy', 'Relic Synergy Triggered!', 'Solar Greatsword Crescent Wave', 6.4);
      pushCombatLog(world, 'perfect_dodge', 'Perfect Dodge', 'Evaded Strike · +15 Essence', 6.8);
    }
    if (params.get('reactions') === '1') {
      const e0 = world.enemies[0];
      const e1 = world.enemies[1] ?? world.enemies[0];
      if (e0) {
        e0.maxHp = Math.max(e0.maxHp, 360);
        e0.hp = e0.maxHp;
        applyEnemyDebuff(e0, 'burned', 5.5, undefined, undefined, 2);
        applyEnemyDebuff(e0, 'slowed', 5.0);
        triggerThermalShock(world, e0);
      }
      if (e1) {
        e1.maxHp = Math.max(e1.maxHp, 420);
        e1.hp = e1.maxHp;
        applyEnemyDebuff(e1, 'burned', 5.5, undefined, undefined, 3);
        triggerSolarMeltdown(world, e1);
      }
    }
    if (params.get('eclipse') !== null) {
      let boss = world.enemies.find((e) => e.archetype === 'archon');
      if (!boss) {
        boss = createEnemy(
          world.nextEntityId++,
          'archon',
          600,
          220,
          world.stageLevel,
          Math.max(1, world.bossRushCycle)
        );
        world.enemies.unshift(boss);
      }
      boss.hp = Math.round(boss.maxHp * 0.45);
      triggerTotalEclipseEvent(world, boss);
      if (params.get('eclipse') === 'vulnerable') {
        const brazier = world.hazards.find((h) => h.kind === 'solar_brazier');
        if (brazier) {
          detonateSolarBrazier(world, brazier);
        }
      }
    }
  }
  return world;
}

export default function App() {
  const initialPhase = getInitialPhaseFromUrl();
  const initialBest = loadBestScore();
  const initialStage = getInitialStageFromUrl();
  const initialMode = getInitialModeFromUrl();
  const initialFamiliar = getInitialFamiliarFromUrl();
  const dailyChallengeConfig = getDailyChallengeConfig();

  const [selectedStage, setSelectedStage] = useState<number>(initialStage);
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);
  const [selectedFamiliar, setSelectedFamiliar] = useState<FamiliarId>(initialFamiliar);
  const [highestUnlockedStage, setHighestUnlockedStage] = useState<number>(() =>
    Math.max(loadHighestUnlockedStage(), initialStage)
  );
  const [runsPlayed, setRunsPlayed] = useState<number>(() => loadRunsPlayed());
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [authStatusText, setAuthStatusText] = useState<string>('');
  const [persistedBestiary, setPersistedBestiary] = useState<
    Partial<Record<EnemyArchetype, number>>
  >(() => loadBestiaryDefeated());
  const [hoveredBestiaryArchetype, setHoveredBestiaryArchetype] =
    useState<EnemyArchetype | null>(null);

  // Global Sanctum Leaderboard states
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(() =>
    getInitialLeaderboardOpenFromUrl()
  );
  const [leaderboardCategory, setLeaderboardCategory] =
    useState<LeaderboardCategory>('high_score');
  const [cloudLeaderboard, setCloudLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [localLeaderboardRecord, setLocalLeaderboardRecord] =
    useState<SanctumLeaderboardRecord>(() =>
      loadLocalLeaderboardRecord(dailyChallengeConfig.seedCode)
    );
  const [leaderboardSyncNote, setLeaderboardSyncNote] = useState<string>('');

  const worldRef = useRef(
    buildInitialWorld(initialPhase, initialBest, initialStage, initialMode, initialFamiliar)
  );
  const [phase, setPhase] = useState<GamePhase>(initialPhase);
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);

  const buildHudFromWorld = useCallback((w = worldRef.current): HudDiscreteState => {
    const learnedSkills = (Object.keys(w.player.skills) as SkillId[])
      .filter((k) => (w.player.skills[k] ?? 0) > 0)
      .map((k) => ({ id: k, rank: w.player.skills[k] ?? 1 }));
    const activeRoomArchetypes = Array.from(
      new Set(w.enemies.filter((e) => e.aiState !== 'ko').map((e) => e.archetype))
    );
    const cherubRem = w.player.cherubShieldActive
      ? 0
      : Math.max(0, Math.ceil(20 - w.player.cherubShieldTimer));
    const activeBoss =
      w.enemies.find((e) => e.aiState !== 'ko' && e.archetype === 'archon') ??
      w.enemies.find((e) => e.aiState !== 'ko' && isBossOrEclipseCandidate(w, e)) ??
      null;
    return {
      gameMode: w.gameMode,
      dailySeed: w.dailySeed,
      bossRushCycle: w.bossRushCycle,
      bossRushWavesCleared: w.bossRushWavesCleared,
      elapsedSeconds: Number(w.elapsedSeconds.toFixed(1)),
      stageLevel: w.stageLevel,
      hp: Math.round(w.player.hp),
      maxHp: w.player.maxHp,
      essence: Math.round(w.player.essence),
      maxEssence: w.player.maxEssence,
      level: w.player.level,
      xp: Math.round(w.player.xp),
      xpToNextLevel: w.player.xpToNextLevel,
      coins: w.player.coins,
      inventory: w.player.inventory.map((slot) => ({ ...slot })),
      rooms: w.rooms.map((r) => ({ ...r, doors: [...r.doors] })),
      currentRoomIndex: w.currentRoomIndex,
      wave: w.wave,
      totalWaves: w.totalWaves,
      score: Math.round(w.score),
      bestScore: Math.round(w.bestScore),
      comboCount: w.comboCount,
      stance: w.player.stance,
      awakenedStances: { ...w.player.awakenedStances },
      dawnbladeSwingCount: w.player.dawnbladeSwingCount ?? 0,
      activeFamiliar: w.player.activeFamiliar,
      unlockedFamiliars: { ...w.player.unlockedFamiliars },
      cherubShieldActive: w.player.cherubShieldActive,
      cherubShieldCooldownRemaining: cherubRem,
      collectedRelics: [...w.collectedRelics],
      lastAwakenedStance: w.lastAwakenedStance,
      awakeningBannerActive: w.awakeningBannerTimer > 0,
      bossHp: activeBoss ? Math.max(0, Math.round(activeBoss.hp)) : null,
      bossMaxHp: activeBoss ? Math.max(1, Math.round(activeBoss.maxHp)) : null,
      bossHpPercent: activeBoss ? Math.round((activeBoss.hp / activeBoss.maxHp) * 100) : null,
      bossName: activeBoss ? ENEMY_ARCHETYPE_CATALOG[activeBoss.archetype].name : null,
      totalEclipseActive: w.totalEclipseActive,
      bossVulnerabilityTimer: Number(w.bossVulnerabilityTimer.toFixed(1)),
      bossVulnerabilityMaxTimer: w.bossVulnerabilityMaxTimer,
      skills: learnedSkills,
      skillChoices: [...w.skillChoices],
      relicChoices: [...w.relicChoices],
      defeatedByArchetype: { ...w.defeatedByArchetype },
      activeRoomArchetypes,
      hoveredArenaEnemy: null,
      hazards: w.hazards.map((h) => ({ ...h })),
      nearbyShrine: findInteractableShrine(w, 95),
      damageMultiplier: w.player.damageMultiplier,
      playerDebuffs: getPlayerActiveDebuffs(w.player),
      enemyDebuffSummary: getRoomEnemyDebuffSummary(w),
      thermalShockCount: w.thermalShockCount,
      solarMeltdownCount: w.solarMeltdownCount,
      combatLog: getActiveCombatLogEntries(w),
    };
  }, []);

  const [hud, setHud] = useState<HudDiscreteState>(() => buildHudFromWorld(worldRef.current));

  // Persist any newly defeated monster archetypes into localStorage Bestiary archive
  useEffect(() => {
    const runEntries = Object.entries(hud.defeatedByArchetype) as Array<[EnemyArchetype, number]>;
    if (runEntries.length === 0) return;
    setPersistedBestiary((prev) => {
      let changed = false;
      const next: Partial<Record<EnemyArchetype, number>> = { ...prev };
      for (const [arch, count] of runEntries) {
        if (count > (next[arch] ?? 0)) {
          next[arch] = count;
          changed = true;
        }
      }
      if (changed) {
        saveBestiaryDefeated(next);
        return next;
      }
      return prev;
    });
  }, [hud.defeatedByArchetype]);

  // High-frequency bar DOM refs updated by ArenaCanvas without React re-renders
  const hpBarRef = useRef<HTMLDivElement | null>(null);
  const ghostHpBarRef = useRef<HTMLDivElement | null>(null);
  const essenceBarRef = useRef<HTMLDivElement | null>(null);
  const xpBarRef = useRef<HTMLDivElement | null>(null);
  const dashCooldownRef = useRef<HTMLDivElement | null>(null);
  const novaCooldownRef = useRef<HTMLDivElement | null>(null);

  // Sync document.body.dataset.state immediately on mount and phase change
  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  // Subscribe to Global Sanctum Leaderboard in Firestore
  useEffect(() => {
    const unsubLeaderboard = subscribeToGlobalLeaderboard((entries) => {
      setCloudLeaderboard(entries);
    });
    return () => {
      unsubLeaderboard();
    };
  }, []);

  // Listen to Firebase Auth state & subscribe to Firestore cloud progress
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }
      if (user) {
        setAuthStatusText('Cloud Progress Synced');
        const localBest = Math.max(loadBestScore(), worldRef.current.bestScore);
        const localStage = loadHighestUnlockedStage();
        const localRuns = loadRunsPlayed();
        void syncPlayerProgressToCloud(user, {
          bestScore: localBest,
          highestUnlockedStage: localStage,
          totalCoins: worldRef.current.player.coins,
          runsPlayed: localRuns,
        });

        const curRec = loadLocalLeaderboardRecord(dailyChallengeConfig.seedCode);
        const updatedRec: SanctumLeaderboardRecord = {
          ...curRec,
          uid: user.uid,
          displayName: user.displayName || curRec.displayName,
          bestScore: Math.max(curRec.bestScore, localBest),
          highestStage: Math.max(curRec.highestStage, localStage),
          isCloud: true,
          isCurrentUser: true,
        };
        saveLocalLeaderboardRecord(updatedRec);
        setLocalLeaderboardRecord(updatedRec);
        void submitLeaderboardEntryToCloud(user, updatedRec);

        unsubFirestore = subscribeToCloudProgress(user, (cloud) => {
          const mergedBest = Math.max(loadBestScore(), worldRef.current.bestScore, cloud.bestScore);
          const mergedStage = Math.max(loadHighestUnlockedStage(), cloud.highestUnlockedStage);
          const mergedRuns = Math.max(loadRunsPlayed(), cloud.runsPlayed);
          saveBestScore(mergedBest);
          saveHighestUnlockedStage(mergedStage);
          saveRunsPlayed(mergedRuns);
          worldRef.current.bestScore = mergedBest;
          if (worldRef.current.phase === 'title') {
            worldRef.current.player.coins = Math.max(worldRef.current.player.coins, cloud.totalCoins);
          }
          setHighestUnlockedStage(mergedStage);
          setRunsPlayed(mergedRuns);
          setHud((prev) => ({
            ...prev,
            bestScore: mergedBest,
            coins: worldRef.current.player.coins,
          }));
        });
      } else {
        setAuthStatusText('');
      }
    });
    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, [dailyChallengeConfig.seedCode]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setAuthStatusText('Signing in...');
      await signInWithGooglePopup();
      setAuthStatusText('Cloud Progress Synced');
    } catch (err) {
      setAuthStatusText(formatFirebaseAuthError(err));
    }
  }, []);

  const handleGoogleLogout = useCallback(async () => {
    try {
      await signOutAccount();
      setAuthStatusText('Signed out (Local Mode)');
    } catch {
      // Ignore sign out error
    }
  }, []);

  const handlePhaseChange = useCallback(
    (nextPhase: GamePhase, endSnapshot?: RunSnapshot | null) => {
      document.body.dataset.state = nextPhase;
      worldRef.current.phase = nextPhase;
      if (endSnapshot) {
        setSnapshot(endSnapshot);
        saveBestScore(endSnapshot.bestScore);
        const nextRuns = loadRunsPlayed() + 1;
        saveRunsPlayed(nextRuns);
        setRunsPlayed(nextRuns);

        let updatedStage = loadHighestUnlockedStage();
        if (endSnapshot.outcome === 'victory') {
          const nextUnlock = Math.min(MAX_STAGE_LEVEL, endSnapshot.stageLevel + 1);
          updatedStage = Math.max(updatedStage, nextUnlock);
          saveHighestUnlockedStage(updatedStage);
          setHighestUnlockedStage(updatedStage);
        }

        // Update local & cloud Global Sanctum Leaderboard record
        setLocalLeaderboardRecord((prev) => {
          const isVictory = endSnapshot.outcome === 'victory';
          const clearSec = Math.max(1, Math.round(endSnapshot.clearTimeSeconds));
          const nextFastest = isVictory
            ? Math.min(prev.fastestClearTimeSec, clearSec)
            : prev.fastestClearTimeSec;
          const nextDailyScore =
            endSnapshot.gameMode === 'daily_challenge'
              ? Math.max(prev.dailyScore, endSnapshot.score)
              : prev.dailyScore;
          const nextBossRushWaves =
            endSnapshot.gameMode === 'boss_rush'
              ? Math.max(prev.bossRushWaves, endSnapshot.bossRushWavesCleared)
              : prev.bossRushWaves;
          const nextBossRushScore =
            endSnapshot.gameMode === 'boss_rush'
              ? Math.max(prev.bossRushScore, endSnapshot.score)
              : prev.bossRushScore;

          const updated: SanctumLeaderboardRecord = {
            ...prev,
            uid: auth.currentUser?.uid || prev.uid,
            displayName: auth.currentUser?.displayName || prev.displayName,
            bestScore: Math.max(prev.bestScore, endSnapshot.bestScore, endSnapshot.score),
            highestStage: Math.max(prev.highestStage, updatedStage, endSnapshot.stageLevel),
            fastestClearTimeSec: nextFastest,
            dailySeed: endSnapshot.dailySeed || dailyChallengeConfig.seedCode,
            dailyScore: nextDailyScore,
            bossRushWaves: nextBossRushWaves,
            bossRushScore: nextBossRushScore,
            favoriteStance: worldRef.current.player.stance,
            isCurrentUser: true,
            isCloud: Boolean(auth.currentUser),
          };
          saveLocalLeaderboardRecord(updated);
          if (auth.currentUser) {
            void submitLeaderboardEntryToCloud(auth.currentUser, updated);
          }
          return updated;
        });

        if (auth.currentUser) {
          void syncPlayerProgressToCloud(auth.currentUser, {
            bestScore: endSnapshot.bestScore,
            highestUnlockedStage: updatedStage,
            totalCoins: endSnapshot.coinsCollected,
            runsPlayed: nextRuns,
          });
        }
      }
      setPhase(nextPhase);
      if (nextPhase === 'playing' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [dailyChallengeConfig.seedCode]
  );

  const handleStartModeRun = useCallback(
    (modeToLaunch: GameMode, stageToLaunch: number, e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e?.currentTarget) {
        e.currentTarget.blur();
      }
      const clampedStage = Math.max(1, Math.min(MAX_STAGE_LEVEL, stageToLaunch));
      setSelectedMode(modeToLaunch);
      setSelectedStage(clampedStage);
      const best = Math.max(loadBestScore(), worldRef.current.bestScore);
      saveBestScore(best);
      worldRef.current = createInitialWorldState('playing', best, clampedStage, modeToLaunch);
      hireOrEquipFamiliar(worldRef.current, selectedFamiliar, true);
      setHud(buildHudFromWorld(worldRef.current));
      setSnapshot(null);
      setShowLeaderboardModal(false);
      document.body.dataset.state = 'playing';
      setPhase('playing');
    },
    [buildHudFromWorld, selectedFamiliar]
  );

  const handleStartStage = useCallback(
    (stageToLaunch: number, e?: React.MouseEvent<HTMLButtonElement>) => {
      handleStartModeRun('standard', stageToLaunch, e);
    },
    [handleStartModeRun]
  );

  const handleStartOrRestart = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      handleStartModeRun(selectedMode, selectedStage, e);
    },
    [handleStartModeRun, selectedMode, selectedStage]
  );

  const handleDescendEndlessAbyss = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e?.currentTarget) {
        e.currentTarget.blur();
      }
      const w = worldRef.current;
      advanceBossRushAbyssCycle(w);
      soundEngine.playLevelUp();
      setHud(buildHudFromWorld(w));
      setSnapshot(null);
      document.body.dataset.state = 'playing';
      setPhase('playing');
    },
    [buildHudFromWorld]
  );

  const handleReturnToTitle = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e?.currentTarget) {
        e.currentTarget.blur();
      }
      const best = Math.max(loadBestScore(), worldRef.current.bestScore);
      saveBestScore(best);
      worldRef.current = createInitialWorldState('title', best, selectedStage, selectedMode);
      hireOrEquipFamiliar(worldRef.current, selectedFamiliar, true);
      setHud(buildHudFromWorld(worldRef.current));
      setSnapshot(null);
      document.body.dataset.state = 'title';
      setPhase('title');
    },
    [buildHudFromWorld, selectedFamiliar, selectedMode, selectedStage]
  );

  const handleTogglePause = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'playing') {
        document.body.dataset.state = 'paused';
        worldRef.current.phase = 'paused';
        return 'paused';
      }
      if (prev === 'paused') {
        document.body.dataset.state = 'playing';
        worldRef.current.phase = 'playing';
        return 'playing';
      }
      return prev;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleSelectStance = useCallback((stanceId: WeaponStanceId) => {
    worldRef.current.player.stance = stanceId;
    setHud((prev) => ({ ...prev, stance: stanceId }));
  }, []);

  const handleUseItemSlot = useCallback(
    (slotIndex: number) => {
      const w = worldRef.current;
      if (w.phase !== 'playing') return;
      if (useInventorySlot(w, slotIndex)) {
        soundEngine.playPickup();
        if (w.outcome !== 'none') {
          soundEngine.playOutcome(w.outcome === 'victory');
          handlePhaseChange('gameover', w.snapshot);
        }
        setHud(buildHudFromWorld(w));
      }
    },
    [buildHudFromWorld, handlePhaseChange]
  );

  const handleBuyMerchantItem = useCallback(
    (itemId: UsableItemId) => {
      const w = worldRef.current;
      if (buyMerchantItem(w, itemId)) {
        soundEngine.playPickup();
        setHud(buildHudFromWorld(w));
        if (auth.currentUser) {
          void syncPlayerProgressToCloud(auth.currentUser, {
            bestScore: Math.max(loadBestScore(), w.bestScore),
            highestUnlockedStage: loadHighestUnlockedStage(),
            totalCoins: w.player.coins,
            runsPlayed: loadRunsPlayed(),
          });
        }
      }
    },
    [buildHudFromWorld]
  );

  const handleHireOrEquipFamiliar = useCallback(
    (famId: FamiliarId, forceFree = false) => {
      const w = worldRef.current;
      if (hireOrEquipFamiliar(w, famId, forceFree)) {
        setSelectedFamiliar(famId);
        soundEngine.playPickup();
        setHud(buildHudFromWorld(w));
      }
    },
    [buildHudFromWorld]
  );

  const handleCycleFamiliar = useCallback(() => {
    const w = worldRef.current;
    const next = cycleActiveFamiliar(w);
    if (next) {
      setSelectedFamiliar(next);
      soundEngine.playPickup();
      setHud(buildHudFromWorld(w));
    }
  }, [buildHudFromWorld]);

  const handleActivateShrine = useCallback(
    (hazardId?: number) => {
      const w = worldRef.current;
      const res = activateSanctumShrine(w, hazardId);
      if (res.activated) {
        soundEngine.playLevelUp();
        setHud(buildHudFromWorld(w));
      }
    },
    [buildHudFromWorld]
  );

  const handleDetonateBrazier = useCallback(
    (hazardId?: number) => {
      const w = worldRef.current;
      const target =
        typeof hazardId === 'number'
          ? w.hazards.find((h) => h.id === hazardId && h.kind === 'solar_brazier' && h.cooldown <= 0)
          : w.hazards.find((h) => h.kind === 'solar_brazier' && h.cooldown <= 0);
      if (target) {
        detonateSolarBrazier(w, target);
        soundEngine.playNova();
        if (w.outcome !== 'none') {
          soundEngine.playOutcome(w.outcome === 'victory');
          handlePhaseChange('gameover', w.snapshot);
        }
        setHud(buildHudFromWorld(w));
      }
    },
    [buildHudFromWorld, handlePhaseChange]
  );

  const handleTravelDoor = useCallback(
    (dir: DoorDirection, targetRoomId: number) => {
      const w = worldRef.current;
      const curRoom = w.rooms[w.currentRoomIndex];
      if (!curRoom || !curRoom.cleared) return;
      if (transitionToRoom(w, targetRoomId, dir)) {
        soundEngine.playDash();
        setHud(buildHudFromWorld(w));
      }
    },
    [buildHudFromWorld]
  );

  const handleChooseSkill = useCallback(
    (skillId: SkillId) => {
      if (applySkillChoice(worldRef.current, skillId)) {
        soundEngine.playPickup();
        setHud(buildHudFromWorld(worldRef.current));
      }
    },
    [buildHudFromWorld]
  );

  const handleChooseRelic = useCallback(
    (relicId: string) => {
      if (applyRelicChoice(worldRef.current, relicId)) {
        soundEngine.playPickup();
        setHud(buildHudFromWorld(worldRef.current));
      }
    },
    [buildHudFromWorld]
  );

  const pipStates = getHealthPipStates(hud.hp, hud.maxHp, 5);
  const lowHpCritical = phase === 'playing' && hud.hp > 0 && hud.hp <= hud.maxHp * 0.25;
  const currentRoom = hud.rooms[hud.currentRoomIndex];
  const selectedStageSpec =
    STAGE_CATALOG.find((s) => s.stage === selectedStage) ?? STAGE_CATALOG[0];

  const rankedLeaderboard = buildRankedLeaderboard(
    cloudLeaderboard,
    localLeaderboardRecord,
    leaderboardCategory,
    dailyChallengeConfig.seedCode
  );

  const handleManualSyncLeaderboard = () => {
    const best = Math.max(loadBestScore(), hud.bestScore, localLeaderboardRecord.bestScore);
    const stage = Math.max(loadHighestUnlockedStage(), localLeaderboardRecord.highestStage);
    const updated: SanctumLeaderboardRecord = {
      ...localLeaderboardRecord,
      uid: currentUser?.uid || localLeaderboardRecord.uid,
      displayName: currentUser?.displayName || localLeaderboardRecord.displayName,
      bestScore: best,
      highestStage: stage,
      dailySeed: dailyChallengeConfig.seedCode,
      isCurrentUser: true,
      isCloud: Boolean(currentUser),
    };
    saveLocalLeaderboardRecord(updated);
    setLocalLeaderboardRecord(updated);
    if (currentUser) {
      void submitLeaderboardEntryToCloud(currentUser, updated);
      setLeaderboardSyncNote('Synced to Firebase Firestore Leaderboard!');
    } else {
      setLeaderboardSyncNote('Record updated locally (Sign in with Google to publish globally)');
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#09080d]">
      {/* Isolated 60 FPS Canvas2D Arena Container */}
      <ArenaCanvas
        worldRef={worldRef}
        phase={phase}
        onSyncHud={setHud}
        onPhaseChange={handlePhaseChange}
        onChooseSkill={handleChooseSkill}
        onTogglePause={handleTogglePause}
        onToggleMute={handleToggleMute}
        onRestart={() => handleStartOrRestart()}
        hpBarRef={hpBarRef}
        ghostHpBarRef={ghostHpBarRef}
        essenceBarRef={essenceBarRef}
        xpBarRef={xpBarRef}
        dashCooldownRef={dashCooldownRef}
        novaCooldownRef={novaCooldownRef}
      />

      {/* Subtle Low-HP Peripheral Vignette */}
      {lowHpCritical && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            boxShadow: 'inset 0 0 90px rgba(225, 29, 72, 0.42)',
          }}
        />
      )}

      {/* =====================================================================
          STATE 1: TITLE SCREEN OVERLAY (Cloud Login + Modes + Leaderboard)
          ===================================================================== */}
      {phase === 'title' && (
        <section
          aria-label="Title Screen"
          className="fixed inset-0 z-20 flex flex-col items-center justify-between px-6 py-5 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(9, 8, 13, 0.22) 0%, rgba(9, 8, 13, 0.86) 78%)',
          }}
        >
          {/* Top Bar: Personal Best + Global Leaderboard + Account Login / Cloud Save Status */}
          <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 text-xs tracking-wider text-[#d6cbb9]/85 font-mono-tabular pointer-events-auto">
            <div className="flex flex-wrap items-center gap-3">
              <span>ROGUELIKE SANCTUARY · STAGES 1–30 · MAX LV.{MAX_PLAYER_LEVEL}</span>
              <span className="text-[#fde68a]">
                BEST: {Math.max(hud.bestScore, initialBest)} · FASTEST:{' '}
                {formatSpeedrunTime(localLeaderboardRecord.fastestClearTimeSec)}
              </span>
              <button
                type="button"
                data-testid="open-leaderboard-btn"
                onClick={() => setShowLeaderboardModal(true)}
                className="px-3 py-1 rounded bg-[#2a1f3d] hover:bg-[#3b2b54] text-[#fde047] border border-[#f59e0b] text-[11px] font-bold cursor-pointer transition-colors shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              >
                Global Leaderboard [Top 10]
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {currentUser ? (
                <>
                  <span className="px-2.5 py-1 rounded bg-[#064e3b]/85 border border-[#10b981] text-[#a7f3d0] text-[11px]">
                    {currentUser.displayName || 'Solar Warden'} · Cloud Saved
                  </span>
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="px-2.5 py-1 rounded bg-[#181326] hover:bg-[#251d3a] text-[#d6cbb9] border border-[#3b2d4a] text-[11px] cursor-pointer transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  data-login="true"
                  onClick={handleGoogleLogin}
                  className="px-3 py-1.5 rounded bg-[#1e1b4b] hover:bg-[#2e296e] text-[#e0f2fe] border border-[#38bdf8] text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Login with Google (Save Cloud Progress)
                </button>
              )}
              {authStatusText && !currentUser && (
                <span className="text-[10px] text-[#fde68a]">{authStatusText}</span>
              )}
            </div>
          </div>

          {/* Center Monument Spotlight Lockup + 3-Mode Sanctuary Selector */}
          <div className="flex flex-col items-center text-center max-w-2xl w-full my-auto pointer-events-auto">
            <TitleCrestEmblem />

            <p className="mt-1.5 text-xs sm:text-sm text-[#d6cbb9] max-w-lg leading-relaxed">
              Battle 12 monster archetypes across connected sanctum rooms, awaken evolved weapons, compete on the Daily Challenge Seed, or test your build in Endless Boss Rush.
            </p>

            {/* 3 Game Mode Tabs: Standard Chronicle | Daily Challenge Seed | Boss Rush Abyss */}
            <div
              data-testid="mode-selector"
              className="mt-3.5 w-full grid grid-cols-3 gap-2 font-mono-tabular"
            >
              <button
                type="button"
                data-mode-tab="standard"
                onClick={() => {
                  setSelectedMode('standard');
                  worldRef.current = createInitialWorldState(
                    'title',
                    Math.max(loadBestScore(), worldRef.current.bestScore),
                    selectedStage,
                    'standard'
                  );
                  setHud(buildHudFromWorld(worldRef.current));
                }}
                className={`py-2 px-2.5 rounded border text-xs font-bold transition-colors cursor-pointer ${
                  selectedMode === 'standard'
                    ? 'bg-[#2a1f3d] border-[#f59e0b] text-[#fde68a] shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-[#14101f] border-[#2e243d] text-[#c4b9a5] hover:border-[#fde68a]'
                }`}
              >
                <div>STANDARD CHRONICLE</div>
                <div className="text-[10px] font-normal text-[#38bdf8]">Stages 1–30 Campaign</div>
              </button>

              <button
                type="button"
                data-mode-tab="daily_challenge"
                onClick={() => {
                  setSelectedMode('daily_challenge');
                  worldRef.current = createInitialWorldState(
                    'title',
                    Math.max(loadBestScore(), worldRef.current.bestScore),
                    dailyChallengeConfig.stageLevel,
                    'daily_challenge'
                  );
                  setHud(buildHudFromWorld(worldRef.current));
                }}
                className={`py-2 px-2.5 rounded border text-xs font-bold transition-colors cursor-pointer ${
                  selectedMode === 'daily_challenge'
                    ? 'bg-[#172554] border-[#38bdf8] text-[#e0f2fe] shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                    : 'bg-[#14101f] border-[#2e243d] text-[#c4b9a5] hover:border-[#38bdf8]'
                }`}
              >
                <div>DAILY CHALLENGE SEED</div>
                <div className="text-[10px] font-normal text-[#fde047]">
                  {dailyChallengeConfig.seedCode}
                </div>
              </button>

              <button
                type="button"
                data-mode-tab="boss_rush"
                onClick={() => {
                  setSelectedMode('boss_rush');
                  worldRef.current = createInitialWorldState(
                    'title',
                    Math.max(loadBestScore(), worldRef.current.bestScore),
                    6,
                    'boss_rush'
                  );
                  setHud(buildHudFromWorld(worldRef.current));
                }}
                className={`py-2 px-2.5 rounded border text-xs font-bold transition-colors cursor-pointer ${
                  selectedMode === 'boss_rush'
                    ? 'bg-[#3b0764] border-[#e879f9] text-[#fae8ff] shadow-[0_0_12px_rgba(232,121,249,0.35)]'
                    : 'bg-[#14101f] border-[#2e243d] text-[#c4b9a5] hover:border-[#e879f9]'
                }`}
              >
                <div>BOSS RUSH / ABYSS</div>
                <div className="text-[10px] font-normal text-[#f43f5e]">
                  Boss & Elite Gauntlet
                </div>
              </button>
            </div>

            {/* MODE PANEL A: Stage 1 to 30 Roguelike Level Selector */}
            {selectedMode === 'standard' && (
              <div
                aria-label="Select Sanctuary Stage"
                className="mt-2.5 w-full bg-[#120f1a]/92 border border-[#3b2d4a] rounded-md p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.85)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#fde68a] mb-1.5">
                  <span className="truncate">
                    STAGE {selectedStageSpec.stage}: {selectedStageSpec.name.toUpperCase()} ({selectedStageSpec.subtitle})
                  </span>
                  <span className="text-[#c4b9a5] shrink-0">
                    UNLOCKED {highestUnlockedStage}/{MAX_STAGE_LEVEL}
                  </span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1">
                  {STAGE_CATALOG.map((st) => {
                    const isUnlocked = st.stage <= highestUnlockedStage;
                    const isSelected = st.stage === selectedStage;
                    return (
                      <button
                        key={st.stage}
                        type="button"
                        disabled={!isUnlocked}
                        data-stage={st.stage}
                        aria-label={`Stage ${st.stage} ${st.name}${!isUnlocked ? ' (Locked)' : ''}`}
                        onClick={() => {
                          if (isUnlocked) {
                            setSelectedStage(st.stage);
                            worldRef.current = createInitialWorldState(
                              'title',
                              Math.max(loadBestScore(), worldRef.current.bestScore),
                              st.stage,
                              'standard'
                            );
                            setHud(buildHudFromWorld(worldRef.current));
                          }
                        }}
                        className={`flex items-center justify-between py-1 px-1.5 rounded border font-mono-tabular transition-colors ${
                          !isUnlocked
                            ? 'bg-[#0c0a12] border-[#1f192b] text-[#574c68] opacity-55 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#2a1f3d] border-[#f59e0b] text-[#fde68a] cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                            : 'bg-[#171324] border-[#312642] text-[#d6cbb9] hover:border-[#fde68a] cursor-pointer'
                        }`}
                      >
                        <span className="text-[11px] font-bold leading-none">S{st.stage}</span>
                        <span className="text-[8.5px] text-[#38bdf8] leading-none">{st.roomCount}R</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODE PANEL B: Deterministic Daily Challenge Seed Dossier */}
            {selectedMode === 'daily_challenge' && (
              <div
                data-testid="daily-challenge-card"
                className="mt-2.5 w-full bg-[#120f1a]/95 border border-[#38bdf8] rounded-md p-3.5 text-left shadow-[0_10px_28px_rgba(0,0,0,0.85)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-2">
                  <div>
                    <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#38bdf8]">
                      DAILY DETERMINISTIC SANCTUM SEED · {dailyChallengeConfig.dateString}
                    </span>
                    <h3 className="text-base font-display font-bold text-[#f4efe6]">
                      Seed Code: <span className="text-[#fde047]">{dailyChallengeConfig.seedCode}</span> · Stage {dailyChallengeConfig.stageLevel} Layout
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#0c4a6e] border border-[#38bdf8] text-[10px] font-mono-tabular font-bold text-[#bae6fd]">
                    YOUR DAILY BEST: {localLeaderboardRecord.dailyScore} PTS
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-tabular text-xs">
                  <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2">
                    <div className="text-[9px] text-[#a39887]">AWAKENED STANCE GIFT</div>
                    <div className="mt-0.5 font-bold text-[#fde047]">
                      {dailyChallengeConfig.awakenedStanceName}
                    </div>
                  </div>
                  <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2">
                    <div className="text-[9px] text-[#a39887]">STARTING RELIC BOON</div>
                    <div className="mt-0.5 font-bold text-[#6ee7b7]">
                      {dailyChallengeConfig.startingRelicName}
                    </div>
                  </div>
                  <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2">
                    <div className="text-[9px] text-[#a39887]">DAILY MUTATOR ({dailyChallengeConfig.scoreMultiplier}x SCORE)</div>
                    <div className="mt-0.5 font-bold text-[#38bdf8]">
                      {dailyChallengeConfig.mutatorName}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#c4b9a5] font-mono-tabular">
                  {dailyChallengeConfig.mutatorSummary} — Identical room formations & monster rosters for all Wardens today.
                </p>
              </div>
            )}

            {/* MODE PANEL C: Boss Rush / Endless Abyss Dossier */}
            {selectedMode === 'boss_rush' && (
              <div
                data-testid="boss-rush-card"
                className="mt-2.5 w-full bg-[#120f1a]/95 border border-[#e879f9] rounded-md p-3.5 text-left shadow-[0_10px_28px_rgba(0,0,0,0.85)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b0764] pb-2">
                  <div>
                    <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#e879f9]">
                      ENDLESS ABYSS CRUCIBLE · BOSS & ELITE GAUNTLET
                    </span>
                    <h3 className="text-base font-display font-bold text-[#f4efe6]">
                      5-Crucible Sovereign Rush & Infinite Abyss Cycles
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#3b0764] border border-[#e879f9] text-[10px] font-mono-tabular font-bold text-[#fae8ff]">
                    BEST ABYSS WAVES: {localLeaderboardRecord.bossRushWaves} · {localLeaderboardRecord.bossRushScore} PTS
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-tabular text-xs">
                  <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2">
                    <div className="text-[9px] text-[#a39887]">STARTING LOADOUT</div>
                    <div className="mt-0.5 font-bold text-[#fde047]">
                      LV.3 · 180 HP · Solar Greatsword
                    </div>
                  </div>
                  <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2">
                    <div className="text-[9px] text-[#a39887]">ENEMY ROSTER</div>
                    <div className="mt-0.5 font-bold text-[#f43f5e]">
                      All Elites & Twin Archon Bosses
                    </div>
                  </div>
                  <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2">
                    <div className="text-[9px] text-[#a39887]">ENDLESS SCALING</div>
                    <div className="mt-0.5 font-bold text-[#e879f9]">
                      1.4x Score · Infinite Abyss Cycles
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#c4b9a5] font-mono-tabular">
                  Confront Eclipse Inquisitors, Solar Zealots, Void Singularities, and Archons of the Corona back-to-back.
                </p>
              </div>
            )}

            {/* Astral Familiar Companion (Pendamping Roh Astral) Selector */}
            <div
              data-testid="title-familiar-selector"
              className="mt-3 bg-[#13101d]/95 border border-[#3b2d4a] rounded-md px-3.5 py-2.5 text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-tabular uppercase tracking-wider">
                <span className="text-[#fde68a] font-bold">
                  ASTRAL SPIRIT COMPANION · PENDAMPING ROH ASTRAL [F]
                </span>
                <span className="text-[#a39887]">
                  Starter Bond: <span className="text-[#f4efe6] font-bold">{FAMILIAR_CATALOG[selectedFamiliar].name}</span> ({FAMILIAR_CATALOG[selectedFamiliar].titleIndonesian})
                </span>
              </div>
              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FAMILIAR_KEYS.map((famKey) => {
                  const fam = FAMILIAR_CATALOG[famKey];
                  const isSelected = selectedFamiliar === famKey;
                  return (
                    <button
                      key={famKey}
                      type="button"
                      data-familiar-card={famKey}
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        setSelectedFamiliar(famKey);
                      }}
                      className={`flex items-start gap-2 rounded p-2 border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#231b36] border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-[#0e0c16] hover:bg-[#191427] border-[#2b2238]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        <FamiliarIcon familiarId={famKey} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 text-[11px] font-mono-tabular">
                          <span className="font-bold text-[#f4efe6] truncate">{fam.name}</span>
                          <span
                            className="text-[9px] px-1 py-0.2 rounded font-bold shrink-0"
                            style={{
                              backgroundColor: isSelected ? fam.accentColor : '#1b1629',
                              color: isSelected ? '#09080d' : fam.accentColor,
                            }}
                          >
                            {isSelected ? 'BONDED' : fam.hireCost === 0 ? 'FREE' : `${fam.hireCost}c HIRE`}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#c4b9a5] leading-tight mt-0.5">
                          {fam.roleClue}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-3">
              {selectedMode === 'standard' && (
                <button
                  type="button"
                  data-start="true"
                  onClick={(e) => handleStartModeRun('standard', selectedStage, e)}
                  className="px-7 py-3 rounded-md bg-[#f59e0b] hover:bg-[#fbbf24] active:translate-y-0.5 text-[#09080d] font-display font-bold text-base tracking-wider shadow-[0_6px_20px_rgba(245,158,11,0.35)] transition-transform cursor-pointer whitespace-nowrap shrink-0"
                >
                  Enter Stage {selectedStage} ({selectedStageSpec.roomCount} Rooms)
                </button>
              )}

              {selectedMode === 'daily_challenge' && (
                <button
                  type="button"
                  data-start="true"
                  data-testid="start-daily-challenge-btn"
                  onClick={(e) =>
                    handleStartModeRun('daily_challenge', dailyChallengeConfig.stageLevel, e)
                  }
                  className="px-7 py-3 rounded-md bg-[#38bdf8] hover:bg-[#7dd3fc] active:translate-y-0.5 text-[#09080d] font-display font-bold text-base tracking-wider shadow-[0_6px_20px_rgba(56,189,248,0.35)] transition-transform cursor-pointer whitespace-nowrap shrink-0"
                >
                  Start Daily Challenge ({dailyChallengeConfig.seedCode})
                </button>
              )}

              {selectedMode === 'boss_rush' && (
                <button
                  type="button"
                  data-start="true"
                  data-testid="start-boss-rush-btn"
                  onClick={(e) => handleStartModeRun('boss_rush', 6, e)}
                  className="px-7 py-3 rounded-md bg-[#e879f9] hover:bg-[#f0abfc] active:translate-y-0.5 text-[#09080d] font-display font-bold text-base tracking-wider shadow-[0_6px_20px_rgba(232,121,249,0.35)] transition-transform cursor-pointer whitespace-nowrap shrink-0"
                >
                  Enter Boss Rush Abyss (5 Crucibles)
                </button>
              )}

              <button
                type="button"
                aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleToggleMute();
                }}
                className="px-4 py-3 rounded-md bg-[#161321] hover:bg-[#221d33] text-[#f4efe6] border border-[#3b2d4a] text-xs font-mono-tabular tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {muted ? 'Audio: Muted [M]' : 'Audio: Active [M]'}
              </button>
            </div>
          </div>

          {/* Single Flat Inline Control-Hint Line in Bottom Safe Margin */}
          <div className="text-xs text-[#d6cbb9]/85 tracking-wide font-mono-tabular text-center">
            WASD Move & Portals · Click/J Attack (Strike Braziers) · Space Dash · E Nova · G Activate Altar/Fountain · F Familiar · Z/X/C Items
          </div>
        </section>
      )}

      {/* =====================================================================
          STATE 2: PLAYING HUD (World-matched perimeter clusters, >=85% clear)
          ===================================================================== */}
      {phase !== 'title' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3.5 sm:p-4">
          {/* Top Perimeter Row: Left Vitality/Coins/XP | Center Dungeon Room Map & Boss | Right Utility */}
          <div className="flex items-start justify-between gap-3">
            {/* Top-Left Cluster: Vitality Pips, Essence, Level/XP, Stage/Room, Coins, Timer & Skills */}
            <div className="flex flex-col gap-1.5 bg-[#120f1a]/90 border border-[#3b2d4a] rounded-md px-3 py-2 shadow-[0_6px_16px_rgba(0,0,0,0.75)]">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#f59e0b]">
                  HP
                </span>
                <div className="flex items-center gap-1" aria-label={`Vitality ${hud.hp} of ${hud.maxHp}`}>
                  {pipStates.map((st, idx) => (
                    <VitalityHeartPip key={idx} state={st} />
                  ))}
                </div>
                <span className="text-lg font-bold font-mono-tabular text-[#f4efe6] hud-stroke">
                  {hud.hp}
                  <span className="text-xs text-[#a39887] font-normal">/{hud.maxHp}</span>
                </span>
              </div>

              {/* Continuous Health Bar with Delayed Trailing Ghost Damage Bar */}
              <div className="w-52 h-2 bg-[#09080d] rounded-sm overflow-hidden relative border border-[#2c2238]">
                <div
                  ref={ghostHpBarRef}
                  className="absolute inset-y-0 left-0 w-full bg-[#fbbf24]/70 origin-left transition-none"
                />
                <div
                  ref={hpBarRef}
                  className="absolute inset-y-0 left-0 w-full bg-[#e11d48] origin-left transition-none"
                />
              </div>

              {/* Astral Essence Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#38bdf8] w-14">
                  ESSENCE
                </span>
                <div className="w-28 h-1.5 bg-[#09080d] rounded-sm overflow-hidden relative border border-[#1e293b]">
                  <div
                    ref={essenceBarRef}
                    className="absolute inset-y-0 left-0 w-full bg-[#38bdf8] origin-left transition-none"
                  />
                </div>
                <span className="text-xs font-mono-tabular text-[#bae6fd]">{hud.essence}</span>
              </div>

              {/* Solar Level & XP Progress Bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-widest text-[#fde047] w-14">
                  LV.{hud.level}/{MAX_PLAYER_LEVEL}
                </span>
                <div className="w-28 h-1.5 bg-[#09080d] rounded-sm overflow-hidden relative border border-[#422006]">
                  <div
                    ref={xpBarRef}
                    className="absolute inset-y-0 left-0 w-full bg-[#eab308] origin-left transition-none"
                  />
                </div>
                <span className="text-[11px] font-mono-tabular text-[#fef08a]">
                  {hud.xp}/{hud.xpToNextLevel} XP
                </span>
              </div>

              {/* Player Elemental Debuff Status Bar & Active Enemy Afflictions */}
              <div
                data-testid="player-debuff-bar"
                data-status={hud.playerDebuffs.length > 0 ? 'afflicted' : 'clear'}
                className="flex flex-col gap-1 pt-1 border-t border-[#292036] font-mono-tabular"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#a39887]">
                    STATUS
                  </span>
                  {hud.playerDebuffs.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {hud.playerDebuffs.map((debuff) => {
                        const pct = Math.max(
                          0,
                          Math.min(100, Math.round((debuff.remainingSeconds / Math.max(0.1, debuff.maxSeconds)) * 100))
                        );
                        return (
                          <div
                            key={debuff.id}
                            data-testid={`player-debuff-${debuff.id}`}
                            title={`${debuff.name} (${debuff.effectTag}) · ${debuff.remainingSeconds.toFixed(1)}s remaining`}
                            className="relative overflow-hidden flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]"
                            style={{
                              backgroundColor: debuff.bgColor,
                              borderColor: debuff.borderColor,
                            }}
                          >
                            <DebuffIcon debuffId={debuff.id} className="w-3.5 h-3.5 shrink-0" />
                            <span
                              className="font-bold tracking-tight"
                              style={{ color: debuff.accentColor }}
                            >
                              {debuff.shortLabel}
                              {debuff.stacks > 1 ? ` x${debuff.stacks}` : ''}
                            </span>
                            <span className="text-[9px] text-[#e2e8f0]">{debuff.effectTag}</span>
                            <span className="text-[9px] font-bold text-[#fef08a]">
                              {debuff.remainingSeconds.toFixed(1)}s
                            </span>
                            <div
                              className="absolute bottom-0 left-0 h-[2px] transition-none"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: debuff.accentColor,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#6ee7b7] font-semibold">
                      WARDEN CLEAR
                    </span>
                  )}
                </div>

                {(hud.enemyDebuffSummary.burnedCount > 0 ||
                  hud.enemyDebuffSummary.slowedCount > 0 ||
                  hud.enemyDebuffSummary.sunderedCount > 0) && (
                  <div
                    data-testid="arena-enemy-debuffs"
                    className="flex flex-wrap items-center justify-between gap-1.5 text-[9px] text-[#d6cbb9]"
                  >
                    <span className="text-[#a39887]">ENEMY AFFLICTIONS</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {hud.enemyDebuffSummary.burnedCount > 0 && (
                        <span
                          data-testid="enemy-burned-count"
                          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#431407] border border-[#f97316] text-[#fed7aa] font-bold"
                        >
                          <DebuffIcon debuffId="burned" className="w-3 h-3 shrink-0" />
                          {hud.enemyDebuffSummary.burnedCount} BURN
                        </span>
                      )}
                      {hud.enemyDebuffSummary.slowedCount > 0 && (
                        <span
                          data-testid="enemy-slowed-count"
                          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#082f49] border border-[#38bdf8] text-[#bae6fd] font-bold"
                        >
                          <DebuffIcon debuffId="slowed" className="w-3 h-3 shrink-0" />
                          {hud.enemyDebuffSummary.slowedCount} SLOW
                        </span>
                      )}
                      {hud.enemyDebuffSummary.sunderedCount > 0 && (
                        <span
                          data-testid="enemy-sundered-count"
                          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#4c0519] border border-[#f43f5e] text-[#fecdd3] font-bold"
                        >
                          <DebuffIcon debuffId="sundered" className="w-3 h-3 shrink-0" />
                          {hud.enemyDebuffSummary.sunderedCount} SUNDER
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Elemental Reaction Combo Readout (Thermal Shock & Solar Meltdown) */}
                <div
                  data-testid="hud-elemental-reactions"
                  className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5 text-[9px] text-[#d6cbb9]"
                >
                  <span
                    className="text-[#a39887]"
                    title="Thermal Shock: Burned + Slowed (True DMG + Spread) · Solar Meltdown: 3x Burn + Crit (Armor Sunder +35% DMG)"
                  >
                    REACTIONS
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      data-testid="hud-thermal-shock-pill"
                      title="Thermal Shock (Burned + Slowed): Instant Astral Steam True DMG & spreads debuffs"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border font-bold ${
                        hud.thermalShockCount > 0
                          ? 'bg-[#083344] border-[#22d3ee] text-[#67e8f9]'
                          : 'bg-[#14101f] border-[#2d243b] text-[#94a3b8]'
                      }`}
                    >
                      <span>STEAM</span>
                      <span className="text-[#fef08a]">{hud.thermalShockCount}</span>
                    </span>
                    <span
                      data-testid="hud-solar-meltdown-pill"
                      title="Solar Meltdown (3x Burn Stacks + Critical Strike): Detonates stacks & sunders Elite/Boss armor (+35% DMG)"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border font-bold ${
                        hud.solarMeltdownCount > 0
                          ? 'bg-[#4c0519] border-[#f43f5e] text-[#fde047]'
                          : 'bg-[#14101f] border-[#2d243b] text-[#94a3b8]'
                      }`}
                    >
                      <span>MELTDOWN</span>
                      <span className="text-[#fda4af]">{hud.solarMeltdownCount}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage, Room, Coins, Score & Speedrun Timer Readouts */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-[#292036] text-xs font-mono-tabular">
                <div>
                  <span className="text-[10px] text-[#a39887] mr-1">STAGE</span>
                  <span className="text-xs font-bold text-[#fde68a]">
                    {hud.stageLevel}/{MAX_STAGE_LEVEL}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#a39887] mr-1">ROOM</span>
                  <span className="text-xs font-bold text-[#10b981]">
                    {hud.currentRoomIndex + 1}/{hud.rooms.length}
                  </span>
                </div>
                <div className="flex items-center gap-1" aria-label={`Solar Coins ${hud.coins}`}>
                  <CoinIcon />
                  <span className="text-xs font-bold text-[#fbbf24]">{hud.coins}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#a39887] mr-1">SCORE</span>
                  <span className="text-xs font-bold text-[#f4efe6]">{hud.score}</span>
                </div>
                <div data-testid="hud-run-timer">
                  <span className="text-[10px] text-[#a39887] mr-1">TIME</span>
                  <span className="text-xs font-bold text-[#38bdf8]">
                    {formatSpeedrunTime(hud.elapsedSeconds || 0.1)}
                  </span>
                </div>
              </div>

              {/* Active Game Mode Tag if Daily Challenge or Boss Rush */}
              {hud.gameMode !== 'standard' && (
                <div
                  data-testid="hud-mode-badge"
                  className="flex items-center justify-between gap-2 pt-1 border-t border-[#292036] text-[10px] font-mono-tabular"
                >
                  {hud.gameMode === 'daily_challenge' ? (
                    <span className="text-[#38bdf8] font-bold">
                      DAILY SEED: {hud.dailySeed}
                    </span>
                  ) : (
                    <span className="text-[#e879f9] font-bold">
                      BOSS RUSH · CYCLE {hud.bossRushCycle} · WAVES: {hud.bossRushWavesCleared}
                    </span>
                  )}
                </div>
              )}

              {/* Active Familiar Companion Status & Cycle Button [F] */}
              {hud.activeFamiliar && (
                <div
                  data-testid="hud-active-familiar"
                  data-familiar-id={hud.activeFamiliar}
                  className="flex items-center justify-between gap-2 pt-1 border-t border-[#292036] text-[10px] font-mono-tabular pointer-events-auto"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FamiliarIcon familiarId={hud.activeFamiliar} />
                    <div className="truncate">
                      <span
                        className="font-bold mr-1.5"
                        style={{ color: FAMILIAR_CATALOG[hud.activeFamiliar].accentColor }}
                      >
                        {FAMILIAR_CATALOG[hud.activeFamiliar].name}
                      </span>
                      <span className="text-[#c4b9a5]">
                        {hud.activeFamiliar === 'aegis_cherub'
                          ? hud.cherubShieldActive
                            ? '· Shield Ready'
                            : `· Recharge ${hud.cherubShieldCooldownRemaining}s`
                          : hud.activeFamiliar === 'ember_wisp'
                          ? '· Auto-Fire Bolts'
                          : '· Room Magnet +20%c'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="hud-cycle-familiar-btn"
                    title="Switch Unlocked Familiar Companion [F] or open Pause [P] to hire"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleCycleFamiliar();
                    }}
                    className="px-1.5 py-0.5 rounded bg-[#1d172b] hover:bg-[#2a213d] text-[#fde68a] border border-[#3b2d4a] text-[9px] font-bold cursor-pointer shrink-0"
                  >
                    [F] {Object.values(hud.unlockedFamiliars).filter(Boolean).length}/3
                  </button>
                </div>
              )}

              {/* Active Learned Skills Strip */}
              {hud.skills.length > 0 && (
                <div
                  aria-label="Learned Skills"
                  className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#292036]"
                >
                  {hud.skills.map((sk) => {
                    const spec = SKILL_CATALOG.find((c) => c.id === sk.id);
                    return (
                      <div
                        key={sk.id}
                        title={`${spec?.name ?? sk.id} (Rank ${sk.rank})`}
                        className="flex items-center gap-1 bg-[#1b162a] border border-[#3b2d4a] rounded px-1.5 py-0.5 text-[10px] font-mono-tabular text-[#fde68a]"
                      >
                        <span className="font-semibold text-[#f4efe6]">
                          {spec?.name.split(' ')[0]}
                        </span>
                        <span className="text-[#f59e0b]">R{sk.rank}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center Top: Multi-Room Dungeon Map & Portal / Sanctuary Merchant Bar */}
            <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
              <div
                aria-label="Dungeon Room Map"
                className="flex flex-col items-center bg-[#120f1a]/90 border border-[#3b2d4a] rounded-md px-3.5 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.8)]"
              >
                <div className="flex items-center gap-2 text-[10px] font-mono-tabular text-[#d6cbb9]">
                  <span className="font-bold text-[#fde68a]">
                    {hud.gameMode === 'boss_rush'
                      ? `BOSS RUSH ABYSS · CYCLE ${hud.bossRushCycle} (${hud.rooms.length} CRUCIBLES):`
                      : hud.gameMode === 'daily_challenge'
                      ? `DAILY ${hud.dailySeed} · STAGE ${hud.stageLevel} (${hud.rooms.length} ROOMS):`
                      : `STAGE ${hud.stageLevel} MAP (${hud.rooms.length} ROOMS):`}
                  </span>
                  <span>{currentRoom?.name ?? 'Sanctum Chamber'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      currentRoom?.cleared
                        ? 'bg-[#064e3b] text-[#a7f3d0]'
                        : 'bg-[#4c0519] text-[#fda4af]'
                    }`}
                  >
                    {currentRoom?.cleared ? 'CLEARED · PORTALS OPEN' : 'COMBAT ACTIVE'}
                  </span>
                </div>

                {/* Connected Room Nodes Strip */}
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
                  {hud.rooms.map((rm) => {
                    const isCurrent = rm.id === hud.currentRoomIndex;
                    const label = rm.kind === 'boss' ? 'BOSS' : `R${rm.id + 1}`;
                    return (
                      <div
                        key={rm.id}
                        title={`Room ${rm.id + 1}: ${rm.name} (${rm.roster.length} Monsters · ${rm.cleared ? 'Cleared' : 'Uncleared'})`}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-bold border ${
                          isCurrent
                            ? 'bg-[#f59e0b] text-[#09080d] border-[#fef08a]'
                            : rm.cleared
                            ? 'bg-[#064e3b]/80 text-[#a7f3d0] border-[#10b981]'
                            : rm.visited
                            ? 'bg-[#1e1b4b] text-[#bae6fd] border-[#38bdf8]'
                            : 'bg-[#161224] text-[#7c728d] border-[#2d243b]'
                        }`}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>

                {/* Sanctum Traps & Interactive Arena Hazards Tactical Strip */}
                {hud.hazards.length > 0 && (() => {
                  const braziers = hud.hazards.filter((h) => h.kind === 'solar_brazier');
                  const readyBraziers = braziers.filter((b) => b.cooldown <= 0);
                  const spikes = hud.hazards.filter((h) => h.kind === 'spike_rune');
                  const activeSpikes = spikes.filter((s) => s.spikePhase === 'active').length;
                  const warningSpikes = spikes.filter((s) => s.spikePhase === 'warning').length;
                  const cursedAltar = hud.hazards.find((h) => h.kind === 'cursed_altar');
                  const healingFountain = hud.hazards.find((h) => h.kind === 'healing_fountain');

                  return (
                    <div
                      data-testid="hud-room-hazards"
                      className="mt-1.5 pt-1.5 border-t border-[#2b2238] flex flex-wrap items-center justify-center gap-1.5 font-mono-tabular text-[10px]"
                    >
                      {/* Solar Brazier Tactical Trigger / Status */}
                      <button
                        type="button"
                        data-testid="hud-brazier-status"
                        disabled={readyBraziers.length === 0}
                        title="Solar Brazier (Tungku Api): Strike in arena or click to detonate AoE fire blast against nearby enemies"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          handleDetonateBrazier(readyBraziers[0]?.id);
                        }}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          readyBraziers.length > 0
                            ? 'bg-[#431407]/85 hover:bg-[#7c2d12] text-[#fed7aa] border-[#fb923c] font-bold cursor-pointer'
                            : 'bg-[#14101d] text-[#6d647d] border-[#261e33] opacity-70 cursor-not-allowed'
                        }`}
                      >
                        🔥 Brazier:{' '}
                        {readyBraziers.length > 0
                          ? `${readyBraziers.length}/${braziers.length} Ready [Hit]`
                          : `Recharging`}
                      </button>

                      {/* Spike Runes Tactical Phase Readout */}
                      <span
                        data-testid="hud-spike-status"
                        title="Spike Runes (Lantai Berduri): Push enemies onto active spikes with Chrono Scythe knockback"
                        className={`px-2 py-0.5 rounded border ${
                          activeSpikes > 0
                            ? 'bg-[#4c0519] text-[#fda4af] border-[#f43f5e] font-bold'
                            : warningSpikes > 0
                            ? 'bg-[#451a03] text-[#fde047] border-[#f59e0b]'
                            : 'bg-[#161224] text-[#94a3b8] border-[#2d243b]'
                        }`}
                      >
                        ⚔ Spikes:{' '}
                        {activeSpikes > 0
                          ? 'ACTIVE!'
                          : warningSpikes > 0
                          ? 'ARMING [!]'
                          : 'Dormant'}
                      </span>

                      {/* Cursed Blood Altar Interactive Button */}
                      {cursedAltar && (
                        <button
                          type="button"
                          data-testid="hud-cursed-altar-btn"
                          data-used={cursedAltar.used ? 'true' : 'false'}
                          disabled={cursedAltar.used}
                          title="Cursed Blood Altar (Altar Kutukan): Sacrifice 25% HP to gain +22% permanent Damage & a Relic blessing [G]"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            handleActivateShrine(cursedAltar.id);
                          }}
                          className={`px-2 py-0.5 rounded border transition-colors ${
                            cursedAltar.used
                              ? 'bg-[#14101d] text-[#6d647d] border-[#261e33] opacity-65 cursor-not-allowed'
                              : hud.nearbyShrine?.id === cursedAltar.id
                              ? 'bg-[#881337] hover:bg-[#9f1239] text-[#ffe4e6] border-[#fda4af] font-bold cursor-pointer shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                              : 'bg-[#4c0519]/90 hover:bg-[#881337] text-[#fda4af] border-[#e11d48] font-bold cursor-pointer'
                          }`}
                        >
                          {cursedAltar.used
                            ? 'Cursed Altar: Used'
                            : '[G] Cursed Altar (-25% HP → +22% DMG + Relic)'}
                        </button>
                      )}

                      {/* Sanctum Healing Fountain Interactive Button */}
                      {healingFountain && (
                        <button
                          type="button"
                          data-testid="hud-healing-fountain-btn"
                          data-used={healingFountain.used ? 'true' : 'false'}
                          disabled={healingFountain.used}
                          title="Sanctum Healing Fountain (Mata Air Suci): Restore 40% Max HP & +45 Essence [G]"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            handleActivateShrine(healingFountain.id);
                          }}
                          className={`px-2 py-0.5 rounded border transition-colors ${
                            healingFountain.used
                              ? 'bg-[#14101d] text-[#6d647d] border-[#261e33] opacity-65 cursor-not-allowed'
                              : hud.nearbyShrine?.id === healingFountain.id
                              ? 'bg-[#065f46] hover:bg-[#047857] text-[#ecfdf5] border-[#6ee7b7] font-bold cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : 'bg-[#064e3b]/90 hover:bg-[#065f46] text-[#a7f3d0] border-[#10b981] font-bold cursor-pointer'
                          }`}
                        >
                          {healingFountain.used
                            ? 'Fountain: Used'
                            : '[G] Healing Fountain (+40% HP & +45 Ess)'}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Quick Portal Navigation & Sanctuary Coin Merchant when Room is Cleared */}
                {currentRoom?.cleared && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#2b2238] flex flex-wrap items-center justify-center gap-1.5">
                    {currentRoom.doors.map((door) => {
                      const targetRoom = hud.rooms[door.targetRoomId];
                      return (
                        <button
                          key={`${door.dir}-${door.targetRoomId}`}
                          type="button"
                          onClick={() => handleTravelDoor(door.dir, door.targetRoomId)}
                          className="px-2 py-0.5 rounded bg-[#065f46] hover:bg-[#059669] text-[#ecfdf5] border border-[#34d399] text-[10px] font-mono-tabular font-bold cursor-pointer transition-colors"
                        >
                          Portal {door.dir} →{' '}
                          {targetRoom?.kind === 'boss'
                            ? 'Boss Room'
                            : `Room ${door.targetRoomId + 1}`}
                        </button>
                      );
                    })}

                    {/* Compact Coin Reliquary Pedestal to buy usable items with dropped coins */}
                    {USABLE_ITEM_KEYS.map((itemKey) => {
                      const itemSpec = USABLE_ITEMS[itemKey];
                      const canBuy = hud.coins >= itemSpec.coinCost;
                      return (
                        <button
                          key={itemSpec.id}
                          type="button"
                          disabled={!canBuy}
                          title={`Buy ${itemSpec.name} (${itemSpec.coinCost} Coins): ${itemSpec.effectClue}`}
                          onClick={() => handleBuyMerchantItem(itemSpec.id)}
                          className={`px-2 py-0.5 rounded border text-[10px] font-mono-tabular transition-colors ${
                            canBuy
                              ? 'bg-[#241c35] hover:bg-[#32264a] text-[#fde68a] border-[#f59e0b] cursor-pointer'
                              : 'bg-[#14101d] text-[#6d647d] border-[#261e33] opacity-60 cursor-not-allowed'
                          }`}
                        >
                          +{itemSpec.shortLabel} ({itemSpec.coinCost}c)
                        </button>
                      );
                    })}

                    {/* Sanctuary Mercenary Pact: Hire or Switch Astral Familiars with Solar Coins */}
                    {FAMILIAR_KEYS.map((famKey) => {
                      const fam = FAMILIAR_CATALOG[famKey];
                      const isUnlocked = Boolean(hud.unlockedFamiliars[famKey]);
                      const isActive = hud.activeFamiliar === famKey;
                      const canHire = isUnlocked || hud.coins >= fam.hireCost;
                      return (
                        <button
                          key={famKey}
                          type="button"
                          data-merchant-familiar={famKey}
                          disabled={!canHire}
                          title={`${fam.name} (${fam.titleIndonesian}): ${fam.description}`}
                          onClick={() => handleHireOrEquipFamiliar(famKey, false)}
                          className={`px-2 py-0.5 rounded border text-[10px] font-mono-tabular transition-colors ${
                            isActive
                              ? 'bg-[#1e293b] text-[#7dd3fc] border-[#38bdf8] font-bold cursor-pointer'
                              : canHire
                              ? 'bg-[#1b1528] hover:bg-[#2a203d] text-[#e9d5ff] border-[#a855f7] cursor-pointer'
                              : 'bg-[#14101d] text-[#6d647d] border-[#261e33] opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {isActive
                            ? `★ ${fam.name}`
                            : isUnlocked
                            ? `Equip ${fam.name}`
                            : `Hire ${fam.name} (${fam.hireCost}c)`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Boss Health Bar & Total Eclipse / Vulnerability Window Banner */}
              {hud.bossHpPercent !== null && (
                <div
                  data-testid="hud-boss-bar"
                  className={`hidden md:flex flex-col items-center rounded-md px-5 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.85)] transition-colors ${
                    hud.totalEclipseActive
                      ? hud.bossVulnerabilityTimer > 0
                        ? 'bg-[#1a1308]/95 border border-[#facc15]'
                        : 'bg-[#0b0714]/95 border border-[#a855f7]/80'
                      : 'bg-[#120f1a]/90 border border-[#f59e0b]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#fde68a]">
                      {hud.bossName} · STAGE {hud.stageLevel} SOVEREIGN
                    </span>
                    <span
                      data-testid="hud-boss-hp-readout"
                      className="text-[9.5px] font-mono-tabular font-bold text-[#f4efe6]"
                    >
                      {hud.bossHp !== null && hud.bossMaxHp !== null
                        ? `${hud.bossHp.toLocaleString()} / ${hud.bossMaxHp.toLocaleString()} HP (${hud.bossHpPercent}%)`
                        : `${hud.bossHpPercent}%`}
                    </span>
                  </div>
                  <div className="w-64 h-2 bg-[#09080d] border border-[#4c1d95] rounded-sm overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-100 ${
                        hud.bossVulnerabilityTimer > 0
                          ? 'bg-[#facc15]'
                          : hud.totalEclipseActive
                          ? 'bg-[#a855f7]'
                          : 'bg-[#f43f5e]'
                      }`}
                      style={{ width: `${hud.bossHpPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Total Eclipse Arena Event & Boss Vulnerability Window Tactical Banner */}
              {hud.totalEclipseActive && (
                <div
                  data-testid="hud-total-eclipse-banner"
                  data-eclipse-vulnerable={hud.bossVulnerabilityTimer > 0 ? 'true' : 'false'}
                  className={`flex items-center gap-2.5 rounded-md px-3.5 py-1.5 border shadow-[0_6px_22px_rgba(0,0,0,0.9)] pointer-events-auto transition-all ${
                    hud.bossVulnerabilityTimer > 0
                      ? 'bg-[#1c1306]/95 border-[#facc15] text-[#fef08a]'
                      : 'bg-[#0d0718]/95 border-[#a855f7]/80 text-[#e9d5ff]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      hud.bossVulnerabilityTimer > 0
                        ? 'bg-[#facc15] animate-ping'
                        : 'bg-[#a855f7] animate-pulse'
                    }`}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {hud.bossVulnerabilityTimer > 0
                          ? `BOSS VULNERABILITY WINDOW · ${hud.bossVulnerabilityTimer.toFixed(1)}S`
                          : 'TOTAL ECLIPSE PHASE · UMBRAL WARD ACTIVE'}
                      </span>
                      <span
                        className={`text-[9px] font-mono-tabular px-1.5 py-0.5 rounded-xs border ${
                          hud.bossVulnerabilityTimer > 0
                            ? 'bg-[#422006] border-[#facc15]/60 text-[#fde047]'
                            : 'bg-[#2e1065] border-[#c084fc]/50 text-[#d8b4fe]'
                        }`}
                      >
                        {hud.bossVulnerabilityTimer > 0 ? '+50% BOSS DMG' : '-25% BOSS DMG · STRIKE BRAZIER'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono-tabular text-[#c4b5d9]">
                      {hud.bossVulnerabilityTimer > 0
                        ? 'Solar Brazier flare shattered the Umbral Ward! Unleash critical finishers now!'
                        : 'Darkness narrows arena sightlines — ignite a Solar Brazier to shatter Boss defenses!'}
                    </span>
                  </div>
                  {hud.hazards.some((h) => h.kind === 'solar_brazier' && h.cooldown <= 0) && (
                    <button
                      type="button"
                      data-testid="eclipse-ignite-brazier-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        const w = worldRef.current;
                        const readyBrazier = w.hazards.find(
                          (h) => h.kind === 'solar_brazier' && h.cooldown <= 0
                        );
                        if (readyBrazier) {
                          detonateSolarBrazier(w, readyBrazier);
                          soundEngine.playNova();
                          setHud(buildHudFromWorld(w));
                        }
                      }}
                      className="ml-1 px-2.5 py-1 rounded-xs bg-[#f59e0b]/25 hover:bg-[#f59e0b]/40 border border-[#facc15]/80 text-[#fef08a] text-[9.5px] font-mono-tabular font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      title="Ignite nearest ready Solar Brazier to open the Boss Vulnerability Window"
                    >
                      Ignite Brazier
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Top-Right Cluster: Compact Clickable Utility Icon Buttons + Subtle Fading Combat Log Overlay */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
                  title="Mute / Unmute [M]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleMute();
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-[#120f1a]/90 hover:bg-[#231d33] text-[#f4efe6] border border-[#3b2d4a] cursor-pointer transition-colors"
                >
                  <UtilityIcon kind="mute" muted={muted} />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Pause Game [P]"
                  title="Pause [P]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleTogglePause();
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-[#120f1a]/90 hover:bg-[#231d33] text-[#f4efe6] border border-[#3b2d4a] cursor-pointer transition-colors"
                >
                  <UtilityIcon kind="pause" />
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Restart Run [R]"
                  title="Restart Run [R]"
                  onClick={handleStartOrRestart}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-[#120f1a]/90 hover:bg-[#231d33] text-[#f4efe6] border border-[#3b2d4a] cursor-pointer transition-colors"
                >
                  <UtilityIcon kind="restart" />
                </button>
              </div>

              {/* Subtle Temporary Combat Log Overlay with Smooth Fading Animation */}
              <div
                data-testid="hud-combat-log"
                data-active-count={hud.combatLog.length}
                aria-live="polite"
                className="w-[288px] flex flex-col items-end gap-1.5 pointer-events-none select-none"
              >
                {hud.combatLog.map((entry) => {
                  const duration = Math.max(0.1, entry.duration);
                  const lifeRatio = Math.max(0, Math.min(1, 1 - entry.age / duration));
                  const fadeOpacity =
                    entry.age < 0.16
                      ? Math.max(0.35, entry.age / 0.16)
                      : lifeRatio < 0.38
                      ? Math.max(0.08, lifeRatio / 0.38)
                      : 0.94;
                  const slideOffsetPx =
                    entry.age < 0.16
                      ? Math.round((1 - entry.age / 0.16) * 8)
                      : lifeRatio < 0.35
                      ? -Math.round((1 - lifeRatio / 0.35) * 6)
                      : 0;

                  return (
                    <div
                      key={entry.id}
                      data-testid={`combat-log-entry-${entry.kind}`}
                      data-log-kind={entry.kind}
                      style={{
                        opacity: Number(fadeOpacity.toFixed(2)),
                        transform: `translateY(${slideOffsetPx}px)`,
                        backgroundColor: `${entry.bgColor}d9`,
                        borderColor: entry.borderColor,
                      }}
                      className="w-full relative overflow-hidden rounded-md border px-2.5 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.78)] backdrop-blur-xs transition-all duration-150 ease-out"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-4 h-4 rounded-xs flex items-center justify-center shrink-0 border"
                            style={{
                              borderColor: `${entry.borderColor}88`,
                              backgroundColor: '#09080d99',
                              color: entry.accentColor,
                            }}
                          >
                            {entry.kind === 'critical_strike' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1l1.9 4.5L15 7.2l-4.1 2.9 1.3 4.9L8 12.2 3.8 15l1.3-4.9L1 7.2l5.1-1.7L8 1z" />
                              </svg>
                            )}
                            {entry.kind === 'relic_synergy' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1.2L13.5 8 8 14.8 2.5 8 8 1.2zm0 3.1L5.1 8 8 11.7 10.9 8 8 4.3z" />
                              </svg>
                            )}
                            {entry.kind === 'perfect_dodge' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M2 8l5.5-5v3h6.5l-3 2 3 2H7.5v3L2 8z" />
                              </svg>
                            )}
                            {entry.kind === 'brazier_blast' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8.5 1.5c.4 2.4-1.5 3.6-1 5.6.4 1.3 1.9 1.6 2.3.2.9 1.2 1.2 2.9.4 4.4-.9 1.8-3.1 2.8-5.1 2.1-2-.7-3.1-2.8-2.4-4.9.6-1.8 2.4-2.9 3.6-4.4.8-1 1.5-2 2.2-3z" />
                              </svg>
                            )}
                            {entry.kind === 'sanctum_blessing' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M6.5 2h3v4.5H14v3H9.5V14h-3V9.5H2v-3h4.5V2z" />
                              </svg>
                            )}
                            {entry.kind === 'aegis_parry' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1.5l5.5 2.2v4.1c0 3.4-2.3 5.9-5.5 6.9-3.2-1-5.5-3.5-5.5-6.9V3.7L8 1.5z" />
                              </svg>
                            )}
                            {entry.kind === 'thermal_shock' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1.2l2.1 4.2 4.7.7-3.4 3.3.8 4.6L8 11.8 3.8 14l.8-4.6L1.2 6.1l4.7-.7L8 1.2z" />
                              </svg>
                            )}
                            {entry.kind === 'solar_meltdown' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1l5 2.2v4.3c0 3.5-2.1 6.1-5 7.3-2.9-1.2-5-3.8-5-7.3V3.2L8 1zm.7 2.4L6.2 8.2h2.4l-1.3 4.4 3.5-5.2H8.4l.3-4z" />
                              </svg>
                            )}
                            {entry.kind === 'total_eclipse' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1.5a6.5 6.5 0 106.2 8.4A5.2 5.2 0 017.8 2a6.4 6.4 0 01.2-.5z" />
                              </svg>
                            )}
                            {entry.kind === 'eclipse_vulnerability' && (
                              <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden="true">
                                <path d="M8 1l1.8 4.2L14 7l-4.2 1.8L8 13l-1.8-4.2L2 7l4.2-1.8L8 1z" />
                              </svg>
                            )}
                          </span>
                          <span
                            className="text-[10px] font-bold tracking-wide truncate"
                            style={{ color: entry.accentColor }}
                          >
                            {entry.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono-tabular text-[#c4b5d9]/80 shrink-0">
                          {Math.max(0.1, duration - entry.age).toFixed(1)}s
                        </span>
                      </div>
                      <div className="mt-0.5 pl-5 text-[9.5px] font-mono-tabular text-[#ede8f5]/90 truncate">
                        {entry.detail}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#09080d]/70">
                        <div
                          className="h-full transition-all duration-100"
                          style={{
                            width: `${Math.round(lifeRatio * 100)}%`,
                            backgroundColor: entry.accentColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Perimeter Dock: 3 Equippable Stances + 3 Usable Item Belt Slots [Z/X/C] + Dash & Nova */}
          <div className="flex items-end justify-center">
            <div className="flex flex-wrap items-center gap-2 bg-[#120f1a]/92 border border-[#3b2d4a] rounded-md px-3 py-2 pointer-events-auto shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
              {(Object.keys(WEAPON_STANCES) as WeaponStanceId[]).map((stanceKey) => {
                const spec = WEAPON_STANCES[stanceKey];
                const evo = WEAPON_EVOLUTIONS[stanceKey];
                const isAwakened = Boolean(hud.awakenedStances[stanceKey]);
                const isSelected = hud.stance === stanceKey;
                const canAfford = hud.essence >= spec.essenceCost;
                const displayName = isAwakened ? evo.evolvedName : spec.name;
                const displayClue = isAwakened ? evo.evolvedRoleClue : spec.roleClue;
                const slashStep = hud.dawnbladeSwingCount % 3;

                return (
                  <button
                    key={stanceKey}
                    type="button"
                    tabIndex={-1}
                    data-stance={stanceKey}
                    data-awakened={isAwakened ? 'true' : 'false'}
                    title={
                      isAwakened
                        ? `[${spec.keyBinding}] ${evo.evolvedName} (Awakened ${spec.name}): ${evo.passiveSummary}`
                        : `[${spec.keyBinding}] ${spec.name} — Awakens into ${evo.evolvedName} at LV.${evo.unlockLevel}+ or Relic Synergy (${evo.synergyRelicNames.join(' + ')})`
                    }
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleSelectStance(stanceKey);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? isAwakened
                          ? 'bg-[#2a1d3d] border-[#fde047] text-[#f4efe6] shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                          : 'bg-[#241d35] border-[#f59e0b] text-[#f4efe6]'
                        : isAwakened
                          ? 'bg-[#1b1429] border-[#f59e0b]/70 text-[#fde68a] hover:text-[#f4efe6]'
                          : 'bg-[#151120] border-[#2b2238] text-[#a39887] hover:text-[#f4efe6]'
                    } ${!canAfford ? 'opacity-60' : ''}`}
                  >
                    <StanceIcon stance={stanceKey} awakened={isAwakened} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono-tabular font-bold text-[#fde68a]">
                          [{spec.keyBinding}]
                        </span>
                        <span className="text-xs font-semibold">{displayName}</span>
                        {isAwakened ? (
                          <span className="px-1 py-0.2 rounded bg-[#78350f] border border-[#fde047] text-[9px] font-mono-tabular font-bold text-[#fef08a]">
                            AWAKENED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono-tabular text-[#8c829e]">
                            LV.{evo.unlockLevel}
                          </span>
                        )}
                        {stanceKey === 'dawnblade' && isAwakened && (
                          <span
                            data-testid="solar-greatsword-charge"
                            className="text-[9px] font-mono-tabular text-[#fb7185] font-bold"
                          >
                            {slashStep}/3
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#c4b9a5]">{displayClue}</span>
                    </div>
                  </button>
                );
              })}

              {/* 3-Slot Usable Roguelike Item Belt ([Z], [X], [C]) */}
              <div
                aria-label="Usable Item Belt"
                className="flex items-center gap-1.5 pl-2 border-l border-[#2e243d]"
              >
                {[0, 1, 2].map((idx) => {
                  const slot = hud.inventory[idx];
                  const keyLabel = idx === 0 ? 'Z' : idx === 1 ? 'X' : 'C';
                  const itemSpec = slot ? USABLE_ITEMS[slot.itemId] : null;
                  const hasItem = Boolean(itemSpec && slot && slot.count > 0);
                  return (
                    <button
                      key={idx}
                      type="button"
                      tabIndex={-1}
                      disabled={!hasItem}
                      data-item-slot={idx}
                      title={
                        itemSpec && slot
                          ? `[${keyLabel}] Use ${itemSpec.name} (x${slot.count}): ${itemSpec.effectClue}`
                          : `[${keyLabel}] Empty Item Slot — Defeat enemies to loot usable items`
                      }
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleUseItemSlot(idx);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border font-mono-tabular transition-colors whitespace-nowrap shrink-0 ${
                        hasItem
                          ? 'bg-[#1c162b] hover:bg-[#2a2140] border-[#f59e0b]/80 text-[#f4efe6] cursor-pointer'
                          : 'bg-[#110e19] border-[#261f33] text-[#685e78] opacity-65 cursor-not-allowed'
                      }`}
                    >
                      {itemSpec ? (
                        <UsableItemIcon itemId={itemSpec.id} />
                      ) : (
                        <div className="w-6 h-6 rounded bg-[#181424] border border-[#2c243b] flex items-center justify-center text-[10px] text-[#685e78]">
                          -
                        </div>
                      )}
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#fde047]">[{keyLabel}]</span>
                          <span className="text-[11px] font-semibold">
                            {itemSpec ? itemSpec.shortLabel : 'Empty'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#a7f3d0]">
                          {hasItem && slot ? `x${slot.count} Ready` : 'No Item'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dash & Solar Nova Live Ability Meters */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#2e243d]">
                <div className="flex flex-col w-20">
                  <div className="flex justify-between text-[10px] font-mono-tabular text-[#fde68a]">
                    <span>[SPACE] DASH</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#09080d] border border-[#3b2d4a] rounded-sm overflow-hidden mt-1">
                    <div
                      ref={dashCooldownRef}
                      className="h-full w-full bg-[#f59e0b] origin-left"
                    />
                  </div>
                </div>

                <div className="flex flex-col w-24">
                  <div className="flex justify-between text-[10px] font-mono-tabular text-[#38bdf8]">
                    <span>[E] NOVA</span>
                    <span>30 ESS</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#09080d] border border-[#3b2d4a] rounded-sm overflow-hidden mt-1">
                    <div
                      ref={novaCooldownRef}
                      className="h-full w-full bg-[#38bdf8] origin-left"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEVEL-UP SKILL SELECTION MODAL OVERLAY
          ===================================================================== */}
      {phase === 'playing' && hud.skillChoices.length > 0 && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Level Up Skill Selection"
          className="fixed inset-0 z-30 flex items-center justify-center p-6 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.82)' }}
        >
          <div className="w-full max-w-2xl bg-[#14111f] border-2 border-[#fde047] rounded-md p-6 shadow-[0_16px_48px_rgba(0,0,0,0.95)]">
            <div className="text-center">
              <span className="text-xs font-mono-tabular uppercase tracking-widest text-[#fde047]">
                SOLAR ASCENSION · LEVEL {hud.level} REACHED
              </span>
              <h2 className="mt-1 text-2xl font-display font-bold text-[#f4efe6]">
                Choose a Combat Skill
              </h2>
              <p className="mt-1 text-xs text-[#c4b9a5]">
                Select one Solar Warden technique to learn or evolve (Click or press [1] / [2] / [3]).
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {hud.skillChoices.map((choice, idx) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleChooseSkill(choice.id)}
                  className="flex flex-col justify-between p-4 rounded bg-[#1b162a] hover:bg-[#261f3b] border border-[#3b2d4a] hover:border-[#fde047] text-left transition-colors cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <SkillIcon skillId={choice.id} />
                      <span className="text-[11px] font-mono-tabular font-bold text-[#fde047]">
                        [{idx + 1}] {choice.currentRank === 0 ? 'NEW SKILL' : `RANK ${choice.currentRank} → ${choice.nextRank}`}
                      </span>
                    </div>

                    <div className="mt-2.5 text-[10px] font-mono-tabular tracking-wider text-[#a39887]">
                      {choice.categoryTag}
                    </div>
                    <h3 className="mt-0.5 text-sm font-display font-bold text-[#f4efe6]">
                      {choice.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#c4b9a5] leading-relaxed">
                      {choice.description}
                    </p>
                  </div>

                  <span className="mt-4 inline-block text-xs font-mono-tabular font-bold text-[#fde047]">
                    Select Skill [{idx + 1}] →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          BETWEEN-ROOM SANCTUARY RELIC DRAFT OVERLAY
          ===================================================================== */}
      {phase === 'playing' && hud.skillChoices.length === 0 && hud.relicChoices.length > 0 && (
        <section
          aria-label="Sanctuary Relic Boon"
          className="fixed inset-0 z-30 flex items-center justify-center p-6 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.78)' }}
        >
          <div className="w-full max-w-2xl bg-[#14111f] border border-[#f59e0b] rounded-md p-6 shadow-[0_16px_48px_rgba(0,0,0,0.95)]">
            <div className="text-center">
              <span className="text-xs font-mono-tabular uppercase tracking-widest text-[#f59e0b]">
                ROOM CLEARED · SANCTUARY ALTAR
              </span>
              <h2 className="mt-1 text-2xl font-display font-bold text-[#f4efe6]">
                Claim an Eclipse Chronicle Relic
              </h2>
              <p className="mt-1 text-xs text-[#c4b9a5]">
                Select one permanent blessing before entering the next dungeon room.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {hud.relicChoices.map((relic) => {
                const matchingEvolutions = (
                  ['dawnblade', 'astral_bow', 'chrono_scythe'] as WeaponStanceId[]
                )
                  .map((st) => WEAPON_EVOLUTIONS[st])
                  .filter((evo) => evo.synergyRelics.includes(relic.id));
                const willAwaken = matchingEvolutions.find((evo) => {
                  if (hud.awakenedStances[evo.stanceId]) return false;
                  const partnerId = evo.synergyRelics.find((r) => r !== relic.id);
                  return Boolean(partnerId && hud.collectedRelics.includes(partnerId));
                });

                return (
                  <button
                    key={relic.id}
                    type="button"
                    onClick={() => handleChooseRelic(relic.id)}
                    className="flex flex-col justify-between p-4 rounded bg-[#1b162a] hover:bg-[#261f3b] border border-[#3b2d4a] hover:border-[#f59e0b] text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-mono-tabular text-[#fde68a]">
                        {relic.statTag}
                      </div>
                      <h3 className="mt-1.5 text-sm font-display font-bold text-[#f4efe6]">
                        {relic.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#c4b9a5] leading-relaxed">
                        {relic.description}
                      </p>
                      {matchingEvolutions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#2b2238] text-[10px] font-mono-tabular">
                          {willAwaken ? (
                            <span className="text-[#fde047] font-bold">
                              ★ AWAKENS {willAwaken.evolvedName.toUpperCase()} NOW!
                            </span>
                          ) : (
                            <span className="text-[#a7f3d0]">
                              Synergy:{' '}
                              {matchingEvolutions.map((m) => m.evolvedName).join(' / ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="mt-4 inline-block text-xs font-mono-tabular font-bold text-[#f59e0b]">
                      Inscribe Relic →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          STATE 3: PAUSE MODAL & SANCTUM BESTIARY HOVER CODEX
          ===================================================================== */}
      {phase === 'paused' && (() => {
        const mergedCounts: Record<EnemyArchetype, number> = {} as Record<EnemyArchetype, number>;
        for (const arch of ENEMY_ARCHETYPE_KEYS) {
          mergedCounts[arch] = Math.max(
            persistedBestiary[arch] ?? 0,
            hud.defeatedByArchetype[arch] ?? 0
          );
        }
        const defeatedList = ENEMY_ARCHETYPE_KEYS.filter((arch) => mergedCounts[arch] > 0);
        const defaultArch: EnemyArchetype =
          hud.hoveredArenaEnemy?.archetype ??
          hoveredBestiaryArchetype ??
          defeatedList[0] ??
          hud.activeRoomArchetypes[0] ??
          'stalker';
        const activeEntry = getBestiaryEntry(
          defaultArch,
          hud.stageLevel,
          hud.currentRoomIndex,
          hud.rooms.length,
          mergedCounts[defaultArch] ?? 0
        );
        const isLiveArenaHover = hud.hoveredArenaEnemy?.archetype === activeEntry.id;
        const allStancesAwakened = (
          ['dawnblade', 'astral_bow', 'chrono_scythe'] as WeaponStanceId[]
        ).every((st) => Boolean(hud.awakenedStances[st]));

        return (
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Game Paused and Bestiary"
            className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-none"
            style={{ backgroundColor: 'rgba(9, 8, 13, 0.58)' }}
          >
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left Column: Sanctuary Pause Summary, Weapon Evolutions & Actions */}
              <div className="lg:col-span-4 bg-[#14111f]/95 border border-[#4c3b63] rounded-md p-4 text-center shadow-[0_16px_48px_rgba(0,0,0,0.95)] flex flex-col justify-between pointer-events-auto">
                <div>
                  <span className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#f59e0b]">
                    CHRONICLE SUSPENDED · STAGE {hud.stageLevel}
                  </span>
                  <h2 className="mt-0.5 text-xl font-display font-bold text-[#f4efe6]">
                    Sanctuary Paused
                  </h2>

                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center font-mono-tabular">
                    <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-1.5">
                      <div className="text-[9px] text-[#a39887]">STAGE · ROOM</div>
                      <div className="mt-0.5 text-xs font-bold text-[#fde68a]">
                        S{hud.stageLevel} · R{hud.currentRoomIndex + 1}/{hud.rooms.length}
                      </div>
                    </div>
                    <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-1.5">
                      <div className="text-[9px] text-[#a39887]">COINS · SCORE</div>
                      <div className="mt-0.5 text-xs font-bold text-[#f4efe6]">
                        {hud.coins}c · {hud.score}
                      </div>
                    </div>
                    <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-1.5">
                      <div className="text-[9px] text-[#a39887]">VITALITY</div>
                      <div className="mt-0.5 text-xs font-bold text-[#e11d48]">
                        {hud.hp}/{hud.maxHp}
                      </div>
                    </div>
                  </div>

                  {/* Stance Awakening / Weapon Evolution Overview */}
                  <div
                    data-testid="pause-weapon-evolutions"
                    className="mt-3 bg-[#0d0b14] border border-[#3b2d4a] rounded p-2.5 text-left"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-wider text-[#fde047]">
                        WEAPON EVOLUTIONS (LV.5+ / RELICS)
                      </span>
                      {!allStancesAwakened && (
                        <button
                          type="button"
                          data-testid="awaken-all-stances-btn"
                          onClick={() => {
                            const w = worldRef.current;
                            awakenStance(w, 'dawnblade');
                            awakenStance(w, 'astral_bow');
                            awakenStance(w, 'chrono_scythe');
                            soundEngine.playLevelUp();
                            setHud(buildHudFromWorld(w));
                          }}
                          className="px-1.5 py-0.5 rounded bg-[#2a1f3d] hover:bg-[#3b2b54] border border-[#fde047] text-[9px] font-mono-tabular font-bold text-[#fef08a] cursor-pointer transition-colors"
                        >
                          Awaken All
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {(['dawnblade', 'astral_bow', 'chrono_scythe'] as WeaponStanceId[]).map(
                        (stKey) => {
                          const evo = WEAPON_EVOLUTIONS[stKey];
                          const stSpec = WEAPON_STANCES[stKey];
                          const isAwakened = Boolean(hud.awakenedStances[stKey]);
                          return (
                            <div
                              key={stKey}
                              data-evolution-stance={stKey}
                              data-evolution-active={isAwakened ? 'true' : 'false'}
                              className={`rounded px-2 py-1 border ${
                                isAwakened
                                  ? 'bg-[#1d152c] border-[#f59e0b]/80'
                                  : 'bg-[#13101d] border-[#261f33]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono-tabular">
                                <span className="font-bold text-[#f4efe6]">
                                  [{stSpec.keyBinding}] {evo.evolvedName}
                                </span>
                                <span
                                  className={
                                    isAwakened ? 'text-[#6ee7b7] font-bold' : 'text-[#a39887]'
                                  }
                                >
                                  {isAwakened ? 'AWAKENED' : `LV.${evo.unlockLevel} / SYNERGY`}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#c4b9a5] leading-snug">
                                {evo.evolvedRoleClue}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Mercenary / Familiar Companion Pact (Pendamping Roh Astral) */}
                    <div
                      data-testid="pause-familiar-pact"
                      className="mt-2.5 pt-2.5 border-t border-[#2d243b]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#38bdf8] font-bold">
                          PENDAMPING ROH ASTRAL · FAMILIAR PACT [F]
                        </span>
                        <span className="text-[9px] font-mono-tabular text-[#a39887]">
                          Coins: <strong className="text-[#fbbf24]">{hud.coins}c</strong>
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {FAMILIAR_KEYS.map((famKey) => {
                          const fam = FAMILIAR_CATALOG[famKey];
                          const isUnlocked = Boolean(hud.unlockedFamiliars[famKey]);
                          const isActive = hud.activeFamiliar === famKey;
                          const canAfford = isUnlocked || hud.coins >= fam.hireCost;
                          return (
                            <div
                              key={famKey}
                              data-pause-familiar={famKey}
                              data-familiar-active={isActive ? 'true' : 'false'}
                              className={`rounded px-2 py-1.5 border flex items-center justify-between gap-2 ${
                                isActive
                                  ? 'bg-[#1a1528] border-[#38bdf8]'
                                  : 'bg-[#13101d] border-[#261f33]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FamiliarIcon familiarId={famKey} />
                                <div className="min-w-0">
                                  <div className="text-[10px] font-mono-tabular font-bold text-[#f4efe6] flex items-center gap-1.5">
                                    <span>{fam.name}</span>
                                    <span className="text-[9px] text-[#a39887] font-normal">
                                      ({fam.titleIndonesian})
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-[#c4b9a5] leading-snug">
                                    {fam.roleClue}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!isUnlocked && !canAfford && (
                                  <button
                                    type="button"
                                    data-testid={`free-pact-${famKey}`}
                                    onClick={() => handleHireOrEquipFamiliar(famKey, true)}
                                    className="px-1.5 py-0.5 rounded bg-[#1e1b4b] hover:bg-[#312e81] text-[#bae6fd] border border-[#38bdf8]/60 text-[9px] font-mono-tabular font-bold cursor-pointer"
                                    title="Sanctum Trial Pact: Unlock & Equip immediately"
                                  >
                                    Pact
                                  </button>
                                )}
                                <button
                                  type="button"
                                  data-testid={`select-familiar-${famKey}`}
                                  onClick={() =>
                                    handleHireOrEquipFamiliar(famKey, !isUnlocked && !canAfford)
                                  }
                                  className={`px-2 py-0.5 rounded text-[9px] font-mono-tabular font-bold border cursor-pointer transition-colors ${
                                    isActive
                                      ? 'bg-[#38bdf8] text-[#09080d] border-[#bae6fd]'
                                      : isUnlocked
                                      ? 'bg-[#241c35] hover:bg-[#32264a] text-[#fde68a] border-[#f59e0b]'
                                      : canAfford
                                      ? 'bg-[#065f46] hover:bg-[#059669] text-[#a7f3d0] border-[#34d399]'
                                      : 'bg-[#1b1629] hover:bg-[#28203d] text-[#c4b9a5] border-[#3b2d4a]'
                                  }`}
                                >
                                  {isActive
                                    ? 'ACTIVE'
                                    : isUnlocked
                                    ? 'EQUIP'
                                    : canAfford
                                    ? `HIRE ${fam.hireCost}c`
                                    : `PACT (${fam.hireCost}c)`}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sanctum Traps & Interactive Arena Hazards Guide */}
                    <div
                      data-testid="pause-sanctum-hazards"
                      className="mt-2.5 pt-2.5 border-t border-[#2d243b]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#fb923c] font-bold">
                          SANCTUM TRAPS & SHRINES [G]
                        </span>
                        <span className="text-[9px] font-mono-tabular text-[#fde68a]">
                          DMG Mult: {(hud.damageMultiplier * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-left">
                        {(
                          [
                            'solar_brazier',
                            'spike_rune',
                            'cursed_altar',
                            'healing_fountain',
                          ] as HazardKind[]
                        ).map((hk) => {
                          const hSpec = SANCTUM_HAZARD_CATALOG[hk];
                          return (
                            <div
                              key={hk}
                              data-hazard-guide={hk}
                              className="bg-[#13101d] border border-[#261f33] rounded px-1.5 py-1"
                            >
                              <div
                                className="text-[9px] font-mono-tabular font-bold truncate"
                                style={{ color: hSpec.accentColor }}
                              >
                                {hSpec.name}
                              </div>
                              <div className="text-[8.5px] text-[#c4b9a5] leading-tight">
                                {hSpec.indonesianTitle}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleTogglePause();
                    }}
                    className="w-full py-2 rounded bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] font-display font-bold text-sm tracking-wider cursor-pointer transition-colors"
                  >
                    Resume Game [P]
                  </button>
                  {!currentUser && (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full py-1.5 rounded bg-[#1e1b4b] hover:bg-[#2e296e] text-[#e0f2fe] border border-[#38bdf8] text-xs font-mono-tabular font-bold tracking-wider cursor-pointer transition-colors"
                    >
                      Login with Google (Save Cloud Progress)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartOrRestart}
                    className="w-full py-1.5 rounded bg-[#1f1a30] hover:bg-[#2b2442] text-[#f4efe6] border border-[#3b2d4a] text-xs font-mono-tabular tracking-wider cursor-pointer transition-colors"
                  >
                    Restart Stage {hud.stageLevel}
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnToTitle}
                    className="w-full py-1.5 rounded bg-[#14111f] hover:bg-[#1f1a30] text-[#c4b9a5] text-xs font-mono-tabular tracking-wider cursor-pointer transition-colors"
                  >
                    Return to Stage Select
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Bestiary Hover Codex */}
              <div
                data-testid="pause-bestiary-codex"
                className="lg:col-span-8 bg-[#14111f]/95 border border-[#f59e0b]/70 rounded-md p-5 shadow-[0_16px_48px_rgba(0,0,0,0.95)] flex flex-col justify-between pointer-events-auto"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b2238] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#fde047]">
                        SANCTUM BESTIARY CODEX · HOVER INSPECTOR
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#1f1930] border border-[#4c3b63] text-[10px] font-mono-tabular text-[#a7f3d0]">
                        {defeatedList.length}/{ENEMY_ARCHETYPE_KEYS.length} DEFEATED
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#c4b9a5]">
                      Hover a defeated archetype badge below or point directly at any monster in the paused arena.
                    </p>
                  </div>

                  {defeatedList.length < ENEMY_ARCHETYPE_KEYS.length && (
                    <button
                      type="button"
                      data-testid="bestiary-unlock-all-btn"
                      onClick={() => {
                        const unlockedAll: Partial<Record<EnemyArchetype, number>> = {};
                        for (const arch of ENEMY_ARCHETYPE_KEYS) {
                          unlockedAll[arch] = Math.max(1, mergedCounts[arch] ?? 0);
                        }
                        saveBestiaryDefeated(unlockedAll);
                        setPersistedBestiary(unlockedAll);
                      }}
                      className="px-2.5 py-1 rounded bg-[#1f1930] hover:bg-[#2d2444] border border-[#f59e0b]/60 text-[10px] font-mono-tabular text-[#fde68a] cursor-pointer transition-colors"
                    >
                      Decipher All 12 Codex Entries
                    </button>
                  )}
                </div>

                {/* 12 Monster Archetype Hover Grid */}
                <div
                  aria-label="Bestiary Archetype Grid"
                  className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5"
                >
                  {ENEMY_ARCHETYPE_KEYS.map((arch) => {
                    const meta = ENEMY_ARCHETYPE_CATALOG[arch];
                    const killCount = mergedCounts[arch] ?? 0;
                    const isDefeated = killCount > 0;
                    const isInRoom = hud.activeRoomArchetypes.includes(arch);
                    const isSelected = activeEntry.id === arch;

                    return (
                      <button
                        key={arch}
                        type="button"
                        data-bestiary-archetype={arch}
                        data-defeated={isDefeated ? 'true' : 'false'}
                        onMouseEnter={() => setHoveredBestiaryArchetype(arch)}
                        onFocus={() => setHoveredBestiaryArchetype(arch)}
                        onClick={() => setHoveredBestiaryArchetype(arch)}
                        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#261f3d] border-[#fde047] text-[#f4efe6]'
                            : isDefeated
                              ? 'bg-[#171324] hover:bg-[#221c35] border-[#3b2d4a] text-[#f4efe6]'
                              : 'bg-[#0f0c18] hover:bg-[#191427] border-[#231b30] text-[#8c829e]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#09080d]"
                            style={{ backgroundColor: meta.accentColor }}
                          />
                          <span className="text-[11px] font-semibold truncate">{meta.name}</span>
                        </div>
                        <span
                          className={`text-[9px] font-mono-tabular px-1 py-0.5 rounded shrink-0 ${
                            isDefeated
                              ? 'bg-[#064e3b]/70 text-[#6ee7b7]'
                              : isInRoom
                                ? 'bg-[#78350f]/70 text-[#fde68a]'
                                : 'bg-[#181326] text-[#685e78]'
                          }`}
                        >
                          {isDefeated ? `×${killCount}` : isInRoom ? 'LIVE' : 'SCAN'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Hovered Monster Stats & Weakness Dossier */}
                <div
                  data-testid="bestiary-hover-dossier"
                  data-inspected-archetype={activeEntry.id}
                  className="mt-3.5 bg-[#0d0b14] border border-[#3b2d4a] rounded-md p-3.5 text-left"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-[#f4efe6]/40 shrink-0"
                        style={{ backgroundColor: activeEntry.accentColor }}
                      />
                      <h3
                        data-testid="bestiary-dossier-name"
                        className="text-base font-display font-bold text-[#f4efe6]"
                      >
                        {activeEntry.name}
                      </h3>
                      <span className="text-[10px] font-mono-tabular uppercase px-2 py-0.5 rounded bg-[#1b162a] border border-[#3b2d4a] text-[#fde68a]">
                        {activeEntry.role} · MIN STAGE {activeEntry.minStage}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono-tabular text-[10px]">
                      {isLiveArenaHover && hud.hoveredArenaEnemy && (
                        <span className="px-2 py-0.5 rounded bg-[#78350f] border border-[#fde047] text-[#fef08a] font-bold">
                          ARENA TARGET LOCKED · {hud.hoveredArenaEnemy.hp}/{hud.hoveredArenaEnemy.maxHp} HP
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded border font-bold ${
                          activeEntry.unlocked
                            ? 'bg-[#064e3b]/60 border-[#10b981] text-[#6ee7b7]'
                            : 'bg-[#1f1930] border-[#4c3b63] text-[#c4b9a5]'
                        }`}
                      >
                        {activeEntry.unlocked
                          ? `DEFEATED ×${activeEntry.defeatedCount}`
                          : 'FIELD SCAN (DEFEAT TO RECORD)'}
                      </span>
                    </div>
                  </div>

                  {/* Stage-Scaled Numerical Stats */}
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tabular">
                    <div className="bg-[#14111f] border border-[#2b2238] rounded px-2.5 py-1.5">
                      <div className="text-[9px] text-[#a39887]">STAGE {hud.stageLevel} MAX HP</div>
                      <div
                        data-testid="bestiary-stat-hp"
                        className="text-xs font-bold text-[#f43f5e]"
                      >
                        {activeEntry.scaledHp} HP{' '}
                        <span className="text-[10px] font-normal text-[#8c829e]">
                          (Base {ENEMY_ARCHETYPE_CATALOG[activeEntry.id].baseHp})
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#14111f] border border-[#2b2238] rounded px-2.5 py-1.5">
                      <div className="text-[9px] text-[#a39887]">ATTACK DAMAGE</div>
                      <div
                        data-testid="bestiary-stat-damage"
                        className="text-xs font-bold text-[#fb923c]"
                      >
                        {activeEntry.scaledDamage} DMG{' '}
                        <span className="text-[10px] font-normal text-[#8c829e]">
                          (Base {ENEMY_ARCHETYPE_CATALOG[activeEntry.id].baseDamage})
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#14111f] border border-[#2b2238] rounded px-2.5 py-1.5">
                      <div className="text-[9px] text-[#a39887]">MOVE SPEED</div>
                      <div
                        data-testid="bestiary-stat-speed"
                        className="text-xs font-bold text-[#38bdf8]"
                      >
                        {activeEntry.scaledSpeed} PX/S
                      </div>
                    </div>

                    <div className="bg-[#14111f] border border-[#2b2238] rounded px-2.5 py-1.5">
                      <div className="text-[9px] text-[#a39887]">VICTORY BOUNTY</div>
                      <div className="text-xs font-bold text-[#fde047]">
                        {activeEntry.xpReward} XP · {activeEntry.coinReward}c
                      </div>
                    </div>
                  </div>

                  {/* Monster Weakness & Tactical Counter Box */}
                  <div
                    data-testid="bestiary-weakness-box"
                    className="mt-2.5 bg-[#191326] border border-[#f59e0b]/60 rounded p-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StanceIcon stance={activeEntry.weaknessStance} />
                        <div>
                          <div className="text-[10px] font-mono-tabular uppercase tracking-wider text-[#fde047] font-bold">
                            STANCE WEAKNESS: {activeEntry.weaknessStanceName.toUpperCase()} (+20% BONUS DMG)
                          </div>
                          <p className="text-[11px] text-[#f4efe6]">{activeEntry.weaknessSummary}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#a7f3d0] font-mono-tabular">
                      COUNTER TACTIC: {activeEntry.counterTip}
                    </p>
                  </div>

                  {/* Movement & Attack Behavior Signatures */}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#c4b9a5]">
                    <div className="bg-[#120e1c] border border-[#241c33] rounded px-2.5 py-1.5">
                      <span className="font-mono-tabular text-[10px] uppercase text-[#a39887]">
                        MOVEMENT:{' '}
                      </span>
                      <span className="text-[#f4efe6]">{activeEntry.movementPattern}</span>
                    </div>
                    <div className="bg-[#120e1c] border border-[#241c33] rounded px-2.5 py-1.5">
                      <span className="font-mono-tabular text-[10px] uppercase text-[#a39887]">
                        ATTACK:{' '}
                      </span>
                      <span className="text-[#f4efe6]">{activeEntry.attackPattern}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* =====================================================================
          STATE 4: VICTORY / GAME OVER OUTCOME MODAL CARD
          ===================================================================== */}
      {phase === 'gameover' && snapshot && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label={snapshot.outcome === 'victory' ? 'Victory Summary' : 'Game Over Summary'}
          className="fixed inset-0 z-30 flex items-center justify-center p-6 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.86)' }}
        >
          <div className="w-full max-w-md bg-[#14111f] border border-[#f59e0b] rounded-md p-6 text-center shadow-[0_16px_48px_rgba(0,0,0,0.95)]">
            <span className="text-xs font-mono-tabular uppercase tracking-widest text-[#f59e0b]">
              {snapshot.outcome === 'victory'
                ? snapshot.gameMode === 'boss_rush'
                  ? `BOSS RUSH CYCLE ${hud.bossRushCycle} CLEARED · VICTORY`
                  : snapshot.gameMode === 'daily_challenge'
                  ? `DAILY CHALLENGE (${snapshot.dailySeed}) CLEARED`
                  : `STAGE ${snapshot.stageLevel} RECLAIMED · VICTORY`
                : `STAGE ${snapshot.stageLevel} · SOLAR WARDEN FALLEN`}
            </span>
            <h2 className="mt-1 text-2xl font-display font-bold text-[#f4efe6]">
              {snapshot.outcome === 'victory'
                ? 'Archon of the Corona Banished'
                : 'The Eclipse Consumes the Arena'}
            </h2>

            {/* 4 Tabular-Nums Mastery / Progress Metric Tiles */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono-tabular">
              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[9px] text-[#a39887]">SCORE / BEST</div>
                <div className="mt-1 text-sm font-bold text-[#fde68a]">
                  {snapshot.score} / {snapshot.bestScore}
                </div>
              </div>

              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[9px] text-[#a39887]">ROOMS · COINS</div>
                <div className="mt-1 text-sm font-bold text-[#38bdf8]">
                  {snapshot.roomsCleared}/{snapshot.totalRooms} · {snapshot.coinsCollected}c
                </div>
              </div>

              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[9px] text-[#a39887]">SPEEDRUN TIME</div>
                <div className="mt-1 text-sm font-bold text-[#a7f3d0]">
                  {formatSpeedrunTime(snapshot.clearTimeSeconds)}
                </div>
              </div>

              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[9px] text-[#a39887]">WARDEN LEVEL</div>
                <div className="mt-1 text-sm font-bold text-[#10b981]">
                  LV. {snapshot.levelReached}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {snapshot.outcome === 'victory' && snapshot.gameMode === 'boss_rush' && (
                <button
                  type="button"
                  data-testid="descend-endless-abyss-btn"
                  onClick={handleDescendEndlessAbyss}
                  className="w-full py-3 rounded bg-[#e879f9] hover:bg-[#f0abfc] text-[#09080d] font-display font-bold text-sm tracking-wider cursor-pointer transition-colors"
                >
                  Descend to Endless Abyss Cycle {hud.bossRushCycle + 1} →
                </button>
              )}
              {snapshot.outcome === 'victory' &&
                snapshot.gameMode === 'standard' &&
                snapshot.stageLevel < MAX_STAGE_LEVEL && (
                  <button
                    type="button"
                    onClick={(e) => handleStartStage(snapshot.stageLevel + 1, e)}
                    className="w-full py-3 rounded bg-[#10b981] hover:bg-[#34d399] text-[#09080d] font-display font-bold text-sm tracking-wider cursor-pointer transition-colors"
                  >
                    Next Stage: Enter Stage {snapshot.stageLevel + 1} →
                  </button>
                )}
              <button
                type="button"
                data-start="true"
                onClick={handleStartOrRestart}
                className="w-full py-2.5 rounded bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] font-display font-bold text-sm tracking-wider cursor-pointer transition-colors"
              >
                {snapshot.outcome === 'victory'
                  ? `Replay ${
                      snapshot.gameMode === 'boss_rush'
                        ? 'Boss Rush'
                        : snapshot.gameMode === 'daily_challenge'
                        ? 'Daily Challenge'
                        : `Stage ${snapshot.stageLevel}`
                    }`
                  : `Retry ${
                      snapshot.gameMode === 'boss_rush'
                        ? 'Boss Rush'
                        : snapshot.gameMode === 'daily_challenge'
                        ? 'Daily Challenge'
                        : `Stage ${snapshot.stageLevel}`
                    }`}
              </button>
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="w-full py-2 rounded bg-[#2a1f3d] hover:bg-[#3b2b54] text-[#fde047] border border-[#f59e0b] text-xs font-mono-tabular font-bold tracking-wider cursor-pointer transition-colors"
              >
                View Global Sanctum Leaderboard [Top 10]
              </button>
              <button
                type="button"
                onClick={handleReturnToTitle}
                className="w-full py-2 rounded bg-[#1f1a30] hover:bg-[#2b2442] text-[#f4efe6] border border-[#3b2d4a] text-xs font-mono-tabular tracking-wider cursor-pointer transition-colors"
              >
                Return to Stage Select
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          GLOBAL SANCTUM LEADERBOARD & DAILY CHALLENGE SEED MODAL
          ===================================================================== */}
      {showLeaderboardModal && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Global Sanctum Leaderboard"
          data-testid="global-leaderboard-modal"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.85)' }}
        >
          <div className="w-full max-w-4xl bg-[#14111f] border-2 border-[#f59e0b] rounded-md p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col max-h-[90vh]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b2238] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#fde047]">
                    FIREBASE CLOUD HALL OF CHAMPIONS · TOP 10 WARDENS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#064e3b] border border-[#10b981] text-[10px] font-mono-tabular text-[#a7f3d0]">
                    {currentUser ? 'CLOUD SYNC ACTIVE' : 'LOCAL + CLOUD HONOUR ROLL'}
                  </span>
                </div>
                <h2 className="mt-0.5 text-xl font-display font-bold text-[#f4efe6]">
                  Global Sanctum Leaderboard
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="sync-leaderboard-btn"
                  onClick={handleManualSyncLeaderboard}
                  className="px-3 py-1.5 rounded bg-[#1e1b4b] hover:bg-[#2e296e] border border-[#38bdf8] text-xs font-mono-tabular font-bold text-[#e0f2fe] cursor-pointer transition-colors"
                >
                  Sync My Record
                </button>
                <button
                  type="button"
                  data-testid="close-leaderboard-btn"
                  onClick={() => setShowLeaderboardModal(false)}
                  className="px-3 py-1.5 rounded bg-[#2a1f3d] hover:bg-[#3b2b54] border border-[#f59e0b] text-xs font-mono-tabular font-bold text-[#fde68a] cursor-pointer transition-colors"
                >
                  Close [ESC]
                </button>
              </div>
            </div>

            {leaderboardSyncNote && (
              <div className="mt-2 px-3 py-1 rounded bg-[#064e3b]/60 border border-[#10b981] text-[11px] font-mono-tabular text-[#a7f3d0]">
                {leaderboardSyncNote}
              </div>
            )}

            {/* 4 Leaderboard Ranking Category Tabs */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-tabular">
              {(
                [
                  { id: 'high_score', label: 'Top 10 High Score', sub: 'Overall Sanctum Score' },
                  { id: 'speedrun', label: 'Stage & Speedrun', sub: 'Furthest Stage & Fastest Time' },
                  {
                    id: 'daily_challenge',
                    label: `Daily Seed (${dailyChallengeConfig.seedCode})`,
                    sub: 'Today’s Seed Ranking',
                  },
                  { id: 'boss_rush', label: 'Boss Rush / Abyss', sub: 'Endless Waves & Score' },
                ] as Array<{ id: LeaderboardCategory; label: string; sub: string }>
              ).map((tab) => {
                const active = leaderboardCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-leaderboard-tab={tab.id}
                    onClick={() => setLeaderboardCategory(tab.id)}
                    className={`p-2 rounded border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2a1f3d] border-[#fde047] text-[#f4efe6]'
                        : 'bg-[#0d0b14] border-[#2b2238] text-[#a39887] hover:text-[#f4efe6]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#fde68a]">{tab.label}</div>
                    <div className="text-[10px] text-[#c4b9a5] truncate">{tab.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Top 10 Table */}
            <div className="mt-3 overflow-y-auto border border-[#2b2238] rounded bg-[#0d0b14]">
              <table className="w-full text-left border-collapse font-mono-tabular text-xs">
                <thead>
                  <tr className="border-b border-[#2b2238] bg-[#161224] text-[10px] uppercase text-[#a39887]">
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Solar Warden</th>
                    <th className="py-2 px-3">Awakened Stance</th>
                    <th className="py-2 px-3 text-right">High Score</th>
                    <th className="py-2 px-3 text-right">Stage</th>
                    <th className="py-2 px-3 text-right">Speedrun</th>
                    <th className="py-2 px-3 text-right">Daily Seed</th>
                    <th className="py-2 px-3 text-right">Boss Rush</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedLeaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    const evo = WEAPON_EVOLUTIONS[entry.favoriteStance] ?? WEAPON_EVOLUTIONS.dawnblade;
                    const isMe = Boolean(entry.isCurrentUser || (currentUser && entry.uid === currentUser.uid));
                    return (
                      <tr
                        key={entry.uid}
                        data-testid="leaderboard-row"
                        data-rank={rank}
                        className={`border-b border-[#1c162b] ${
                          isMe
                            ? 'bg-[#2a1f3d]/75 text-[#fef08a]'
                            : rank <= 3
                            ? 'bg-[#171324] text-[#f4efe6]'
                            : 'text-[#d6cbb9]'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold">
                          <span
                            className={`inline-block w-6 text-center rounded px-1 py-0.5 text-[10px] ${
                              rank === 1
                                ? 'bg-[#f59e0b] text-[#09080d]'
                                : rank === 2
                                ? 'bg-[#94a3b8] text-[#09080d]'
                                : rank === 3
                                ? 'bg-[#b45309] text-[#fef08a]'
                                : 'bg-[#1b162a] text-[#a39887]'
                            }`}
                          >
                            #{rank}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span>{entry.displayName}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded bg-[#065f46] border border-[#34d399] text-[9px] text-[#ecfdf5] font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-[#c4b9a5]">
                          {evo.evolvedName}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#fde68a]">
                          {entry.bestScore.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-[#10b981] font-bold">
                          S{entry.highestStage}/{MAX_STAGE_LEVEL}
                        </td>
                        <td className="py-2 px-3 text-right text-[#38bdf8]">
                          {formatSpeedrunTime(entry.fastestClearTimeSec)}
                        </td>
                        <td className="py-2 px-3 text-right text-[#bae6fd]">
                          {entry.dailyScore.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-[#e879f9] font-bold">
                          {entry.bossRushWaves}W · {entry.bossRushScore.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyRelicChoice,
  applySkillChoice,
  buyMerchantItem,
  createInitialWorldState,
  DoorDirection,
  GamePhase,
  getHealthPipStates,
  grantPlayerXp,
  MAX_STAGE_LEVEL,
  RunSnapshot,
  SKILL_CATALOG,
  SkillId,
  STAGE_CATALOG,
  transitionToRoom,
  USABLE_ITEM_KEYS,
  USABLE_ITEMS,
  UsableItemId,
  useInventorySlot,
  WEAPON_STANCES,
  WeaponStanceId,
} from './game/rules';
import { soundEngine } from './game/audio';
import { ArenaCanvas, HudDiscreteState } from './components/ArenaCanvas';
import {
  CoinIcon,
  SkillIcon,
  StanceIcon,
  TitleCrestEmblem,
  UsableItemIcon,
  UtilityIcon,
  VitalityHeartPip,
} from './components/GameIcons';
import {
  auth,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutAccount,
  subscribeToCloudProgress,
  syncPlayerProgressToCloud,
  User,
} from './firebase';

const STORAGE_BEST_SCORE_KEY = 'eclipse_chronicle_best_score_v1';
const STORAGE_UNLOCKED_STAGE_KEY = 'eclipse_chronicle_unlocked_stage_v1';
const STORAGE_RUNS_PLAYED_KEY = 'eclipse_chronicle_runs_played_v1';

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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('unlockall') === '1') return MAX_STAGE_LEVEL;
      const stageParam = parseInt(params.get('stage') || '0', 10);
      if (stageParam >= 1 && stageParam <= MAX_STAGE_LEVEL) {
        return Math.max(stageParam, 1);
      }
    }
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

function getInitialStageFromUrl(): number {
  if (typeof window === 'undefined') return 1;
  const params = new URLSearchParams(window.location.search);
  const st = parseInt(params.get('stage') || '1', 10);
  return Number.isFinite(st) && st >= 1 && st <= MAX_STAGE_LEVEL ? st : 1;
}

function getInitialPhaseFromUrl(): GamePhase {
  if (typeof window === 'undefined') return 'title';
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1' || params.get('levelup') === '1'
    ? 'playing'
    : 'title';
}

function buildInitialWorld(phase: GamePhase, bestScore: number, stageLevel: number) {
  const world = createInitialWorldState(phase, bestScore, stageLevel);
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('levelup') === '1') {
      grantPlayerXp(world, world.player.xpToNextLevel);
    }
  }
  return world;
}

export default function App() {
  const initialPhase = getInitialPhaseFromUrl();
  const initialBest = loadBestScore();
  const initialStage = getInitialStageFromUrl();

  const [selectedStage, setSelectedStage] = useState<number>(initialStage);
  const [highestUnlockedStage, setHighestUnlockedStage] = useState<number>(() =>
    Math.max(loadHighestUnlockedStage(), initialStage)
  );
  const [runsPlayed, setRunsPlayed] = useState<number>(() => loadRunsPlayed());
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [authStatusText, setAuthStatusText] = useState<string>('');

  const worldRef = useRef(buildInitialWorld(initialPhase, initialBest, initialStage));
  const [phase, setPhase] = useState<GamePhase>(initialPhase);
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);

  const buildHudFromWorld = useCallback((w = worldRef.current): HudDiscreteState => {
    const learnedSkills = (Object.keys(w.player.skills) as SkillId[])
      .filter((k) => (w.player.skills[k] ?? 0) > 0)
      .map((k) => ({ id: k, rank: w.player.skills[k] ?? 1 }));
    return {
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
      bossHpPercent: null,
      bossName: null,
      skills: learnedSkills,
      skillChoices: [...w.skillChoices],
      relicChoices: [...w.relicChoices],
    };
  }, []);

  const [hud, setHud] = useState<HudDiscreteState>(() => buildHudFromWorld(worldRef.current));

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
        // Push local progress up first so existing offline progress is never lost
        const localBest = Math.max(loadBestScore(), worldRef.current.bestScore);
        const localStage = loadHighestUnlockedStage();
        const localRuns = loadRunsPlayed();
        void syncPlayerProgressToCloud(user, {
          bestScore: localBest,
          highestUnlockedStage: localStage,
          totalCoins: worldRef.current.player.coins,
          runsPlayed: localRuns,
        });

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
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setAuthStatusText('Signing in...');
      await signInWithGooglePopup();
      setAuthStatusText('Cloud Progress Synced');
    } catch {
      setAuthStatusText('Sign-in cancelled');
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
    []
  );

  const handleStartStage = useCallback(
    (stageToLaunch: number, e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e?.currentTarget) {
        e.currentTarget.blur();
      }
      const clampedStage = Math.max(1, Math.min(MAX_STAGE_LEVEL, stageToLaunch));
      setSelectedStage(clampedStage);
      const best = Math.max(loadBestScore(), worldRef.current.bestScore);
      saveBestScore(best);
      worldRef.current = createInitialWorldState('playing', best, clampedStage);
      setHud(buildHudFromWorld(worldRef.current));
      setSnapshot(null);
      document.body.dataset.state = 'playing';
      setPhase('playing');
    },
    [buildHudFromWorld]
  );

  const handleStartOrRestart = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      handleStartStage(selectedStage, e);
    },
    [handleStartStage, selectedStage]
  );

  const handleReturnToTitle = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (e?.currentTarget) {
        e.currentTarget.blur();
      }
      const best = Math.max(loadBestScore(), worldRef.current.bestScore);
      saveBestScore(best);
      worldRef.current = createInitialWorldState('title', best, selectedStage);
      setHud(buildHudFromWorld(worldRef.current));
      setSnapshot(null);
      document.body.dataset.state = 'title';
      setPhase('title');
    },
    [buildHudFromWorld, selectedStage]
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
          STATE 1: TITLE SCREEN OVERLAY (Cloud Login + Stage 1-10 Selector)
          ===================================================================== */}
      {phase === 'title' && (
        <section
          aria-label="Title Screen"
          className="fixed inset-0 z-20 flex flex-col items-center justify-between px-6 py-6 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(9, 8, 13, 0.22) 0%, rgba(9, 8, 13, 0.86) 78%)',
          }}
        >
          {/* Top Bar: Personal Best + Account Login / Cloud Save Status */}
          <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 text-xs tracking-wider text-[#d6cbb9]/85 font-mono-tabular pointer-events-auto">
            <div className="flex items-center gap-3">
              <span>ROGUELIKE SANCTUARY · STAGES 1–10</span>
              <span className="text-[#fde68a]">
                BEST: {Math.max(hud.bestScore, initialBest)} · RUNS: {runsPlayed}
              </span>
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

          {/* Center Monument Spotlight Lockup + 10-Stage Dungeon Selector */}
          <div className="flex flex-col items-center text-center max-w-2xl my-auto pointer-events-auto">
            <TitleCrestEmblem />

            <p className="mt-2 text-xs sm:text-sm text-[#d6cbb9] max-w-lg leading-relaxed">
              Battle 8 distinct monster archetypes across 4 to 10 connected rooms per stage, loot Solar Coins & usable items, evolve skills on level-up, and sync your progress to the cloud.
            </p>

            {/* Stage 1 to 10 Roguelike Level Selector */}
            <div
              aria-label="Select Sanctuary Stage"
              className="mt-4 w-full bg-[#120f1a]/92 border border-[#3b2d4a] rounded-md p-3 shadow-[0_10px_28px_rgba(0,0,0,0.85)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#fde68a] mb-2">
                <span>
                  STAGE {selectedStageSpec.stage}: {selectedStageSpec.name.toUpperCase()} ({selectedStageSpec.subtitle})
                </span>
                <span className="text-[#c4b9a5]">
                  UNLOCKED {highestUnlockedStage}/{MAX_STAGE_LEVEL}
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
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
                            st.stage
                          );
                          setHud(buildHudFromWorld(worldRef.current));
                        }
                      }}
                      className={`flex flex-col items-center justify-center py-1.5 px-1 rounded border font-mono-tabular transition-colors ${
                        !isUnlocked
                          ? 'bg-[#0c0a12] border-[#1f192b] text-[#574c68] opacity-55 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#2a1f3d] border-[#f59e0b] text-[#fde68a] cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                          : 'bg-[#171324] border-[#312642] text-[#d6cbb9] hover:border-[#fde68a] cursor-pointer'
                      }`}
                    >
                      <span className="text-[10px] text-[#a39887]">LV</span>
                      <span className="text-sm font-bold leading-tight">{st.stage}</span>
                      <span className="text-[9px] text-[#38bdf8]">{st.roomCount}R</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button
                type="button"
                data-start="true"
                onClick={handleStartOrRestart}
                className="px-8 py-3 rounded-md bg-[#f59e0b] hover:bg-[#fbbf24] active:translate-y-0.5 text-[#09080d] font-display font-bold text-base tracking-wider shadow-[0_6px_20px_rgba(245,158,11,0.35)] transition-transform cursor-pointer whitespace-nowrap shrink-0"
              >
                Enter Stage {selectedStage} ({selectedStageSpec.roomCount} Rooms)
              </button>

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
            WASD Move & Enter Portals · Click / J Attack · Space Dash · E Nova · Z/X/C Use Dropped Items · 1-3 Stance/Skill
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
            {/* Top-Left Cluster: Vitality Pips, Essence, Level/XP, Stage/Room, Coins & Skills */}
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
                  LV. {hud.level}
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

              {/* Stage, Room, Coins & Score Readouts */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#292036] text-xs font-mono-tabular">
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
              </div>

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
                    STAGE {hud.stageLevel} MAP ({hud.rooms.length} ROOMS):
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
                  </div>
                )}
              </div>

              {/* Boss Health Bar when Archon Boss is active */}
              {hud.bossHpPercent !== null && (
                <div className="hidden md:flex flex-col items-center bg-[#120f1a]/90 border border-[#f59e0b]/60 rounded-md px-5 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.85)]">
                  <span className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#fde68a]">
                    {hud.bossName} · STAGE {hud.stageLevel} SOVEREIGN
                  </span>
                  <div className="w-64 h-2 bg-[#09080d] border border-[#4c1d95] rounded-sm overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#f43f5e] transition-all duration-100"
                      style={{ width: `${hud.bossHpPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right Cluster: Compact Clickable Utility Icon Buttons */}
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
          </div>

          {/* Bottom Perimeter Dock: 3 Equippable Stances + 3 Usable Item Belt Slots [Z/X/C] + Dash & Nova */}
          <div className="flex items-end justify-center">
            <div className="flex flex-wrap items-center gap-2 bg-[#120f1a]/92 border border-[#3b2d4a] rounded-md px-3 py-2 pointer-events-auto shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
              {(Object.keys(WEAPON_STANCES) as WeaponStanceId[]).map((stanceKey) => {
                const spec = WEAPON_STANCES[stanceKey];
                const isSelected = hud.stance === stanceKey;
                const canAfford = hud.essence >= spec.essenceCost;
                return (
                  <button
                    key={stanceKey}
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleSelectStance(stanceKey);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-left transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#241d35] border-[#f59e0b] text-[#f4efe6]'
                        : 'bg-[#151120] border-[#2b2238] text-[#a39887] hover:text-[#f4efe6]'
                    } ${!canAfford ? 'opacity-60' : ''}`}
                  >
                    <StanceIcon stance={stanceKey} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-mono-tabular font-bold text-[#fde68a]">
                          [{spec.keyBinding}]
                        </span>
                        <span className="text-xs font-semibold">{spec.name}</span>
                      </div>
                      <span className="text-[10px] text-[#c4b9a5]">{spec.roleClue}</span>
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
              {hud.relicChoices.map((relic) => (
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
                  </div>
                  <span className="mt-4 inline-block text-xs font-mono-tabular font-bold text-[#f59e0b]">
                    Inscribe Relic →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          STATE 3: PAUSE MODAL CARD
          ===================================================================== */}
      {phase === 'paused' && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Game Paused"
          className="fixed inset-0 z-30 flex items-center justify-center p-6 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.82)' }}
        >
          <div className="w-full max-w-md bg-[#14111f] border border-[#4c3b63] rounded-md p-6 text-center shadow-[0_16px_48px_rgba(0,0,0,0.95)]">
            <span className="text-xs font-mono-tabular uppercase tracking-widest text-[#f59e0b]">
              CHRONICLE SUSPENDED · STAGE {hud.stageLevel}
            </span>
            <h2 className="mt-1 text-2xl font-display font-bold text-[#f4efe6]">
              Sanctuary Paused
            </h2>

            <div className="mt-5 grid grid-cols-3 gap-2.5 text-center font-mono-tabular">
              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[10px] text-[#a39887]">STAGE · ROOM</div>
                <div className="mt-0.5 text-base font-bold text-[#fde68a]">
                  S{hud.stageLevel} · R{hud.currentRoomIndex + 1}/{hud.rooms.length}
                </div>
              </div>
              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[10px] text-[#a39887]">COINS · SCORE</div>
                <div className="mt-0.5 text-base font-bold text-[#f4efe6]">
                  {hud.coins}c · {hud.score}
                </div>
              </div>
              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-2.5">
                <div className="text-[10px] text-[#a39887]">VITALITY</div>
                <div className="mt-0.5 text-base font-bold text-[#e11d48]">
                  {hud.hp}/{hud.maxHp}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleTogglePause();
                }}
                className="w-full py-2.5 rounded bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] font-display font-bold text-sm tracking-wider cursor-pointer transition-colors"
              >
                Resume Game
              </button>
              {!currentUser && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 rounded bg-[#1e1b4b] hover:bg-[#2e296e] text-[#e0f2fe] border border-[#38bdf8] text-xs font-mono-tabular font-bold tracking-wider cursor-pointer transition-colors"
                >
                  Login with Google (Save Cloud Progress)
                </button>
              )}
              <button
                type="button"
                onClick={handleStartOrRestart}
                className="w-full py-2.5 rounded bg-[#1f1a30] hover:bg-[#2b2442] text-[#f4efe6] border border-[#3b2d4a] text-xs font-mono-tabular tracking-wider cursor-pointer transition-colors"
              >
                Restart Stage {hud.stageLevel}
              </button>
              <button
                type="button"
                onClick={handleReturnToTitle}
                className="w-full py-2.5 rounded bg-[#14111f] hover:bg-[#1f1a30] text-[#c4b9a5] text-xs font-mono-tabular tracking-wider cursor-pointer transition-colors"
              >
                Return to Stage Select
              </button>
            </div>
          </div>
        </section>
      )}

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
                ? `STAGE ${snapshot.stageLevel} RECLAIMED · VICTORY`
                : `STAGE ${snapshot.stageLevel} · SOLAR WARDEN FALLEN`}
            </span>
            <h2 className="mt-1 text-2xl font-display font-bold text-[#f4efe6]">
              {snapshot.outcome === 'victory'
                ? 'Archon of the Corona Banished'
                : 'The Eclipse Consumes the Arena'}
            </h2>

            {/* 3 Tabular-Nums Mastery / Progress Metric Tiles */}
            <div className="mt-5 grid grid-cols-3 gap-2.5 text-center font-mono-tabular">
              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-3">
                <div className="text-[10px] text-[#a39887]">SCORE / BEST</div>
                <div className="mt-1 text-base font-bold text-[#fde68a]">
                  {snapshot.score} / {snapshot.bestScore}
                </div>
              </div>

              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-3">
                <div className="text-[10px] text-[#a39887]">ROOMS · COINS</div>
                <div className="mt-1 text-base font-bold text-[#38bdf8]">
                  {snapshot.roomsCleared}/{snapshot.totalRooms} · {snapshot.coinsCollected}c
                </div>
              </div>

              <div className="bg-[#0d0b14] border border-[#2b2238] rounded p-3">
                <div className="text-[10px] text-[#a39887]">WARDEN LEVEL</div>
                <div className="mt-1 text-base font-bold text-[#10b981]">
                  LV. {snapshot.levelReached}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              {snapshot.outcome === 'victory' && snapshot.stageLevel < MAX_STAGE_LEVEL && (
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
                className="w-full py-3 rounded bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] font-display font-bold text-sm tracking-wider cursor-pointer transition-colors"
              >
                {snapshot.outcome === 'victory'
                  ? `Replay Stage ${snapshot.stageLevel}`
                  : `Retry Stage ${snapshot.stageLevel}`}
              </button>
              <button
                type="button"
                onClick={handleReturnToTitle}
                className="w-full py-2.5 rounded bg-[#1f1a30] hover:bg-[#2b2442] text-[#f4efe6] border border-[#3b2d4a] text-xs font-mono-tabular tracking-wider cursor-pointer transition-colors"
              >
                Return to Stage Select
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

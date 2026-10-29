import React, { useEffect, useRef } from 'react';
import {
  ActiveDebuffView,
  ArenaHazard,
  ArenaWorldState,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  CombatLogEntry,
  computeScreenShakeOffset,
  DoorDirection,
  DungeonRoom,
  ENEMY_ARCHETYPE_CATALOG,
  EnemyArchetype,
  FAMILIAR_CATALOG,
  FamiliarId,
  findInteractableShrine,
  FrameInput,
  GameMode,
  GamePhase,
  getActiveCombatLogEntries,
  getDoorWorldPosition,
  getEclipseLightSources,
  getEnemyActiveDebuffs,
  getPlayerActiveDebuffs,
  getRoomEnemyDebuffSummary,
  InventorySlot,
  isBossOrEclipseCandidate,
  RelicOption,
  RunSnapshot,
  SCREEN_SHAKE_PROFILES,
  ScreenShakeReason,
  ScreenShakeSample,
  SkillChoiceOption,
  SkillId,
  stepArenaWorld,
  USABLE_ITEMS,
  WEAPON_EVOLUTIONS,
  WEAPON_STANCES,
  WeaponStanceId,
} from '../game/rules';
import { soundEngine } from '../game/audio';

export interface HoveredArenaEnemyHud {
  id: number;
  archetype: EnemyArchetype;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  debuffs?: ActiveDebuffView[];
}

export interface HudDiscreteState {
  gameMode: GameMode;
  dailySeed: string;
  bossRushCycle: number;
  bossRushWavesCleared: number;
  elapsedSeconds: number;
  stageLevel: number;
  hp: number;
  maxHp: number;
  essence: number;
  maxEssence: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  inventory: InventorySlot[];
  rooms: DungeonRoom[];
  currentRoomIndex: number;
  wave: number;
  totalWaves: number;
  score: number;
  bestScore: number;
  comboCount: number;
  stance: WeaponStanceId;
  awakenedStances: Partial<Record<WeaponStanceId, boolean>>;
  dawnbladeSwingCount: number;
  activeFamiliar: FamiliarId | null;
  unlockedFamiliars: Partial<Record<FamiliarId, boolean>>;
  cherubShieldActive: boolean;
  cherubShieldCooldownRemaining: number;
  collectedRelics: string[];
  lastAwakenedStance: WeaponStanceId | null;
  awakeningBannerActive: boolean;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossHpPercent: number | null;
  bossName: string | null;
  skills: Array<{ id: SkillId; rank: number }>;
  skillChoices: SkillChoiceOption[];
  relicChoices: RelicOption[];
  defeatedByArchetype: Partial<Record<EnemyArchetype, number>>;
  activeRoomArchetypes: EnemyArchetype[];
  hoveredArenaEnemy: HoveredArenaEnemyHud | null;
  hazards: ArenaHazard[];
  nearbyShrine: ArenaHazard | null;
  damageMultiplier: number;
  playerDebuffs: ActiveDebuffView[];
  enemyDebuffSummary: { burnedCount: number; slowedCount: number; sunderedCount: number };
  thermalShockCount: number;
  solarMeltdownCount: number;
  totalEclipseActive: boolean;
  bossVulnerabilityTimer: number;
  bossVulnerabilityMaxTimer: number;
  combatLog: CombatLogEntry[];
}

interface ArenaCanvasProps {
  worldRef: React.MutableRefObject<ArenaWorldState>;
  phase: GamePhase;
  onSyncHud: (hud: HudDiscreteState) => void;
  onPhaseChange: (nextPhase: GamePhase, snapshot?: RunSnapshot | null) => void;
  onChooseSkill: (skillId: SkillId) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
  hpBarRef: React.RefObject<HTMLDivElement | null>;
  ghostHpBarRef: React.RefObject<HTMLDivElement | null>;
  essenceBarRef: React.RefObject<HTMLDivElement | null>;
  xpBarRef: React.RefObject<HTMLDivElement | null>;
  dashCooldownRef: React.RefObject<HTMLDivElement | null>;
  novaCooldownRef: React.RefObject<HTMLDivElement | null>;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const PARTICLE_POOL_CAPACITY = 256;

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  worldRef,
  phase,
  onSyncHud,
  onPhaseChange,
  onChooseSkill,
  onTogglePause,
  onToggleMute,
  onRestart,
  hpBarRef,
  ghostHpBarRef,
  essenceBarRef,
  xpBarRef,
  dashCooldownRef,
  novaCooldownRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest React callbacks in refs so canvas loop never tears down on HUD updates
  const callbacksRef = useRef({
    onSyncHud,
    onPhaseChange,
    onChooseSkill,
    onTogglePause,
    onToggleMute,
    onRestart,
  });
  useEffect(() => {
    callbacksRef.current = {
      onSyncHud,
      onPhaseChange,
      onChooseSkill,
      onTogglePause,
      onToggleMute,
      onRestart,
    };
  }, [onSyncHud, onPhaseChange, onChooseSkill, onTogglePause, onToggleMute, onRestart]);

  const phaseRef = useRef<GamePhase>(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pre-allocate zero-GC pooled particle ring buffer
    const particlePool: PooledParticle[] = Array.from({ length: PARTICLE_POOL_CAPACITY }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 3,
      color: '#f59e0b',
    }));
    let poolCursor = 0;

    const spawnParticlesInPool = (
      x: number,
      y: number,
      color: string,
      count: number,
      speed: number,
      size: number
    ) => {
      for (let i = 0; i < count; i++) {
        const slot = particlePool[poolCursor];
        poolCursor = (poolCursor + 1) % PARTICLE_POOL_CAPACITY;
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.75);
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.vx = Math.cos(angle) * mag;
        slot.vy = Math.sin(angle) * mag;
        slot.life = 0;
        slot.maxLife = 0.22 + Math.random() * 0.26;
        slot.size = size;
        slot.color = color;
      }
    };

    // Unified input hub: separate continuous held keys from single-frame justPressed edges
    const heldKeys = new Set<string>();
    const justPressedKeys = new Set<string>();
    let mouseHeld = false;
    let mouseJustPressed = false;
    let rightMouseJustPressed = false;
    let pointerClientX = window.innerWidth * 0.5;
    let pointerClientY = window.innerHeight * 0.42;

    // Live ResizeObserver canvas bounds for screenToWorld
    let canvasRect = canvas.getBoundingClientRect();
    let renderScale = 1;
    let renderOffsetX = 0;
    let renderOffsetY = 0;

    const updateCanvasMetrics = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvasRect = rect;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      const scaleX = w / ARENA_WIDTH;
      const scaleY = h / ARENA_HEIGHT;
      renderScale = Math.min(scaleX, scaleY);
      renderOffsetX = (w - ARENA_WIDTH * renderScale) * 0.5;
      renderOffsetY = (h - ARENA_HEIGHT * renderScale) * 0.5;
    };

    updateCanvasMetrics();
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasMetrics();
    });
    resizeObserver.observe(canvas);

    const screenToWorld = (clientX: number, clientY: number) => {
      const localX = clientX - canvasRect.left - renderOffsetX;
      const localY = clientY - canvasRect.top - renderOffsetY;
      return {
        x: Math.max(0, Math.min(ARENA_WIDTH, localX / (renderScale || 1))),
        y: Math.max(0, Math.min(ARENA_HEIGHT, localY / (renderScale || 1))),
      };
    };

    const clearAllInputs = () => {
      heldKeys.clear();
      justPressedKeys.clear();
      mouseHeld = false;
      mouseJustPressed = false;
      rightMouseJustPressed = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;

      if (code === 'KeyM') {
        e.preventDefault();
        callbacksRef.current.onToggleMute();
        return;
      }

      if (code === 'KeyP' || code === 'Escape') {
        if (phaseRef.current === 'playing' || phaseRef.current === 'paused') {
          e.preventDefault();
          clearAllInputs();
          callbacksRef.current.onTogglePause();
          return;
        }
      }

      if (code === 'KeyR' && (phaseRef.current === 'playing' || phaseRef.current === 'paused')) {
        e.preventDefault();
        clearAllInputs();
        callbacksRef.current.onRestart();
        return;
      }

      if (phaseRef.current === 'title' && (code === 'Enter' || code === 'Space')) {
        e.preventDefault();
        clearAllInputs();
        callbacksRef.current.onPhaseChange('playing');
        return;
      }

      // Keyboard shortcut 1 / 2 / 3 when Level-Up Skill Draft modal is open
      const activeSkillChoices = worldRef.current.skillChoices;
      if (phaseRef.current === 'playing' && activeSkillChoices.length > 0) {
        if (code === 'Digit1' && activeSkillChoices[0]) {
          e.preventDefault();
          clearAllInputs();
          callbacksRef.current.onChooseSkill(activeSkillChoices[0].id);
          return;
        }
        if (code === 'Digit2' && activeSkillChoices[1]) {
          e.preventDefault();
          clearAllInputs();
          callbacksRef.current.onChooseSkill(activeSkillChoices[1].id);
          return;
        }
        if (code === 'Digit3' && activeSkillChoices[2]) {
          e.preventDefault();
          clearAllInputs();
          callbacksRef.current.onChooseSkill(activeSkillChoices[2].id);
          return;
        }
      }

      if (!heldKeys.has(code)) {
        justPressedKeys.add(code);
      }
      heldKeys.add(code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };

    const handleMouseMove = (e: MouseEvent) => {
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      pointerClientX = e.clientX;
      pointerClientY = e.clientY;
      if (e.button === 0) {
        if (!mouseHeld) {
          mouseJustPressed = true;
        }
        mouseHeld = true;
      } else if (e.button === 2) {
        rightMouseJustPressed = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseHeld = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (phaseRef.current === 'playing') {
        e.preventDefault();
      }
    };

    const handleWindowBlur = () => {
      clearAllInputs();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearAllInputs();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    let lastTime = performance.now();
    let titlePanTime = 0;
    let cameraOffsetX = 0;
    let cameraOffsetY = 0;
    let cameraRotationRad = 0;
    let shakeImpulseX = 0;
    let shakeImpulseY = 0;
    let lastShakeActiveAttr = 'false';
    let lastShakeReasonAttr: ScreenShakeReason = 'none';
    let lastHudHash = '';
    let lastHpTransform = '';
    let lastGhostHpTransform = '';
    let lastEssenceTransform = '';
    let lastXpTransform = '';
    let lastDashTransform = '';
    let lastNovaTransform = '';
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const isHeadlessSoftware =
      typeof navigator !== 'undefined' && /HeadlessChrome/i.test(navigator.userAgent || '');

    const scheduleNextFrame = () => {
      if (disposed) return;
      if (isHeadlessSoftware) {
        timerId = setTimeout(() => {
          if (!disposed) {
            rafId = requestAnimationFrame(tick);
          }
        }, 32);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => {
      if (disposed) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const clampedDt = Math.min(Math.max(0, rawDt), 0.05);

      const world = worldRef.current;
      world.phase = phaseRef.current;

      // Build FrameInput if playing and no draft modal is open
      if (
        world.phase === 'playing' &&
        world.relicChoices.length === 0 &&
        world.skillChoices.length === 0
      ) {
        let moveX = 0;
        let moveY = 0;
        if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) moveX -= 1;
        if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) moveX += 1;
        if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) moveY -= 1;
        if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) moveY += 1;

        const aimWorld = screenToWorld(pointerClientX, pointerClientY);

        let stanceSelect: WeaponStanceId | null = null;
        if (justPressedKeys.has('Digit1')) stanceSelect = 'dawnblade';
        if (justPressedKeys.has('Digit2')) stanceSelect = 'astral_bow';
        if (justPressedKeys.has('Digit3')) stanceSelect = 'chrono_scythe';

        let useItemSlot: number | null = null;
        if (justPressedKeys.has('KeyZ')) useItemSlot = 0;
        else if (justPressedKeys.has('KeyX')) useItemSlot = 1;
        else if (justPressedKeys.has('KeyC')) useItemSlot = 2;

        const attackJustPressed =
          mouseJustPressed || justPressedKeys.has('KeyJ') || justPressedKeys.has('KeyK');
        const dashJustPressed =
          justPressedKeys.has('Space') || justPressedKeys.has('ShiftLeft');
        const novaJustPressed =
          rightMouseJustPressed || justPressedKeys.has('KeyE') || justPressedKeys.has('KeyQ');
        const cycleFamiliarJustPressed = justPressedKeys.has('KeyF');
        const interactJustPressed = justPressedKeys.has('KeyG');

        const input: FrameInput = {
          moveX,
          moveY,
          aimWorldX: aimWorld.x,
          aimWorldY: aimWorld.y,
          attackHeld: mouseHeld || heldKeys.has('KeyJ'),
          attackJustPressed,
          dashJustPressed,
          novaJustPressed,
          stanceSelect,
          useItemSlot,
          cycleFamiliarJustPressed,
          interactJustPressed,
        };

        // Consume edge triggers
        justPressedKeys.clear();
        mouseJustPressed = false;
        rightMouseJustPressed = false;

        const simEvents = stepArenaWorld(world, input, clampedDt);

        // Trigger procedural Web Audio & pooled particles from events
        if (simEvents.playerSwung) {
          soundEngine.playSwing(simEvents.playerSwung);
        }
        if (simEvents.familiarFired) {
          soundEngine.playSwing('astral_bow');
        }
        if (simEvents.cherubShieldBlocked) {
          soundEngine.playPickup();
        }
        if (simEvents.brazierDetonated) {
          soundEngine.playNova();
          const ang = world.screenShakeAngle;
          shakeImpulseX += Math.cos(ang) * 14 + (Math.random() * 2 - 1) * 6;
          shakeImpulseY += Math.sin(ang) * 14 + (Math.random() * 2 - 1) * 6;
        }
        if (simEvents.spikeTrapTriggered) {
          soundEngine.playHit(false);
        }
        if (simEvents.shrineActivated) {
          soundEngine.playLevelUp();
        }
        if (simEvents.playerDashed || simEvents.roomChanged) {
          soundEngine.playDash();
        }
        if (simEvents.perfectDodge) {
          soundEngine.playPickup();
        }
        if (simEvents.playerNova) {
          soundEngine.playNova();
        }
        if (simEvents.playerLeveledUp || simEvents.stanceAwakened) {
          soundEngine.playLevelUp();
        }
        if (simEvents.itemUsed) {
          soundEngine.playPickup();
        }
        if (simEvents.criticalStrike) {
          soundEngine.playCriticalHit();
          const ang = world.screenShakeAngle;
          shakeImpulseX += Math.cos(ang) * 10;
          shakeImpulseY += Math.sin(ang) * 10;
        }
        if (simEvents.enemiesKilled > 0) {
          soundEngine.playHit(true);
        } else if (simEvents.enemiesHit > 0 && !simEvents.criticalStrike) {
          soundEngine.playHit(false);
        }
        if (simEvents.playerHurt) {
          soundEngine.playPlayerHurt();
          const ang = world.screenShakeAngle;
          shakeImpulseX += Math.cos(ang) * 16 + (Math.random() * 2 - 1) * 7;
          shakeImpulseY += Math.sin(ang) * 16 + (Math.random() * 2 - 1) * 7;
        }
        if (simEvents.pickupCollected || simEvents.coinCollected) {
          soundEngine.playPickup();
        }
        if (simEvents.telegraphStarted) {
          soundEngine.playTelegraph();
        }
        for (const pBurst of simEvents.particlesToSpawn) {
          spawnParticlesInPool(
            pBurst.x,
            pBurst.y,
            pBurst.color,
            pBurst.count,
            pBurst.speed,
            pBurst.size
          );
        }

        if (simEvents.outcomeTriggered !== 'none') {
          soundEngine.playOutcome(simEvents.outcomeTriggered === 'victory');
          callbacksRef.current.onPhaseChange('gameover', world.snapshot);
        }
      } else {
        justPressedKeys.clear();
        mouseJustPressed = false;
        rightMouseJustPressed = false;
      }

      // Update pooled particles in real time
      for (let i = 0; i < PARTICLE_POOL_CAPACITY; i++) {
        const pt = particlePool[i];
        if (!pt.active) continue;
        pt.life += clampedDt;
        if (pt.life >= pt.maxLife) {
          pt.active = false;
          continue;
        }
        pt.x += pt.vx * clampedDt;
        pt.y += pt.vy * clampedDt;
        pt.vx *= Math.pow(0.15, clampedDt);
        pt.vy *= Math.pow(0.15, clampedDt);
      }

      // Update high-frequency DOM bar refs only when quantized transform changes
      const p = world.player;
      if (hpBarRef.current) {
        const pct = Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp)));
        const nextT = `scaleX(${(Math.round(pct * 20) / 20).toFixed(2)})`;
        if (nextT !== lastHpTransform) {
          lastHpTransform = nextT;
          hpBarRef.current.style.transform = nextT;
        }
      }
      if (ghostHpBarRef.current) {
        const gPct = Math.max(0, Math.min(1, p.ghostHp / Math.max(1, p.maxHp)));
        const nextT = `scaleX(${(Math.round(gPct * 20) / 20).toFixed(2)})`;
        if (nextT !== lastGhostHpTransform) {
          lastGhostHpTransform = nextT;
          ghostHpBarRef.current.style.transform = nextT;
        }
      }
      if (essenceBarRef.current) {
        const ePct = Math.max(0, Math.min(1, p.essence / Math.max(1, p.maxEssence)));
        const nextT = `scaleX(${(Math.round(ePct * 20) / 20).toFixed(2)})`;
        if (nextT !== lastEssenceTransform) {
          lastEssenceTransform = nextT;
          essenceBarRef.current.style.transform = nextT;
        }
      }
      if (xpBarRef.current) {
        const xPct = Math.max(0, Math.min(1, p.xp / Math.max(1, p.xpToNextLevel)));
        const nextT = `scaleX(${(Math.round(xPct * 20) / 20).toFixed(2)})`;
        if (nextT !== lastXpTransform) {
          lastXpTransform = nextT;
          xpBarRef.current.style.transform = nextT;
        }
      }
      if (dashCooldownRef.current) {
        const dReady = 1 - Math.min(1, p.dashCooldown / Math.max(0.1, p.dashCooldownMax));
        const nextT = `scaleX(${(Math.round(dReady * 10) / 10).toFixed(1)})`;
        if (nextT !== lastDashTransform) {
          lastDashTransform = nextT;
          dashCooldownRef.current.style.transform = nextT;
        }
      }
      if (novaCooldownRef.current) {
        const nReady = 1 - Math.min(1, p.novaCooldown / Math.max(0.1, p.novaCooldownMax));
        const nextT = `scaleX(${(Math.round(nReady * 10) / 10).toFixed(1)})`;
        if (nextT !== lastNovaTransform) {
          lastNovaTransform = nextT;
          novaCooldownRef.current.style.transform = nextT;
        }
      }

      // Throttle discrete HUD synchronization
      const boss =
        world.enemies.find((e) => e.archetype === 'archon' && e.aiState !== 'ko') ??
        (world.gameMode === 'boss_rush'
          ? world.enemies.find((e) => isBossOrEclipseCandidate(world, e) && e.aiState !== 'ko')
          : undefined);
      const bossHp = boss ? Math.max(0, Math.round(boss.hp)) : null;
      const bossMaxHp = boss ? Math.max(1, Math.round(boss.maxHp)) : null;
      const bossHpPct = boss ? Math.max(0, Math.round((boss.hp / boss.maxHp) * 100)) : null;
      const quantizedEssence =
        p.essence >= p.maxEssence ? p.maxEssence : Math.floor(p.essence / 5) * 5;
      const learnedSkills = (Object.keys(p.skills) as SkillId[])
        .filter((k) => (p.skills[k] ?? 0) > 0)
        .map((k) => ({ id: k, rank: p.skills[k] ?? 1 }));
      const skillsSig = learnedSkills.map((s) => `${s.id}:${s.rank}`).join(',');
      const invSig = p.inventory.map((s) => `${s.itemId}:${s.count}`).join(',');
      const roomsSig = world.rooms.map((r) => `${r.id}:${r.cleared ? 1 : 0}:${r.visited ? 1 : 0}`).join(',');

      // Detect hovered arena enemy when paused for Bestiary live arena inspection
      let hoveredArenaEnemy: HoveredArenaEnemyHud | null = null;
      if (world.phase === 'paused') {
        const hoverWorld = screenToWorld(pointerClientX, pointerClientY);
        let bestDist = Infinity;
        for (const e of world.enemies) {
          if (e.aiState === 'ko') continue;
          const d = Math.hypot(e.x - hoverWorld.x, e.y - hoverWorld.y);
          if (d <= e.radius + 22 && d < bestDist) {
            bestDist = d;
            hoveredArenaEnemy = {
              id: e.id,
              archetype: e.archetype,
              hp: Math.max(0, Math.round(e.hp)),
              maxHp: Math.round(e.maxHp),
              x: Math.round(e.x),
              y: Math.round(e.y),
              debuffs: getEnemyActiveDebuffs(e),
            };
          }
        }
      }

      const activeRoomArchetypes = Array.from(
        new Set(world.enemies.filter((e) => e.aiState !== 'ko').map((e) => e.archetype))
      );
      const defeatedSig = Object.entries(world.defeatedByArchetype)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      const activeArchSig = activeRoomArchetypes.join(',');
      const hoverSig = hoveredArenaEnemy
        ? `${hoveredArenaEnemy.id}:${hoveredArenaEnemy.archetype}:${hoveredArenaEnemy.hp}`
        : 'none';
      const awakenedSig = (['dawnblade', 'astral_bow', 'chrono_scythe'] as WeaponStanceId[])
        .filter((st) => p.awakenedStances[st])
        .join(',');
      const unlockedFamSig = (['ember_wisp', 'aegis_cherub', 'greed_imp'] as FamiliarId[])
        .filter((f) => p.unlockedFamiliars[f])
        .join(',');
      const cherubRem = p.cherubShieldActive
        ? 0
        : Math.max(0, Math.ceil(20 - p.cherubShieldTimer));
      const relicsSig = world.collectedRelics.join(',');
      const bannerActive = world.awakeningBannerTimer > 0;
      const quantizedTime = Math.floor(world.elapsedSeconds * 5) / 5;
      const nearbyShrine = findInteractableShrine(world, 95);
      const hazardsSig = world.hazards
        .map(
          (h) =>
            `${h.id}:${h.kind}:${h.used ? 1 : 0}:${Math.ceil(h.cooldown)}:${h.spikePhase}`
        )
        .join(',');
      const nearbySig = nearbyShrine ? `${nearbyShrine.id}:${nearbyShrine.kind}` : 'none';
      const playerDebuffs = getPlayerActiveDebuffs(p);
      const playerDebuffSig = playerDebuffs
        .map((d) => `${d.id}:${d.stacks}:${Math.ceil(d.remainingSeconds * 5)}`)
        .join(',');
      const enemyDebuffSummary = getRoomEnemyDebuffSummary(world);
      const eclipseSig = `${world.totalEclipseActive ? 1 : 0}:${Math.ceil(world.bossVulnerabilityTimer * 5)}`;
      const enemyDebuffSig = `${enemyDebuffSummary.burnedCount}:${enemyDebuffSummary.slowedCount}:${enemyDebuffSummary.sunderedCount}:${world.thermalShockCount}:${world.solarMeltdownCount}:${eclipseSig}`;
      const combatLog = getActiveCombatLogEntries(world);
      const combatLogSig = combatLog
        .map((c) => `${c.id}:${c.detail}:${Math.floor(c.age * 8)}`)
        .join(',');

      const hudHash = `${world.gameMode}|${world.dailySeed}|${world.bossRushCycle}|${world.bossRushWavesCleared}|${quantizedTime}|${world.stageLevel}|${Math.round(p.hp)}|${p.maxHp}|${quantizedEssence}|${p.maxEssence}|${p.level}|${Math.round(p.xp)}|${p.xpToNextLevel}|${p.coins}|${invSig}|${world.currentRoomIndex}|${roomsSig}|${world.wave}|${Math.round(world.score)}|${Math.round(world.bestScore)}|${world.comboCount}|${p.stance}|${awakenedSig}|${p.dawnbladeSwingCount}|${p.activeFamiliar}|${unlockedFamSig}|${p.cherubShieldActive}|${cherubRem}|${relicsSig}|${world.lastAwakenedStance}|${bannerActive}|${bossHp}|${bossMaxHp}|${bossHpPct}|${skillsSig}|${world.skillChoices.length}|${world.relicChoices.length}|${defeatedSig}|${activeArchSig}|${hoverSig}|${hazardsSig}|${nearbySig}|${p.damageMultiplier}|${playerDebuffSig}|${enemyDebuffSig}|${combatLogSig}`;
      if (hudHash !== lastHudHash) {
        lastHudHash = hudHash;
        callbacksRef.current.onSyncHud({
          gameMode: world.gameMode,
          dailySeed: world.dailySeed,
          bossRushCycle: world.bossRushCycle,
          bossRushWavesCleared: world.bossRushWavesCleared,
          elapsedSeconds: Number(world.elapsedSeconds.toFixed(1)),
          stageLevel: world.stageLevel,
          hp: Math.round(p.hp),
          maxHp: p.maxHp,
          essence: quantizedEssence,
          maxEssence: p.maxEssence,
          level: p.level,
          xp: Math.round(p.xp),
          xpToNextLevel: p.xpToNextLevel,
          coins: p.coins,
          inventory: p.inventory.map((slot) => ({ ...slot })),
          rooms: world.rooms.map((r) => ({ ...r, doors: [...r.doors] })),
          currentRoomIndex: world.currentRoomIndex,
          wave: world.wave,
          totalWaves: world.totalWaves,
          score: Math.round(world.score),
          bestScore: Math.round(world.bestScore),
          comboCount: world.comboCount,
          stance: p.stance,
          awakenedStances: { ...p.awakenedStances },
          dawnbladeSwingCount: p.dawnbladeSwingCount ?? 0,
          activeFamiliar: p.activeFamiliar,
          unlockedFamiliars: { ...p.unlockedFamiliars },
          cherubShieldActive: p.cherubShieldActive,
          cherubShieldCooldownRemaining: cherubRem,
          collectedRelics: [...world.collectedRelics],
          lastAwakenedStance: world.lastAwakenedStance,
          awakeningBannerActive: bannerActive,
          bossHp,
          bossMaxHp,
          bossHpPercent: bossHpPct,
          bossName: boss
            ? boss.archetype === 'archon'
              ? 'Archon of the Corona'
              : ENEMY_ARCHETYPE_CATALOG[boss.archetype].name
            : null,
          skills: learnedSkills,
          skillChoices: world.skillChoices,
          relicChoices: world.relicChoices,
          defeatedByArchetype: { ...world.defeatedByArchetype },
          activeRoomArchetypes,
          hoveredArenaEnemy,
          hazards: world.hazards.map((h) => ({ ...h })),
          nearbyShrine: nearbyShrine ? { ...nearbyShrine } : null,
          damageMultiplier: p.damageMultiplier,
          playerDebuffs,
          enemyDebuffSummary,
          thermalShockCount: world.thermalShockCount,
          solarMeltdownCount: world.solarMeltdownCount,
          totalEclipseActive: world.totalEclipseActive,
          bossVulnerabilityTimer: Number(world.bossVulnerabilityTimer.toFixed(1)),
          bossVulnerabilityMaxTimer: world.bossVulnerabilityMaxTimer,
          combatLog,
        });
      }

      // Render Frame
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);
      const viewportW = canvas.width / dpr;
      const viewportH = canvas.height / dpr;

      // Clear full bleed outer background
      ctx.fillStyle = '#09080d';
      ctx.fillRect(0, 0, viewportW, viewportH);

      // Camera Pan on Title Screen vs Gameplay Screen-Shake (Player Hurt / Critical Strike / Solar Brazier)
      const shakeSample = computeScreenShakeOffset(world, now / 1000);
      if (world.phase === 'title') {
        titlePanTime += clampedDt;
        cameraOffsetX = Math.sin(titlePanTime * 0.45) * 32;
        cameraOffsetY = 64 + Math.cos(titlePanTime * 0.32) * 16;
        cameraRotationRad = 0;
      } else {
        shakeImpulseX *= Math.pow(0.002, clampedDt);
        shakeImpulseY *= Math.pow(0.002, clampedDt);
        cameraOffsetX = shakeSample.offsetX + shakeImpulseX;
        cameraOffsetY = shakeSample.offsetY + shakeImpulseY;
        cameraRotationRad = shakeSample.rotationRad;
      }

      const nextShakeActiveAttr = shakeSample.active ? 'true' : 'false';
      if (nextShakeActiveAttr !== lastShakeActiveAttr) {
        lastShakeActiveAttr = nextShakeActiveAttr;
        canvas.dataset.shakeActive = nextShakeActiveAttr;
      }
      if (world.lastScreenShakeReason !== lastShakeReasonAttr) {
        lastShakeReasonAttr = world.lastScreenShakeReason;
        canvas.dataset.lastShakeReason = world.lastScreenShakeReason;
      }
      canvas.dataset.totalEclipse = world.totalEclipseActive ? 'true' : 'false';
      canvas.dataset.bossVulnerable = world.bossVulnerabilityTimer > 0.04 ? 'true' : 'false';

      const centerScreenX = renderOffsetX + ARENA_WIDTH * 0.5 * renderScale;
      const centerScreenY = renderOffsetY + ARENA_HEIGHT * 0.5 * renderScale;
      ctx.translate(
        centerScreenX + cameraOffsetX * renderScale,
        centerScreenY + cameraOffsetY * renderScale
      );
      if (cameraRotationRad !== 0) {
        ctx.rotate(cameraRotationRad);
      }
      ctx.scale(renderScale, renderScale);
      ctx.translate(-ARENA_WIDTH * 0.5, -ARENA_HEIGHT * 0.5);

      drawArenaFloorAndPillars(ctx, world, now / 1000);
      drawSanctumHazards(ctx, world, now / 1000);
      drawEmberZones(ctx, world, now / 1000);
      drawVortexVisuals(ctx, world, now / 1000);
      drawReactionVisuals(ctx, world, now / 1000);
      drawPickups(ctx, world, now / 1000);
      drawEnemyTelegraphs(ctx, world);
      drawEnemies(ctx, world, now / 1000);
      drawPausedBestiaryReticles(ctx, world, hoveredArenaEnemy, now / 1000);
      drawPlayerAndAttack(ctx, world);
      drawLightningArcs(ctx, world);
      drawProjectiles(ctx, world);
      drawParticles(ctx, particlePool);
      drawTotalEclipseLighting(ctx, world, now / 1000);
      drawCriticalStrikeCallout(ctx, world);
      drawScreenShakeImpactRim(ctx, world, shakeSample);
      drawWaveBanner(ctx, world);

      ctx.restore();
      scheduleNextFrame();
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    worldRef,
    hpBarRef,
    ghostHpBarRef,
    essenceBarRef,
    xpBarRef,
    dashCooldownRef,
    novaCooldownRef,
  ]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#09080d]">
      <canvas
        ref={canvasRef}
        data-testid="arena-canvas"
        data-shake-active="false"
        data-last-shake-reason="none"
        className="block w-full h-full cursor-crosshair"
      />
    </div>
  );
};

function drawArenaFloorAndPillars(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  // Sanctum floor base
  ctx.fillStyle = '#12101b';
  ctx.fillRect(32, 32, world.arenaWidth - 64, world.arenaHeight - 64);

  // Subtle pixel tile grid & runic stone joints
  const tileSize = 48;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 32; x <= world.arenaWidth - 32; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x, world.arenaHeight - 32);
    ctx.stroke();
  }
  for (let y = 32; y <= world.arenaHeight - 32; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(world.arenaWidth - 32, y);
    ctx.stroke();
  }

  // Central Solar Eclipse Seal on the Sanctuary Floor
  ctx.save();
  ctx.translate(world.arenaWidth * 0.5, world.arenaHeight * 0.5);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 145, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.12)';
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Solar Nova Pulse Ring
  if (world.novaPulseTimer > 0) {
    const progress = 1 - world.novaPulseTimer / 0.45;
    const novaSurgeRank = world.player.skills.supernova_surge ?? 0;
    const radius = 24 + progress * (175 + novaSurgeRank * 32);
    ctx.save();
    ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - progress) * 0.85})`;
    ctx.lineWidth = 6 * (1 - progress * 0.6);
    ctx.beginPath();
    ctx.arc(world.novaPulseX, world.novaPulseY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Sanctum Perimeter Border Walls
  ctx.strokeStyle = '#3b2d4a';
  ctx.lineWidth = 6;
  ctx.strokeRect(35, 35, world.arenaWidth - 70, world.arenaHeight - 70);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, world.arenaWidth - 80, world.arenaHeight - 80);

  // Draw Runic Portal Doors for Connected Dungeon Rooms
  const currentRoom = world.rooms[world.currentRoomIndex];
  if (currentRoom) {
    for (const door of currentRoom.doors) {
      const targetRoom = world.rooms[door.targetRoomId];
      const pos = getDoorWorldPosition(door.dir, world.arenaWidth, world.arenaHeight);
      const isOpen = currentRoom.cleared;
      const pulse = 0.65 + Math.sin(timeSec * 4.5) * 0.25;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.fillStyle = isOpen
        ? `rgba(16, 185, 129, ${(0.28 * pulse).toFixed(2)})`
        : 'rgba(244, 63, 94, 0.16)';
      ctx.strokeStyle = isOpen ? '#10b981' : '#be123c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = isOpen ? '#fde68a' : '#881337';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isOpen ? '#fef3c7' : '#fda4af';
      ctx.font = '700 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const label = targetRoom?.kind === 'boss' ? 'BOSS' : `R${door.targetRoomId + 1}`;
      ctx.fillText(isOpen ? `${door.dir}·${label}` : 'SEALED', 0, 4);
      ctx.restore();
    }
  }

  // Obelisk Pillars
  for (const pillar of world.pillars) {
    ctx.save();
    ctx.translate(pillar.x, pillar.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(4, 7, pillar.radius + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e192b';
    ctx.strokeStyle = '#4c3b63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, pillar.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const pulse = 0.55 + Math.sin(timeSec * 3.2 + pillar.x) * 0.25;
    ctx.fillStyle = `rgba(245, 158, 11, ${pulse.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSanctumHazards(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  const p = world.player;

  for (const hazard of world.hazards) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);

    // 1. SPIKE RUNES (Lantai Berduri Runik)
    if (hazard.kind === 'spike_rune') {
      const r = hazard.radius;
      const isWarning = hazard.spikePhase === 'warning';
      const isActive = hazard.spikePhase === 'active';

      // Base octagonal runic floor plate
      ctx.fillStyle = isActive
        ? 'rgba(136, 19, 55, 0.52)'
        : isWarning
        ? 'rgba(124, 45, 18, 0.42)'
        : 'rgba(20, 16, 31, 0.78)';
      ctx.strokeStyle = isActive
        ? '#f43f5e'
        : isWarning
        ? '#fb923c'
        : 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = isActive ? 2.5 : isWarning ? 2 : 1.5;

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8 + Math.PI / 8;
        const px = Math.cos(ang) * r;
        const py = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner runic circle
      ctx.strokeStyle = isActive
        ? 'rgba(253, 164, 175, 0.75)'
        : isWarning
        ? 'rgba(253, 224, 71, 0.65)'
        : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
      ctx.stroke();

      // Draw 9 spike sockets / emerging spikes
      const spikePositions = [
        { x: 0, y: 0 },
        { x: -15, y: -14 },
        { x: 15, y: -14 },
        { x: -15, y: 14 },
        { x: 15, y: 14 },
        { x: 0, y: -22 },
        { x: 0, y: 22 },
        { x: -22, y: 0 },
        { x: 22, y: 0 },
      ];

      for (const sp of spikePositions) {
        if (isActive) {
          // Extended lethal crimson-steel spikes jutting up
          ctx.fillStyle = '#09080d';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y + 2, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fda4af';
          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sp.x - 4.5, sp.y + 3);
          ctx.lineTo(sp.x, sp.y - 12);
          ctx.lineTo(sp.x + 4.5, sp.y + 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (isWarning) {
          // Pulsing amber spike tips telegraphing imminent impale
          const warnPulse = 0.55 + Math.sin(timeSec * 18) * 0.4;
          ctx.fillStyle = `rgba(251, 191, 36, ${warnPulse.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(sp.x - 3.5, sp.y + 2);
          ctx.lineTo(sp.x, sp.y - 5);
          ctx.lineTo(sp.x + 3.5, sp.y + 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Dormant spike holes
          ctx.fillStyle = '#09080d';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (isWarning || isActive) {
        ctx.fillStyle = isActive ? '#fda4af' : '#fde047';
        ctx.font = '700 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isActive ? 'SPIKES ACTIVE' : 'SPIKES [!]', 0, r + 11);
      }

      ctx.restore();
      continue;
    }

    // 2. SOLAR BRAZIER (Tungku Api Surya)
    if (hazard.kind === 'solar_brazier') {
      const isReady = hazard.cooldown <= 0;
      const r = hazard.radius;

      // Detonation shockwave pulse when struck
      if (hazard.pulseTimer > 0) {
        const prog = Math.max(0, Math.min(1, 1 - hazard.pulseTimer / 0.72));
        const blastR = Math.max(r, r + prog * (hazard.blastRadius - r));
        ctx.strokeStyle = `rgba(251, 146, 60, ${(1 - prog) * 0.9})`;
        ctx.fillStyle = `rgba(249, 115, 22, ${(1 - prog) * 0.22})`;
        ctx.lineWidth = Math.max(1, 4.5 * (1 - prog * 0.5));
        ctx.beginPath();
        ctx.arc(0, 0, blastR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Faint tactical blast radius ring when ready
      if (isReady) {
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, hazard.blastRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Shadow & ornate bronze-obsidian brazier bowl
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(3, 5, r + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1c1526';
      ctx.strokeStyle = isReady ? '#f59e0b' : '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (isReady) {
        // Ignited flickering solar flame core
        const flicker = Math.sin(timeSec * 14 + hazard.id) * 2.5;
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.quadraticCurveTo(-6, -14 + flicker, 0, -18 - flicker);
        ctx.quadraticCurveTo(6, -14 - flicker, 10, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.font = '700 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SOLAR BRAZIER [HIT]', 0, r + 12);
      } else {
        // Cooling down / re-igniting progress arc
        const pct = 1 - hazard.cooldown / Math.max(0.1, hazard.cooldownMax);
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r - 4, -Math.PI * 0.5, -Math.PI * 0.5 + pct * Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${hazard.cooldown.toFixed(1)}s`, 0, 3);
      }

      ctx.restore();
      continue;
    }

    // 3. CURSED ALTAR & HEALING FOUNTAIN (Altar Kutukan Darah & Mata Air Suci)
    if (hazard.kind === 'cursed_altar' || hazard.kind === 'healing_fountain') {
      const isCursed = hazard.kind === 'cursed_altar';
      const r = hazard.radius;
      const distToPlayer = Math.hypot(p.x - hazard.x, p.y - hazard.y);
      const isPlayerNear = !hazard.used && distToPlayer <= 95;
      const pulse = 0.65 + Math.sin(timeSec * 4.5 + hazard.id) * 0.25;

      // Activation pulse ring
      if (hazard.pulseTimer > 0) {
        const prog = Math.max(0, Math.min(1, 1 - hazard.pulseTimer / 0.6));
        ctx.strokeStyle = isCursed
          ? `rgba(225, 29, 72, ${(1 - prog) * 0.9})`
          : `rgba(16, 185, 129, ${(1 - prog) * 0.9})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(r, r + prog * 65), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Outer sanctuary aura
      if (!hazard.used) {
        ctx.fillStyle = isCursed
          ? `rgba(225, 29, 72, ${(0.14 * pulse).toFixed(2)})`
          : `rgba(16, 185, 129, ${(0.14 * pulse).toFixed(2)})`;
        ctx.strokeStyle = isCursed
          ? `rgba(244, 63, 94, ${(0.55 * pulse).toFixed(2)})`
          : `rgba(52, 211, 153, ${(0.55 * pulse).toFixed(2)})`;
        ctx.lineWidth = isPlayerNear ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Pedestal base
      ctx.fillStyle = '#161224';
      ctx.strokeStyle = hazard.used
        ? '#475569'
        : isCursed
        ? '#e11d48'
        : '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner chalice / emblem
      if (isCursed) {
        ctx.fillStyle = hazard.used ? '#334155' : '#be123c';
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(11, 0);
        ctx.lineTo(0, 13);
        ctx.lineTo(-11, 0);
        ctx.closePath();
        ctx.fill();

        if (!hazard.used) {
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = hazard.used ? '#334155' : '#059669';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        if (!hazard.used) {
          ctx.fillStyle = '#6ee7b7';
          ctx.fillRect(-2.5, -8, 5, 16);
          ctx.fillRect(-8, -2.5, 16, 5);
        }
      }

      // Label below shrine
      ctx.font = '700 9.5px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      if (hazard.used) {
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(hazard.rewardLabel || 'SHRINE USED', 0, r + 14);
      } else if (isPlayerNear) {
        ctx.fillStyle = isCursed ? '#fecdd3' : '#a7f3d0';
        ctx.fillText(
          isCursed
            ? '[G] CURSED ALTAR (-25% HP → +22% DMG + RELIC)'
            : '[G] HEALING FOUNTAIN (+40% HP & +45 ESS)',
          0,
          -r - 12
        );
        ctx.fillStyle = isCursed ? '#fda4af' : '#6ee7b7';
        ctx.fillText(isCursed ? 'CURSED ALTAR [G]' : 'HEALING FOUNTAIN [G]', 0, r + 14);
      } else {
        ctx.fillStyle = isCursed ? '#fda4af' : '#6ee7b7';
        ctx.fillText(isCursed ? 'CURSED ALTAR [G]' : 'HEALING FOUNTAIN [G]', 0, r + 14);
      }

      ctx.restore();
    }
  }
}

function drawEmberZones(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  for (const zone of world.emberZones) {
    const alpha = Math.min(1, zone.life / Math.max(0.2, zone.maxLife * 0.4));
    ctx.save();
    ctx.translate(zone.x, zone.y);
    if (zone.kind === 'star_mine') {
      // Constellation Repeater exploding star mine
      const pulse = 1 + Math.sin(timeSec * 16 + zone.id) * 0.15;
      ctx.fillStyle = `rgba(56, 189, 248, ${(0.18 * alpha).toFixed(2)})`;
      ctx.strokeStyle = `rgba(253, 224, 71, ${(0.75 * alpha).toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // 4-point Constellation Star Core
      ctx.rotate(timeSec * 3 + zone.id);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(3.2, -3.2);
      ctx.lineTo(11, 0);
      ctx.lineTo(3.2, 3.2);
      ctx.lineTo(0, 11);
      ctx.lineTo(-3.2, 3.2);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-3.2, -3.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(244, 63, 94, ${(0.22 * alpha).toFixed(2)})`;
      ctx.strokeStyle = `rgba(251, 191, 36, ${(0.65 * alpha).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, zone.radius + Math.sin(timeSec * 9 + zone.id) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawVortexVisuals(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  for (const vx of world.vortexVisuals) {
    const progress = Math.min(1, vx.life / Math.max(0.05, vx.maxLife));
    const alpha = Math.max(0, 1 - progress);
    const radius = vx.radius * (1 - progress * 0.45);
    ctx.save();
    ctx.translate(vx.x, vx.y);
    ctx.fillStyle = `rgba(88, 28, 135, ${(0.28 * alpha).toFixed(2)})`;
    ctx.strokeStyle = `rgba(232, 121, 249, ${(0.85 * alpha).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(56, 189, 248, ${(0.75 * alpha).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, timeSec * 6, timeSec * 6 + Math.PI * 1.65);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawReactionVisuals(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  for (const rv of world.reactionVisuals) {
    const progress = Math.min(1, rv.life / Math.max(0.05, rv.maxLife));
    const alpha = Math.max(0, 1 - progress);
    const outerRadius = rv.radius * (0.28 + progress * 0.72);
    const innerRadius = rv.radius * (0.15 + progress * 0.48);

    ctx.save();
    ctx.translate(rv.x, rv.y);

    if (rv.kind === 'thermal_shock') {
      // Astral Steam explosion (Cyan + Solar Orange dual shockwave)
      ctx.fillStyle = `rgba(34, 211, 238, ${(0.22 * alpha).toFixed(2)})`;
      ctx.strokeStyle = `rgba(103, 232, 249, ${(0.92 * alpha).toFixed(2)})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = `rgba(251, 146, 60, ${(0.85 * alpha).toFixed(2)})`;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius, -timeSec * 5, -timeSec * 5 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating reaction callout above blast center
      const floatY = -24 - progress * 24;
      ctx.font = 'bold 11px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(103, 232, 249, ${Math.min(1, alpha * 1.25).toFixed(2)})`;
      ctx.fillText(`THERMAL SHOCK! -${rv.damageDealt}`, 0, floatY);
    } else {
      // Solar Meltdown (Gold + Crimson armor-sundering solar flare)
      ctx.fillStyle = `rgba(244, 63, 94, ${(0.25 * alpha).toFixed(2)})`;
      ctx.strokeStyle = `rgba(253, 224, 71, ${(0.95 * alpha).toFixed(2)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = `rgba(251, 113, 133, ${(0.88 * alpha).toFixed(2)})`;
      ctx.lineWidth = 2.5;
      for (let s = 0; s < 8; s++) {
        const ang = (s * Math.PI) / 4 + progress * 0.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * innerRadius * 0.5, Math.sin(ang) * innerRadius * 0.5);
        ctx.lineTo(Math.cos(ang) * outerRadius * 0.92, Math.sin(ang) * outerRadius * 0.92);
        ctx.stroke();
      }

      const floatY = -26 - progress * 26;
      ctx.font = 'bold 11.5px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(253, 224, 71, ${Math.min(1, alpha * 1.25).toFixed(2)})`;
      ctx.fillText(`SOLAR MELTDOWN! -${rv.damageDealt} · SUNDER`, 0, floatY);
    }

    ctx.restore();
  }
}

function drawPickups(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  for (const item of world.pickups) {
    const bob = Math.sin(timeSec * 5 + item.id) * 3;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    if (item.kind === 'solar_heart') {
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(-2, -5, 4, 10);
      ctx.fillRect(-5, -2, 10, 4);
    } else if (item.kind === 'gold_coin') {
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, -4, 3, 8);
    } else if (item.kind === 'usable_item' && item.itemId) {
      const spec = USABLE_ITEMS[item.itemId];
      ctx.fillStyle = '#181326';
      ctx.strokeStyle = spec?.accentColor ?? '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-9, -9, 18, 18, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = spec?.accentColor ?? '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEnemyTelegraphs(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  for (const enemy of world.enemies) {
    if (enemy.aiState !== 'windup') continue;
    const progress = Math.min(1, enemy.stateTimer / Math.max(0.05, enemy.stateDuration));

    ctx.save();
    if (
      enemy.archetype === 'stalker' ||
      enemy.archetype === 'wraith' ||
      enemy.archetype === 'solar_zealot'
    ) {
      const len =
        enemy.archetype === 'wraith' ? 128 : enemy.archetype === 'solar_zealot' ? 116 : 88;
      const endX = enemy.x + Math.cos(enemy.aimAngle) * len;
      const endY = enemy.y + Math.sin(enemy.aimAngle) * len;
      ctx.strokeStyle =
        enemy.archetype === 'wraith'
          ? `rgba(45, 212, 191, ${0.4 + progress * 0.55})`
          : enemy.archetype === 'solar_zealot'
          ? `rgba(250, 204, 21, ${0.45 + progress * 0.5})`
          : `rgba(244, 63, 94, ${0.35 + progress * 0.55})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 8 * (1 - progress), 0, Math.PI * 2);
      ctx.strokeStyle =
        enemy.archetype === 'wraith'
          ? '#99f6e4'
          : enemy.archetype === 'solar_zealot'
          ? '#fef08a'
          : '#fda4af';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (
      enemy.archetype === 'arcanist' ||
      enemy.archetype === 'pyromancer' ||
      enemy.archetype === 'necro_weaver' ||
      enemy.archetype === 'frost_revenant'
    ) {
      const endX = enemy.x + Math.cos(enemy.aimAngle) * 320;
      const endY = enemy.y + Math.sin(enemy.aimAngle) * 320;
      ctx.strokeStyle =
        enemy.archetype === 'pyromancer'
          ? `rgba(249, 115, 22, ${0.3 + progress * 0.5})`
          : enemy.archetype === 'necro_weaver'
          ? `rgba(16, 185, 129, ${0.3 + progress * 0.5})`
          : enemy.archetype === 'frost_revenant'
          ? `rgba(103, 232, 249, ${0.35 + progress * 0.55})`
          : `rgba(244, 63, 94, ${0.25 + progress * 0.45})`;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle =
        enemy.archetype === 'pyromancer'
          ? '#fb923c'
          : enemy.archetype === 'necro_weaver'
          ? '#34d399'
          : enemy.archetype === 'frost_revenant'
          ? '#67e8f9'
          : '#fb7185';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 10 * progress, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.archetype === 'void_singularity') {
      // Gravitational collapse rings around the singularity
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + progress * 0.55})`;
      ctx.fillStyle = `rgba(147, 51, 234, ${0.08 + progress * 0.16})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 76 * (1 - progress * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (enemy.archetype === 'sentinel' || enemy.archetype === 'eclipse_inquisitor') {
      const rays = enemy.archetype === 'eclipse_inquisitor' ? 8 : 4;
      ctx.strokeStyle =
        enemy.archetype === 'eclipse_inquisitor'
          ? `rgba(232, 121, 249, ${0.38 + progress * 0.52})`
          : `rgba(56, 189, 248, ${0.35 + progress * 0.5})`;
      ctx.lineWidth = 2.5;
      for (let k = 0; k < rays; k++) {
        const ang = enemy.aimAngle + (k * Math.PI * 2) / rays;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + Math.cos(ang) * 230, enemy.y + Math.sin(ang) * 230);
        ctx.stroke();
      }
    } else if (enemy.archetype === 'juggernaut') {
      const rushLen = 280;
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.aimAngle);
      ctx.fillStyle = `rgba(245, 158, 11, ${0.14 + progress * 0.22})`;
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.5 + progress * 0.45})`;
      ctx.lineWidth = 2;
      ctx.fillRect(0, -enemy.radius, rushLen * progress, enemy.radius * 2);
      ctx.strokeRect(0, -enemy.radius, rushLen, enemy.radius * 2);
    } else if (enemy.archetype === 'archon') {
      ctx.strokeStyle = `rgba(251, 113, 133, ${0.4 + progress * 0.55})`;
      ctx.fillStyle = `rgba(244, 63, 94, ${0.1 + progress * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(enemy.targetX, enemy.targetY, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(enemy.targetX, enemy.targetY, 92 * progress, 0, Math.PI * 2);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEnemies(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  const isFrozen = world.enemyFreezeTimer > 0;
  for (const enemy of world.enemies) {
    ctx.save();
    const bob = Math.sin(enemy.walkDistance * 0.12) * 2.5;
    ctx.translate(enemy.x, enemy.y + bob);

    if (enemy.aiState === 'ko') {
      const koProgress = Math.min(1, enemy.stateTimer / Math.max(0.05, enemy.stateDuration));
      ctx.globalAlpha = Math.max(0, 1 - koProgress);
      ctx.rotate(koProgress * 1.4);
      ctx.scale(1 + koProgress * 0.25, Math.max(0.2, 1 - koProgress * 0.6));
    } else {
      ctx.scale(enemy.scaleX, enemy.scaleY);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius - 2, enemy.radius * 0.9, enemy.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    const isFlashing = enemy.hitFlashTimer > 0;

    if (enemy.archetype === 'stalker') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#be123c';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#09080d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(15, 4);
      ctx.lineTo(9, 16);
      ctx.lineTo(-9, 16);
      ctx.lineTo(-15, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-6, -4, 4, 4);
      ctx.fillRect(2, -4, 4, 4);
    } else if (enemy.archetype === 'wraith') {
      // Phantom Wraith: sleek cyan-teal crescent blade specter
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0d9488';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#2dd4bf';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -19);
      ctx.lineTo(16, 8);
      ctx.lineTo(0, 3);
      ctx.lineTo(-16, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ccfbf1';
      ctx.beginPath();
      ctx.arc(0, -5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.archetype === 'frost_revenant') {
      // Frost Revenant: crystalline 4-pointed glacial star-prism
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0369a1';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#67e8f9';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, -21);
      ctx.lineTo(7, -7);
      ctx.lineTo(21, 0);
      ctx.lineTo(7, 7);
      ctx.lineTo(0, 21);
      ctx.lineTo(-7, 7);
      ctx.lineTo(-21, 0);
      ctx.lineTo(-7, -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ecfeff';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.archetype === 'arcanist') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#6d28d9';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#09080d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -21);
      ctx.lineTo(17, 0);
      ctx.lineTo(0, 20);
      ctx.lineTo(-17, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.archetype === 'pyromancer') {
      // Cinder Pyromancer: hexagonal magma cultist with solar flame core
      ctx.fillStyle = isFlashing ? '#ffffff' : '#c2410c';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#fb923c';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const ang = (h * Math.PI) / 3 - Math.PI * 0.5;
        const hx = Math.cos(ang) * 18;
        const hy = Math.sin(ang) * 18;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.archetype === 'necro_weaver') {
      // Necro-Weaver: emerald bone-horned summoner
      ctx.fillStyle = isFlashing ? '#ffffff' : '#065f46';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#34d399';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-14, -18);
      ctx.lineTo(0, -10);
      ctx.lineTo(14, -18);
      ctx.lineTo(18, 8);
      ctx.lineTo(0, 20);
      ctx.lineTo(-18, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(-7, -3, 4, 4);
      ctx.fillRect(3, -3, 4, 4);
    } else if (enemy.archetype === 'void_singularity') {
      // Void Singularity: pulsing dark-matter orb with orbiting accretion ring
      ctx.fillStyle = isFlashing ? '#ffffff' : '#3b0764';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#c084fc';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.radius + 4, 8, timeSec * 2.2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.archetype === 'solar_zealot') {
      // Solar Zealot: golden-amber twin-blade fanatic
      ctx.fillStyle = isFlashing ? '#ffffff' : '#a16207';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#facc15';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, -4);
      ctx.lineTo(11, 16);
      ctx.lineTo(-11, 16);
      ctx.lineTo(-18, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(-7, -5, 14, 4);
    } else if (enemy.archetype === 'sentinel') {
      // Obsidian Sentinel: octagonal armored construct with cross-visor
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e1b4b';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#38bdf8';
      ctx.lineWidth = 3;
      const r = enemy.radius;
      ctx.beginPath();
      ctx.roundRect(-r, -r, r * 2, r * 2, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-11, -2.5, 22, 5);
      ctx.fillRect(-2.5, -11, 5, 22);
    } else if (enemy.archetype === 'eclipse_inquisitor') {
      // Eclipse Inquisitor: crowned royal-magenta & gold high templar
      ctx.fillStyle = isFlashing ? '#ffffff' : '#4a044e';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#f59e0b';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(19, -8);
      ctx.lineTo(15, 20);
      ctx.lineTo(-15, 20);
      ctx.lineTo(-19, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.archetype === 'juggernaut') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#b45309';
      ctx.strokeStyle = isFrozen ? '#c084fc' : '#09080d';
      ctx.lineWidth = 3.5;
      const r = enemy.radius;
      ctx.beginPath();
      ctx.roundRect(-r, -r, r * 2, r * 2, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-12, -6, 24, 5);
    } else {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#4c1d95';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      for (let c = 0; c < 4; c++) {
        const ang = timeSec * 2.5 + (c * Math.PI) / 2;
        const cx = Math.cos(ang) * (enemy.radius + 10);
        const cy = Math.sin(ang) * (enemy.radius + 10);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Elemental status aura around afflicted enemies
    if (enemy.aiState !== 'ko') {
      if (enemy.burnTimer > 0.04) {
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 5 + Math.sin(timeSec * 14 + enemy.id) * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (enemy.slowTimer > 0.04 || isFrozen) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (enemy.sunderTimer > 0.04) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (enemy.aiState !== 'ko' && enemy.archetype !== 'archon' && enemy.hp < enemy.maxHp) {
      const barW = 32;
      const pct = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = '#09080d';
      ctx.fillRect(-barW * 0.5 - 1, -enemy.radius - 13, barW + 2, 6);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-barW * 0.5, -enemy.radius - 12, barW * pct, 4);
    }

    ctx.restore();

    // Draw overhead Elemental Debuff Icons (Burned / Slowed / Sundered) in unscaled world coordinates above enemy head
    if (enemy.aiState !== 'ko') {
      const debuffs = getEnemyActiveDebuffs(enemy);
      if (debuffs.length > 0) {
        const hasHpBar = enemy.archetype !== 'archon' && enemy.hp < enemy.maxHp;
        const badgeW = 32;
        const badgeH = 15;
        const gap = 4;
        const totalW = debuffs.length * badgeW + (debuffs.length - 1) * gap;
        const startX = enemy.x - totalW * 0.5;
        const badgeY = enemy.y + bob - enemy.radius - (hasHpBar ? 31 : 21);

        ctx.save();
        for (let dIdx = 0; dIdx < debuffs.length; dIdx++) {
          const debuff = debuffs[dIdx];
          const bx = startX + dIdx * (badgeW + gap);
          const pct = Math.max(0, Math.min(1, debuff.remainingSeconds / Math.max(0.1, debuff.maxSeconds)));

          // Pill badge background & border
          ctx.fillStyle = 'rgba(9, 8, 13, 0.92)';
          ctx.strokeStyle = debuff.borderColor;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(bx, badgeY, badgeW, badgeH, 3.5);
          ctx.fill();
          ctx.stroke();

          // Duration progress bar at bottom of badge
          ctx.fillStyle = debuff.accentColor;
          ctx.fillRect(bx + 1.5, badgeY + badgeH - 2.5, (badgeW - 3) * pct, 1.5);

          // Vector elemental icon on left of badge
          const iconCx = bx + 7.5;
          const iconCy = badgeY + 6.5;
          if (debuff.id === 'burned') {
            // Flame silhouette
            ctx.fillStyle = '#fb923c';
            ctx.beginPath();
            ctx.moveTo(iconCx, iconCy - 4.5);
            ctx.quadraticCurveTo(iconCx + 4.2, iconCy - 1, iconCx + 3.0, iconCy + 3.2);
            ctx.quadraticCurveTo(iconCx, iconCy + 4.6, iconCx - 3.0, iconCy + 3.2);
            ctx.quadraticCurveTo(iconCx - 4.2, iconCy - 1, iconCx, iconCy - 4.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(iconCx, iconCy + 1.2, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (debuff.id === 'sundered') {
            // Shattered crimson shield / armor sunder icon
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(iconCx, iconCy - 4.4);
            ctx.lineTo(iconCx + 3.8, iconCy - 2.6);
            ctx.lineTo(iconCx + 3.2, iconCy + 2.2);
            ctx.lineTo(iconCx, iconCy + 4.5);
            ctx.lineTo(iconCx - 3.2, iconCy + 2.2);
            ctx.lineTo(iconCx - 3.8, iconCy - 2.6);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(iconCx + 0.8, iconCy - 3.8);
            ctx.lineTo(iconCx - 1.0, iconCy + 0.2);
            ctx.lineTo(iconCx + 1.0, iconCy + 0.8);
            ctx.lineTo(iconCx - 0.8, iconCy + 3.8);
            ctx.stroke();
          } else {
            // Frost / Chrono 6-point crystal icon
            ctx.strokeStyle = '#67e8f9';
            ctx.lineWidth = 1.4;
            for (let a = 0; a < 3; a++) {
              const ang = (a * Math.PI) / 3;
              ctx.beginPath();
              ctx.moveTo(iconCx - Math.cos(ang) * 3.8, iconCy - Math.sin(ang) * 3.8);
              ctx.lineTo(iconCx + Math.cos(ang) * 3.8, iconCy + Math.sin(ang) * 3.8);
              ctx.stroke();
            }
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.arc(iconCx, iconCy, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Remaining timer or stack readout on right of badge
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle =
            debuff.id === 'burned'
              ? '#fed7aa'
              : debuff.id === 'sundered'
                ? '#fecdd3'
                : '#bae6fd';
          const labelText =
            debuff.stacks > 1
              ? `x${debuff.stacks}`
              : `${debuff.remainingSeconds.toFixed(1)}`;
          ctx.fillText(labelText, bx + 13, badgeY + 6.5);
        }
        ctx.restore();
      }
    }
  }
}

function drawPlayerAndAttack(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  const p = world.player;
  const spec = WEAPON_STANCES[p.stance];
  const echoRank = p.skills.phantom_echo ?? 0;
  const effectiveRange = Math.round(spec.range * (1 + echoRank * 0.18));

  // Draw Orbiting Solar Blades skill
  const orbitRank = p.skills.solar_orbit ?? 0;
  if (orbitRank > 0) {
    const bladeCount = orbitRank + 1;
    const orbitRadius = 64;
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let b = 0; b < bladeCount; b++) {
      const ang = p.orbitAngle + (b * Math.PI * 2) / bladeCount;
      const bx = p.x + Math.cos(ang) * orbitRadius;
      const by = p.y + Math.sin(ang) * orbitRadius;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(ang + Math.PI * 0.5);
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // Draw active or windup weapon arc
  const isCurrentAwakened = Boolean(p.awakenedStances[p.stance]);
  const evoSpec = WEAPON_EVOLUTIONS[p.stance];
  const evoRangeMult = isCurrentAwakened ? evoSpec.bonusRangeMultiplier : 1.0;
  const drawRange = Math.round(effectiveRange * evoRangeMult);

  if (p.attackPhase === 'windup' || p.attackPhase === 'active') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.attackAngle);

    if (p.attackPhase === 'windup') {
      ctx.strokeStyle = isCurrentAwakened
        ? 'rgba(253, 224, 71, 0.55)'
        : 'rgba(254, 243, 199, 0.35)';
      ctx.lineWidth = isCurrentAwakened ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, drawRange * 0.75, -spec.arcRadians * 0.5, spec.arcRadians * 0.5);
      ctx.stroke();
    } else if (p.stance !== 'astral_bow') {
      ctx.fillStyle =
        p.stance === 'dawnblade'
          ? isCurrentAwakened
            ? 'rgba(251, 191, 36, 0.46)'
            : 'rgba(245, 158, 11, 0.38)'
          : isCurrentAwakened
            ? 'rgba(232, 121, 249, 0.46)'
            : 'rgba(192, 132, 252, 0.42)';
      ctx.strokeStyle = isCurrentAwakened ? evoSpec.accentColor : spec.accentColor;
      ctx.lineWidth = isCurrentAwakened ? 5 : 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, drawRange, -spec.arcRadians * 0.5, spec.arcRadians * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (isCurrentAwakened) {
        ctx.strokeStyle = evoSpec.secondaryColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, drawRange * 0.84, -spec.arcRadians * 0.48, spec.arcRadians * 0.48);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Draw Solar Warden Protagonist
  ctx.save();
  const walkBob = Math.sin(p.walkDistance * 0.14) * 2.5;
  ctx.translate(p.x, p.y + walkBob);
  ctx.scale(p.scaleX, p.scaleY);

  // Dawn Aegis Ward active barrier ring
  if (p.aegisActive) {
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Aegis Cherub Familiar sacred shield ring (or 20s recharge arc)
  if (p.activeFamiliar === 'aegis_cherub') {
    if (p.cherubShieldActive) {
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      const rechargePct = Math.max(0, Math.min(1, p.cherubShieldTimer / 20));
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 13, -Math.PI * 0.5, -Math.PI * 0.5 + rechargePct * Math.PI * 2);
      ctx.stroke();
    }
  }

  // Dash afterimage halo
  if (p.dashTimer > 0) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Player elemental debuff rings in arena
  if (p.burnTimer > 0.04) {
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (p.slowTimer > 0.04) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, p.radius - 1, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const flash = p.hitFlashTimer > 0;
  ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
  ctx.strokeStyle = isCurrentAwakened ? evoSpec.accentColor : '#09080d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = flash ? '#ffffff' : isCurrentAwakened ? evoSpec.accentColor : spec.accentColor;
  ctx.beginPath();
  ctx.arc(0, -2, p.radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  const lookX = Math.cos(p.facingAngle) * 5;
  const lookY = Math.sin(p.facingAngle) * 5;
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(lookX, lookY - 2, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Draw Flying Astral Spirit Familiar Companion (Pendamping Roh Astral)
  if (p.activeFamiliar) {
    const famSpec = FAMILIAR_CATALOG[p.activeFamiliar];
    const famBob = Math.sin(p.familiarOrbitAngle * 2.5) * 3.5;
    const fx = p.familiarX;
    const fy = p.familiarY + famBob;

    // Greed Imp magnetic tether lines to nearby pickups
    if (p.activeFamiliar === 'greed_imp' && world.pickups.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.36)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      for (const item of world.pickups) {
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(item.x, item.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(fx, fy);

    // Subtle ground shadow below flying familiar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18 - famBob * 0.5, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer astral aura ring
    ctx.strokeStyle = famSpec.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
    ctx.stroke();

    if (p.activeFamiliar === 'ember_wisp') {
      // Blazing crimson-gold Ember Wisp spirit
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#09080d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.quadraticCurveTo(11, -3, 9, 6);
      ctx.arc(0, 5, 9, 0, Math.PI, false);
      ctx.quadraticCurveTo(-11, -3, 0, -13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 2, 4.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.activeFamiliar === 'aegis_cherub') {
      // Celestial winged Aegis Cherub with golden halo
      const wingFlap = Math.sin(p.familiarOrbitAngle * 5) * 2.5;
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#09080d';
      ctx.lineWidth = 1.5;
      // Left & right wings
      ctx.beginPath();
      ctx.ellipse(-10, -1 + wingFlap, 6, 3.5, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(10, -1 + wingFlap, 6, 3.5, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cherub core
      ctx.fillStyle = p.cherubShieldActive ? '#38bdf8' : '#475569';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Halo
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, -10, 6.5, 2.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Greed Imp: emerald treasure imp with golden horns
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(-10, -13);
      ctx.lineTo(-2, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -6);
      ctx.lineTo(10, -13);
      ctx.lineTo(2, -8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#09080d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-3, 0, 1.8, 0, Math.PI * 2);
      ctx.arc(3, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawLightningArcs(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  for (const arc of world.lightningArcs) {
    const alpha = Math.max(0, 1 - arc.life / arc.maxLife);
    ctx.save();
    ctx.strokeStyle = arc.color
      ? arc.color
      : `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 3;
    const midX = (arc.x1 + arc.x2) * 0.5 + (Math.random() - 0.5) * 18;
    const midY = (arc.y1 + arc.y2) * 0.5 + (Math.random() - 0.5) * 18;
    ctx.beginPath();
    ctx.moveTo(arc.x1, arc.y1);
    ctx.lineTo(midX, midY);
    ctx.lineTo(arc.x2, arc.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  for (const proj of world.projectiles) {
    ctx.save();
    ctx.translate(proj.x, proj.y);

    if (proj.kind === 'solar_crescent') {
      // [1] Solar Greatsword: Blazing crescent flame wave
      const ang = proj.angle ?? Math.atan2(proj.vy, proj.vx);
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.88)';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(-10, 0, proj.radius, -Math.PI * 0.42, Math.PI * 0.42, false);
      ctx.arc(-22, 0, proj.radius * 0.78, Math.PI * 0.36, -Math.PI * 0.36, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'astral_arrow') {
      // [2] Constellation Repeater: Star-tipped ricochet arrow
      const ang = proj.angle ?? Math.atan2(proj.vy, proj.vx);
      ctx.rotate(ang);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      ctx.strokeStyle = '#09080d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(4, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'ember_bolt') {
      // Ember Wisp Firebolt projectile
      const ang = proj.angle ?? Math.atan2(proj.vy, proj.vx);
      ctx.rotate(ang);
      ctx.fillStyle = '#fb7185';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = proj.color;
      ctx.strokeStyle = '#09080d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, pool: PooledParticle[]): void {
  for (let i = 0; i < pool.length; i++) {
    const pt = pool[i];
    if (!pt.active) continue;
    const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

function drawPausedBestiaryReticles(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  hoveredEnemy: HoveredArenaEnemyHud | null,
  timeSec: number
): void {
  if (world.phase !== 'paused') return;

  for (const e of world.enemies) {
    if (e.aiState === 'ko') continue;
    const isHovered = hoveredEnemy?.id === e.id;
    const meta = ENEMY_ARCHETYPE_CATALOG[e.archetype];
    ctx.save();
    ctx.translate(e.x, e.y);

    // Subtle scan ring on all alive monsters while paused; bright animated reticle on hovered monster
    const ringRadius = e.radius + (isHovered ? 12 + Math.sin(timeSec * 6) * 2 : 7);
    ctx.strokeStyle = isHovered ? '#fde047' : 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = isHovered ? 2.5 : 1.25;
    ctx.setLineDash(isHovered ? [6, 4] : [3, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isHovered) {
      const label = `${meta.name.toUpperCase()} · ${Math.max(0, Math.round(e.hp))}/${Math.round(e.maxHp)} HP`;
      ctx.font = '700 11px JetBrains Mono, monospace';
      const textW = ctx.measureText(label).width;
      const boxW = textW + 16;
      const boxH = 22;
      const boxY = -e.radius - 36;
      ctx.fillStyle = 'rgba(13, 11, 20, 0.94)';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-boxW * 0.5, boxY, boxW, boxH);
      ctx.strokeRect(-boxW * 0.5, boxY, boxW, boxH);

      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(label, 0, boxY + 15);
    }

    ctx.restore();
  }
}

function drawWaveBanner(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  if (world.phase !== 'playing') return;

  if (world.awakeningBannerTimer > 0 && world.lastAwakenedStance) {
    const evo = WEAPON_EVOLUTIONS[world.lastAwakenedStance];
    const alpha = Math.min(1, world.awakeningBannerTimer * 1.2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(15, 11, 28, 0.92)';
    ctx.strokeStyle = evo.accentColor;
    ctx.lineWidth = 2;
    const boxW = 470;
    const boxH = 60;
    const bx = (world.arenaWidth - boxW) * 0.5;
    const by = 148;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = evo.accentColor;
    ctx.font = '700 14px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `STANCE AWAKENED: ${evo.baseName.toUpperCase()} → ${evo.evolvedName.toUpperCase()}`,
      world.arenaWidth * 0.5,
      by + 25
    );
    ctx.fillStyle = '#f4efe6';
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.fillText(evo.evolvedRoleClue, world.arenaWidth * 0.5, by + 45);
    ctx.restore();
  }

  if (world.waveBannerTimer <= 0) return;
  const alpha = Math.min(1, world.waveBannerTimer * 1.2);
  const currentRoom = world.rooms[world.currentRoomIndex];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(9, 8, 13, 0.82)';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  const boxW = 390;
  const boxH = 54;
  const bx = (world.arenaWidth - boxW) * 0.5;
  const by = 86;
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeRect(bx, by, boxW, boxH);

  ctx.fillStyle = '#fde68a';
  ctx.font = '700 16px Cinzel, Georgia, serif';
  ctx.textAlign = 'center';
  const bannerLabel = currentRoom
    ? `STAGE ${world.stageLevel} · ROOM ${currentRoom.id + 1}/${world.rooms.length} · ${currentRoom.name.toUpperCase()}`
    : `STAGE ${world.stageLevel} · ROOM ${world.wave}/${world.totalWaves}`;
  ctx.fillText(bannerLabel, world.arenaWidth * 0.5, by + 33);
  ctx.restore();
}

function drawCriticalStrikeCallout(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  if (world.critCalloutTimer <= 0 || world.lastCritDamage <= 0) return;
  const progress = 1 - Math.min(1, world.critCalloutTimer / 0.55);
  const alpha = Math.min(1, world.critCalloutTimer * 2.4);
  const floatY = world.lastCritY - 28 - progress * 24;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(world.lastCritX, floatY);

  // Starburst flare behind critical callout
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-42, 0);
  ctx.lineTo(42, 0);
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 14);
  ctx.stroke();

  const label = `CRIT! -${world.lastCritDamage}`;
  ctx.font = '700 12px JetBrains Mono, monospace';
  const textW = ctx.measureText(label).width;
  const boxW = textW + 16;
  const boxH = 22;

  ctx.fillStyle = 'rgba(24, 13, 18, 0.94)';
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.8;
  ctx.fillRect(-boxW * 0.5, -boxH * 0.5, boxW, boxH);
  ctx.strokeRect(-boxW * 0.5, -boxH * 0.5, boxW, boxH);

  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 4);
  ctx.restore();
}

function drawScreenShakeImpactRim(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  shakeSample: ScreenShakeSample
): void {
  if (
    !shakeSample.active ||
    world.screenShakeTimer <= 0 ||
    world.lastScreenShakeReason === 'none'
  ) {
    return;
  }

  const profile = SCREEN_SHAKE_PROFILES[world.lastScreenShakeReason];
  const ratio = Math.max(
    0,
    Math.min(1, world.screenShakeTimer / Math.max(0.05, world.screenShakeDuration))
  );

  ctx.save();
  ctx.globalAlpha = ratio * 0.55;
  ctx.strokeStyle = profile.tintColor;
  ctx.lineWidth = 6 + ratio * 8;
  ctx.strokeRect(20, 20, world.arenaWidth - 40, world.arenaHeight - 40);
  ctx.restore();
}

let cachedEclipseCanvas: HTMLCanvasElement | null = null;
let cachedEclipseCtx: CanvasRenderingContext2D | null = null;

function drawTotalEclipseLighting(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  const eclipseStrength = Math.max(
    world.eclipseTransitionProgress,
    world.totalEclipseActive ? 1.0 : 0
  );
  if (eclipseStrength <= 0.02) return;

  if (typeof document !== 'undefined' && !cachedEclipseCanvas) {
    cachedEclipseCanvas = document.createElement('canvas');
    cachedEclipseCanvas.width = ARENA_WIDTH;
    cachedEclipseCanvas.height = ARENA_HEIGHT;
    cachedEclipseCtx = cachedEclipseCanvas.getContext('2d');
  }

  const isVulnerable = world.bossVulnerabilityTimer > 0.04;
  const baseDarkAlpha = (isVulnerable ? 0.58 : 0.86) * eclipseStrength;
  const lightSources = getEclipseLightSources(world);

  if (cachedEclipseCanvas && cachedEclipseCtx) {
    const mCtx = cachedEclipseCtx;
    mCtx.clearRect(0, 0, world.arenaWidth, world.arenaHeight);

    // 1. Fill arena with deep Total Eclipse umbral darkness
    mCtx.globalCompositeOperation = 'source-over';
    mCtx.fillStyle = isVulnerable
      ? `rgba(14, 7, 26, ${baseDarkAlpha.toFixed(2)})`
      : `rgba(5, 3, 12, ${baseDarkAlpha.toFixed(2)})`;
    mCtx.fillRect(0, 0, world.arenaWidth, world.arenaHeight);

    // 2. Punch smooth radial visibility cones around Player and lit/ignited Solar Braziers
    mCtx.globalCompositeOperation = 'destination-out';
    for (const src of lightSources) {
      const flicker =
        src.kind === 'player'
          ? Math.sin(timeSec * 6) * 4
          : Math.sin(timeSec * 11 + src.x) * 7;
      const outerR = Math.max(40, src.radius + flicker);
      const innerR = outerR * 0.28;
      const grad = mCtx.createRadialGradient(src.x, src.y, innerR, src.x, src.y, outerR);
      grad.addColorStop(0, `rgba(0, 0, 0, ${src.intensity})`);
      grad.addColorStop(0.65, `rgba(0, 0, 0, ${(src.intensity * 0.72).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.arc(src.x, src.y, outerR, 0, Math.PI * 2);
      mCtx.fill();
    }

    // Also punch a subtle umbral rim around the Boss so its silhouette and corona stay readable
    for (const enemy of world.enemies) {
      if (enemy.aiState === 'ko' || !isBossOrEclipseCandidate(world, enemy)) continue;
      const bossLightR = isVulnerable ? 155 : 95;
      const grad = mCtx.createRadialGradient(
        enemy.x,
        enemy.y,
        bossLightR * 0.2,
        enemy.x,
        enemy.y,
        bossLightR
      );
      grad.addColorStop(0, isVulnerable ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.62)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.arc(enemy.x, enemy.y, bossLightR, 0, Math.PI * 2);
      mCtx.fill();
    }

    mCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(cachedEclipseCanvas, 0, 0);
  }

  // 3. Draw warm Solar Brazier sanctuary beacon rings & callouts on top of the eclipse shroud
  for (const hazard of world.hazards) {
    if (hazard.kind !== 'solar_brazier') continue;
    const isIgnited = hazard.cooldown > 0 || hazard.pulseTimer > 0;
    const beaconR = isIgnited ? 250 : 165;
    ctx.save();
    ctx.translate(hazard.x, hazard.y);

    ctx.strokeStyle = isIgnited
      ? 'rgba(253, 224, 71, 0.72)'
      : 'rgba(251, 146, 60, 0.55)';
    ctx.lineWidth = isIgnited ? 2.8 : 2.0;
    ctx.setLineDash(isIgnited ? [10, 6] : [6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, beaconR, timeSec * 0.8, timeSec * 0.8 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isIgnited ? '#fde047' : '#fed7aa';
    ctx.fillText(
      isIgnited
        ? 'SOLAR SANCTUARY FLARE ACTIVE'
        : 'IGNITE BRAZIER [HIT] → PIERCE ECLIPSE & WEAKEN BOSS',
      0,
      -hazard.radius - 16
    );
    ctx.restore();
  }

  // 4. Draw Boss Total Eclipse Umbral Ward OR Solar Vulnerability Window reticle above Boss
  for (const enemy of world.enemies) {
    if (enemy.aiState === 'ko' || !isBossOrEclipseCandidate(world, enemy)) continue;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (isVulnerable) {
      // Shattered golden-crimson Vulnerability Window reticle
      const pulseR = enemy.radius + 18 + Math.sin(timeSec * 14) * 3;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, -timeSec * 3, -timeSec * 3 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const tag = `VULNERABLE! +50% DMG (${world.bossVulnerabilityTimer.toFixed(1)}s)`;
      ctx.font = 'bold 10.5px "JetBrains Mono", monospace';
      const tw = ctx.measureText(tag).width + 14;
      ctx.fillStyle = 'rgba(69, 10, 25, 0.94)';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-tw * 0.5, -enemy.radius - 52, tw, 18);
      ctx.strokeRect(-tw * 0.5, -enemy.radius - 52, tw, 18);
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(tag, 0, -enemy.radius - 39);
    } else {
      // Umbral Eclipse Ward dark lunar corona ring
      const wardR = enemy.radius + 16 + Math.sin(timeSec * 8) * 2;
      ctx.strokeStyle = '#c084fc';
      ctx.fillStyle = 'rgba(88, 28, 135, 0.24)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, wardR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const tag = 'ECLIPSE WARD (-25% DMG) · HIT SOLAR BRAZIER!';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(tag).width + 14;
      ctx.fillStyle = 'rgba(24, 10, 42, 0.94)';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-tw * 0.5, -enemy.radius - 52, tw, 18);
      ctx.strokeRect(-tw * 0.5, -enemy.radius - 52, tw, 18);
      ctx.fillStyle = '#e9d5ff';
      ctx.textAlign = 'center';
      ctx.fillText(tag, 0, -enemy.radius - 39);
    }

    ctx.restore();
  }
}

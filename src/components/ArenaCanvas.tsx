import React, { useEffect, useRef } from 'react';
import {
  ArenaWorldState,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  DoorDirection,
  DungeonRoom,
  ENEMY_ARCHETYPE_CATALOG,
  EnemyArchetype,
  FrameInput,
  GamePhase,
  getDoorWorldPosition,
  InventorySlot,
  RelicOption,
  RunSnapshot,
  SkillChoiceOption,
  SkillId,
  stepArenaWorld,
  USABLE_ITEMS,
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
}

export interface HudDiscreteState {
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
  bossHpPercent: number | null;
  bossName: string | null;
  skills: Array<{ id: SkillId; rank: number }>;
  skillChoices: SkillChoiceOption[];
  relicChoices: RelicOption[];
  defeatedByArchetype: Partial<Record<EnemyArchetype, number>>;
  activeRoomArchetypes: EnemyArchetype[];
  hoveredArenaEnemy: HoveredArenaEnemyHud | null;
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
        if (simEvents.playerDashed || simEvents.roomChanged) {
          soundEngine.playDash();
        }
        if (simEvents.playerNova) {
          soundEngine.playNova();
        }
        if (simEvents.playerLeveledUp) {
          soundEngine.playLevelUp();
        }
        if (simEvents.itemUsed) {
          soundEngine.playPickup();
        }
        if (simEvents.enemiesKilled > 0) {
          soundEngine.playHit(true);
        } else if (simEvents.enemiesHit > 0) {
          soundEngine.playHit(false);
        }
        if (simEvents.playerHurt) {
          soundEngine.playPlayerHurt();
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
      const boss = world.enemies.find((e) => e.archetype === 'archon' && e.aiState !== 'ko');
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

      const hudHash = `${world.stageLevel}|${Math.round(p.hp)}|${p.maxHp}|${quantizedEssence}|${p.maxEssence}|${p.level}|${Math.round(p.xp)}|${p.xpToNextLevel}|${p.coins}|${invSig}|${world.currentRoomIndex}|${roomsSig}|${world.wave}|${Math.round(world.score)}|${Math.round(world.bestScore)}|${world.comboCount}|${p.stance}|${bossHpPct}|${skillsSig}|${world.skillChoices.length}|${world.relicChoices.length}|${defeatedSig}|${activeArchSig}|${hoverSig}`;
      if (hudHash !== lastHudHash) {
        lastHudHash = hudHash;
        callbacksRef.current.onSyncHud({
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
          bossHpPercent: bossHpPct,
          bossName: boss ? 'Archon of the Corona' : null,
          skills: learnedSkills,
          skillChoices: world.skillChoices,
          relicChoices: world.relicChoices,
          defeatedByArchetype: { ...world.defeatedByArchetype },
          activeRoomArchetypes,
          hoveredArenaEnemy,
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

      // Camera Pan on Title Screen vs Gameplay Trauma Shake
      if (world.phase === 'title') {
        titlePanTime += clampedDt;
        cameraOffsetX = Math.sin(titlePanTime * 0.45) * 32;
        cameraOffsetY = 64 + Math.cos(titlePanTime * 0.32) * 16;
      } else {
        cameraOffsetX *= Math.pow(0.01, clampedDt);
        cameraOffsetY *= Math.pow(0.01, clampedDt);
        const shakeMag = world.cameraTrauma * world.cameraTrauma * 16;
        cameraOffsetX += (Math.random() * 2 - 1) * shakeMag;
        cameraOffsetY += (Math.random() * 2 - 1) * shakeMag;
      }

      ctx.translate(
        renderOffsetX + cameraOffsetX * renderScale,
        renderOffsetY + cameraOffsetY * renderScale
      );
      ctx.scale(renderScale, renderScale);

      drawArenaFloorAndPillars(ctx, world, now / 1000);
      drawEmberZones(ctx, world, now / 1000);
      drawPickups(ctx, world, now / 1000);
      drawEnemyTelegraphs(ctx, world);
      drawEnemies(ctx, world, now / 1000);
      drawPausedBestiaryReticles(ctx, world, hoveredArenaEnemy, now / 1000);
      drawPlayerAndAttack(ctx, world);
      drawLightningArcs(ctx, world);
      drawProjectiles(ctx, world);
      drawParticles(ctx, particlePool);
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

function drawEmberZones(
  ctx: CanvasRenderingContext2D,
  world: ArenaWorldState,
  timeSec: number
): void {
  for (const zone of world.emberZones) {
    const alpha = Math.min(1, zone.life / Math.max(0.2, zone.maxLife * 0.4));
    ctx.save();
    ctx.translate(zone.x, zone.y);
    ctx.fillStyle = `rgba(244, 63, 94, ${(0.22 * alpha).toFixed(2)})`;
    ctx.strokeStyle = `rgba(251, 191, 36, ${(0.65 * alpha).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, zone.radius + Math.sin(timeSec * 9 + zone.id) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
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

    if (enemy.aiState !== 'ko' && enemy.archetype !== 'archon' && enemy.hp < enemy.maxHp) {
      const barW = 32;
      const pct = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = '#09080d';
      ctx.fillRect(-barW * 0.5 - 1, -enemy.radius - 13, barW + 2, 6);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-barW * 0.5, -enemy.radius - 12, barW * pct, 4);
    }

    ctx.restore();
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
  if (p.attackPhase === 'windup' || p.attackPhase === 'active') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.attackAngle);

    if (p.attackPhase === 'windup') {
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, effectiveRange * 0.75, -spec.arcRadians * 0.5, spec.arcRadians * 0.5);
      ctx.stroke();
    } else if (p.stance !== 'astral_bow') {
      ctx.fillStyle =
        p.stance === 'dawnblade'
          ? 'rgba(245, 158, 11, 0.38)'
          : 'rgba(192, 132, 252, 0.42)';
      ctx.strokeStyle = spec.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, effectiveRange, -spec.arcRadians * 0.5, spec.arcRadians * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
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

  // Dash afterimage halo
  if (p.dashTimer > 0) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, p.radius - 1, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  const flash = p.hitFlashTimer > 0;
  ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
  ctx.strokeStyle = '#09080d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = flash ? '#ffffff' : spec.accentColor;
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
}

function drawLightningArcs(ctx: CanvasRenderingContext2D, world: ArenaWorldState): void {
  for (const arc of world.lightningArcs) {
    const alpha = Math.max(0, 1 - arc.life / arc.maxLife);
    ctx.save();
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
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
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#09080d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
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
  if (world.phase !== 'playing' || world.waveBannerTimer <= 0) return;
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

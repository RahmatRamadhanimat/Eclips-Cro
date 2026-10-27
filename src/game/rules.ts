export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';
export type OutcomeType = 'none' | 'victory' | 'defeat';

export type WeaponStanceId = 'dawnblade' | 'astral_bow' | 'chrono_scythe';

export interface WeaponStanceSpec {
  id: WeaponStanceId;
  keyBinding: '1' | '2' | '3';
  name: string;
  roleClue: string;
  essenceCost: number;
  windupDuration: number;
  activeDuration: number;
  recoveryDuration: number;
  damage: number;
  range: number;
  arcRadians: number;
  knockback: number;
  hitstop: number;
  accentColor: string;
}

export const WEAPON_STANCES: Record<WeaponStanceId, WeaponStanceSpec> = {
  dawnblade: {
    id: 'dawnblade',
    keyBinding: '1',
    name: 'Dawnblade',
    roleClue: 'Sweeping Melee · Restores Essence',
    essenceCost: 0,
    windupDuration: 0.07,
    activeDuration: 0.11,
    recoveryDuration: 0.1,
    damage: 28,
    range: 86,
    arcRadians: Math.PI * 0.85,
    knockback: 220,
    hitstop: 0.04,
    accentColor: '#f59e0b',
  },
  astral_bow: {
    id: 'astral_bow',
    keyBinding: '2',
    name: 'Astral Bow',
    roleClue: 'Piercing Volley · Long Range',
    essenceCost: 14,
    windupDuration: 0.09,
    activeDuration: 0.08,
    recoveryDuration: 0.12,
    damage: 24,
    range: 460,
    arcRadians: 0.28,
    knockback: 140,
    hitstop: 0.03,
    accentColor: '#38bdf8',
  },
  chrono_scythe: {
    id: 'chrono_scythe',
    keyBinding: '3',
    name: 'Chrono Scythe',
    roleClue: 'Heavy Reap · High Knockback',
    essenceCost: 22,
    windupDuration: 0.14,
    activeDuration: 0.14,
    recoveryDuration: 0.16,
    damage: 52,
    range: 112,
    arcRadians: Math.PI * 1.35,
    knockback: 340,
    hitstop: 0.065,
    accentColor: '#c084fc',
  },
};

export type SkillId =
  | 'solar_orbit'
  | 'chain_arc'
  | 'blaze_trail'
  | 'phantom_echo'
  | 'supernova_surge'
  | 'dawn_aegis';

export interface SkillSpec {
  id: SkillId;
  name: string;
  categoryTag: string;
  accentColor: string;
  maxRank: number;
  getDescription: (nextRank: number) => string;
}

export interface SkillChoiceOption {
  id: SkillId;
  name: string;
  categoryTag: string;
  accentColor: string;
  currentRank: number;
  nextRank: number;
  maxRank: number;
  description: string;
}

export const SKILL_CATALOG: SkillSpec[] = [
  {
    id: 'solar_orbit',
    name: 'Orbiting Solar Blades',
    categoryTag: 'AUTONOMOUS ORBIT',
    accentColor: '#f59e0b',
    maxRank: 3,
    getDescription: (nextRank) =>
      `Summon ${nextRank + 1} rotating sun-blades around you that slice enemies on contact for ${16 + nextRank * 8} damage.`,
  },
  {
    id: 'chain_arc',
    name: 'Astral Chain Lightning',
    categoryTag: 'ARC DISCHARGE',
    accentColor: '#38bdf8',
    maxRank: 3,
    getDescription: (nextRank) =>
      `Weapon hits unleash a lightning bolt that leaps to ${nextRank} nearby target${nextRank > 1 ? 's' : ''} for ${14 + nextRank * 8} shock damage.`,
  },
  {
    id: 'blaze_trail',
    name: 'Ignis Dash Trail',
    categoryTag: 'DASH HAZARD',
    accentColor: '#fb7185',
    maxRank: 3,
    getDescription: (nextRank) =>
      `Dashing leaves scorching solar embers for ${(2.0 + nextRank * 0.5).toFixed(1)}s that burn enemies for ${16 + nextRank * 7} damage.`,
  },
  {
    id: 'phantom_echo',
    name: 'Phantom Strike Echo',
    categoryTag: 'WEAPON MASTERY',
    accentColor: '#c084fc',
    maxRank: 3,
    getDescription: (nextRank) =>
      `+${nextRank * 18}% melee cleave reach & +${nextRank * 10} bonus strike damage; Astral Bow fires +${nextRank * 2} extra arrows.`,
  },
  {
    id: 'supernova_surge',
    name: 'Eclipse Supernova',
    categoryTag: 'NOVA OVERDRIVE',
    accentColor: '#fbbf24',
    maxRank: 3,
    getDescription: (nextRank) =>
      `[E] Solar Nova radius +${nextRank * 32}px, cooldown -${nextRank * 18}%, and refunds 12 Essence on multi-hit.`,
  },
  {
    id: 'dawn_aegis',
    name: 'Dawn Aegis Ward',
    categoryTag: 'SOLAR BARRIER',
    accentColor: '#10b981',
    maxRank: 3,
    getDescription: (nextRank) =>
      `Forms a sacred barrier every ${(8.5 - nextRank * 1.5).toFixed(1)}s that negates 1 incoming attack and blasts nearby foes.`,
  },
];

// ============================================================================
// USABLE ROGUELIKE ITEMS & COINS SYSTEM
// ============================================================================
export type UsableItemId =
  | 'crimson_elixir'
  | 'astral_tonic'
  | 'chrono_hourglass'
  | 'sunfire_bomb';

export interface UsableItemSpec {
  id: UsableItemId;
  name: string;
  shortLabel: string;
  effectClue: string;
  coinCost: number;
  accentColor: string;
}

export const USABLE_ITEMS: Record<UsableItemId, UsableItemSpec> = {
  crimson_elixir: {
    id: 'crimson_elixir',
    name: 'Crimson Elixir',
    shortLabel: 'Elixir',
    effectClue: 'Restore +40 HP',
    coinCost: 25,
    accentColor: '#f43f5e',
  },
  astral_tonic: {
    id: 'astral_tonic',
    name: 'Astral Tonic',
    shortLabel: 'Tonic',
    effectClue: '+60 ESS & Reset Cooldowns',
    coinCost: 25,
    accentColor: '#38bdf8',
  },
  chrono_hourglass: {
    id: 'chrono_hourglass',
    name: 'Chrono Hourglass',
    shortLabel: 'Hourglass',
    effectClue: 'Freeze/Slow Foes 4s',
    coinCost: 35,
    accentColor: '#c084fc',
  },
  sunfire_bomb: {
    id: 'sunfire_bomb',
    name: 'Sunfire Bomb',
    shortLabel: 'Sun Bomb',
    effectClue: '90 AoE Blast + Clear Orbs',
    coinCost: 40,
    accentColor: '#f59e0b',
  },
};

export const USABLE_ITEM_KEYS: UsableItemId[] = [
  'crimson_elixir',
  'astral_tonic',
  'chrono_hourglass',
  'sunfire_bomb',
];

export interface InventorySlot {
  itemId: UsableItemId;
  count: number;
}

// ============================================================================
// 10 STAGE LEVELS & MULTI-ROOM DUNGEON MAP SYSTEM
// ============================================================================
export const MAX_STAGE_LEVEL = 10;

export interface StageLevelSpec {
  stage: number;
  name: string;
  subtitle: string;
  roomCount: number;
  floorTint: string;
  borderTint: string;
}

export const STAGE_CATALOG: StageLevelSpec[] = [
  { stage: 1, name: 'Outer Courtyard', subtitle: '4 Sanctum Rooms · Stalker & Wraith Patrol', roomCount: 4, floorTint: '#12101b', borderTint: '#3b2d4a' },
  { stage: 2, name: 'Hall of Dusk', subtitle: '5 Sanctum Rooms · Frost Revenant & Pyromancer', roomCount: 5, floorTint: '#141122', borderTint: '#433259' },
  { stage: 3, name: 'Obsidian Cloister', subtitle: '5 Sanctum Rooms · Juggernaut & Sentinel', roomCount: 5, floorTint: '#16111e', borderTint: '#4c345c' },
  { stage: 4, name: 'Sunken Reliquary', subtitle: '6 Sanctum Rooms · Void Singularity & Necro Coven', roomCount: 6, floorTint: '#101522', borderTint: '#2e4466' },
  { stage: 5, name: 'Astral Nave', subtitle: '6 Sanctum Rooms · Solar Zealot Vanguard', roomCount: 6, floorTint: '#131626', borderTint: '#384c78' },
  { stage: 6, name: 'Ashen Catacombs', subtitle: '7 Sanctum Rooms · Eclipse Inquisitor Order', roomCount: 7, floorTint: '#1b1118', borderTint: '#5e2b3f' },
  { stage: 7, name: 'Mirror Spire', subtitle: '8 Sanctum Rooms · Phantom Convergence', roomCount: 8, floorTint: '#151226', borderTint: '#513b78' },
  { stage: 8, name: 'Corona Forge', subtitle: '8 Sanctum Rooms · Molten Siege Phalanx', roomCount: 8, floorTint: '#1c1410', borderTint: '#6e4526' },
  { stage: 9, name: 'Abyssal Threshold', subtitle: '9 Sanctum Rooms · Grand Inquisitor Conclave', roomCount: 9, floorTint: '#120e1e', borderTint: '#582c82' },
  { stage: 10, name: 'Throne of Eclipse', subtitle: '10 Sanctum Rooms · Sovereign Apex', roomCount: 10, floorTint: '#1a0d18', borderTint: '#7a284b' },
];

export type DoorDirection = 'N' | 'S' | 'E' | 'W';
export type RoomKind = 'entrance' | 'combat' | 'shrine' | 'boss';
export type RoomFormationType =
  | 'vanguard_patrol'
  | 'crossfire_battery'
  | 'shadow_ambush'
  | 'siege_phalanx'
  | 'arcane_convergence'
  | 'inquisitor_sanctum'
  | 'sovereign_throne';

export interface RoomDoor {
  dir: DoorDirection;
  targetRoomId: number;
}

export interface ObstaclePillar {
  x: number;
  y: number;
  radius: number;
}

export interface DungeonRoom {
  id: number;
  name: string;
  kind: RoomKind;
  formation?: RoomFormationType;
  difficultyRating?: number;
  gridX: number;
  gridY: number;
  cleared: boolean;
  visited: boolean;
  doors: RoomDoor[];
  roster: EnemyArchetype[];
  pillars: ObstaclePillar[];
}

export type EnemyArchetype =
  | 'stalker'
  | 'wraith'
  | 'arcanist'
  | 'frost_revenant'
  | 'pyromancer'
  | 'sentinel'
  | 'juggernaut'
  | 'necro_weaver'
  | 'void_singularity'
  | 'solar_zealot'
  | 'eclipse_inquisitor'
  | 'archon';
export type EnemyAIState = 'move' | 'windup' | 'active' | 'recovery' | 'ko';

export interface EnemyArchetypeMetadata {
  id: EnemyArchetype;
  name: string;
  minStage: number;
  role: 'skirmisher' | 'assassin' | 'artillery' | 'controller' | 'juggernaut' | 'summoner' | 'elite' | 'boss';
  movementPattern: string;
  attackPattern: string;
}

export const ENEMY_ARCHETYPE_CATALOG: Record<EnemyArchetype, EnemyArchetypeMetadata> = {
  stalker: {
    id: 'stalker',
    name: 'Void Stalker',
    minStage: 1,
    role: 'skirmisher',
    movementPattern: 'Curved flank pursuit',
    attackPattern: 'Short-range crimson lunge',
  },
  wraith: {
    id: 'wraith',
    name: 'Blink Wraith',
    minStage: 1,
    role: 'assassin',
    movementPattern: 'Diagonal sinusoidal weave',
    attackPattern: 'High-velocity phantom blink-slash',
  },
  arcanist: {
    id: 'arcanist',
    name: 'Rift Arcanist',
    minStage: 1,
    role: 'artillery',
    movementPattern: 'Standoff kiting & lateral strafe',
    attackPattern: 'Stage-scaled rift orb volley',
  },
  frost_revenant: {
    id: 'frost_revenant',
    name: 'Frost Revenant',
    minStage: 2,
    role: 'controller',
    movementPattern: 'Figure-eight glacial glide',
    attackPattern: 'Piercing cryo-lance + crescent ice fan',
  },
  pyromancer: {
    id: 'pyromancer',
    name: 'Cinder Pyromancer',
    minStage: 2,
    role: 'artillery',
    movementPattern: 'Mid-range thermal orbit',
    attackPattern: 'Spreading magma mortar fan',
  },
  sentinel: {
    id: 'sentinel',
    name: 'Solaris Sentinel',
    minStage: 3,
    role: 'controller',
    movementPattern: 'Relentless armored advance',
    attackPattern: 'Rotating 4-way / 8-way cardinal laser pulse',
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'Obsidian Juggernaut',
    minStage: 3,
    role: 'juggernaut',
    movementPattern: 'Heavy unstoppable march',
    attackPattern: 'Long-distance bull charge + shockwave',
  },
  necro_weaver: {
    id: 'necro_weaver',
    name: 'Necro Weaver',
    minStage: 4,
    role: 'summoner',
    movementPattern: 'Wide ritual circle orbit',
    attackPattern: 'Tri-bolt curse fan + shadow minion summon',
  },
  void_singularity: {
    id: 'void_singularity',
    name: 'Void Singularity',
    minStage: 4,
    role: 'controller',
    movementPattern: 'Harmonic anchor drift + gravity well',
    attackPattern: 'Gravitational pull windup + spiral orb burst',
  },
  solar_zealot: {
    id: 'solar_zealot',
    name: 'Solar Zealot',
    minStage: 5,
    role: 'assassin',
    movementPattern: 'Frenzied zig-zag rush (enrages below 60% HP)',
    attackPattern: 'Cleaving dash + twin lateral solar chakrams',
  },
  eclipse_inquisitor: {
    id: 'eclipse_inquisitor',
    name: 'Eclipse Inquisitor',
    minStage: 6,
    role: 'elite',
    movementPattern: 'Tactical shadow-step teleportation',
    attackPattern: '8-way judgment star + aimed triple lance burst',
  },
  archon: {
    id: 'archon',
    name: 'Archon of the Corona',
    minStage: 1,
    role: 'boss',
    movementPattern: 'Sanctum center orbital command',
    attackPattern: 'Multi-phase radial corona barrage + targeted annihilation blast',
  },
};

export interface EnemyEntity {
  id: number;
  archetype: EnemyArchetype;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  aiState: EnemyAIState;
  stateTimer: number;
  stateDuration: number;
  aimAngle: number;
  targetX: number;
  targetY: number;
  hitFlashTimer: number;
  hasAttackToken: boolean;
  scaleX: number;
  scaleY: number;
  walkDistance: number;
  flankSign: number;
  phase: number;
  scoreValue: number;
  xpValue: number;
}

export interface ProjectileEntity {
  id: number;
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  pierceLeft: number;
  hitEnemyIds: number[];
}

export type PickupKind = 'gold_coin' | 'solar_heart' | 'astral_shard' | 'usable_item';

export interface PickupEntity {
  id: number;
  kind: PickupKind;
  itemId?: UsableItemId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  value: number;
}

export interface EmberZoneEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
  tickTimer: number;
}

export interface LightningArcVisual {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
}

export interface RelicOption {
  id: string;
  name: string;
  description: string;
  statTag: string;
}

export const RELIC_CATALOG: RelicOption[] = [
  {
    id: 'solar_vessel',
    name: 'Solar Heart Vessel',
    description: '+20 Max Vitality and immediately mend 30 Vitality.',
    statTag: '+20 MAX HP · HEAL 30',
  },
  {
    id: 'corona_edge',
    name: 'Corona Tempered Edge',
    description: '+25% Weapon & Nova damage across all three stances.',
    statTag: '+25% ATTACK DAMAGE',
  },
  {
    id: 'quicksilver_step',
    name: 'Quicksilver Step',
    description: '+18% Movement speed and -25% Dash cooldown.',
    statTag: '+18% SPEED · FAST DASH',
  },
  {
    id: 'astral_conduit',
    name: 'Astral Wellspring',
    description: '+40% Essence regeneration rate and +25 Max Essence.',
    statTag: '+40% ESSENCE REGEN',
  },
  {
    id: 'siphon_sigil',
    name: 'Umbral Siphon Sigil',
    description: 'Defeating enemies restores 4 Vitality and 8 Essence.',
    statTag: '+4 HP & +8 ESSENCE ON KILL',
  },
];

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  ghostHp: number;
  essence: number;
  maxEssence: number;
  essenceRegen: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  inventory: InventorySlot[];
  skills: Partial<Record<SkillId, number>>;
  orbitAngle: number;
  orbitHitCooldowns: Record<number, number>;
  aegisActive: boolean;
  aegisTimer: number;
  speed: number;
  damageMultiplier: number;
  vampiricHeal: number;
  facingAngle: number;
  stance: WeaponStanceId;
  attackPhase: 'idle' | 'windup' | 'active' | 'recovery';
  attackTimer: number;
  attackDuration: number;
  attackAngle: number;
  attackHitIds: number[];
  comboStep: number;
  dashTimer: number;
  dashCooldown: number;
  dashCooldownMax: number;
  dashDirX: number;
  dashDirY: number;
  novaCooldown: number;
  novaCooldownMax: number;
  invulnTimer: number;
  hitFlashTimer: number;
  scaleX: number;
  scaleY: number;
  walkDistance: number;
  bufferedAction: 'none' | 'attack' | 'dash' | 'nova';
  bufferTimer: number;
}

export interface RunSnapshot {
  outcome: OutcomeType;
  stageLevel: number;
  score: number;
  bestScore: number;
  roomsCleared: number;
  totalRooms: number;
  waveReached: number;
  totalWaves: number;
  levelReached: number;
  coinsCollected: number;
  clearTimeSeconds: number;
  enemiesDefeated: number;
  damageTaken: number;
  bossHpRemainingPercent: number;
  relicsCollected: string[];
  skillsLearned: Array<{ id: SkillId; rank: number }>;
}

export interface ArenaWorldState {
  phase: GamePhase;
  outcome: OutcomeType;
  stageLevel: number;
  rooms: DungeonRoom[];
  currentRoomIndex: number;
  roomTransitionCooldown: number;
  enemyFreezeTimer: number;
  arenaWidth: number;
  arenaHeight: number;
  pillars: ObstaclePillar[];
  player: PlayerState;
  enemies: EnemyEntity[];
  projectiles: ProjectileEntity[];
  pickups: PickupEntity[];
  emberZones: EmberZoneEntity[];
  lightningArcs: LightningArcVisual[];
  nextEntityId: number;
  wave: number;
  totalWaves: number;
  waveBannerTimer: number;
  levelUpBannerTimer: number;
  enemiesRemainingToSpawn: EnemyArchetype[];
  spawnTimer: number;
  activeAttackTokens: number;
  maxAttackTokens: number;
  score: number;
  bestScore: number;
  comboCount: number;
  comboTimer: number;
  elapsedSeconds: number;
  enemiesDefeated: number;
  damageTaken: number;
  hitstopTimer: number;
  cameraTrauma: number;
  novaPulseTimer: number;
  novaPulseX: number;
  novaPulseY: number;
  defeatDelayTimer: number;
  pendingLevelUps: number;
  skillChoices: SkillChoiceOption[];
  relicChoices: RelicOption[];
  collectedRelics: string[];
  snapshot: RunSnapshot | null;
}

export interface FrameInput {
  moveX: number;
  moveY: number;
  aimWorldX: number;
  aimWorldY: number;
  attackHeld: boolean;
  attackJustPressed: boolean;
  dashJustPressed: boolean;
  novaJustPressed: boolean;
  stanceSelect: WeaponStanceId | null;
  useItemSlot?: number | null;
}

export interface SimulationEvents {
  playerSwung: WeaponStanceId | null;
  playerDashed: boolean;
  playerNova: boolean;
  playerLeveledUp: boolean;
  itemUsed: UsableItemId | null;
  roomChanged: boolean;
  enemiesHit: number;
  enemiesKilled: number;
  playerHurt: boolean;
  pickupCollected: boolean;
  coinCollected: boolean;
  telegraphStarted: boolean;
  waveCleared: boolean;
  bossSpawned: boolean;
  outcomeTriggered: OutcomeType;
  particlesToSpawn: Array<{
    x: number;
    y: number;
    color: string;
    count: number;
    speed: number;
    size: number;
  }>;
}

export const ARENA_WIDTH = 1200;
export const ARENA_HEIGHT = 760;
export const TOTAL_WAVES = 5;
export const MAX_CONCURRENT_ATTACKERS = 3;

export function clampDt(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt < 0) return 0;
  return Math.min(rawDt, 0.05);
}

export function calculateXpForLevel(level: number): number {
  return Math.round(60 * Math.pow(1.35, Math.max(0, level - 1)));
}

export function getHealthPipStates(
  hp: number,
  maxHp: number,
  totalPips = 5
): Array<'full' | 'cracked' | 'empty'> {
  const safeMax = Math.max(1, maxHp);
  const clampedHp = Math.max(0, Math.min(safeMax, hp));
  const hpPerPip = safeMax / totalPips;
  const states: Array<'full' | 'cracked' | 'empty'> = [];

  for (let i = 0; i < totalPips; i++) {
    const pipFloor = i * hpPerPip;
    const pipMid = pipFloor + hpPerPip * 0.45;
    if (clampedHp >= pipFloor + hpPerPip * 0.9) {
      states.push('full');
    } else if (clampedHp >= pipMid || (clampedHp > 0 && i === 0)) {
      states.push('cracked');
    } else {
      states.push('empty');
    }
  }
  return states;
}

export function createRoomPillars(roomIndex: number, stageLevel = 1): ObstaclePillar[] {
  const variant = (roomIndex + Math.floor(stageLevel / 2)) % 5;
  if (variant === 0) {
    return [
      { x: 340, y: 230, radius: 34 },
      { x: 860, y: 230, radius: 34 },
      { x: 340, y: 530, radius: 34 },
      { x: 860, y: 530, radius: 34 },
    ];
  }
  if (variant === 1) {
    return [
      { x: 420, y: 380, radius: 36 },
      { x: 780, y: 380, radius: 36 },
      { x: 600, y: 210, radius: 30 },
      { x: 600, y: 550, radius: 30 },
    ];
  }
  if (variant === 2) {
    return [
      { x: 310, y: 260, radius: 32 },
      { x: 890, y: 260, radius: 32 },
      { x: 310, y: 500, radius: 32 },
      { x: 890, y: 500, radius: 32 },
    ];
  }
  if (variant === 3) {
    return [
      { x: 280, y: 380, radius: 32 },
      { x: 920, y: 380, radius: 32 },
      { x: 490, y: 240, radius: 28 },
      { x: 710, y: 240, radius: 28 },
      { x: 490, y: 520, radius: 28 },
      { x: 710, y: 520, radius: 28 },
    ];
  }
  return [
    { x: 360, y: 220, radius: 30 },
    { x: 840, y: 220, radius: 30 },
    { x: 600, y: 380, radius: 38 },
    { x: 360, y: 540, radius: 30 },
    { x: 840, y: 540, radius: 30 },
  ];
}

export function createDefaultPillars(): ObstaclePillar[] {
  return createRoomPillars(0, 1);
}

export interface StageDifficultyProfile {
  stageLevel: number;
  roomIndex: number;
  totalRooms: number;
  difficultyRating: number;
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  cooldownMultiplier: number;
  projectileSpeedMultiplier: number;
  maxConcurrentAttackers: number;
  enemyCount: number;
  unlockedArchetypes: EnemyArchetype[];
}

export function getStageDifficultyProfile(
  stageLevel: number,
  roomIdx = 0,
  totalRooms = 4
): StageDifficultyProfile {
  const clampedStage = Math.max(1, Math.min(MAX_STAGE_LEVEL, stageLevel));
  const safeTotal = Math.max(1, totalRooms);
  const clampedRoom = Math.max(0, Math.min(safeTotal - 1, roomIdx));
  const roomDepthRatio = safeTotal > 1 ? clampedRoom / (safeTotal - 1) : 0;

  const hpMultiplier = Number(
    (1 + (clampedStage - 1) * 0.22 + roomDepthRatio * 0.18).toFixed(2)
  );
  const damageMultiplier = Number(
    (1 + (clampedStage - 1) * 0.15 + roomDepthRatio * 0.1).toFixed(2)
  );
  const speedMultiplier = Number(
    (1 + (clampedStage - 1) * 0.045 + roomDepthRatio * 0.03).toFixed(3)
  );
  const cooldownMultiplier = Number(
    Math.max(0.55, 1 - (clampedStage - 1) * 0.04 - roomDepthRatio * 0.05).toFixed(2)
  );
  const projectileSpeedMultiplier = Number(
    (1 + (clampedStage - 1) * 0.042 + roomDepthRatio * 0.04).toFixed(2)
  );
  const maxConcurrentAttackers = Math.min(
    6,
    2 + Math.floor((clampedStage + 1) / 2) + (roomDepthRatio >= 0.7 ? 1 : 0)
  );

  const baseCount =
    4 + Math.floor(clampedStage * 0.85) + Math.floor(clampedRoom * 0.9);
  const enemyCount = Math.min(15, Math.max(4, baseCount));

  // Unlock archetypes progressively by stageLevel and deep room exploration
  const effectiveTier = clampedStage + Math.floor(clampedRoom / 3);
  const unlockedArchetypes: EnemyArchetype[] = ['stalker', 'wraith', 'arcanist'];
  if (effectiveTier >= 2) {
    unlockedArchetypes.push('frost_revenant', 'pyromancer');
  }
  if (effectiveTier >= 3) {
    unlockedArchetypes.push('sentinel', 'juggernaut');
  }
  if (effectiveTier >= 4) {
    unlockedArchetypes.push('necro_weaver', 'void_singularity');
  }
  if (effectiveTier >= 5) {
    unlockedArchetypes.push('solar_zealot');
  }
  if (effectiveTier >= 6) {
    unlockedArchetypes.push('eclipse_inquisitor');
  }

  const difficultyRating = Number(
    (clampedStage * 1.2 + clampedRoom * 0.45).toFixed(1)
  );

  return {
    stageLevel: clampedStage,
    roomIndex: clampedRoom,
    totalRooms: safeTotal,
    difficultyRating,
    hpMultiplier,
    damageMultiplier,
    speedMultiplier,
    cooldownMultiplier,
    projectileSpeedMultiplier,
    maxConcurrentAttackers,
    enemyCount,
    unlockedArchetypes,
  };
}

export function selectRoomFormation(
  stageLevel: number,
  roomIdx: number,
  totalRooms: number
): RoomFormationType {
  if (roomIdx === totalRooms - 1) return 'sovereign_throne';
  if (roomIdx === 0) return 'vanguard_patrol';
  if (roomIdx === totalRooms - 2) {
    return stageLevel >= 6 ? 'inquisitor_sanctum' : 'arcane_convergence';
  }
  const formations: RoomFormationType[] = [
    'crossfire_battery',
    'shadow_ambush',
    'siege_phalanx',
    'arcane_convergence',
  ];
  if (stageLevel >= 6) {
    formations.push('inquisitor_sanctum');
  }
  return formations[(stageLevel * 3 + roomIdx * 2) % formations.length];
}

export function buildRoomRoster(
  stageLevel: number,
  roomIdx: number,
  totalRooms: number
): EnemyArchetype[] {
  const profile = getStageDifficultyProfile(stageLevel, roomIdx, totalRooms);
  const unlocked = profile.unlockedArchetypes;
  const formation = selectRoomFormation(stageLevel, roomIdx, totalRooms);

  const pickUnlocked = (preferred: EnemyArchetype[], fallbackSeed: number): EnemyArchetype => {
    const valid = preferred.filter((a) => unlocked.includes(a));
    const pool = valid.length > 0 ? valid : unlocked;
    return pool[fallbackSeed % pool.length];
  };

  if (formation === 'sovereign_throne') {
    const extraCount = Math.min(8, 3 + Math.floor(stageLevel * 0.6));
    const honorGuardPool: EnemyArchetype[] = [
      'wraith',
      'frost_revenant',
      'pyromancer',
      'sentinel',
      'void_singularity',
      'solar_zealot',
      'eclipse_inquisitor',
    ];
    const extras: EnemyArchetype[] = [];
    for (let i = 0; i < extraCount; i++) {
      extras.push(pickUnlocked(honorGuardPool, stageLevel * 3 + i * 2));
    }
    return ['archon', ...extras];
  }

  const count = profile.enemyCount;
  const roster: EnemyArchetype[] = [];

  for (let i = 0; i < count; i++) {
    const seed = stageLevel * 7 + roomIdx * 5 + i * 3;
    if (formation === 'vanguard_patrol') {
      const pool: EnemyArchetype[] =
        i % 3 === 0
          ? ['arcanist', 'frost_revenant', 'pyromancer']
          : ['stalker', 'wraith', 'solar_zealot'];
      roster.push(pickUnlocked(pool, seed));
    } else if (formation === 'crossfire_battery') {
      const pool: EnemyArchetype[] =
        i % 3 === 0
          ? ['stalker', 'sentinel', 'juggernaut']
          : ['arcanist', 'frost_revenant', 'pyromancer', 'void_singularity'];
      roster.push(pickUnlocked(pool, seed));
    } else if (formation === 'shadow_ambush') {
      const pool: EnemyArchetype[] =
        i % 4 === 0
          ? ['void_singularity', 'necro_weaver', 'frost_revenant']
          : ['wraith', 'solar_zealot', 'stalker', 'eclipse_inquisitor'];
      roster.push(pickUnlocked(pool, seed));
    } else if (formation === 'siege_phalanx') {
      const pool: EnemyArchetype[] =
        i % 2 === 0
          ? ['juggernaut', 'sentinel', 'eclipse_inquisitor']
          : ['pyromancer', 'necro_weaver', 'frost_revenant', 'arcanist'];
      roster.push(pickUnlocked(pool, seed));
    } else if (formation === 'inquisitor_sanctum') {
      const pool: EnemyArchetype[] =
        i === 0
          ? ['eclipse_inquisitor']
          : i % 2 === 0
          ? ['solar_zealot', 'void_singularity', 'sentinel']
          : ['necro_weaver', 'frost_revenant', 'pyromancer', 'wraith'];
      roster.push(pickUnlocked(pool, seed));
    } else {
      // arcane_convergence
      const pool: EnemyArchetype[] =
        i % 2 === 0
          ? ['necro_weaver', 'void_singularity', 'pyromancer', 'frost_revenant']
          : ['sentinel', 'wraith', 'solar_zealot', 'arcanist'];
      roster.push(pickUnlocked(pool, seed));
    }
  }

  return roster;
}

export function buildWaveRoster(wave: number): EnemyArchetype[] {
  return buildRoomRoster(wave, wave - 1, TOTAL_WAVES);
}

export function generateDungeonMap(stageLevel: number): DungeonRoom[] {
  const clampedStage = Math.max(1, Math.min(MAX_STAGE_LEVEL, stageLevel));
  const stageSpec = STAGE_CATALOG[clampedStage - 1] ?? STAGE_CATALOG[0];
  const totalRooms = Math.max(4, stageSpec.roomCount);

  // Layout coordinates on a 2D dungeon grid up to 10 rooms so rooms connect via E / N / W / S doors
  const gridCoords: Array<{ x: number; y: number; name: string }> = [
    { x: 0, y: 0, name: 'Sanctum Entrance' },
    { x: 1, y: 0, name: 'Umbral Gallery' },
    { x: 1, y: -1, name: 'Astral Vault' },
    { x: 2, y: -1, name: 'Crimson Hall' },
    { x: 2, y: -2, name: 'Obsidian Nave' },
    { x: 3, y: -2, name: 'Cinder Reliquary' },
    { x: 3, y: -1, name: 'Phantom Cloister' },
    { x: 4, y: -1, name: 'Necro Catacomb' },
    { x: 4, y: -2, name: 'Sentinel Bastion' },
    { x: 5, y: -2, name: 'Corona Altar' },
  ];

  const rooms: DungeonRoom[] = [];
  for (let i = 0; i < totalRooms; i++) {
    const isBoss = i === totalRooms - 1;
    const coord = gridCoords[i] ?? { x: i, y: 0, name: `Chamber ${i + 1}` };
    const kind: RoomKind =
      i === 0 ? 'entrance' : isBoss ? 'boss' : i === totalRooms - 2 ? 'shrine' : 'combat';
    const formation = selectRoomFormation(clampedStage, i, totalRooms);
    const diffProfile = getStageDifficultyProfile(clampedStage, i, totalRooms);
    rooms.push({
      id: i,
      name: isBoss ? 'Sovereign Boss Chamber' : coord.name,
      kind,
      formation,
      difficultyRating: diffProfile.difficultyRating,
      gridX: coord.x,
      gridY: coord.y,
      cleared: false,
      visited: i === 0,
      doors: [],
      roster: buildRoomRoster(clampedStage, i, totalRooms),
      pillars: createRoomPillars(i, clampedStage),
    });
  }

  // Connect sequential rooms bidirectionally
  for (let i = 0; i < totalRooms - 1; i++) {
    const curr = rooms[i];
    const next = rooms[i + 1];
    const dx = next.gridX - curr.gridX;
    const dy = next.gridY - curr.gridY;
    let forwardDir: DoorDirection = 'E';
    let backDir: DoorDirection = 'W';
    if (dx > 0) {
      forwardDir = 'E';
      backDir = 'W';
    } else if (dx < 0) {
      forwardDir = 'W';
      backDir = 'E';
    } else if (dy < 0) {
      forwardDir = 'N';
      backDir = 'S';
    } else {
      forwardDir = 'S';
      backDir = 'N';
    }
    curr.doors.push({ dir: forwardDir, targetRoomId: next.id });
    next.doors.push({ dir: backDir, targetRoomId: curr.id });
  }

  return rooms;
}

export function createEnemy(
  id: number,
  archetype: EnemyArchetype,
  x: number,
  y: number,
  stageOrWave: number,
  roomIdx = 0,
  totalRooms = 4
): EnemyEntity {
  const profile = getStageDifficultyProfile(stageOrWave, roomIdx, totalRooms);
  const hpScale = profile.hpMultiplier;
  const dmgScale = profile.damageMultiplier;
  const spdScale = profile.speedMultiplier;

  const baseCommon = {
    id,
    archetype,
    x,
    y,
    vx: 0,
    vy: 0,
    aiState: 'move' as EnemyAIState,
    stateTimer: 0,
    stateDuration: 0,
    aimAngle: 0,
    targetX: x,
    targetY: y,
    hitFlashTimer: 0,
    hasAttackToken: false,
    scaleX: 1,
    scaleY: 1,
    walkDistance: 0,
    flankSign: id % 2 === 0 ? 1 : -1,
    phase: 1,
  };

  if (archetype === 'stalker') {
    const maxHp = Math.round(50 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 17,
      speed: Math.round(146 * spdScale),
      damage: Math.round(11 * dmgScale),
      scoreValue: Math.round(120 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 34,
    };
  }

  if (archetype === 'wraith') {
    const maxHp = Math.round(42 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 15,
      speed: Math.round(180 * spdScale),
      damage: Math.round(13 * dmgScale),
      scoreValue: Math.round(150 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 42,
    };
  }

  if (archetype === 'arcanist') {
    const maxHp = Math.round(46 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 18,
      speed: Math.round(114 * spdScale),
      damage: Math.round(14 * dmgScale),
      scoreValue: Math.round(160 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 45,
    };
  }

  if (archetype === 'frost_revenant') {
    const maxHp = Math.round(54 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 18,
      speed: Math.round(128 * spdScale),
      damage: Math.round(15 * dmgScale),
      scoreValue: Math.round(185 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 52,
    };
  }

  if (archetype === 'pyromancer') {
    const maxHp = Math.round(58 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 19,
      speed: Math.round(106 * spdScale),
      damage: Math.round(16 * dmgScale),
      scoreValue: Math.round(195 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 55,
    };
  }

  if (archetype === 'necro_weaver') {
    const maxHp = Math.round(72 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 20,
      speed: Math.round(98 * spdScale),
      damage: Math.round(15 * dmgScale),
      scoreValue: Math.round(225 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 64,
    };
  }

  if (archetype === 'void_singularity') {
    const maxHp = Math.round(78 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 21,
      speed: Math.round(92 * spdScale),
      damage: Math.round(17 * dmgScale),
      scoreValue: Math.round(235 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 68,
    };
  }

  if (archetype === 'solar_zealot') {
    const maxHp = Math.round(68 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 17,
      speed: Math.round(168 * spdScale),
      damage: Math.round(17 * dmgScale),
      scoreValue: Math.round(230 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 66,
    };
  }

  if (archetype === 'sentinel') {
    const maxHp = Math.round(98 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 23,
      speed: Math.round(80 * spdScale),
      damage: Math.round(18 * dmgScale),
      flankSign: 1,
      scoreValue: Math.round(240 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 70,
    };
  }

  if (archetype === 'juggernaut') {
    const maxHp = Math.round(115 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 25,
      speed: Math.round(88 * spdScale),
      damage: Math.round(20 * dmgScale),
      flankSign: 1,
      scoreValue: Math.round(260 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: 75,
    };
  }

  if (archetype === 'eclipse_inquisitor') {
    const maxHp = Math.round(135 * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 24,
      speed: Math.round(122 * spdScale),
      damage: Math.round(21 * dmgScale),
      scoreValue: Math.round(320 * (1 + (stageOrWave - 1) * 0.12)),
      xpValue: 92,
    };
  }

  // Archon Boss
  const maxHp = Math.round(400 * hpScale);
  return {
    ...baseCommon,
    archetype: 'archon',
    hp: maxHp,
    maxHp,
    radius: 36,
    speed: Math.round(104 * spdScale),
    damage: Math.round(22 * dmgScale),
    flankSign: 1,
    scoreValue: Math.round(1200 * (1 + (stageOrWave - 1) * 0.15)),
    xpValue: 260,
  };
}

export function createInitialWorldState(
  initialPhase: GamePhase = 'title',
  bestScore = 0,
  stageLevel = 1
): ArenaWorldState {
  const clampedStage = Math.max(1, Math.min(MAX_STAGE_LEVEL, stageLevel));
  const rooms = generateDungeonMap(clampedStage);
  const firstRoom = rooms[0];

  const state: ArenaWorldState = {
    phase: initialPhase,
    outcome: 'none',
    stageLevel: clampedStage,
    rooms,
    currentRoomIndex: 0,
    roomTransitionCooldown: 0,
    enemyFreezeTimer: 0,
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    pillars: [...firstRoom.pillars],
    player: {
      x: ARENA_WIDTH * 0.5,
      y: ARENA_HEIGHT * 0.58,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: 100,
      maxHp: 100,
      ghostHp: 100,
      essence: 100,
      maxEssence: 100,
      essenceRegen: 14,
      level: 1,
      xp: 0,
      xpToNextLevel: calculateXpForLevel(1),
      coins: 15,
      // Start with 1 Crimson Elixir so player can test/use roguelike items immediately
      inventory: [{ itemId: 'crimson_elixir', count: 1 }],
      skills: {},
      orbitAngle: 0,
      orbitHitCooldowns: {},
      aegisActive: false,
      aegisTimer: 0,
      speed: 245,
      damageMultiplier: 1,
      vampiricHeal: 0,
      facingAngle: -Math.PI * 0.5,
      stance: 'dawnblade',
      attackPhase: 'idle',
      attackTimer: 0,
      attackDuration: 0,
      attackAngle: 0,
      attackHitIds: [],
      comboStep: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashCooldownMax: 0.85,
      dashDirX: 0,
      dashDirY: -1,
      novaCooldown: 0,
      novaCooldownMax: 5.0,
      invulnTimer: 2.0,
      hitFlashTimer: 0,
      scaleX: 1,
      scaleY: 1,
      walkDistance: 0,
      bufferedAction: 'none',
      bufferTimer: 0,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    emberZones: [],
    lightningArcs: [],
    nextEntityId: 1,
    wave: 1,
    totalWaves: rooms.length,
    waveBannerTimer: 2.0,
    levelUpBannerTimer: 0,
    enemiesRemainingToSpawn: [...firstRoom.roster],
    spawnTimer: 1.3,
    activeAttackTokens: 0,
    maxAttackTokens: Math.min(6, MAX_CONCURRENT_ATTACKERS + Math.floor(clampedStage / 3)),
    score: 0,
    bestScore,
    comboCount: 0,
    comboTimer: 0,
    elapsedSeconds: 0,
    enemiesDefeated: 0,
    damageTaken: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    novaPulseTimer: 0,
    novaPulseX: ARENA_WIDTH * 0.5,
    novaPulseY: ARENA_HEIGHT * 0.5,
    defeatDelayTimer: 0,
    pendingLevelUps: 0,
    skillChoices: [],
    relicChoices: [],
    collectedRelics: [],
    snapshot: null,
  };

  spawnNextWaveEnemy(state, 0);
  spawnNextWaveEnemy(state, 1);
  return state;
}

export function addUsableItemToInventory(
  state: ArenaWorldState,
  itemId: UsableItemId,
  amount = 1
): void {
  const inv = state.player.inventory;
  const existing = inv.find((slot) => slot.itemId === itemId);
  if (existing) {
    existing.count = Math.min(9, existing.count + amount);
    return;
  }
  if (inv.length < 3) {
    inv.push({ itemId, count: amount });
  } else {
    // If 3 slots are occupied by different item types, increment the first slot or convert to coins
    inv[0].count = Math.min(9, inv[0].count + amount);
  }
}

export function useInventorySlot(
  state: ArenaWorldState,
  slotIndex: number,
  events?: SimulationEvents
): boolean {
  const p = state.player;
  const slot = p.inventory[slotIndex];
  if (!slot || slot.count <= 0 || p.hp <= 0) return false;

  const itemId = slot.itemId;
  slot.count -= 1;
  if (slot.count <= 0) {
    p.inventory.splice(slotIndex, 1);
  }

  if (itemId === 'crimson_elixir') {
    p.hp = Math.min(p.maxHp, p.hp + 40);
    p.ghostHp = Math.max(p.ghostHp, p.hp);
    events?.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#f43f5e',
      count: 16,
      speed: 180,
      size: 4,
    });
  } else if (itemId === 'astral_tonic') {
    p.essence = p.maxEssence;
    p.dashCooldown = 0;
    p.novaCooldown = 0;
    events?.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#38bdf8',
      count: 16,
      speed: 190,
      size: 4,
    });
  } else if (itemId === 'chrono_hourglass') {
    state.enemyFreezeTimer = 4.0;
    for (const enemy of state.enemies) {
      if (enemy.aiState === 'windup') {
        enemy.aiState = 'move';
        enemy.stateTimer = 0;
        if (enemy.hasAttackToken) {
          enemy.hasAttackToken = false;
          state.activeAttackTokens = Math.max(0, state.activeAttackTokens - 1);
        }
      }
    }
    events?.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#c084fc',
      count: 20,
      speed: 220,
      size: 4,
    });
  } else if (itemId === 'sunfire_bomb') {
    state.novaPulseTimer = 0.45;
    state.novaPulseX = p.x;
    state.novaPulseY = p.y;
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.45);
    const dummyEvents: SimulationEvents = events ?? {
      playerSwung: null,
      playerDashed: false,
      playerNova: false,
      playerLeveledUp: false,
      itemUsed: 'sunfire_bomb',
      roomChanged: false,
      enemiesHit: 0,
      enemiesKilled: 0,
      playerHurt: false,
      pickupCollected: false,
      coinCollected: false,
      telegraphStarted: false,
      waveCleared: false,
      bossSpawned: false,
      outcomeTriggered: 'none',
      particlesToSpawn: [],
    };
    for (const enemy of state.enemies) {
      if (enemy.aiState === 'ko') continue;
      const ang = Math.atan2(enemy.y - p.y, enemy.x - p.x);
      damageEnemy(state, enemy, Math.round(90 * p.damageMultiplier), ang, 320, 0.05, dummyEvents, false);
    }
    state.projectiles = state.projectiles.filter((proj) => proj.fromPlayer);
  }

  if (events) {
    events.itemUsed = itemId;
  }
  return true;
}

export function buyMerchantItem(state: ArenaWorldState, itemId: UsableItemId): boolean {
  const spec = USABLE_ITEMS[itemId];
  if (!spec || state.player.coins < spec.coinCost) return false;
  state.player.coins -= spec.coinCost;
  addUsableItemToInventory(state, itemId, 1);
  return true;
}

export function transitionToRoom(
  state: ArenaWorldState,
  targetRoomId: number,
  entryDoorDir?: DoorDirection
): boolean {
  const targetRoom = state.rooms.find((r) => r.id === targetRoomId);
  if (!targetRoom) return false;

  const currentRoom = state.rooms[state.currentRoomIndex];
  if (currentRoom && !currentRoom.cleared && state.enemies.length > 0) {
    return false;
  }

  state.currentRoomIndex = targetRoomId;
  state.wave = targetRoomId + 1;
  state.totalWaves = state.rooms.length;
  state.waveBannerTimer = 2.0;
  state.roomTransitionCooldown = 0.65;
  state.pillars = [...targetRoom.pillars];
  state.projectiles = [];
  state.emberZones = [];
  state.lightningArcs = [];
  state.activeAttackTokens = 0;
  const roomProfile = getStageDifficultyProfile(
    state.stageLevel,
    targetRoomId,
    state.rooms.length
  );
  state.maxAttackTokens = roomProfile.maxConcurrentAttackers;

  // Position player inside the newly entered room near the opposite doorway
  const p = state.player;
  if (entryDoorDir === 'E') {
    p.x = 120;
    p.y = state.arenaHeight * 0.5;
  } else if (entryDoorDir === 'W') {
    p.x = state.arenaWidth - 120;
    p.y = state.arenaHeight * 0.5;
  } else if (entryDoorDir === 'N') {
    p.x = state.arenaWidth * 0.5;
    p.y = state.arenaHeight - 120;
  } else if (entryDoorDir === 'S') {
    p.x = state.arenaWidth * 0.5;
    p.y = 120;
  } else {
    p.x = state.arenaWidth * 0.5;
    p.y = state.arenaHeight * 0.58;
  }
  p.vx = 0;
  p.vy = 0;
  p.invulnTimer = Math.max(p.invulnTimer, 1.2);

  targetRoom.visited = true;
  state.enemies = [];

  if (!targetRoom.cleared) {
    state.enemiesRemainingToSpawn = [...targetRoom.roster];
    state.spawnTimer = 0.85;
    spawnNextWaveEnemy(state, 0);
    if (state.enemiesRemainingToSpawn.length > 0) {
      spawnNextWaveEnemy(state, 1);
    }
  } else {
    state.enemiesRemainingToSpawn = [];
  }

  return true;
}

export function getDoorWorldPosition(
  dir: DoorDirection,
  arenaWidth = ARENA_WIDTH,
  arenaHeight = ARENA_HEIGHT
): { x: number; y: number } {
  if (dir === 'N') return { x: arenaWidth * 0.5, y: 42 };
  if (dir === 'S') return { x: arenaWidth * 0.5, y: arenaHeight - 42 };
  if (dir === 'W') return { x: 42, y: arenaHeight * 0.5 };
  return { x: arenaWidth - 42, y: arenaHeight * 0.5 };
}

export function rollSkillChoices(state: ArenaWorldState): SkillChoiceOption[] {
  const p = state.player;
  const available = SKILL_CATALOG.filter((spec) => (p.skills[spec.id] ?? 0) < spec.maxRank);
  if (available.length === 0) return [];

  const seed = state.player.level * 7 + state.wave * 3 + state.enemiesDefeated;
  const pool = [...available];
  const selected: SkillChoiceOption[] = [];

  while (selected.length < 3 && pool.length > 0) {
    const idx = (seed + selected.length * 2) % pool.length;
    const spec = pool.splice(idx, 1)[0];
    const currentRank = p.skills[spec.id] ?? 0;
    const nextRank = currentRank + 1;
    selected.push({
      id: spec.id,
      name: spec.name,
      categoryTag: spec.categoryTag,
      accentColor: spec.accentColor,
      currentRank,
      nextRank,
      maxRank: spec.maxRank,
      description: spec.getDescription(nextRank),
    });
  }

  return selected;
}

export function grantPlayerXp(
  state: ArenaWorldState,
  amount: number,
  events?: SimulationEvents
): boolean {
  if (amount <= 0 || state.player.hp <= 0) return false;
  const p = state.player;
  p.xp += amount;
  let leveledUp = false;

  while (p.xp >= p.xpToNextLevel) {
    p.xp -= p.xpToNextLevel;
    p.level += 1;
    p.xpToNextLevel = calculateXpForLevel(p.level);
    p.hp = Math.min(p.maxHp, p.hp + 12);
    p.ghostHp = Math.max(p.ghostHp, p.hp);
    p.essence = Math.min(p.maxEssence, p.essence + 20);
    state.pendingLevelUps += 1;
    state.levelUpBannerTimer = 2.0;
    leveledUp = true;
  }

  if (leveledUp) {
    if (state.skillChoices.length === 0 && state.pendingLevelUps > 0) {
      const choices = rollSkillChoices(state);
      if (choices.length > 0) {
        state.skillChoices = choices;
        state.pendingLevelUps -= 1;
      } else {
        state.pendingLevelUps = 0;
      }
    }
    if (events) {
      events.playerLeveledUp = true;
      events.particlesToSpawn.push({
        x: p.x,
        y: p.y,
        color: '#fde047',
        count: 20,
        speed: 230,
        size: 5,
      });
    }
  }

  return leveledUp;
}

export function applySkillChoice(state: ArenaWorldState, skillId: SkillId): boolean {
  const spec = SKILL_CATALOG.find((s) => s.id === skillId);
  if (!spec) return false;

  const p = state.player;
  const currentRank = p.skills[skillId] ?? 0;
  if (currentRank >= spec.maxRank) return false;

  const nextRank = currentRank + 1;
  p.skills[skillId] = nextRank;

  if (skillId === 'dawn_aegis') {
    p.aegisActive = true;
    p.aegisTimer = 0;
  }

  if (state.pendingLevelUps > 0) {
    const nextChoices = rollSkillChoices(state);
    if (nextChoices.length > 0) {
      state.skillChoices = nextChoices;
      state.pendingLevelUps -= 1;
    } else {
      state.skillChoices = [];
      state.pendingLevelUps = 0;
    }
  } else {
    state.skillChoices = [];
  }

  return true;
}

export function spawnNextWaveEnemy(state: ArenaWorldState, slotHint = 0): EnemyEntity | null {
  const nextArch = state.enemiesRemainingToSpawn.shift();
  if (!nextArch) return null;

  const perimeterPoints = [
    { x: 140, y: 120 },
    { x: state.arenaWidth - 140, y: 120 },
    { x: 140, y: state.arenaHeight - 120 },
    { x: state.arenaWidth - 140, y: state.arenaHeight - 120 },
    { x: state.arenaWidth * 0.5, y: 95 },
    { x: 110, y: state.arenaHeight * 0.5 },
    { x: state.arenaWidth - 110, y: state.arenaHeight * 0.5 },
  ];

  const idx = (state.nextEntityId + slotHint) % perimeterPoints.length;
  let pt = perimeterPoints[idx];
  const distToPlayer = Math.hypot(pt.x - state.player.x, pt.y - state.player.y);
  if (distToPlayer < 260) {
    pt = perimeterPoints[(idx + 3) % perimeterPoints.length];
  }

  if (nextArch === 'archon') {
    pt = { x: state.arenaWidth * 0.5, y: 135 };
  }

  const enemy = createEnemy(
    state.nextEntityId++,
    nextArch,
    pt.x,
    pt.y,
    state.stageLevel,
    state.currentRoomIndex,
    state.rooms.length
  );
  state.enemies.push(enemy);
  return enemy;
}

export function applyRelicChoice(state: ArenaWorldState, relicId: string): boolean {
  const relic = RELIC_CATALOG.find((r) => r.id === relicId);
  if (!relic) return false;

  state.collectedRelics.push(relic.id);
  const p = state.player;

  switch (relic.id) {
    case 'solar_vessel':
      p.maxHp += 20;
      p.hp = Math.min(p.maxHp, p.hp + 30);
      p.ghostHp = Math.max(p.ghostHp, p.hp);
      break;
    case 'corona_edge':
      p.damageMultiplier = Number((p.damageMultiplier + 0.25).toFixed(2));
      break;
    case 'quicksilver_step':
      p.speed = Math.round(p.speed * 1.18);
      p.dashCooldownMax = Math.max(0.4, Number((p.dashCooldownMax * 0.75).toFixed(2)));
      break;
    case 'astral_conduit':
      p.maxEssence += 25;
      p.essence = Math.min(p.maxEssence, p.essence + 25);
      p.essenceRegen = Number((p.essenceRegen * 1.4).toFixed(1));
      break;
    case 'siphon_sigil':
      p.vampiricHeal += 4;
      break;
  }

  state.relicChoices = [];
  return true;
}

function normalizeAngleDiff(target: number, current: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function resolveCircleObstacles(
  entity: { x: number; y: number; radius: number },
  pillars: ObstaclePillar[],
  arenaWidth: number,
  arenaHeight: number
): void {
  const margin = 44 + entity.radius;
  entity.x = Math.max(margin, Math.min(arenaWidth - margin, entity.x));
  entity.y = Math.max(margin, Math.min(arenaHeight - margin, entity.y));

  for (const pillar of pillars) {
    const dx = entity.x - pillar.x;
    const dy = entity.y - pillar.y;
    const dist = Math.hypot(dx, dy);
    const minDist = entity.radius + pillar.radius;
    if (dist > 0 && dist < minDist) {
      const push = minDist - dist;
      entity.x += (dx / dist) * push;
      entity.y += (dy / dist) * push;
    }
  }
}

function createSnapshot(state: ArenaWorldState, outcome: OutcomeType): RunSnapshot {
  const boss = state.enemies.find((e) => e.archetype === 'archon');
  const bossHpPercent =
    outcome === 'victory'
      ? 0
      : boss
        ? Math.max(0, Math.round((boss.hp / boss.maxHp) * 100))
        : state.currentRoomIndex < state.rooms.length - 1
          ? 100
          : 0;

  const bestScore = Math.max(state.bestScore, state.score);
  state.bestScore = bestScore;

  const skillsLearned = (Object.keys(state.player.skills) as SkillId[])
    .filter((k) => (state.player.skills[k] ?? 0) > 0)
    .map((k) => ({ id: k, rank: state.player.skills[k] ?? 1 }));

  const clearedCount = state.rooms.filter((r) => r.cleared).length;

  return {
    outcome,
    stageLevel: state.stageLevel,
    score: Math.round(state.score),
    bestScore: Math.round(bestScore),
    roomsCleared: clearedCount,
    totalRooms: state.rooms.length,
    waveReached: state.currentRoomIndex + 1,
    totalWaves: state.rooms.length,
    levelReached: state.player.level,
    coinsCollected: state.player.coins,
    clearTimeSeconds: Number(state.elapsedSeconds.toFixed(1)),
    enemiesDefeated: state.enemiesDefeated,
    damageTaken: Math.round(state.damageTaken),
    bossHpRemainingPercent: bossHpPercent,
    relicsCollected: [...state.collectedRelics],
    skillsLearned,
  };
}

export function stepArenaWorld(
  state: ArenaWorldState,
  input: FrameInput,
  rawDt: number
): SimulationEvents {
  const dt = clampDt(rawDt);
  const events: SimulationEvents = {
    playerSwung: null,
    playerDashed: false,
    playerNova: false,
    playerLeveledUp: false,
    itemUsed: null,
    roomChanged: false,
    enemiesHit: 0,
    enemiesKilled: 0,
    playerHurt: false,
    pickupCollected: false,
    coinCollected: false,
    telegraphStarted: false,
    waveCleared: false,
    bossSpawned: false,
    outcomeTriggered: 'none',
    particlesToSpawn: [],
  };

  if (state.phase !== 'playing' || dt <= 0) {
    return events;
  }

  // Real-time visual timers tick even during hitstop
  state.cameraTrauma = Math.max(0, state.cameraTrauma - dt * 1.85);
  state.waveBannerTimer = Math.max(0, state.waveBannerTimer - dt);
  state.levelUpBannerTimer = Math.max(0, state.levelUpBannerTimer - dt);
  state.novaPulseTimer = Math.max(0, state.novaPulseTimer - dt);
  state.roomTransitionCooldown = Math.max(0, state.roomTransitionCooldown - dt);
  state.enemyFreezeTimer = Math.max(0, state.enemyFreezeTimer - dt);

  for (let i = state.lightningArcs.length - 1; i >= 0; i--) {
    state.lightningArcs[i].life += dt;
    if (state.lightningArcs[i].life >= state.lightningArcs[i].maxLife) {
      state.lightningArcs.splice(i, 1);
    }
  }

  const p = state.player;
  p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
  p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
  p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

  for (const enemy of state.enemies) {
    enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
    enemy.scaleX += (1 - enemy.scaleX) * Math.min(1, dt * 12);
    enemy.scaleY += (1 - enemy.scaleY) * Math.min(1, dt * 12);
  }

  // Delayed trailing ghost HP bar
  if (p.ghostHp > p.hp) {
    p.ghostHp = Math.max(p.hp, p.ghostHp - dt * 28);
  } else {
    p.ghostHp = p.hp;
  }

  // Handle defeat final beat before transitioning to gameover
  if (p.hp <= 0) {
    state.defeatDelayTimer += dt;
    if (state.defeatDelayTimer >= 0.45 && state.outcome === 'none') {
      state.outcome = 'defeat';
      state.phase = 'gameover';
      state.snapshot = createSnapshot(state, 'defeat');
      events.outcomeTriggered = 'defeat';
    }
    return events;
  }

  // Pause simulation while player is choosing a Level-Up Skill or Wave Relic
  if (state.skillChoices.length > 0 || state.relicChoices.length > 0) {
    return events;
  }

  // Use Consumable Item if triggered via [Z]/[X]/[C] (processed before hitstop so edge input is never lost)
  if (typeof input.useItemSlot === 'number' && input.useItemSlot >= 0) {
    useInventorySlot(state, input.useItemSlot, events);
  }

  // Sim-level hitstop pauses simulation physics while rendering & flashes continue
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  const simDt = dt;
  state.elapsedSeconds += simDt;

  // Dawn Aegis Ward skill recharge
  const aegisRank = p.skills.dawn_aegis ?? 0;
  if (aegisRank > 0 && !p.aegisActive) {
    const rechargeTime = Math.max(3.5, 8.5 - aegisRank * 1.5);
    p.aegisTimer += simDt;
    if (p.aegisTimer >= rechargeTime) {
      p.aegisActive = true;
      p.aegisTimer = 0;
    }
  }

  // Orbiting Solar Blades skill update
  const orbitRank = p.skills.solar_orbit ?? 0;
  if (orbitRank > 0) {
    p.orbitAngle = (p.orbitAngle + simDt * (3.4 + orbitRank * 0.45)) % (Math.PI * 2);
    const bladeCount = orbitRank + 1;
    const orbitRadius = 64;
    const bladeDamage = Math.round((16 + orbitRank * 8) * p.damageMultiplier);

    for (const enemyIdStr of Object.keys(p.orbitHitCooldowns)) {
      const idNum = Number(enemyIdStr);
      p.orbitHitCooldowns[idNum] -= simDt;
      if (p.orbitHitCooldowns[idNum] <= 0) {
        delete p.orbitHitCooldowns[idNum];
      }
    }

    for (let b = 0; b < bladeCount; b++) {
      const ang = p.orbitAngle + (b * Math.PI * 2) / bladeCount;
      const bx = p.x + Math.cos(ang) * orbitRadius;
      const by = p.y + Math.sin(ang) * orbitRadius;

      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko' || (p.orbitHitCooldowns[enemy.id] ?? 0) > 0) continue;
        if (Math.hypot(enemy.x - bx, enemy.y - by) <= enemy.radius + 13) {
          p.orbitHitCooldowns[enemy.id] = 0.36;
          damageEnemy(state, enemy, bladeDamage, ang, 110, 0.015, events, false);
        }
      }
    }
  }

  // Update Ignis Dash Trail Ember Zones
  for (let i = state.emberZones.length - 1; i >= 0; i--) {
    const zone = state.emberZones[i];
    zone.life -= simDt;
    zone.tickTimer -= simDt;
    if (zone.life <= 0) {
      state.emberZones.splice(i, 1);
      continue;
    }
    if (zone.tickTimer <= 0) {
      zone.tickTimer = 0.35;
      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko') continue;
        if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.radius + enemy.radius) {
          const pushAng = Math.atan2(enemy.y - zone.y, enemy.x - zone.x);
          damageEnemy(state, enemy, zone.damage, pushAng, 60, 0.01, events, false);
        }
      }
    }
  }

  // Stance switch
  if (input.stanceSelect && WEAPON_STANCES[input.stanceSelect]) {
    p.stance = input.stanceSelect;
  }

  // Aiming angle
  const aimDx = input.aimWorldX - p.x;
  const aimDy = input.aimWorldY - p.y;
  if (Math.hypot(aimDx, aimDy) > 4) {
    p.facingAngle = Math.atan2(aimDy, aimDx);
  }

  // Input buffering (0.12s window)
  if (input.dashJustPressed) {
    p.bufferedAction = 'dash';
    p.bufferTimer = 0.12;
  } else if (input.novaJustPressed) {
    p.bufferedAction = 'nova';
    p.bufferTimer = 0.12;
  } else if (input.attackJustPressed) {
    p.bufferedAction = 'attack';
    p.bufferTimer = 0.12;
  }

  if (p.bufferTimer > 0) {
    p.bufferTimer = Math.max(0, p.bufferTimer - simDt);
    if (p.bufferTimer === 0) {
      p.bufferedAction = 'none';
    }
  }

  // Cooldowns & Essence regeneration
  p.dashCooldown = Math.max(0, p.dashCooldown - simDt);
  p.novaCooldown = Math.max(0, p.novaCooldown - simDt);
  p.invulnTimer = Math.max(0, p.invulnTimer - simDt);
  p.essence = Math.min(p.maxEssence, p.essence + p.essenceRegen * simDt);

  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - simDt);
    if (state.comboTimer === 0) {
      state.comboCount = 0;
    }
  }

  // Execute buffered or immediate Dash
  if (p.bufferedAction === 'dash' && p.dashCooldown <= 0 && p.dashTimer <= 0) {
    p.bufferedAction = 'none';
    p.bufferTimer = 0;
    p.dashTimer = 0.18;
    p.dashCooldown = p.dashCooldownMax;
    p.invulnTimer = Math.max(p.invulnTimer, 0.22);
    const moveLen = Math.hypot(input.moveX, input.moveY);
    if (moveLen > 0.05) {
      p.dashDirX = input.moveX / moveLen;
      p.dashDirY = input.moveY / moveLen;
    } else {
      p.dashDirX = Math.cos(p.facingAngle);
      p.dashDirY = Math.sin(p.facingAngle);
    }
    p.scaleX = 1.24;
    p.scaleY = 0.78;
    events.playerDashed = true;
    events.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#f59e0b',
      count: 8,
      speed: 140,
      size: 4,
    });

    const blazeRank = p.skills.blaze_trail ?? 0;
    if (blazeRank > 0) {
      const duration = 2.0 + blazeRank * 0.5;
      const emberDmg = Math.round((16 + blazeRank * 7) * p.damageMultiplier);
      state.emberZones.push(
        {
          id: state.nextEntityId++,
          x: p.x,
          y: p.y,
          radius: 34,
          life: duration,
          maxLife: duration,
          damage: emberDmg,
          tickTimer: 0.05,
        },
        {
          id: state.nextEntityId++,
          x: p.x + p.dashDirX * 48,
          y: p.y + p.dashDirY * 48,
          radius: 34,
          life: duration,
          maxLife: duration,
          damage: emberDmg,
          tickTimer: 0.12,
        }
      );
    }
  }

  // Execute buffered or immediate Solar Nova [E]
  if (p.bufferedAction === 'nova' && p.novaCooldown <= 0 && p.essence >= 30) {
    p.bufferedAction = 'none';
    p.bufferTimer = 0;
    p.essence -= 30;
    const novaSurgeRank = p.skills.supernova_surge ?? 0;
    const cooldownMult = Math.max(0.4, 1 - novaSurgeRank * 0.18);
    p.novaCooldown = p.novaCooldownMax * cooldownMult;
    state.novaPulseTimer = 0.45;
    state.novaPulseX = p.x;
    state.novaPulseY = p.y;
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.42);
    state.hitstopTimer = Math.max(state.hitstopTimer, 0.05);
    events.playerNova = true;
    events.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#fbbf24',
      count: 22,
      speed: 260,
      size: 5,
    });

    const novaRadius = 185 + novaSurgeRank * 32;
    const novaDamage = Math.round((44 + novaSurgeRank * 14) * p.damageMultiplier);
    let hitsCount = 0;
    for (const enemy of state.enemies) {
      if (enemy.aiState === 'ko') continue;
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist <= novaRadius + enemy.radius) {
        hitsCount++;
        const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        damageEnemy(state, enemy, novaDamage, angle, 310, 0.05, events, true);
      }
    }
    if (novaSurgeRank > 0 && hitsCount >= 2) {
      p.essence = Math.min(p.maxEssence, p.essence + 12);
    }
    state.projectiles = state.projectiles.filter(
      (proj) => proj.fromPlayer || Math.hypot(proj.x - p.x, proj.y - p.y) > novaRadius
    );
  }

  // Execute buffered Attack
  const stanceSpec = WEAPON_STANCES[p.stance];
  const echoRank = p.skills.phantom_echo ?? 0;
  const effectiveRange = Math.round(stanceSpec.range * (1 + echoRank * 0.18));

  if (
    p.bufferedAction === 'attack' &&
    p.attackPhase === 'idle' &&
    p.essence >= stanceSpec.essenceCost
  ) {
    p.bufferedAction = 'none';
    p.bufferTimer = 0;
    p.essence -= stanceSpec.essenceCost;
    p.attackPhase = 'windup';
    p.attackTimer = 0;
    p.attackDuration = stanceSpec.windupDuration;
    p.attackAngle = p.facingAngle;
    p.attackHitIds = [];
    p.comboStep = (p.comboStep + 1) % 3;
    p.scaleX = 0.88;
    p.scaleY = 1.14;
    events.playerSwung = p.stance;
  }

  // Advance player attack state machine
  if (p.attackPhase !== 'idle') {
    p.attackTimer += simDt;
    if (p.attackPhase === 'windup' && p.attackTimer >= p.attackDuration) {
      p.attackPhase = 'active';
      p.attackTimer = 0;
      p.attackDuration = stanceSpec.activeDuration;
      p.scaleX = 1.18;
      p.scaleY = 0.84;

      if (p.stance === 'astral_bow') {
        const angles = [p.attackAngle, p.attackAngle - 0.14, p.attackAngle + 0.14];
        for (let r = 1; r <= echoRank; r++) {
          angles.push(p.attackAngle - 0.14 * (r + 1), p.attackAngle + 0.14 * (r + 1));
        }
        for (let i = 0; i < angles.length; i++) {
          const ang = angles[i];
          const speed = i === 0 ? 640 : 580;
          state.projectiles.push({
            id: state.nextEntityId++,
            fromPlayer: true,
            x: p.x + Math.cos(ang) * 20,
            y: p.y + Math.sin(ang) * 20,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            radius: i === 0 ? 7 : 5,
            damage: Math.round(
              (stanceSpec.damage + echoRank * 6) * p.damageMultiplier * (i === 0 ? 1 : 0.7)
            ),
            color: '#38bdf8',
            life: 0,
            maxLife: 0.85,
            pierceLeft: i === 0 ? 2 + echoRank : 1,
            hitEnemyIds: [],
          });
        }
      }
    } else if (p.attackPhase === 'active') {
      if (p.stance !== 'astral_bow') {
        for (const enemy of state.enemies) {
          if (enemy.aiState === 'ko' || p.attackHitIds.includes(enemy.id)) continue;
          const dx = enemy.x - p.x;
          const dy = enemy.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= effectiveRange + enemy.radius) {
            const angleToEnemy = Math.atan2(dy, dx);
            const diff = Math.abs(normalizeAngleDiff(angleToEnemy, p.attackAngle));
            if (diff <= stanceSpec.arcRadians * 0.5 || dist < p.radius + enemy.radius + 10) {
              p.attackHitIds.push(enemy.id);
              const dmg = Math.round(
                (stanceSpec.damage + echoRank * 10) * p.damageMultiplier
              );
              if (p.stance === 'dawnblade') {
                p.essence = Math.min(p.maxEssence, p.essence + 8);
              }
              damageEnemy(
                state,
                enemy,
                dmg,
                angleToEnemy,
                stanceSpec.knockback,
                stanceSpec.hitstop,
                events,
                true
              );
            }
          }
        }
      }
      if (p.attackTimer >= p.attackDuration) {
        p.attackPhase = 'recovery';
        p.attackTimer = 0;
        p.attackDuration = stanceSpec.recoveryDuration;
      }
    } else if (p.attackPhase === 'recovery' && p.attackTimer >= p.attackDuration) {
      p.attackPhase = 'idle';
      p.attackTimer = 0;
    }
  }

  // Player movement
  if (p.dashTimer > 0) {
    p.dashTimer = Math.max(0, p.dashTimer - simDt);
    const dashSpeed = p.speed * 2.65;
    p.vx = p.dashDirX * dashSpeed;
    p.vy = p.dashDirY * dashSpeed;
    if (p.dashTimer === 0) {
      p.scaleX = 1.18;
      p.scaleY = 0.82;
    }
  } else {
    const moveLen = Math.hypot(input.moveX, input.moveY);
    const normX = moveLen > 0.01 ? input.moveX / moveLen : 0;
    const normY = moveLen > 0.01 ? input.moveY / moveLen : 0;
    const attackMovePenalty = p.attackPhase === 'active' ? 0.65 : 1.0;
    const targetVx = normX * p.speed * attackMovePenalty;
    const targetVy = normY * p.speed * attackMovePenalty;
    const accel = Math.min(1, simDt * 16);
    p.vx += (targetVx - p.vx) * accel;
    p.vy += (targetVy - p.vy) * accel;
  }

  const prevX = p.x;
  const prevY = p.y;
  p.x += p.vx * simDt;
  p.y += p.vy * simDt;
  resolveCircleObstacles(p, state.pillars, state.arenaWidth, state.arenaHeight);
  p.walkDistance += Math.hypot(p.x - prevX, p.y - prevY);

  // Check if player walks into an open Runic Portal Door in a cleared room
  const activeRoom = state.rooms[state.currentRoomIndex];
  if (
    activeRoom &&
    activeRoom.cleared &&
    state.enemies.length === 0 &&
    state.roomTransitionCooldown <= 0
  ) {
    for (const door of activeRoom.doors) {
      const pos = getDoorWorldPosition(door.dir, state.arenaWidth, state.arenaHeight);
      if (Math.hypot(p.x - pos.x, p.y - pos.y) <= 46) {
        if (transitionToRoom(state, door.targetRoomId, door.dir)) {
          events.roomChanged = true;
          return events;
        }
      }
    }
  }

  // Wave / Room Enemy Spawner
  if (state.enemiesRemainingToSpawn.length > 0) {
    state.spawnTimer -= simDt;
    if (state.spawnTimer <= 0 || state.enemies.length === 0) {
      const spawned = spawnNextWaveEnemy(state, state.enemiesRemainingToSpawn.length);
      if (spawned?.archetype === 'archon') {
        events.bossSpawned = true;
      }
      state.spawnTimer = Math.max(0.85, 2.0 - state.stageLevel * 0.12);
    }
  }

  // Recompute active attack tokens
  let tokensUsed = 0;
  for (const e of state.enemies) {
    if (e.aiState !== 'ko' && e.hasAttackToken) {
      tokensUsed++;
    }
  }
  state.activeAttackTokens = tokensUsed;

  const enemySpeedMult = state.enemyFreezeTimer > 0 ? 0.25 : 1.0;

  const stageDiff = getStageDifficultyProfile(
    state.stageLevel,
    state.currentRoomIndex,
    state.rooms.length
  );
  const cdMult = stageDiff.cooldownMultiplier;
  const projSpdMult = stageDiff.projectileSpeedMultiplier;

  // Update Enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];

    if (enemy.aiState === 'ko') {
      enemy.stateTimer += simDt;
      enemy.x += enemy.vx * simDt;
      enemy.y += enemy.vy * simDt;
      enemy.vx *= Math.pow(0.08, simDt);
      enemy.vy *= Math.pow(0.08, simDt);
      if (enemy.stateTimer >= enemy.stateDuration) {
        state.enemies.splice(i, 1);
      }
      continue;
    }

    const enemyDt = simDt * enemySpeedMult;
    const dxToPlayer = p.x - enemy.x;
    const dyToPlayer = p.y - enemy.y;
    const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer) || 1;
    const angleToPlayer = Math.atan2(dyToPlayer, dxToPlayer);

    enemy.vx *= Math.pow(0.06, simDt);
    enemy.vy *= Math.pow(0.06, simDt);

    if (enemy.aiState === 'move') {
      enemy.aimAngle = angleToPlayer;

      if (enemy.archetype === 'stalker') {
        const flankAngle =
          angleToPlayer +
          enemy.flankSign * 0.42 * Math.min(1, Math.max(0, (distToPlayer - 70) / 180));
        const moveStepX = Math.cos(flankAngle) * enemy.speed * enemySpeedMult;
        const moveStepY = Math.sin(flankAngle) * enemy.speed * enemySpeedMult;
        enemy.x += (moveStepX + enemy.vx) * simDt;
        enemy.y += (moveStepY + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;

        if (distToPlayer <= 72 && state.activeAttackTokens < state.maxAttackTokens) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.24, 0.36 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.scaleX = 0.82;
          enemy.scaleY = 1.2;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'wraith') {
        // Phantom Wraith weaves diagonally and blink-lunges from medium range
        const weaveAngle =
          angleToPlayer + enemy.flankSign * Math.sin(enemy.walkDistance * 0.05) * 0.65;
        enemy.x += (Math.cos(weaveAngle) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(weaveAngle) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 0.85 * cdMult &&
          distToPlayer <= 165 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.2, 0.28 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.scaleX = 0.78;
          enemy.scaleY = 1.24;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'frost_revenant') {
        // Frost Revenant glides in a smooth figure-8 orbit at 185-265px and fires a cryo-lance + ice fan
        const figureEightOffset =
          Math.sin(enemy.walkDistance * 0.035) * 0.75 * enemy.flankSign;
        let moveAngle = angleToPlayer + figureEightOffset;
        if (distToPlayer < 175) {
          moveAngle = angleToPlayer + Math.PI + figureEightOffset * 0.4;
        } else if (distToPlayer <= 265) {
          moveAngle = angleToPlayer + Math.PI * 0.5 * enemy.flankSign + figureEightOffset * 0.35;
        }
        enemy.x += (Math.cos(moveAngle) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(moveAngle) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 1.38 * cdMult &&
          distToPlayer <= 440 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.36, 0.5 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'arcanist' || enemy.archetype === 'pyromancer') {
        let dirX = 0;
        let dirY = 0;
        if (distToPlayer < 210) {
          dirX = -Math.cos(angleToPlayer);
          dirY = -Math.sin(angleToPlayer);
        } else if (distToPlayer > 310) {
          dirX = Math.cos(angleToPlayer);
          dirY = Math.sin(angleToPlayer);
        } else {
          const perp = angleToPlayer + Math.PI * 0.5 * enemy.flankSign;
          dirX = Math.cos(perp) * 0.75;
          dirY = Math.sin(perp) * 0.75;
        }
        enemy.x += (dirX * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (dirY * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * 0.8 * enemyDt;
        enemy.stateTimer += enemyDt;

        const castInterval = (enemy.archetype === 'pyromancer' ? 1.55 : 1.35) * cdMult;
        if (
          enemy.stateTimer >= castInterval &&
          distToPlayer <= 450 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration =
            (enemy.archetype === 'pyromancer' ? 0.58 : 0.52) * Math.max(0.75, cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.targetX = p.x;
          enemy.targetY = p.y;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'necro_weaver') {
        // Necro-Weaver circles at mid-long range and fires a 3-way cursed volley
        const orbitDir = angleToPlayer + Math.PI * 0.45 * enemy.flankSign;
        enemy.x += (Math.cos(orbitDir) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(orbitDir) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 1.65 * cdMult &&
          distToPlayer <= 470 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.38, 0.55 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'void_singularity') {
        // Void Singularity drifts harmonically around strategic anchor points and prepares a gravity well
        const anchorAngle =
          angleToPlayer + Math.PI * 0.38 * enemy.flankSign + Math.cos(enemy.walkDistance * 0.025) * 0.3;
        const speedMod = distToPlayer < 160 ? -0.6 : 0.85;
        enemy.x +=
          (Math.cos(anchorAngle) * enemy.speed * speedMod * enemySpeedMult + enemy.vx) * simDt;
        enemy.y +=
          (Math.sin(anchorAngle) * enemy.speed * speedMod * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 1.75 * cdMult &&
          distToPlayer <= 460 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.45, 0.62 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.targetX = p.x;
          enemy.targetY = p.y;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'solar_zealot') {
        // Solar Zealot sprints in tight zig-zags and enrages (+28% speed) below 60% HP
        const enragedMult = enemy.hp < enemy.maxHp * 0.6 ? 1.28 : 1.0;
        const zigZag =
          angleToPlayer + Math.sin(enemy.walkDistance * 0.075) * 0.52 * enemy.flankSign;
        const stepSpeed = enemy.speed * enragedMult * enemySpeedMult;
        enemy.x += (Math.cos(zigZag) * stepSpeed + enemy.vx) * simDt;
        enemy.y += (Math.sin(zigZag) * stepSpeed + enemy.vy) * simDt;
        enemy.walkDistance += stepSpeed * simDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 0.95 * cdMult &&
          distToPlayer <= 190 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.24, 0.34 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.scaleX = 0.8;
          enemy.scaleY = 1.22;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'sentinel') {
        // Solaris Sentinel advances steadily and unleashes a 4-way or 8-way laser pulse
        enemy.x += (Math.cos(angleToPlayer) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(angleToPlayer) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 1.7 * cdMult &&
          distToPlayer <= 420 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.42, 0.6 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'juggernaut') {
        enemy.x += (Math.cos(angleToPlayer) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(angleToPlayer) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (
          enemy.stateTimer >= 1.5 * cdMult &&
          distToPlayer <= 360 &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.48, 0.65 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.targetX = enemy.x + Math.cos(angleToPlayer) * 300;
          enemy.targetY = enemy.y + Math.sin(angleToPlayer) * 300;
          enemy.scaleX = 1.24;
          enemy.scaleY = 0.78;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'eclipse_inquisitor') {
        // Eclipse Inquisitor shadow-steps to optimal command distance if player is too far or too close
        enemy.stateTimer += enemyDt;
        const stepAngle = angleToPlayer + Math.PI * 0.32 * enemy.flankSign;
        enemy.x += (Math.cos(stepAngle) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(stepAngle) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;

        if (
          enemy.stateTimer >= 1.45 * cdMult &&
          state.activeAttackTokens < state.maxAttackTokens
        ) {
          if (distToPlayer > 330 || distToPlayer < 105) {
            const blinkDist = 185;
            const blinkAng = angleToPlayer + Math.PI + enemy.flankSign * 0.7;
            enemy.x = Math.max(
              90,
              Math.min(state.arenaWidth - 90, p.x + Math.cos(blinkAng) * blinkDist)
            );
            enemy.y = Math.max(
              90,
              Math.min(state.arenaHeight - 90, p.y + Math.sin(blinkAng) * blinkDist)
            );
          }
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.42, 0.56 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          enemy.targetX = p.x;
          enemy.targetY = p.y;
          events.telegraphStarted = true;
        }
      } else if (enemy.archetype === 'archon') {
        const centerAngle = Math.atan2(
          enemy.y - state.arenaHeight * 0.45,
          enemy.x - state.arenaWidth * 0.5
        );
        const orbitAngle = centerAngle + enemyDt * 0.9;
        const targetOrbitX = state.arenaWidth * 0.5 + Math.cos(orbitAngle) * 180;
        const targetOrbitY = state.arenaHeight * 0.42 + Math.sin(orbitAngle) * 110;
        const moveAng = Math.atan2(targetOrbitY - enemy.y, targetOrbitX - enemy.x);
        enemy.x += (Math.cos(moveAng) * enemy.speed * enemySpeedMult + enemy.vx) * simDt;
        enemy.y += (Math.sin(moveAng) * enemy.speed * enemySpeedMult + enemy.vy) * simDt;
        enemy.walkDistance += enemy.speed * enemyDt;
        enemy.stateTimer += enemyDt;

        if (enemy.hp <= enemy.maxHp * 0.5 && enemy.phase === 1) {
          enemy.phase = 2;
          state.hitstopTimer = Math.max(state.hitstopTimer, 0.07);
          state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.5);
        }

        const cooldown = (enemy.phase === 2 ? 1.15 : 1.6) * cdMult;
        if (enemy.stateTimer >= cooldown) {
          enemy.aiState = 'windup';
          enemy.stateTimer = 0;
          enemy.stateDuration = Math.max(0.52, 0.72 * cdMult);
          enemy.hasAttackToken = true;
          state.activeAttackTokens++;
          enemy.aimAngle = angleToPlayer;
          enemy.targetX = p.x;
          enemy.targetY = p.y;
          events.telegraphStarted = true;
        }
      }
    } else if (enemy.aiState === 'windup') {
      enemy.stateTimer += enemyDt;
      if (
        enemy.archetype === 'arcanist' ||
        enemy.archetype === 'necro_weaver' ||
        enemy.archetype === 'frost_revenant' ||
        enemy.archetype === 'eclipse_inquisitor'
      ) {
        enemy.aimAngle = angleToPlayer;
      }

      // Void Singularity exerts a gentle gravitational pull on the player during windup
      if (enemy.archetype === 'void_singularity' && p.dashTimer <= 0) {
        const pullDx = enemy.x - p.x;
        const pullDy = enemy.y - p.y;
        const pullDist = Math.hypot(pullDx, pullDy) || 1;
        if (pullDist < 340 && pullDist > 36) {
          const pullStrength = (42 + state.stageLevel * 3) * enemyDt;
          p.x += (pullDx / pullDist) * pullStrength;
          p.y += (pullDy / pullDist) * pullStrength;
        }
      }

      if (enemy.stateTimer >= enemy.stateDuration) {
        enemy.aiState = 'active';
        enemy.stateTimer = 0;
        enemy.scaleX = 1.22;
        enemy.scaleY = 0.82;

        if (enemy.archetype === 'stalker') {
          enemy.stateDuration = 0.16;
        } else if (enemy.archetype === 'wraith') {
          enemy.stateDuration = 0.18;
        } else if (enemy.archetype === 'solar_zealot') {
          enemy.stateDuration = 0.22;
          // Solar Zealot flings 2 lateral solar chakrams perpendicular to its dash trajectory
          const chakramAngles = [
            enemy.aimAngle - 0.35,
            enemy.aimAngle + 0.35,
          ];
          if (state.stageLevel >= 8) {
            chakramAngles.push(enemy.aimAngle);
          }
          for (const cAng of chakramAngles) {
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(cAng) * 18,
              y: enemy.y + Math.sin(cAng) * 18,
              vx: Math.cos(cAng) * 330 * projSpdMult,
              vy: Math.sin(cAng) * 330 * projSpdMult,
              radius: 8,
              damage: Math.round(enemy.damage * 0.85),
              color: '#facc15',
              life: 0,
              maxLife: 1.9,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'arcanist') {
          enemy.stateDuration = 0.1;
          const orbSpeed = 320 * projSpdMult;
          const spreads =
            state.stageLevel >= 7
              ? [-0.18, 0, 0.18]
              : state.stageLevel >= 4
              ? [-0.09, 0.09]
              : [0];
          for (const sp of spreads) {
            const ang = enemy.aimAngle + sp;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 20,
              y: enemy.y + Math.sin(ang) * 20,
              vx: Math.cos(ang) * orbSpeed,
              vy: Math.sin(ang) * orbSpeed,
              radius: 8,
              damage: enemy.damage,
              color: '#f43f5e',
              life: 0,
              maxLife: 2.2,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'frost_revenant') {
          enemy.stateDuration = 0.12;
          // Central high-speed cryo lance + crescent fan of frost shards
          const shardOffsets =
            state.stageLevel >= 6
              ? [-0.36, -0.18, 0, 0.18, 0.36]
              : [-0.24, 0, 0.24];
          for (const offset of shardOffsets) {
            const ang = enemy.aimAngle + offset;
            const isCenterLance = offset === 0;
            const spd = (isCenterLance ? 390 : 300) * projSpdMult;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 20,
              y: enemy.y + Math.sin(ang) * 20,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              radius: isCenterLance ? 9 : 6,
              damage: enemy.damage,
              color: '#67e8f9',
              life: 0,
              maxLife: 2.1,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'pyromancer') {
          enemy.stateDuration = 0.14;
          const baseAng = enemy.aimAngle;
          const spreads =
            state.stageLevel >= 6
              ? [-0.32, -0.16, 0, 0.16, 0.32]
              : [-0.2, 0, 0.2];
          for (const sp of spreads) {
            const ang = baseAng + sp;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 20,
              y: enemy.y + Math.sin(ang) * 20,
              vx: Math.cos(ang) * 270 * projSpdMult,
              vy: Math.sin(ang) * 270 * projSpdMult,
              radius: 10,
              damage: enemy.damage,
              color: '#f97316',
              life: 0,
              maxLife: 2.0,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'necro_weaver') {
          enemy.stateDuration = 0.14;
          const fan = [-0.26, 0, 0.26];
          for (const offset of fan) {
            const ang = enemy.aimAngle + offset;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 22,
              y: enemy.y + Math.sin(ang) * 22,
              vx: Math.cos(ang) * 300 * projSpdMult,
              vy: Math.sin(ang) * 300 * projSpdMult,
              radius: 7,
              damage: enemy.damage,
              color: '#10b981',
              life: 0,
              maxLife: 2.3,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
          // Summon a shadow stalker or wraith if fewer than 8 enemies in room
          if (state.enemies.length < 8 && enemy.phase < 2 + Math.floor(state.stageLevel / 5)) {
            enemy.phase += 1;
            const summonType: EnemyArchetype =
              state.stageLevel >= 6 && enemy.phase % 2 === 0 ? 'wraith' : 'stalker';
            const minion = createEnemy(
              state.nextEntityId++,
              summonType,
              enemy.x + Math.cos(enemy.aimAngle) * 36,
              enemy.y + Math.sin(enemy.aimAngle) * 36,
              state.stageLevel,
              state.currentRoomIndex,
              state.rooms.length
            );
            minion.maxHp = Math.round(minion.maxHp * 0.65);
            minion.hp = minion.maxHp;
            state.enemies.push(minion);
          }
        } else if (enemy.archetype === 'void_singularity') {
          enemy.stateDuration = 0.16;
          const orbCount = state.stageLevel >= 7 ? 8 : 6;
          for (let k = 0; k < orbCount; k++) {
            const ang = enemy.aimAngle + (k * Math.PI * 2) / orbCount;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 22,
              y: enemy.y + Math.sin(ang) * 22,
              vx: Math.cos(ang) * 255 * projSpdMult,
              vy: Math.sin(ang) * 255 * projSpdMult,
              radius: 8,
              damage: enemy.damage,
              color: '#a855f7',
              life: 0,
              maxLife: 2.4,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'sentinel') {
          enemy.stateDuration = 0.14;
          const beamCount = state.stageLevel >= 6 ? 8 : 4;
          for (let k = 0; k < beamCount; k++) {
            const ang = enemy.aimAngle + (k * Math.PI * 2) / beamCount;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 24,
              y: enemy.y + Math.sin(ang) * 24,
              vx: Math.cos(ang) * 340 * projSpdMult,
              vy: Math.sin(ang) * 340 * projSpdMult,
              radius: 8,
              damage: enemy.damage,
              color: '#38bdf8',
              life: 0,
              maxLife: 2.2,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'eclipse_inquisitor') {
          enemy.stateDuration = 0.18;
          // 8-way judgment star + aimed high-velocity spear trio
          for (let k = 0; k < 8; k++) {
            const ang = enemy.aimAngle + (k * Math.PI) / 4;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 24,
              y: enemy.y + Math.sin(ang) * 24,
              vx: Math.cos(ang) * 310 * projSpdMult,
              vy: Math.sin(ang) * 310 * projSpdMult,
              radius: 7,
              damage: Math.round(enemy.damage * 0.9),
              color: '#e879f9',
              life: 0,
              maxLife: 2.3,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
          for (const spearOffset of [-0.11, 0, 0.11]) {
            const sAng = enemy.aimAngle + spearOffset;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(sAng) * 26,
              y: enemy.y + Math.sin(sAng) * 26,
              vx: Math.cos(sAng) * 430 * projSpdMult,
              vy: Math.sin(sAng) * 430 * projSpdMult,
              radius: 9,
              damage: enemy.damage,
              color: '#fde047',
              life: 0,
              maxLife: 2.1,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        } else if (enemy.archetype === 'juggernaut') {
          enemy.stateDuration = 0.42;
        } else if (enemy.archetype === 'archon') {
          enemy.stateDuration = 0.22;
          const boltCount =
            (enemy.phase === 2 ? 10 : 6) + Math.min(4, Math.floor(state.stageLevel / 3) * 2);
          for (let b = 0; b < boltCount; b++) {
            const ang = enemy.aimAngle + (b * Math.PI * 2) / boltCount;
            state.projectiles.push({
              id: state.nextEntityId++,
              fromPlayer: false,
              x: enemy.x + Math.cos(ang) * 28,
              y: enemy.y + Math.sin(ang) * 28,
              vx: Math.cos(ang) * 290 * projSpdMult,
              vy: Math.sin(ang) * 290 * projSpdMult,
              radius: 9,
              damage: enemy.damage,
              color: '#fb7185',
              life: 0,
              maxLife: 2.6,
              pierceLeft: 1,
              hitEnemyIds: [],
            });
          }
        }
      }
    } else if (enemy.aiState === 'active') {
      enemy.stateTimer += enemyDt;

      if (
        enemy.archetype === 'stalker' ||
        enemy.archetype === 'wraith' ||
        enemy.archetype === 'solar_zealot'
      ) {
        const lungeSpeed =
          enemy.archetype === 'wraith'
            ? 540
            : enemy.archetype === 'solar_zealot'
            ? 490
            : 390;
        enemy.x += Math.cos(enemy.aimAngle) * lungeSpeed * enemyDt;
        enemy.y += Math.sin(enemy.aimAngle) * lungeSpeed * enemyDt;
        if (Math.hypot(p.x - enemy.x, p.y - enemy.y) <= p.radius + enemy.radius + 6) {
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      } else if (enemy.archetype === 'juggernaut') {
        const rushSpeed = 440;
        enemy.x += Math.cos(enemy.aimAngle) * rushSpeed * enemyDt;
        enemy.y += Math.sin(enemy.aimAngle) * rushSpeed * enemyDt;
        if (Math.hypot(p.x - enemy.x, p.y - enemy.y) <= p.radius + enemy.radius + 8) {
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      } else if (enemy.archetype === 'void_singularity') {
        const distToWell = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (distToWell <= 68 && enemy.stateTimer < 0.08) {
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      } else if (enemy.archetype === 'archon') {
        const distToBlast = Math.hypot(p.x - enemy.targetX, p.y - enemy.targetY);
        if (distToBlast <= 92 && enemy.stateTimer < 0.1) {
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      }

      if (enemy.stateTimer >= enemy.stateDuration) {
        enemy.aiState = 'recovery';
        enemy.stateTimer = 0;
        enemy.stateDuration =
          (enemy.archetype === 'juggernaut' ? 0.65 : 0.45) * Math.max(0.7, cdMult);
        if (enemy.hasAttackToken) {
          enemy.hasAttackToken = false;
          state.activeAttackTokens = Math.max(0, state.activeAttackTokens - 1);
        }
      }
    } else if (enemy.aiState === 'recovery') {
      enemy.stateTimer += enemyDt;
      if (enemy.stateTimer >= enemy.stateDuration) {
        enemy.aiState = 'move';
        enemy.stateTimer = 0;
      }
    }

    resolveCircleObstacles(enemy, state.pillars, state.arenaWidth, state.arenaHeight);
  }

  // Soft separation between living enemies
  for (let i = 0; i < state.enemies.length; i++) {
    const a = state.enemies[i];
    if (a.aiState === 'ko') continue;
    for (let j = i + 1; j < state.enemies.length; j++) {
      const b = state.enemies[j];
      if (b.aiState === 'ko') continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius + 4;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }

  // Update Projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    proj.life += simDt;
    proj.x += proj.vx * simDt;
    proj.y += proj.vy * simDt;

    let hitWall =
      proj.x < 36 ||
      proj.x > state.arenaWidth - 36 ||
      proj.y < 36 ||
      proj.y > state.arenaHeight - 36;
    if (!hitWall) {
      for (const pillar of state.pillars) {
        if (Math.hypot(proj.x - pillar.x, proj.y - pillar.y) <= pillar.radius + proj.radius) {
          hitWall = true;
          break;
        }
      }
    }

    if (hitWall || proj.life >= proj.maxLife) {
      state.projectiles.splice(i, 1);
      continue;
    }

    if (proj.fromPlayer) {
      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko' || proj.hitEnemyIds.includes(enemy.id)) continue;
        if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) <= enemy.radius + proj.radius) {
          proj.hitEnemyIds.push(enemy.id);
          proj.pierceLeft--;
          const hitAng = Math.atan2(proj.vy, proj.vx);
          damageEnemy(state, enemy, proj.damage, hitAng, 130, 0.025, events, true);
          if (proj.pierceLeft <= 0) {
            state.projectiles.splice(i, 1);
            break;
          }
        }
      }
    } else {
      if (Math.hypot(p.x - proj.x, p.y - proj.y) <= p.radius + proj.radius) {
        const hitAng = Math.atan2(proj.vy, proj.vx);
        damagePlayer(state, proj.damage, hitAng, events);
        state.projectiles.splice(i, 1);
      }
    }
  }

  // Update Pickups (Coins, Usable Roguelike Items, Hearts, Astral Shards)
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const item = state.pickups[i];
    item.life -= simDt;
    item.x += item.vx * simDt;
    item.y += item.vy * simDt;
    item.vx *= Math.pow(0.08, simDt);
    item.vy *= Math.pow(0.08, simDt);
    if (item.life <= 0) {
      state.pickups.splice(i, 1);
      continue;
    }
    const dx = p.x - item.x;
    const dy = p.y - item.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 155 && dist > 1) {
      item.x += (dx / dist) * 290 * simDt;
      item.y += (dy / dist) * 290 * simDt;
    }
    if (dist <= p.radius + 16) {
      if (item.kind === 'gold_coin') {
        p.coins += item.value;
        state.score += item.value * 5;
        events.coinCollected = true;
        events.particlesToSpawn.push({
          x: item.x,
          y: item.y,
          color: '#fbbf24',
          count: 6,
          speed: 110,
          size: 3,
        });
      } else if (item.kind === 'usable_item' && item.itemId) {
        addUsableItemToInventory(state, item.itemId, 1);
        state.score += 45;
        events.pickupCollected = true;
        events.particlesToSpawn.push({
          x: item.x,
          y: item.y,
          color: USABLE_ITEMS[item.itemId].accentColor,
          count: 10,
          speed: 140,
          size: 4,
        });
      } else if (item.kind === 'solar_heart') {
        p.hp = Math.min(p.maxHp, p.hp + item.value);
        events.pickupCollected = true;
        events.particlesToSpawn.push({
          x: item.x,
          y: item.y,
          color: '#10b981',
          count: 6,
          speed: 110,
          size: 3,
        });
      } else {
        p.essence = Math.min(p.maxEssence, p.essence + item.value);
        state.score += 35;
        grantPlayerXp(state, 22, events);
        events.pickupCollected = true;
        events.particlesToSpawn.push({
          x: item.x,
          y: item.y,
          color: '#38bdf8',
          count: 6,
          speed: 110,
          size: 3,
        });
      }
      state.pickups.splice(i, 1);
    }
  }

  // Check Room Completion
  const anyAliveOrKo = state.enemies.length > 0;
  const currentRoom = state.rooms[state.currentRoomIndex];
  if (
    currentRoom &&
    !currentRoom.cleared &&
    !anyAliveOrKo &&
    state.enemiesRemainingToSpawn.length === 0 &&
    state.outcome === 'none'
  ) {
    currentRoom.cleared = true;
    events.waveCleared = true;

    const allRoomsCleared = state.rooms.every((r) => r.cleared);
    if (allRoomsCleared || currentRoom.kind === 'boss') {
      state.outcome = 'victory';
      state.phase = 'gameover';
      state.score += 400 + state.stageLevel * 100;
      state.snapshot = createSnapshot(state, 'victory');
      events.outcomeTriggered = 'victory';
    } else {
      // Offer 3 relic blessings on room clear & unlock portal doors to next room
      const uncollected = RELIC_CATALOG.filter((r) => !state.collectedRelics.includes(r.id));
      state.relicChoices = (uncollected.length >= 3 ? uncollected : RELIC_CATALOG).slice(0, 3);
      state.waveBannerTimer = 2.4;
    }
  }

  return events;
}

function damageEnemy(
  state: ArenaWorldState,
  enemy: EnemyEntity,
  damage: number,
  knockbackAngle: number,
  knockbackForce: number,
  hitstop: number,
  events: SimulationEvents,
  allowChainArc = false
): void {
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hitFlashTimer = 0.06;
  enemy.vx += Math.cos(knockbackAngle) * knockbackForce;
  enemy.vy += Math.sin(knockbackAngle) * knockbackForce;
  enemy.scaleX = 1.25;
  enemy.scaleY = 0.76;

  state.hitstopTimer = Math.max(state.hitstopTimer, hitstop);
  state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.18);
  state.comboCount += 1;
  state.comboTimer = 3.2;
  events.enemiesHit += 1;

  events.particlesToSpawn.push({
    x: enemy.x,
    y: enemy.y,
    color: '#fef08a',
    count: 10,
    speed: 190,
    size: 4,
  });

  // Trigger Astral Chain Lightning skill on primary weapon hits
  const chainRank = state.player.skills.chain_arc ?? 0;
  if (allowChainArc && chainRank > 0) {
    const chainDamage = Math.round((14 + chainRank * 8) * state.player.damageMultiplier);
    let jumpsRemaining = chainRank;
    let sourceX = enemy.x;
    let sourceY = enemy.y;
    const chainedIds = new Set<number>([enemy.id]);

    while (jumpsRemaining > 0) {
      let nearest: EnemyEntity | null = null;
      let nearestDist = 195;
      for (const candidate of state.enemies) {
        if (candidate.aiState === 'ko' || chainedIds.has(candidate.id)) continue;
        const d = Math.hypot(candidate.x - sourceX, candidate.y - sourceY);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = candidate;
        }
      }
      if (!nearest) break;

      chainedIds.add(nearest.id);
      state.lightningArcs.push({
        x1: sourceX,
        y1: sourceY,
        x2: nearest.x,
        y2: nearest.y,
        life: 0,
        maxLife: 0.22,
      });
      const arcAngle = Math.atan2(nearest.y - sourceY, nearest.x - sourceX);
      sourceX = nearest.x;
      sourceY = nearest.y;
      jumpsRemaining--;
      damageEnemy(state, nearest, chainDamage, arcAngle, 80, 0.01, events, false);
    }
  }

  if (enemy.hp <= 0 && enemy.aiState !== 'ko') {
    enemy.aiState = 'ko';
    enemy.stateTimer = 0;
    enemy.stateDuration = 0.32;
    if (enemy.hasAttackToken) {
      enemy.hasAttackToken = false;
      state.activeAttackTokens = Math.max(0, state.activeAttackTokens - 1);
    }
    state.enemiesDefeated += 1;
    const comboMult = 1 + Math.min(2.0, state.comboCount * 0.1);
    state.score += Math.round(enemy.scoreValue * comboMult);
    state.bestScore = Math.max(state.bestScore, state.score);
    state.hitstopTimer = Math.max(state.hitstopTimer, 0.055);
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.3);
    events.enemiesKilled += 1;

    if (state.player.vampiricHeal > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.vampiricHeal);
      state.player.essence = Math.min(state.player.maxEssence, state.player.essence + 8);
    }

    // Grant XP for defeating enemy
    grantPlayerXp(state, enemy.xpValue, events);

    events.particlesToSpawn.push({
      x: enemy.x,
      y: enemy.y,
      color: enemy.archetype === 'archon' ? '#f59e0b' : '#f43f5e',
      count: enemy.archetype === 'archon' ? 28 : 16,
      speed: 240,
      size: 5,
    });

    // EVERY defeated enemy drops Solar Coins AND either a Usable Roguelike Item or Orb!
    const coinAmount =
      enemy.archetype === 'archon'
        ? 45
        : enemy.archetype === 'eclipse_inquisitor'
        ? 22
        : enemy.archetype === 'juggernaut' || enemy.archetype === 'sentinel'
        ? 16
        : enemy.archetype === 'void_singularity' ||
          enemy.archetype === 'necro_weaver' ||
          enemy.archetype === 'solar_zealot'
        ? 13
        : enemy.archetype === 'arcanist' ||
          enemy.archetype === 'pyromancer' ||
          enemy.archetype === 'frost_revenant'
        ? 10
        : 7;

    state.pickups.push({
      id: state.nextEntityId++,
      kind: 'gold_coin',
      x: enemy.x - 10,
      y: enemy.y,
      vx: -45,
      vy: -30,
      life: 16.0,
      value: coinAmount,
    });

    // Drop a usable roguelike item on every 2nd kill (or elite/boss kill), else drop Essence/Heart
    if (
      enemy.id % 2 === 0 ||
      enemy.archetype === 'juggernaut' ||
      enemy.archetype === 'eclipse_inquisitor' ||
      enemy.archetype === 'archon'
    ) {
      const itemIdx = (enemy.id + state.enemiesDefeated) % USABLE_ITEM_KEYS.length;
      const droppedItemId = USABLE_ITEM_KEYS[itemIdx];
      state.pickups.push({
        id: state.nextEntityId++,
        kind: 'usable_item',
        itemId: droppedItemId,
        x: enemy.x + 12,
        y: enemy.y,
        vx: 45,
        vy: -30,
        life: 18.0,
        value: 1,
      });
    } else {
      const dropHeart = enemy.id % 3 === 0;
      state.pickups.push({
        id: state.nextEntityId++,
        kind: dropHeart ? 'solar_heart' : 'astral_shard',
        x: enemy.x + 10,
        y: enemy.y,
        vx: 35,
        vy: 25,
        life: 14.0,
        value: dropHeart ? 16 : 22,
      });
    }
  }
}

function damagePlayer(
  state: ArenaWorldState,
  damage: number,
  knockbackAngle: number,
  events: SimulationEvents
): void {
  const p = state.player;
  if (p.invulnTimer > 0 || p.hp <= 0) return;

  if (p.aegisActive) {
    p.aegisActive = false;
    p.aegisTimer = 0;
    p.invulnTimer = 0.65;
    state.hitstopTimer = Math.max(state.hitstopTimer, 0.045);
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.25);
    events.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#10b981',
      count: 18,
      speed: 240,
      size: 4,
    });
    for (const enemy of state.enemies) {
      if (enemy.aiState === 'ko') continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 135) {
        const pushAng = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        damageEnemy(state, enemy, 20, pushAng, 280, 0.02, events, false);
      }
    }
    return;
  }

  p.hp = Math.max(0, p.hp - damage);
  p.invulnTimer = 0.55;
  p.hitFlashTimer = 0.08;
  p.vx += Math.cos(knockbackAngle) * 240;
  p.vy += Math.sin(knockbackAngle) * 240;
  p.scaleX = 1.26;
  p.scaleY = 0.74;

  state.damageTaken += damage;
  state.comboCount = 0;
  state.comboTimer = 0;
  state.hitstopTimer = Math.max(state.hitstopTimer, 0.065);
  state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.48);
  events.playerHurt = true;

  events.particlesToSpawn.push({
    x: p.x,
    y: p.y,
    color: '#ef4444',
    count: 16,
    speed: 220,
    size: 4,
  });
}

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';
export type OutcomeType = 'none' | 'victory' | 'defeat';
export type GameMode = 'standard' | 'daily_challenge' | 'boss_rush';
export type LeaderboardCategory = 'high_score' | 'speedrun' | 'daily_challenge' | 'boss_rush';

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

export interface WeaponEvolutionSpec {
  stanceId: WeaponStanceId;
  baseName: string;
  evolvedName: string;
  evolvedRoleClue: string;
  unlockLevel: number;
  synergyRelics: [string, string];
  synergyRelicNames: [string, string];
  passiveSummary: string;
  accentColor: string;
  secondaryColor: string;
  bonusDamageMultiplier: number;
  bonusRangeMultiplier: number;
}

export const WEAPON_EVOLUTIONS: Record<WeaponStanceId, WeaponEvolutionSpec> = {
  dawnblade: {
    stanceId: 'dawnblade',
    baseName: 'Dawnblade',
    evolvedName: 'Solar Greatsword',
    evolvedRoleClue: '3rd Slash Crescent Wave · +12 ESS',
    unlockLevel: 5,
    synergyRelics: ['corona_edge', 'solar_vessel'],
    synergyRelicNames: ['Corona Tempered Edge', 'Solar Heart Vessel'],
    passiveSummary:
      'Every 3rd slash unleashes a piercing crescent flame wave across enemy ranks.',
    accentColor: '#fbbf24',
    secondaryColor: '#f43f5e',
    bonusDamageMultiplier: 1.25,
    bonusRangeMultiplier: 1.18,
  },
  astral_bow: {
    stanceId: 'astral_bow',
    baseName: 'Astral Bow',
    evolvedName: 'Constellation Repeater',
    evolvedRoleClue: 'Ricochet Arrows · Exploding Star Trail',
    unlockLevel: 5,
    synergyRelics: ['astral_conduit', 'quicksilver_step'],
    synergyRelicNames: ['Astral Wellspring', 'Quicksilver Step'],
    passiveSummary:
      'Arrows ricochet between nearby enemies and leave volatile constellation stars that detonate.',
    accentColor: '#7dd3fc',
    secondaryColor: '#fde047',
    bonusDamageMultiplier: 1.22,
    bonusRangeMultiplier: 1.15,
  },
  chrono_scythe: {
    stanceId: 'chrono_scythe',
    baseName: 'Chrono Scythe',
    evolvedName: 'Singularity Harvester',
    evolvedRoleClue: 'Vortex Pull · Brief Time-Stop',
    unlockLevel: 5,
    synergyRelics: ['siphon_sigil', 'corona_edge'],
    synergyRelicNames: ['Umbral Siphon Sigil', 'Corona Tempered Edge'],
    passiveSummary:
      'Reaping slashes pull enemies into a singularity vortex and inflict a 1.2s Time-Stop.',
    accentColor: '#e879f9',
    secondaryColor: '#38bdf8',
    bonusDamageMultiplier: 1.25,
    bonusRangeMultiplier: 1.2,
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

export const MAX_PLAYER_LEVEL = 30;

export const SKILL_CATALOG: SkillSpec[] = [
  {
    id: 'solar_orbit',
    name: 'Orbiting Solar Blades',
    categoryTag: 'AUTONOMOUS ORBIT',
    accentColor: '#f59e0b',
    maxRank: 5,
    getDescription: (nextRank) =>
      `Summon ${nextRank + 1} rotating sun-blades around you that slice enemies on contact for ${16 + nextRank * 8} damage.`,
  },
  {
    id: 'chain_arc',
    name: 'Astral Chain Lightning',
    categoryTag: 'ARC DISCHARGE',
    accentColor: '#38bdf8',
    maxRank: 5,
    getDescription: (nextRank) =>
      `Weapon hits unleash a lightning bolt that leaps to ${nextRank} nearby target${nextRank > 1 ? 's' : ''} for ${14 + nextRank * 8} shock damage.`,
  },
  {
    id: 'blaze_trail',
    name: 'Ignis Dash Trail',
    categoryTag: 'DASH HAZARD',
    accentColor: '#fb7185',
    maxRank: 5,
    getDescription: (nextRank) =>
      `Dashing leaves scorching solar embers for ${(2.0 + nextRank * 0.5).toFixed(1)}s that burn enemies for ${16 + nextRank * 7} damage.`,
  },
  {
    id: 'phantom_echo',
    name: 'Phantom Strike Echo',
    categoryTag: 'WEAPON MASTERY',
    accentColor: '#c084fc',
    maxRank: 5,
    getDescription: (nextRank) =>
      `+${nextRank * 18}% melee cleave reach & +${nextRank * 10} bonus strike damage; Astral Bow fires +${nextRank * 2} extra arrows.`,
  },
  {
    id: 'supernova_surge',
    name: 'Eclipse Supernova',
    categoryTag: 'NOVA OVERDRIVE',
    accentColor: '#fbbf24',
    maxRank: 5,
    getDescription: (nextRank) =>
      `[E] Solar Nova radius +${nextRank * 32}px, cooldown -${Math.min(72, nextRank * 15)}%, and refunds 12 Essence on multi-hit.`,
  },
  {
    id: 'dawn_aegis',
    name: 'Dawn Aegis Ward',
    categoryTag: 'SOLAR BARRIER',
    accentColor: '#10b981',
    maxRank: 5,
    getDescription: (nextRank) =>
      `Forms a sacred barrier every ${Math.max(2.5, 8.5 - nextRank * 1.2).toFixed(1)}s that negates 1 incoming attack and blasts nearby foes.`,
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
// MERCENARY / FAMILIAR COMPANION SYSTEM (PENDAMPING ROH ASTRAL)
// ============================================================================
export type FamiliarId = 'ember_wisp' | 'aegis_cherub' | 'greed_imp';

export interface FamiliarSpec {
  id: FamiliarId;
  name: string;
  titleIndonesian: string;
  roleClue: string;
  description: string;
  hireCost: number;
  accentColor: string;
  secondaryColor: string;
}

export const FAMILIAR_KEYS: FamiliarId[] = ['ember_wisp', 'aegis_cherub', 'greed_imp'];

export const FAMILIAR_CATALOG: Record<FamiliarId, FamiliarSpec> = {
  ember_wisp: {
    id: 'ember_wisp',
    name: 'Ember Wisp',
    titleIndonesian: 'Roh Api Surya',
    roleClue: 'Auto-Fires Firebolts · Nearest Foe',
    description:
      'Menembakkan proyektil api otomatis ke musuh terdekat setiap 0.9 detik.',
    hireCost: 0,
    accentColor: '#fb7185',
    secondaryColor: '#fde047',
  },
  aegis_cherub: {
    id: 'aegis_cherub',
    name: 'Aegis Cherub',
    titleIndonesian: 'Kerub Perisai Suci',
    roleClue: 'Blocks 1 Attack · 20s Cooldown',
    description:
      'Memberikan perisai suci (shield) yang menahan 1 serangan penuh setiap 20 detik.',
    hireCost: 30,
    accentColor: '#38bdf8',
    secondaryColor: '#fef08a',
  },
  greed_imp: {
    id: 'greed_imp',
    name: 'Greed Imp',
    titleIndonesian: 'Imp Magnet Harta',
    roleClue: 'Room-Wide Loot Magnet · +20% Coins',
    description:
      'Otomatis menarik (magnet) semua koin, kristal XP, dan item dari seluruh ruangan.',
    hireCost: 35,
    accentColor: '#34d399',
    secondaryColor: '#fbbf24',
  },
};

// ============================================================================
// 30 STAGE LEVELS & MULTI-ROOM DUNGEON MAP SYSTEM
// ============================================================================
export const MAX_STAGE_LEVEL = 30;

export interface StageLevelSpec {
  stage: number;
  name: string;
  subtitle: string;
  roomCount: number;
  floorTint: string;
  borderTint: string;
}

export const STAGE_CATALOG: StageLevelSpec[] = [
  // Tier I: Sanctum Reclamation (Stages 1–10)
  { stage: 1, name: 'Outer Courtyard', subtitle: '4 Sanctum Rooms · Stalker & Wraith Patrol', roomCount: 4, floorTint: '#12101b', borderTint: '#3b2d4a' },
  { stage: 2, name: 'Hall of Dusk', subtitle: '5 Sanctum Rooms · Frost Revenant & Pyromancer', roomCount: 5, floorTint: '#141122', borderTint: '#433259' },
  { stage: 3, name: 'Obsidian Cloister', subtitle: '5 Sanctum Rooms · Juggernaut & Sentinel', roomCount: 5, floorTint: '#16111e', borderTint: '#4c345c' },
  { stage: 4, name: 'Sunken Reliquary', subtitle: '6 Sanctum Rooms · Void Singularity & Necro Coven', roomCount: 6, floorTint: '#101522', borderTint: '#2e4466' },
  { stage: 5, name: 'Astral Nave', subtitle: '6 Sanctum Rooms · Solar Zealot Vanguard', roomCount: 6, floorTint: '#131626', borderTint: '#384c78' },
  { stage: 6, name: 'Ashen Catacombs', subtitle: '7 Sanctum Rooms · Eclipse Inquisitor Order', roomCount: 7, floorTint: '#1b1118', borderTint: '#5e2b3f' },
  { stage: 7, name: 'Mirror Spire', subtitle: '8 Sanctum Rooms · Phantom Convergence', roomCount: 8, floorTint: '#151226', borderTint: '#513b78' },
  { stage: 8, name: 'Corona Forge', subtitle: '8 Sanctum Rooms · Molten Siege Phalanx', roomCount: 8, floorTint: '#1c1410', borderTint: '#6e4526' },
  { stage: 9, name: 'Abyssal Threshold', subtitle: '9 Sanctum Rooms · Grand Inquisitor Conclave', roomCount: 9, floorTint: '#120e1e', borderTint: '#582c82' },
  { stage: 10, name: 'Throne of Eclipse', subtitle: '10 Sanctum Rooms · Sovereign Vanguard', roomCount: 10, floorTint: '#1a0d18', borderTint: '#7a284b' },
  // Tier II: Astral Ascendancy (Stages 11–20)
  { stage: 11, name: 'Umbral Bastion', subtitle: '10 Sanctum Rooms · Shadow-Step Phalanx', roomCount: 10, floorTint: '#140f24', borderTint: '#4f357a' },
  { stage: 12, name: 'Cryo-Star Vault', subtitle: '10 Sanctum Rooms · Glacial Singularity Ring', roomCount: 10, floorTint: '#0f1826', borderTint: '#2c5882' },
  { stage: 13, name: 'Pyre of the Ancients', subtitle: '10 Sanctum Rooms · Solar Zealot Crusade', roomCount: 10, floorTint: '#211210', borderTint: '#803c28' },
  { stage: 14, name: 'Necropolis of Glass', subtitle: '11 Sanctum Rooms · Undying Weaver Covenant', roomCount: 11, floorTint: '#101c1a', borderTint: '#2a6b5d' },
  { stage: 15, name: 'Tribunal Citadel', subtitle: '11 Sanctum Rooms · Twin Inquisitor Executioners', roomCount: 11, floorTint: '#1c1026', borderTint: '#6e328a' },
  { stage: 16, name: 'Gravity Well Nexus', subtitle: '11 Sanctum Rooms · Event Horizon Crossfire', roomCount: 11, floorTint: '#130e24', borderTint: '#5c2d91' },
  { stage: 17, name: 'Blood Moon Gallery', subtitle: '11 Sanctum Rooms · Crimson Juggernaut Stampede', roomCount: 11, floorTint: '#220d16', borderTint: '#8c2447' },
  { stage: 18, name: 'Solaris Observatory', subtitle: '12 Sanctum Rooms · Cardinal Laser Matrix', roomCount: 12, floorTint: '#121828', borderTint: '#3b649c' },
  { stage: 19, name: 'Sanctum of Ash', subtitle: '12 Sanctum Rooms · Scorched Corona Crucible', roomCount: 12, floorTint: '#1f130e', borderTint: '#874c24' },
  { stage: 20, name: 'Eclipse Spire Apex', subtitle: '12 Sanctum Rooms · Arch-Sovereign Ascendancy', roomCount: 12, floorTint: '#1e0b22', borderTint: '#91296e' },
  // Tier III: Sovereign Omega Chronicle (Stages 21–30)
  { stage: 21, name: 'Riftwalker Outpost', subtitle: '12 Sanctum Rooms · Hyper-Velocity Assassins', roomCount: 12, floorTint: '#0e1722', borderTint: '#2e6f7d' },
  { stage: 22, name: 'Molten Core Foundry', subtitle: '12 Sanctum Rooms · Supernova Siege Battery', roomCount: 12, floorTint: '#24110c', borderTint: '#993d1f' },
  { stage: 23, name: 'Cathedral of Chains', subtitle: '13 Sanctum Rooms · Grand Warden Inquisition', roomCount: 13, floorTint: '#190f24', borderTint: '#6c2b8c' },
  { stage: 24, name: 'Starlight Mausoleum', subtitle: '13 Sanctum Rooms · Astral Phantom Legion', roomCount: 13, floorTint: '#101429', borderTint: '#3e4d9c' },
  { stage: 25, name: 'Singularity Core', subtitle: '13 Sanctum Rooms · Void Collapse Convergence', roomCount: 13, floorTint: '#160b26', borderTint: '#7a25a8' },
  { stage: 26, name: 'Infernal Sun Forge', subtitle: '13 Sanctum Rooms · Blazing Corona Vanguard', roomCount: 13, floorTint: '#26100e', borderTint: '#ad3526' },
  { stage: 27, name: 'Obsidian Pantheon', subtitle: '14 Sanctum Rooms · Immortal Sentinel Garrison', roomCount: 14, floorTint: '#14111f', borderTint: '#63478c' },
  { stage: 28, name: 'Nightfall Horizon', subtitle: '14 Sanctum Rooms · Eternal Eclipse Conclave', roomCount: 14, floorTint: '#11091c', borderTint: '#752291' },
  { stage: 29, name: 'Empyrean Crucible', subtitle: '14 Sanctum Rooms · Sovereign Honor Guard', roomCount: 14, floorTint: '#210c1c', borderTint: '#a12362' },
  { stage: 30, name: 'Omega Eclipse Throne', subtitle: '14 Sanctum Rooms · Supreme Archon of the Corona', roomCount: 14, floorTint: '#240816', borderTint: '#c91c50' },
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

export type HazardKind = 'solar_brazier' | 'spike_rune' | 'cursed_altar' | 'healing_fountain';
export type SpikeRunePhase = 'dormant' | 'warning' | 'active';

export interface SanctumHazardSpec {
  id: HazardKind;
  name: string;
  indonesianTitle: string;
  accentColor: string;
  summary: string;
  tacticalTip: string;
}

export const SANCTUM_HAZARD_CATALOG: Record<HazardKind, SanctumHazardSpec> = {
  solar_brazier: {
    id: 'solar_brazier',
    name: 'Solar Brazier',
    indonesianTitle: 'Tungku Api Surya',
    accentColor: '#fb923c',
    summary:
      'Strike with any melee swing, arrow, or Solar Nova to detonate a 155px fiery shockwave & burning ember field.',
    tacticalTip: 'Pukul tungku saat musuh berkumpul di dekatnya untuk ledakan AoE + knockback besar.',
  },
  spike_rune: {
    id: 'spike_rune',
    name: 'Spike Runes',
    indonesianTitle: 'Lantai Berduri Runik',
    accentColor: '#f43f5e',
    summary:
      'Cycles every few seconds (Dormant → Warning → Active). Impales enemies and careless players standing on active spikes.',
    tacticalTip:
      'Pancing monster atau gunakan knockback Chrono Scythe untuk mendorong musuh ke atas duri aktif.',
  },
  cursed_altar: {
    id: 'cursed_altar',
    name: 'Cursed Blood Altar',
    indonesianTitle: 'Altar Kutukan Darah',
    accentColor: '#e11d48',
    summary:
      'High-Risk High-Reward: Sacrifice 25% HP to gain a permanent +22% Damage buff and an immediate Relic blessing.',
    tacticalTip: 'Tekan [G] di dekat altar untuk mengorbankan 25% HP demi kekuatan permanen.',
  },
  healing_fountain: {
    id: 'healing_fountain',
    name: 'Sanctum Healing Fountain',
    indonesianTitle: 'Mata Air Suci',
    accentColor: '#10b981',
    summary:
      'Restores 40% Max Vitality, +45 Astral Essence, and refreshes Dash cooldown when blessed.',
    tacticalTip: 'Tekan [G] di dekat mata air setelah pertarungan berat atau setelah Cursed Altar.',
  },
};

export interface ArenaHazard {
  id: number;
  kind: HazardKind;
  x: number;
  y: number;
  radius: number;
  cooldown: number;
  cooldownMax: number;
  blastRadius: number;
  blastDamage: number;
  pulseTimer: number;
  spikePhase: SpikeRunePhase;
  cycleTimer: number;
  tickTimer: number;
  used: boolean;
  rewardLabel?: string;
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
  hazards: ArenaHazard[];
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
  accentColor: string;
  baseHp: number;
  baseDamage: number;
  baseSpeed: number;
  xpReward: number;
  coinReward: number;
  weaknessStance: WeaponStanceId;
  weaknessSummary: string;
  counterTip: string;
  movementPattern: string;
  attackPattern: string;
}

export const ENEMY_ARCHETYPE_KEYS: EnemyArchetype[] = [
  'stalker',
  'wraith',
  'arcanist',
  'frost_revenant',
  'pyromancer',
  'sentinel',
  'juggernaut',
  'necro_weaver',
  'void_singularity',
  'solar_zealot',
  'eclipse_inquisitor',
  'archon',
];

export const ENEMY_ARCHETYPE_CATALOG: Record<EnemyArchetype, EnemyArchetypeMetadata> = {
  stalker: {
    id: 'stalker',
    name: 'Void Stalker',
    minStage: 1,
    role: 'skirmisher',
    accentColor: '#f43f5e',
    baseHp: 50,
    baseDamage: 11,
    baseSpeed: 146,
    xpReward: 34,
    coinReward: 7,
    weaknessStance: 'dawnblade',
    weaknessSummary: 'Weak to [1] Dawnblade (+20% DMG) · Rapid sweeps interrupt its flank approach.',
    counterTip: 'Step perpendicular to its crimson telegraph line during the 0.36s windup.',
    movementPattern: 'Curved flank pursuit',
    attackPattern: 'Short-range crimson lunge',
  },
  wraith: {
    id: 'wraith',
    name: 'Blink Wraith',
    minStage: 1,
    role: 'assassin',
    accentColor: '#2dd4bf',
    baseHp: 42,
    baseDamage: 13,
    baseSpeed: 180,
    xpReward: 42,
    coinReward: 7,
    weaknessStance: 'chrono_scythe',
    weaknessSummary: 'Weak to [3] Chrono Scythe (+20% DMG) · Wide 240° reap catches its sinusoidal weave.',
    counterTip: 'Save Dash [Space] for its high-velocity teal blink-lunge and punish its recovery.',
    movementPattern: 'Diagonal sinusoidal weave',
    attackPattern: 'High-velocity phantom blink-slash',
  },
  arcanist: {
    id: 'arcanist',
    name: 'Rift Arcanist',
    minStage: 1,
    role: 'artillery',
    accentColor: '#a855f7',
    baseHp: 46,
    baseDamage: 14,
    baseSpeed: 114,
    xpReward: 45,
    coinReward: 10,
    weaknessStance: 'astral_bow',
    weaknessSummary: 'Weak to [2] Astral Bow (+20% DMG) · Piercing volleys out-range its kiting retreat.',
    counterTip: 'Use stone pillars to block its rift orbs or close distance with Dash.',
    movementPattern: 'Standoff kiting & lateral strafe',
    attackPattern: 'Stage-scaled rift orb volley',
  },
  frost_revenant: {
    id: 'frost_revenant',
    name: 'Frost Revenant',
    minStage: 2,
    role: 'controller',
    accentColor: '#67e8f9',
    baseHp: 54,
    baseDamage: 15,
    baseSpeed: 128,
    xpReward: 52,
    coinReward: 10,
    weaknessStance: 'dawnblade',
    weaknessSummary: 'Weak to [1] Dawnblade (+20% DMG) · Aggressive melee pressure breaks its figure-8 orbit.',
    counterTip: 'Avoid the fast center cryo-lance and slip between the outer crescent shards.',
    movementPattern: 'Figure-eight glacial glide',
    attackPattern: 'Piercing cryo-lance + crescent ice fan',
  },
  pyromancer: {
    id: 'pyromancer',
    name: 'Cinder Pyromancer',
    minStage: 2,
    role: 'artillery',
    accentColor: '#fb923c',
    baseHp: 58,
    baseDamage: 16,
    baseSpeed: 106,
    xpReward: 55,
    coinReward: 10,
    weaknessStance: 'astral_bow',
    weaknessSummary: 'Weak to [2] Astral Bow (+20% DMG) · Snipe from afar before its magma fan spreads.',
    counterTip: 'Trigger Solar Nova [E] to vaporize incoming magma fireballs in mid-air.',
    movementPattern: 'Mid-range thermal orbit',
    attackPattern: 'Spreading magma mortar fan',
  },
  sentinel: {
    id: 'sentinel',
    name: 'Solaris Sentinel',
    minStage: 3,
    role: 'controller',
    accentColor: '#38bdf8',
    baseHp: 145,
    baseDamage: 18,
    baseSpeed: 80,
    xpReward: 78,
    coinReward: 16,
    weaknessStance: 'chrono_scythe',
    weaknessSummary: 'Weak to [3] Chrono Scythe (+20% DMG) · Heavy armor cleaves stagger its construct core.',
    counterTip: 'Stand at a 45° diagonal angle relative to its cross-laser telegraph rays.',
    movementPattern: 'Relentless armored advance',
    attackPattern: 'Rotating 4-way / 8-way cardinal laser pulse',
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'Obsidian Juggernaut',
    minStage: 3,
    role: 'juggernaut',
    accentColor: '#f59e0b',
    baseHp: 175,
    baseDamage: 20,
    baseSpeed: 88,
    xpReward: 85,
    coinReward: 16,
    weaknessStance: 'chrono_scythe',
    weaknessSummary: 'Weak to [3] Chrono Scythe (+20% DMG) · High knockback halts its unstoppable march.',
    counterTip: 'Bait its golden bull-charge rectangle into a pillar and strike during its 0.65s recovery.',
    movementPattern: 'Heavy unstoppable march',
    attackPattern: 'Long-distance bull charge + shockwave',
  },
  necro_weaver: {
    id: 'necro_weaver',
    name: 'Necro Weaver',
    minStage: 4,
    role: 'summoner',
    accentColor: '#34d399',
    baseHp: 96,
    baseDamage: 15,
    baseSpeed: 98,
    xpReward: 72,
    coinReward: 13,
    weaknessStance: 'astral_bow',
    weaknessSummary: 'Weak to [2] Astral Bow (+20% DMG) · Piercing arrows hit both summoned minions and the summoner.',
    counterTip: 'Eliminate the Necro Weaver early before it summons additional Stalkers and Wraiths.',
    movementPattern: 'Wide ritual circle orbit',
    attackPattern: 'Tri-bolt curse fan + shadow minion summon',
  },
  void_singularity: {
    id: 'void_singularity',
    name: 'Void Singularity',
    minStage: 4,
    role: 'controller',
    accentColor: '#c084fc',
    baseHp: 115,
    baseDamage: 17,
    baseSpeed: 92,
    xpReward: 76,
    coinReward: 13,
    weaknessStance: 'astral_bow',
    weaknessSummary: 'Weak to [2] Astral Bow (+20% DMG) · Long-range volleys stay safely outside its gravity well.',
    counterTip: 'Dash [Space] cancels its gravitational pull during windup before the spiral orb burst.',
    movementPattern: 'Harmonic anchor drift + gravity well',
    attackPattern: 'Gravitational pull windup + spiral orb burst',
  },
  solar_zealot: {
    id: 'solar_zealot',
    name: 'Solar Zealot',
    minStage: 5,
    role: 'assassin',
    accentColor: '#facc15',
    baseHp: 92,
    baseDamage: 17,
    baseSpeed: 168,
    xpReward: 74,
    coinReward: 13,
    weaknessStance: 'dawnblade',
    weaknessSummary: 'Weak to [1] Dawnblade (+20% DMG) · Fast strikes duel its frenzied zig-zag rush.',
    counterTip: 'Watch out for the 2 lateral solar chakrams thrown sideways when it dashes.',
    movementPattern: 'Frenzied zig-zag rush (enrages below 60% HP)',
    attackPattern: 'Cleaving dash + twin lateral solar chakrams',
  },
  eclipse_inquisitor: {
    id: 'eclipse_inquisitor',
    name: 'Eclipse Inquisitor',
    minStage: 6,
    role: 'elite',
    accentColor: '#e879f9',
    baseHp: 260,
    baseDamage: 21,
    baseSpeed: 122,
    xpReward: 115,
    coinReward: 25,
    weaknessStance: 'chrono_scythe',
    weaknessSummary: 'Weak to [3] Chrono Scythe (+20% DMG) · Crushes its templar ward after a shadow-step.',
    counterTip: 'After it shadow-steps, dodge the aimed golden spear trio before weaving through the 8-way star.',
    movementPattern: 'Tactical shadow-step teleportation',
    attackPattern: '8-way judgment star + aimed triple lance burst',
  },
  archon: {
    id: 'archon',
    name: 'Archon of the Corona',
    minStage: 1,
    role: 'boss',
    accentColor: '#fb7185',
    baseHp: 1800,
    baseDamage: 24,
    baseSpeed: 104,
    xpReward: 520,
    coinReward: 85,
    weaknessStance: 'dawnblade',
    weaknessSummary: 'Weak to [1] Dawnblade (+20% DMG) · Rapid melee hits generate Essence for frequent Solar Novas.',
    counterTip: 'Move out of the 92px crimson annihilation circle and ignite Solar Braziers during Total Eclipse (<=50% HP) to shatter its ward.',
    movementPattern: 'Sanctum center orbital command',
    attackPattern: 'Multi-phase radial corona barrage + targeted annihilation blast + Total Eclipse Ward',
  },
};

export interface BestiaryEntryView {
  id: EnemyArchetype;
  name: string;
  role: EnemyArchetypeMetadata['role'];
  minStage: number;
  accentColor: string;
  unlocked: boolean;
  defeatedCount: number;
  scaledHp: number;
  scaledDamage: number;
  scaledSpeed: number;
  xpReward: number;
  coinReward: number;
  weaknessStance: WeaponStanceId;
  weaknessStanceName: string;
  weaknessSummary: string;
  counterTip: string;
  movementPattern: string;
  attackPattern: string;
}

export type ElementalDebuffId = 'burned' | 'slowed' | 'sundered';

export interface ElementalDebuffMetadata {
  id: ElementalDebuffId;
  name: string;
  titleIndonesian: string;
  shortLabel: string;
  effectTag: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  defaultDuration: number;
  tickInterval: number;
  playerSpeedMultiplier: number;
  enemySpeedMultiplier: number;
  damageTakenMultiplier?: number;
}

export const ELEMENTAL_DEBUFF_CATALOG: Record<ElementalDebuffId, ElementalDebuffMetadata> = {
  burned: {
    id: 'burned',
    name: 'Burned',
    titleIndonesian: 'Terbakar (Sengatan Surya)',
    shortLabel: 'BURN',
    effectTag: '-HP/s',
    accentColor: '#fb923c',
    borderColor: '#f97316',
    bgColor: '#431407',
    defaultDuration: 3.6,
    tickInterval: 0.6,
    playerSpeedMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
  },
  slowed: {
    id: 'slowed',
    name: 'Slowed',
    titleIndonesian: 'Melambat (Beku Astral)',
    shortLabel: 'SLOW',
    effectTag: '-35% SPD',
    accentColor: '#38bdf8',
    borderColor: '#67e8f9',
    bgColor: '#082f49',
    defaultDuration: 3.2,
    tickInterval: 0,
    playerSpeedMultiplier: 0.65,
    enemySpeedMultiplier: 0.55,
  },
  sundered: {
    id: 'sundered',
    name: 'Armor Sundered',
    titleIndonesian: 'Armor Rontok (Meltdown Surya)',
    shortLabel: 'SUNDER',
    effectTag: '+35% DMG',
    accentColor: '#f43f5e',
    borderColor: '#fb7185',
    bgColor: '#4c0519',
    defaultDuration: 6.0,
    tickInterval: 0,
    playerSpeedMultiplier: 1.0,
    enemySpeedMultiplier: 0.9,
    damageTakenMultiplier: 1.35,
  },
};

export type ElementalReactionId = 'thermal_shock' | 'solar_meltdown';

export interface ElementalReactionSpec {
  id: ElementalReactionId;
  name: string;
  indonesianTitle: string;
  recipeLabel: string;
  accentColor: string;
  secondaryColor: string;
  blastRadius: number;
  baseTrueDamage: number;
  summary: string;
}

export const ELEMENTAL_REACTION_CATALOG: Record<ElementalReactionId, ElementalReactionSpec> = {
  thermal_shock: {
    id: 'thermal_shock',
    name: 'Thermal Shock',
    indonesianTitle: 'Ledakan Uap Astral (Burned + Slowed)',
    recipeLabel: 'BURNED + SLOWED',
    accentColor: '#38bdf8',
    secondaryColor: '#fb923c',
    blastRadius: 155,
    baseTrueDamage: 34,
    summary:
      'Saat Burned dan Slowed bertemu pada musuh, memicu ledakan uap astral instan yang memberikan bonus True Damage dan menyebarkan debuff ke musuh di sekitarnya.',
  },
  solar_meltdown: {
    id: 'solar_meltdown',
    name: 'Solar Meltdown',
    indonesianTitle: 'Gelombang Suar Rontok Armor (3x Burn + Crit)',
    recipeLabel: '3x BURN + CRITICAL',
    accentColor: '#fde047',
    secondaryColor: '#f43f5e',
    blastRadius: 185,
    baseTrueDamage: 56,
    summary:
      'Serangan Critical Strike pada musuh dengan 3x Burn Stacks meledakkan seluruh tumpukan api menjadi gelombang suar yang merontokkan armor Elite/Boss (+35% DMG diterima).',
  },
};

export interface ActiveDebuffView {
  id: ElementalDebuffId;
  name: string;
  shortLabel: string;
  effectTag: string;
  remainingSeconds: number;
  maxSeconds: number;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  stacks: number;
}

export type CombatLogKind =
  | 'critical_strike'
  | 'relic_synergy'
  | 'perfect_dodge'
  | 'brazier_blast'
  | 'sanctum_blessing'
  | 'aegis_parry'
  | 'thermal_shock'
  | 'solar_meltdown'
  | 'total_eclipse'
  | 'eclipse_vulnerability';

export interface EclipseLightSource {
  x: number;
  y: number;
  radius: number;
  kind: 'player' | 'brazier_lit' | 'brazier_ignited';
  intensity: number;
}

export interface CombatLogEntry {
  id: number;
  kind: CombatLogKind;
  title: string;
  detail: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  age: number;
  duration: number;
}

export const COMBAT_LOG_STYLES: Record<
  CombatLogKind,
  {
    accentColor: string;
    borderColor: string;
    bgColor: string;
    defaultDuration: number;
  }
> = {
  critical_strike: {
    accentColor: '#fde047',
    borderColor: '#f59e0b',
    bgColor: '#291d07',
    defaultDuration: 3.2,
  },
  relic_synergy: {
    accentColor: '#e879f9',
    borderColor: '#c084fc',
    bgColor: '#261033',
    defaultDuration: 3.6,
  },
  perfect_dodge: {
    accentColor: '#38bdf8',
    borderColor: '#67e8f9',
    bgColor: '#08273a',
    defaultDuration: 3.2,
  },
  brazier_blast: {
    accentColor: '#fb923c',
    borderColor: '#f97316',
    bgColor: '#2e1307',
    defaultDuration: 3.0,
  },
  sanctum_blessing: {
    accentColor: '#34d399',
    borderColor: '#10b981',
    bgColor: '#062c21',
    defaultDuration: 3.2,
  },
  aegis_parry: {
    accentColor: '#67e8f9',
    borderColor: '#38bdf8',
    bgColor: '#0b2538',
    defaultDuration: 3.0,
  },
  thermal_shock: {
    accentColor: '#67e8f9',
    borderColor: '#fb923c',
    bgColor: '#0c2438',
    defaultDuration: 3.8,
  },
  solar_meltdown: {
    accentColor: '#fde047',
    borderColor: '#f43f5e',
    bgColor: '#3b0a1e',
    defaultDuration: 4.0,
  },
  total_eclipse: {
    accentColor: '#c084fc',
    borderColor: '#a855f7',
    bgColor: '#1e0b36',
    defaultDuration: 4.5,
  },
  eclipse_vulnerability: {
    accentColor: '#fde047',
    borderColor: '#fb923c',
    bgColor: '#3b1706',
    defaultDuration: 4.5,
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
  burnTimer: number;
  burnMaxTimer: number;
  burnTickTimer: number;
  burnStacks: number;
  slowTimer: number;
  slowMaxTimer: number;
  sunderTimer: number;
  sunderMaxTimer: number;
  thermalShockCooldown: number;
}

export interface ProjectileEntity {
  id: number;
  fromPlayer: boolean;
  kind?: 'standard' | 'solar_crescent' | 'astral_arrow' | 'ember_bolt';
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
  ricochetLeft?: number;
  starTrailTimer?: number;
  angle?: number;
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
  kind?: 'ember' | 'star_mine';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
  tickTimer: number;
}

export interface VortexVisual {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface ReactionVisual {
  id: number;
  kind: ElementalReactionId;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damageDealt: number;
}

export interface LightningArcVisual {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
  color?: string;
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
  activeFamiliar: FamiliarId | null;
  unlockedFamiliars: Partial<Record<FamiliarId, boolean>>;
  familiarX: number;
  familiarY: number;
  familiarOrbitAngle: number;
  familiarFireTimer: number;
  cherubShieldActive: boolean;
  cherubShieldTimer: number;
  speed: number;
  damageMultiplier: number;
  vampiricHeal: number;
  facingAngle: number;
  stance: WeaponStanceId;
  awakenedStances: Partial<Record<WeaponStanceId, boolean>>;
  dawnbladeSwingCount: number;
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
  burnTimer: number;
  burnMaxTimer: number;
  burnTickTimer: number;
  burnStacks: number;
  slowTimer: number;
  slowMaxTimer: number;
  perfectDodgeCooldown: number;
}

export interface RunSnapshot {
  outcome: OutcomeType;
  gameMode: GameMode;
  dailySeed: string;
  bossRushWavesCleared: number;
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
  awakenedStances: WeaponStanceId[];
  activeFamiliar?: FamiliarId | null;
}

export interface ArenaWorldState {
  phase: GamePhase;
  outcome: OutcomeType;
  gameMode: GameMode;
  dailySeed: string;
  scoreMultiplier: number;
  bossRushCycle: number;
  bossRushWavesCleared: number;
  stageLevel: number;
  rooms: DungeonRoom[];
  currentRoomIndex: number;
  roomTransitionCooldown: number;
  enemyFreezeTimer: number;
  arenaWidth: number;
  arenaHeight: number;
  pillars: ObstaclePillar[];
  hazards: ArenaHazard[];
  player: PlayerState;
  enemies: EnemyEntity[];
  projectiles: ProjectileEntity[];
  pickups: PickupEntity[];
  emberZones: EmberZoneEntity[];
  lightningArcs: LightningArcVisual[];
  vortexVisuals: VortexVisual[];
  reactionVisuals: ReactionVisual[];
  thermalShockCount: number;
  solarMeltdownCount: number;
  lastReactionTriggered: ElementalReactionId | null;
  totalEclipseActive: boolean;
  eclipseTransitionProgress: number;
  eclipseBannerTimer: number;
  bossVulnerabilityTimer: number;
  bossVulnerabilityMaxTimer: number;
  nextEntityId: number;
  wave: number;
  totalWaves: number;
  waveBannerTimer: number;
  levelUpBannerTimer: number;
  awakeningBannerTimer: number;
  lastAwakenedStance: WeaponStanceId | null;
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
  defeatedByArchetype: Partial<Record<EnemyArchetype, number>>;
  damageTaken: number;
  hitstopTimer: number;
  cameraTrauma: number;
  screenShakeTimer: number;
  screenShakeDuration: number;
  screenShakeIntensity: number;
  screenShakeAngle: number;
  lastScreenShakeReason: ScreenShakeReason;
  criticalStrikesCount: number;
  critCalloutTimer: number;
  lastCritX: number;
  lastCritY: number;
  lastCritDamage: number;
  novaPulseTimer: number;
  novaPulseX: number;
  novaPulseY: number;
  defeatDelayTimer: number;
  pendingLevelUps: number;
  skillChoices: SkillChoiceOption[];
  relicChoices: RelicOption[];
  collectedRelics: string[];
  combatLog: CombatLogEntry[];
  snapshot: RunSnapshot | null;
}

export type ScreenShakeReason =
  | 'none'
  | 'player_hurt'
  | 'critical_strike'
  | 'brazier_detonated';

export interface ScreenShakeSample {
  offsetX: number;
  offsetY: number;
  rotationRad: number;
  active: boolean;
  progress: number;
  reason: ScreenShakeReason;
}

export const SCREEN_SHAKE_PROFILES: Record<
  Exclude<ScreenShakeReason, 'none'>,
  {
    intensity: number;
    duration: number;
    traumaBoost: number;
    tintColor: string;
    label: string;
  }
> = {
  player_hurt: {
    intensity: 15.0,
    duration: 0.36,
    traumaBoost: 0.52,
    tintColor: '#ef4444',
    label: 'IMPACT TRAUMA',
  },
  critical_strike: {
    intensity: 9.5,
    duration: 0.24,
    traumaBoost: 0.32,
    tintColor: '#fde047',
    label: 'CRITICAL STRIKE',
  },
  brazier_detonated: {
    intensity: 13.5,
    duration: 0.32,
    traumaBoost: 0.44,
    tintColor: '#fb923c',
    label: 'BRAZIER BLAST',
  },
};

export function triggerScreenShake(
  state: ArenaWorldState,
  reason: Exclude<ScreenShakeReason, 'none'>,
  angle = 0,
  events?: SimulationEvents,
  customIntensity?: number
): void {
  const profile = SCREEN_SHAKE_PROFILES[reason];
  const nextIntensity = customIntensity ?? profile.intensity;
  if (state.screenShakeTimer <= 0 || nextIntensity >= state.screenShakeIntensity * 0.8) {
    state.screenShakeIntensity = nextIntensity;
    state.screenShakeDuration = profile.duration;
  }
  state.screenShakeTimer = Math.max(state.screenShakeTimer, profile.duration);
  state.screenShakeAngle = angle;
  state.lastScreenShakeReason = reason;
  state.cameraTrauma = Math.min(1, state.cameraTrauma + profile.traumaBoost);
  if (events) {
    events.screenShakeReason = reason;
  }
}

export function computeScreenShakeOffset(
  state: ArenaWorldState,
  elapsedTimeSec: number
): ScreenShakeSample {
  const timerRatio =
    state.screenShakeDuration > 0
      ? Math.max(0, Math.min(1, state.screenShakeTimer / state.screenShakeDuration))
      : 0;
  const traumaMag = state.cameraTrauma * state.cameraTrauma * 12;
  const impulseMag = state.screenShakeIntensity * Math.pow(timerRatio, 1.35);
  const totalMag = Math.max(traumaMag, impulseMag);

  if (totalMag < 0.15 || state.phase === 'title') {
    return {
      offsetX: 0,
      offsetY: 0,
      rotationRad: 0,
      active: false,
      progress: 0,
      reason: state.lastScreenShakeReason,
    };
  }

  const freq = state.lastScreenShakeReason === 'critical_strike' ? 58 : 46;
  const primaryWave = Math.sin(elapsedTimeSec * freq);
  const secondaryWave = Math.cos(elapsedTimeSec * (freq * 1.37) + 1.1);
  const dirX = Math.cos(state.screenShakeAngle);
  const dirY = Math.sin(state.screenShakeAngle);
  const perpX = -dirY;
  const perpY = dirX;

  const along = primaryWave * totalMag;
  const across = secondaryWave * totalMag * 0.62;
  const offsetX = Number((dirX * along + perpX * across).toFixed(2));
  const offsetY = Number((dirY * along + perpY * across).toFixed(2));
  const rotationRad = Number(
    (Math.sin(elapsedTimeSec * (freq * 0.85)) * (totalMag / 16) * 0.016).toFixed(5)
  );

  return {
    offsetX,
    offsetY,
    rotationRad,
    active: true,
    progress: Math.max(timerRatio, state.cameraTrauma),
    reason: state.lastScreenShakeReason,
  };
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
  cycleFamiliarJustPressed?: boolean;
  interactJustPressed?: boolean;
}

export interface SimulationEvents {
  playerSwung: WeaponStanceId | null;
  playerDashed: boolean;
  playerNova: boolean;
  playerLeveledUp: boolean;
  stanceAwakened: WeaponStanceId | null;
  itemUsed: UsableItemId | null;
  familiarFired?: boolean;
  cherubShieldBlocked?: boolean;
  brazierDetonated?: boolean;
  spikeTrapTriggered?: boolean;
  shrineActivated?: HazardKind | null;
  criticalStrike?: boolean;
  criticalHits?: number;
  perfectDodge?: boolean;
  relicSynergyTriggered?: boolean;
  elementalReaction?: ElementalReactionId;
  totalEclipseTriggered?: boolean;
  bossVulnerabilityTriggered?: boolean;
  screenShakeReason?: ScreenShakeReason;
  enemyDebuffApplied?: ElementalDebuffId;
  playerDebuffApplied?: ElementalDebuffId;
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
  const safeLevel = Math.max(1, Math.min(MAX_PLAYER_LEVEL, level));
  return Math.round(60 * Math.pow(1.18, safeLevel - 1) + (safeLevel - 1) * 12);
}

export function formatSpeedrunTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const clamped = Math.max(0.1, Math.min(86400, seconds));
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  const tenths = Math.floor((clamped - Math.floor(clamped)) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export interface DailyChallengeConfig {
  dateString: string;
  seedCode: string;
  seedNumber: number;
  stageLevel: number;
  awakenedStance: WeaponStanceId;
  awakenedStanceName: string;
  startingRelicId: string;
  startingRelicName: string;
  mutatorName: string;
  mutatorSummary: string;
  scoreMultiplier: number;
}

export function hashSeedString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function getDailyChallengeConfig(dateOverride?: string): DailyChallengeConfig {
  const dateString =
    dateOverride && /^\d{4}-\d{2}-\d{2}$/.test(dateOverride)
      ? dateOverride
      : new Date().toISOString().slice(0, 10);
  const compact = dateString.replace(/-/g, '');
  const seedCode = `SOLAR-${compact}`;
  const seedNumber = hashSeedString(seedCode);

  const stageLevel = 3 + (seedNumber % 18); // Deterministic stage between 3 and 20
  const stances: WeaponStanceId[] = ['dawnblade', 'astral_bow', 'chrono_scythe'];
  const awakenedStance = stances[seedNumber % stances.length];
  const awakenedStanceName = WEAPON_EVOLUTIONS[awakenedStance].evolvedName;

  const relicSpec = RELIC_CATALOG[(seedNumber >>> 3) % RELIC_CATALOG.length];
  const mutators = [
    {
      name: 'Blood Moon Overdrive',
      summary: '+20% Move Speed · +35% Score Multiplier',
      scoreMultiplier: 1.35,
    },
    {
      name: 'Astral Convergence',
      summary: '+45% Essence Regen · +25% Score Multiplier',
      scoreMultiplier: 1.25,
    },
    {
      name: 'Singularity Resonance',
      summary: '-25% Dash Cooldown · +30% Score Multiplier',
      scoreMultiplier: 1.3,
    },
  ];
  const mutator = mutators[(seedNumber >>> 5) % mutators.length];

  return {
    dateString,
    seedCode,
    seedNumber,
    stageLevel,
    awakenedStance,
    awakenedStanceName,
    startingRelicId: relicSpec.id,
    startingRelicName: relicSpec.name,
    mutatorName: mutator.name,
    mutatorSummary: mutator.summary,
    scoreMultiplier: mutator.scoreMultiplier,
  };
}

export interface SanctumLeaderboardRecord {
  uid: string;
  displayName: string;
  bestScore: number;
  highestStage: number;
  fastestClearTimeSec: number;
  dailySeed: string;
  dailyScore: number;
  bossRushWaves: number;
  bossRushScore: number;
  favoriteStance: WeaponStanceId;
  isCloud?: boolean;
  isCurrentUser?: boolean;
}

export const DEFAULT_SANCTUM_LEADERBOARD: SanctumLeaderboardRecord[] = [
  {
    uid: 'warden_valerius',
    displayName: 'Arch-Warden Valerius',
    bestScore: 18450,
    highestStage: 30,
    fastestClearTimeSec: 94,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 14200,
    bossRushWaves: 14,
    bossRushScore: 22600,
    favoriteStance: 'dawnblade',
  },
  {
    uid: 'warden_lyra',
    displayName: 'Lyra of the Corona',
    bestScore: 16280,
    highestStage: 28,
    fastestClearTimeSec: 102,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 12950,
    bossRushWaves: 12,
    bossRushScore: 19400,
    favoriteStance: 'astral_bow',
  },
  {
    uid: 'warden_kaelen',
    displayName: 'Kaelen Chrono-Reaper',
    bestScore: 14890,
    highestStage: 25,
    fastestClearTimeSec: 111,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 11840,
    bossRushWaves: 11,
    bossRushScore: 17850,
    favoriteStance: 'chrono_scythe',
  },
  {
    uid: 'warden_seraphina',
    displayName: 'Seraphina Dawnstar',
    bestScore: 13120,
    highestStage: 22,
    fastestClearTimeSec: 119,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 10620,
    bossRushWaves: 9,
    bossRushScore: 15200,
    favoriteStance: 'astral_bow',
  },
  {
    uid: 'warden_orion',
    displayName: 'Orion Void-Strider',
    bestScore: 11640,
    highestStage: 19,
    fastestClearTimeSec: 128,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 9540,
    bossRushWaves: 8,
    bossRushScore: 13900,
    favoriteStance: 'chrono_scythe',
  },
  {
    uid: 'warden_ignis',
    displayName: 'Solarius Ignis',
    bestScore: 9850,
    highestStage: 16,
    fastestClearTimeSec: 136,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 8420,
    bossRushWaves: 7,
    bossRushScore: 11800,
    favoriteStance: 'dawnblade',
  },
  {
    uid: 'warden_nyx',
    displayName: 'Nyx Astral-Weaver',
    bestScore: 8420,
    highestStage: 13,
    fastestClearTimeSec: 145,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 7350,
    bossRushWaves: 6,
    bossRushScore: 10200,
    favoriteStance: 'astral_bow',
  },
  {
    uid: 'warden_cassian',
    displayName: 'Cassian Vanguard',
    bestScore: 6940,
    highestStage: 10,
    fastestClearTimeSec: 158,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 6180,
    bossRushWaves: 5,
    bossRushScore: 8650,
    favoriteStance: 'dawnblade',
  },
  {
    uid: 'warden_thalassa',
    displayName: 'Thalassa Frost-Bane',
    bestScore: 5480,
    highestStage: 7,
    fastestClearTimeSec: 172,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 4920,
    bossRushWaves: 4,
    bossRushScore: 6900,
    favoriteStance: 'chrono_scythe',
  },
  {
    uid: 'warden_draven',
    displayName: 'Initiate Draven',
    bestScore: 3820,
    highestStage: 4,
    fastestClearTimeSec: 195,
    dailySeed: 'SOLAR-DAILY',
    dailyScore: 3450,
    bossRushWaves: 3,
    bossRushScore: 5100,
    favoriteStance: 'dawnblade',
  },
];

export function buildRankedLeaderboard(
  cloudEntries: SanctumLeaderboardRecord[],
  localEntry: SanctumLeaderboardRecord | null,
  category: LeaderboardCategory,
  currentDailySeed: string
): SanctumLeaderboardRecord[] {
  const byUid = new Map<string, SanctumLeaderboardRecord>();

  for (const champ of DEFAULT_SANCTUM_LEADERBOARD) {
    byUid.set(champ.uid, {
      ...champ,
      dailySeed: currentDailySeed,
    });
  }

  for (const c of cloudEntries) {
    byUid.set(c.uid, { ...c, isCloud: true });
  }

  if (localEntry) {
    const existing = byUid.get(localEntry.uid);
    if (existing) {
      byUid.set(localEntry.uid, {
        ...existing,
        displayName: localEntry.displayName || existing.displayName,
        bestScore: Math.max(existing.bestScore, localEntry.bestScore),
        highestStage: Math.max(existing.highestStage, localEntry.highestStage),
        fastestClearTimeSec: Math.min(existing.fastestClearTimeSec, localEntry.fastestClearTimeSec),
        dailySeed: localEntry.dailySeed || existing.dailySeed,
        dailyScore: Math.max(existing.dailyScore, localEntry.dailyScore),
        bossRushWaves: Math.max(existing.bossRushWaves, localEntry.bossRushWaves),
        bossRushScore: Math.max(existing.bossRushScore, localEntry.bossRushScore),
        favoriteStance: localEntry.favoriteStance || existing.favoriteStance,
        isCurrentUser: true,
        isCloud: Boolean(existing.isCloud || localEntry.isCloud),
      });
    } else {
      byUid.set(localEntry.uid, { ...localEntry, isCurrentUser: true });
    }
  }

  const all = Array.from(byUid.values());

  all.sort((a, b) => {
    if (category === 'speedrun') {
      if (b.highestStage !== a.highestStage) {
        return b.highestStage - a.highestStage;
      }
      if (a.fastestClearTimeSec !== b.fastestClearTimeSec) {
        return a.fastestClearTimeSec - b.fastestClearTimeSec;
      }
      return b.bestScore - a.bestScore;
    }
    if (category === 'daily_challenge') {
      if (b.dailyScore !== a.dailyScore) {
        return b.dailyScore - a.dailyScore;
      }
      return b.bestScore - a.bestScore;
    }
    if (category === 'boss_rush') {
      if (b.bossRushWaves !== a.bossRushWaves) {
        return b.bossRushWaves - a.bossRushWaves;
      }
      if (b.bossRushScore !== a.bossRushScore) {
        return b.bossRushScore - a.bossRushScore;
      }
      return b.bestScore - a.bestScore;
    }
    // Default: high_score
    if (b.bestScore !== a.bestScore) {
      return b.bestScore - a.bestScore;
    }
    if (b.highestStage !== a.highestStage) {
      return b.highestStage - a.highestStage;
    }
    return a.fastestClearTimeSec - b.fastestClearTimeSec;
  });

  return all.slice(0, 10);
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

export function createRoomHazards(
  roomIndex: number,
  stageLevel = 1,
  _kind: RoomKind = 'combat'
): ArenaHazard[] {
  const baseId = (roomIndex + 1) * 100;
  const variant = (roomIndex + stageLevel) % 3;
  const brazierBlastDmg = 68 + Math.max(0, stageLevel - 1) * 12;

  const brazierCoords =
    variant === 0
      ? [
          { x: 470, y: 300 },
          { x: 730, y: 460 },
        ]
      : variant === 1
      ? [
          { x: 470, y: 460 },
          { x: 730, y: 300 },
        ]
      : [
          { x: 390, y: 380 },
          { x: 810, y: 380 },
        ];

  const spikeCoords =
    variant === 0
      ? [
          { x: 730, y: 300, initialTimer: 0.4 },
          { x: 470, y: 460, initialTimer: 1.5 },
        ]
      : variant === 1
      ? [
          { x: 470, y: 300, initialTimer: 0.6 },
          { x: 730, y: 460, initialTimer: 1.7 },
        ]
      : [
          { x: 520, y: 310, initialTimer: 0.5 },
          { x: 680, y: 450, initialTimer: 1.6 },
        ];

  const hazards: ArenaHazard[] = [
    {
      id: baseId + 1,
      kind: 'solar_brazier',
      x: brazierCoords[0].x,
      y: brazierCoords[0].y,
      radius: 24,
      cooldown: 0,
      cooldownMax: 5.5,
      blastRadius: 155,
      blastDamage: brazierBlastDmg,
      pulseTimer: 0,
      spikePhase: 'dormant',
      cycleTimer: 0,
      tickTimer: 0,
      used: false,
    },
    {
      id: baseId + 2,
      kind: 'solar_brazier',
      x: brazierCoords[1].x,
      y: brazierCoords[1].y,
      radius: 24,
      cooldown: 0,
      cooldownMax: 5.5,
      blastRadius: 155,
      blastDamage: brazierBlastDmg,
      pulseTimer: 0,
      spikePhase: 'dormant',
      cycleTimer: 0,
      tickTimer: 0,
      used: false,
    },
    {
      id: baseId + 3,
      kind: 'spike_rune',
      x: spikeCoords[0].x,
      y: spikeCoords[0].y,
      radius: 38,
      cooldown: 0,
      cooldownMax: 0,
      blastRadius: 38,
      blastDamage: 34 + stageLevel * 6,
      pulseTimer: 0,
      spikePhase: 'dormant',
      cycleTimer: spikeCoords[0].initialTimer,
      tickTimer: 0,
      used: false,
    },
    {
      id: baseId + 4,
      kind: 'spike_rune',
      x: spikeCoords[1].x,
      y: spikeCoords[1].y,
      radius: 38,
      cooldown: 0,
      cooldownMax: 0,
      blastRadius: 38,
      blastDamage: 34 + stageLevel * 6,
      pulseTimer: 0,
      spikePhase: 'dormant',
      cycleTimer: spikeCoords[1].initialTimer,
      tickTimer: 0,
      used: false,
    },
    {
      id: baseId + 5,
      kind: 'cursed_altar',
      x: 460,
      y: 152,
      radius: 26,
      cooldown: 0,
      cooldownMax: 0,
      blastRadius: 90,
      blastDamage: 0,
      pulseTimer: 0,
      spikePhase: 'dormant',
      cycleTimer: 0,
      tickTimer: 0,
      used: false,
    },
    {
      id: baseId + 6,
      kind: 'healing_fountain',
      x: 740,
      y: 152,
      radius: 26,
      cooldown: 0,
      cooldownMax: 0,
      blastRadius: 90,
      blastDamage: 0,
      pulseTimer: 0,
      spikePhase: 'dormant',
      cycleTimer: 0,
      tickTimer: 0,
      used: false,
    },
  ];

  return hazards;
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

export function getBestiaryEntry(
  archetype: EnemyArchetype,
  stageLevel = 1,
  roomIdx = 0,
  totalRooms = 4,
  defeatedCount = 0
): BestiaryEntryView {
  const meta = ENEMY_ARCHETYPE_CATALOG[archetype];
  const profile = getStageDifficultyProfile(stageLevel, roomIdx, totalRooms);
  const stanceSpec = WEAPON_STANCES[meta.weaknessStance];
  const bossStageSurge =
    archetype === 'archon' ? 1 + Math.max(0, profile.stageLevel - 1) * 0.08 : 1;
  return {
    id: meta.id,
    name: meta.name,
    role: meta.role,
    minStage: meta.minStage,
    accentColor: meta.accentColor,
    unlocked: defeatedCount > 0,
    defeatedCount,
    scaledHp: Math.round(meta.baseHp * profile.hpMultiplier * bossStageSurge),
    scaledDamage: Math.round(meta.baseDamage * profile.damageMultiplier),
    scaledSpeed: Math.round(meta.baseSpeed * profile.speedMultiplier),
    xpReward: meta.xpReward,
    coinReward: meta.coinReward,
    weaknessStance: meta.weaknessStance,
    weaknessStanceName: `[${stanceSpec.keyBinding}] ${stanceSpec.name}`,
    weaknessSummary: meta.weaknessSummary,
    counterTip: meta.counterTip,
    movementPattern: meta.movementPattern,
    attackPattern: meta.attackPattern,
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
  totalRooms: number,
  seedOffset = 0
): EnemyArchetype[] {
  const profile = getStageDifficultyProfile(stageLevel, roomIdx, totalRooms);
  const unlocked = profile.unlockedArchetypes;
  const formation = selectRoomFormation(stageLevel, roomIdx, totalRooms);

  const pickUnlocked = (preferred: EnemyArchetype[], fallbackSeed: number): EnemyArchetype => {
    const valid = preferred.filter((a) => unlocked.includes(a));
    const pool = valid.length > 0 ? valid : unlocked;
    return pool[Math.abs(fallbackSeed + seedOffset) % pool.length];
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
    const seed = stageLevel * 7 + roomIdx * 5 + i * 3 + (seedOffset % 997);
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

export function generateBossRushGauntlet(cycle = 1): DungeonRoom[] {
  const safeCycle = Math.max(1, cycle);
  const effectiveStage = Math.min(MAX_STAGE_LEVEL, 5 + safeCycle);
  const waves: Array<{
    name: string;
    kind: RoomKind;
    formation: RoomFormationType;
    roster: EnemyArchetype[];
  }> = [
    {
      name: `Abyss I · Vanguard Elites (Cycle ${safeCycle})`,
      kind: 'entrance',
      formation: 'inquisitor_sanctum',
      roster: ['eclipse_inquisitor', 'solar_zealot', 'juggernaut', 'sentinel', 'wraith'],
    },
    {
      name: `Abyss II · Elemental Archons (Cycle ${safeCycle})`,
      kind: 'combat',
      formation: 'arcane_convergence',
      roster: [
        'frost_revenant',
        'pyromancer',
        'void_singularity',
        'necro_weaver',
        'eclipse_inquisitor',
      ],
    },
    {
      name: `Abyss III · Sovereign Vanguard (Cycle ${safeCycle})`,
      kind: 'combat',
      formation: 'sovereign_throne',
      roster: ['archon', 'solar_zealot', 'juggernaut', 'frost_revenant'],
    },
    {
      name: `Abyss IV · Tribunal Phalanx (Cycle ${safeCycle})`,
      kind: 'shrine',
      formation: 'siege_phalanx',
      roster: [
        'eclipse_inquisitor',
        'eclipse_inquisitor',
        'void_singularity',
        'juggernaut',
        'necro_weaver',
      ],
    },
    {
      name: `Abyss V · Twin Sovereign Apex (Cycle ${safeCycle})`,
      kind: 'boss',
      formation: 'sovereign_throne',
      roster: ['archon', 'archon', 'eclipse_inquisitor', 'solar_zealot', 'void_singularity'],
    },
  ];

  const rooms: DungeonRoom[] = waves.map((w, idx) => ({
    id: idx,
    name: w.name,
    kind: w.kind,
    formation: w.formation,
    difficultyRating: Number((effectiveStage * 1.35 + idx * 0.8 + (safeCycle - 1) * 1.5).toFixed(1)),
    gridX: idx,
    gridY: 0,
    cleared: false,
    visited: idx === 0,
    doors: [],
    roster: [...w.roster],
    pillars: createRoomPillars(idx + safeCycle, effectiveStage),
    hazards: createRoomHazards(idx + safeCycle, effectiveStage, w.kind),
  }));

  for (let i = 0; i < rooms.length - 1; i++) {
    rooms[i].doors.push({ dir: 'E', targetRoomId: i + 1 });
    rooms[i + 1].doors.push({ dir: 'W', targetRoomId: i });
  }

  return rooms;
}

export function generateDungeonMap(
  stageLevel: number,
  gameMode: GameMode = 'standard',
  seedOffset = 0
): DungeonRoom[] {
  if (gameMode === 'boss_rush') {
    return generateBossRushGauntlet(1);
  }

  const clampedStage = Math.max(1, Math.min(MAX_STAGE_LEVEL, stageLevel));
  const stageSpec = STAGE_CATALOG[clampedStage - 1] ?? STAGE_CATALOG[0];
  const totalRooms = Math.max(4, stageSpec.roomCount);

  // Layout coordinates on a 2D dungeon grid up to 14 rooms so rooms connect via E / N / W / S doors
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
    { x: 5, y: -1, name: 'Singularity Atrium' },
    { x: 6, y: -1, name: 'Solaris Citadel' },
    { x: 6, y: -2, name: 'Inquisitor Spire' },
    { x: 7, y: -2, name: 'Sovereign Apex' },
  ];

  const rooms: DungeonRoom[] = [];
  for (let i = 0; i < totalRooms; i++) {
    const isBoss = i === totalRooms - 1;
    const coord = gridCoords[i] ?? { x: i, y: -2, name: `Chamber ${i + 1}` };
    const kind: RoomKind =
      i === 0 ? 'entrance' : isBoss ? 'boss' : i === totalRooms - 2 ? 'shrine' : 'combat';
    const formation = selectRoomFormation(clampedStage + (seedOffset % 3), i, totalRooms);
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
      roster: buildRoomRoster(clampedStage, i, totalRooms, seedOffset),
      pillars: createRoomPillars(i + (seedOffset % 5), clampedStage),
      hazards: createRoomHazards(i + (seedOffset % 5), clampedStage, kind),
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
  const xpScale = 1 + Math.max(0, stageOrWave - 1) * 0.12;

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
    burnTimer: 0,
    burnMaxTimer: 3.6,
    burnTickTimer: 0.55,
    burnStacks: 0,
    slowTimer: 0,
    slowMaxTimer: 3.2,
    sunderTimer: 0,
    sunderMaxTimer: 6.0,
    thermalShockCooldown: 0,
  };

  if (archetype === 'stalker') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.stalker.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 17,
      speed: Math.round(146 * spdScale),
      damage: Math.round(11 * dmgScale),
      scoreValue: Math.round(120 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(34 * xpScale),
    };
  }

  if (archetype === 'wraith') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.wraith.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 15,
      speed: Math.round(180 * spdScale),
      damage: Math.round(13 * dmgScale),
      scoreValue: Math.round(150 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(42 * xpScale),
    };
  }

  if (archetype === 'arcanist') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.arcanist.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 18,
      speed: Math.round(114 * spdScale),
      damage: Math.round(14 * dmgScale),
      scoreValue: Math.round(160 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(45 * xpScale),
    };
  }

  if (archetype === 'frost_revenant') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.frost_revenant.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 18,
      speed: Math.round(128 * spdScale),
      damage: Math.round(15 * dmgScale),
      scoreValue: Math.round(185 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(52 * xpScale),
    };
  }

  if (archetype === 'pyromancer') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.pyromancer.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 19,
      speed: Math.round(106 * spdScale),
      damage: Math.round(16 * dmgScale),
      scoreValue: Math.round(195 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(55 * xpScale),
    };
  }

  if (archetype === 'necro_weaver') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.necro_weaver.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 20,
      speed: Math.round(98 * spdScale),
      damage: Math.round(15 * dmgScale),
      scoreValue: Math.round(225 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(72 * xpScale),
    };
  }

  if (archetype === 'void_singularity') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.void_singularity.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 21,
      speed: Math.round(92 * spdScale),
      damage: Math.round(17 * dmgScale),
      scoreValue: Math.round(235 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(76 * xpScale),
    };
  }

  if (archetype === 'solar_zealot') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.solar_zealot.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 17,
      speed: Math.round(168 * spdScale),
      damage: Math.round(17 * dmgScale),
      scoreValue: Math.round(230 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(74 * xpScale),
    };
  }

  if (archetype === 'sentinel') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.sentinel.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 23,
      speed: Math.round(80 * spdScale),
      damage: Math.round(18 * dmgScale),
      flankSign: 1,
      scoreValue: Math.round(240 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(78 * xpScale),
    };
  }

  if (archetype === 'juggernaut') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.juggernaut.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 25,
      speed: Math.round(88 * spdScale),
      damage: Math.round(20 * dmgScale),
      flankSign: 1,
      scoreValue: Math.round(260 * (1 + (stageOrWave - 1) * 0.1)),
      xpValue: Math.round(85 * xpScale),
    };
  }

  if (archetype === 'eclipse_inquisitor') {
    const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.eclipse_inquisitor.baseHp * hpScale);
    return {
      ...baseCommon,
      hp: maxHp,
      maxHp,
      radius: 24,
      speed: Math.round(122 * spdScale),
      damage: Math.round(21 * dmgScale),
      scoreValue: Math.round(360 * (1 + (stageOrWave - 1) * 0.12)),
      xpValue: Math.round(115 * xpScale),
    };
  }

  // Archon of the Corona Boss — Substantially fortified Sovereign HP pool across Stages 1–30
  const bossStageSurge = 1 + Math.max(0, stageOrWave - 1) * 0.08;
  const maxHp = Math.round(ENEMY_ARCHETYPE_CATALOG.archon.baseHp * hpScale * bossStageSurge);
  return {
    ...baseCommon,
    archetype: 'archon',
    hp: maxHp,
    maxHp,
    radius: 36,
    speed: Math.round(104 * spdScale),
    damage: Math.round(24 * dmgScale),
    flankSign: 1,
    scoreValue: Math.round(1600 * (1 + (stageOrWave - 1) * 0.18)),
    xpValue: Math.round(520 * xpScale),
  };
}

export function createInitialWorldState(
  initialPhase: GamePhase = 'title',
  bestScore = 0,
  stageLevel = 1,
  gameMode: GameMode = 'standard',
  dailyDateOverride?: string
): ArenaWorldState {
  const dailyConfig = getDailyChallengeConfig(dailyDateOverride);
  const resolvedStage =
    gameMode === 'daily_challenge'
      ? dailyConfig.stageLevel
      : gameMode === 'boss_rush'
      ? Math.max(6, stageLevel)
      : Math.max(1, Math.min(MAX_STAGE_LEVEL, stageLevel));

  const rooms = generateDungeonMap(
    resolvedStage,
    gameMode,
    gameMode === 'daily_challenge' ? dailyConfig.seedNumber : 0
  );
  const firstRoom = rooms[0];

  const state: ArenaWorldState = {
    phase: initialPhase,
    outcome: 'none',
    gameMode,
    dailySeed: dailyConfig.seedCode,
    scoreMultiplier:
      gameMode === 'daily_challenge'
        ? dailyConfig.scoreMultiplier
        : gameMode === 'boss_rush'
        ? 1.4
        : 1.0,
    bossRushCycle: 1,
    bossRushWavesCleared: 0,
    stageLevel: resolvedStage,
    rooms,
    currentRoomIndex: 0,
    roomTransitionCooldown: 0,
    enemyFreezeTimer: 0,
    arenaWidth: ARENA_WIDTH,
    arenaHeight: ARENA_HEIGHT,
    pillars: [...firstRoom.pillars],
    hazards: firstRoom.hazards,
    player: {
      x: ARENA_WIDTH * 0.5,
      y: ARENA_HEIGHT * 0.58,
      vx: 0,
      vy: 0,
      radius: 18,
      hp: gameMode === 'boss_rush' ? 180 : 100,
      maxHp: gameMode === 'boss_rush' ? 180 : 100,
      ghostHp: gameMode === 'boss_rush' ? 180 : 100,
      essence: 100,
      maxEssence: 100,
      essenceRegen: 14,
      level: gameMode === 'boss_rush' ? 3 : 1,
      xp: 0,
      xpToNextLevel: calculateXpForLevel(gameMode === 'boss_rush' ? 3 : 1),
      coins: gameMode === 'boss_rush' ? 50 : 15,
      // Start with Crimson Elixir (and Sunfire Bomb in Boss Rush) so player can test/use roguelike items immediately
      inventory:
        gameMode === 'boss_rush'
          ? [
              { itemId: 'crimson_elixir', count: 2 },
              { itemId: 'sunfire_bomb', count: 1 },
            ]
          : [{ itemId: 'crimson_elixir', count: 1 }],
      skills: {},
      orbitAngle: 0,
      orbitHitCooldowns: {},
      aegisActive: false,
      aegisTimer: 0,
      activeFamiliar: 'ember_wisp',
      unlockedFamiliars: {
        ember_wisp: true,
        ...(gameMode === 'boss_rush' ? { aegis_cherub: true, greed_imp: true } : {}),
      },
      familiarX: ARENA_WIDTH * 0.5 - 38,
      familiarY: ARENA_HEIGHT * 0.58 - 22,
      familiarOrbitAngle: 0,
      familiarFireTimer: 0.45,
      cherubShieldActive: true,
      cherubShieldTimer: 0,
      speed: 245,
      damageMultiplier: gameMode === 'boss_rush' ? 1.2 : 1,
      vampiricHeal: 0,
      facingAngle: -Math.PI * 0.5,
      stance: gameMode === 'daily_challenge' ? dailyConfig.awakenedStance : 'dawnblade',
      awakenedStances: {},
      dawnbladeSwingCount: 0,
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
      burnTimer: 0,
      burnMaxTimer: 3.6,
      burnTickTimer: 0.6,
      burnStacks: 0,
      slowTimer: 0,
      slowMaxTimer: 3.2,
      perfectDodgeCooldown: 0,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    emberZones: [],
    lightningArcs: [],
    vortexVisuals: [],
    reactionVisuals: [],
    thermalShockCount: 0,
    solarMeltdownCount: 0,
    lastReactionTriggered: null,
    totalEclipseActive: false,
    eclipseTransitionProgress: 0,
    eclipseBannerTimer: 0,
    bossVulnerabilityTimer: 0,
    bossVulnerabilityMaxTimer: 7.0,
    nextEntityId: 1,
    wave: 1,
    totalWaves: rooms.length,
    waveBannerTimer: 2.0,
    levelUpBannerTimer: 0,
    awakeningBannerTimer: 0,
    lastAwakenedStance: null,
    enemiesRemainingToSpawn: [...firstRoom.roster],
    spawnTimer: 1.3,
    activeAttackTokens: 0,
    maxAttackTokens: Math.min(6, MAX_CONCURRENT_ATTACKERS + Math.floor(resolvedStage / 3)),
    score: 0,
    bestScore,
    comboCount: 0,
    comboTimer: 0,
    elapsedSeconds: 0,
    enemiesDefeated: 0,
    defeatedByArchetype: {},
    damageTaken: 0,
    hitstopTimer: 0,
    cameraTrauma: 0,
    screenShakeTimer: 0,
    screenShakeDuration: 0.3,
    screenShakeIntensity: 0,
    screenShakeAngle: 0,
    lastScreenShakeReason: 'none',
    criticalStrikesCount: 0,
    critCalloutTimer: 0,
    lastCritX: ARENA_WIDTH * 0.5,
    lastCritY: ARENA_HEIGHT * 0.5,
    lastCritDamage: 0,
    novaPulseTimer: 0,
    novaPulseX: ARENA_WIDTH * 0.5,
    novaPulseY: ARENA_HEIGHT * 0.5,
    defeatDelayTimer: 0,
    pendingLevelUps: 0,
    skillChoices: [],
    relicChoices: [],
    collectedRelics: [],
    combatLog: [],
    snapshot: null,
  };

  if (gameMode === 'daily_challenge') {
    applyRelicChoice(state, dailyConfig.startingRelicId);
    awakenStance(state, dailyConfig.awakenedStance);
    if (dailyConfig.mutatorName === 'Blood Moon Overdrive') {
      state.player.speed = Math.round(state.player.speed * 1.2);
    } else if (dailyConfig.mutatorName === 'Astral Convergence') {
      state.player.essenceRegen = Number((state.player.essenceRegen * 1.45).toFixed(1));
    } else {
      state.player.dashCooldownMax = Number((state.player.dashCooldownMax * 0.75).toFixed(2));
    }
  } else if (gameMode === 'boss_rush') {
    awakenStance(state, 'dawnblade');
  }

  spawnNextWaveEnemy(state, 0);
  spawnNextWaveEnemy(state, 1);
  return state;
}

export function advanceBossRushAbyssCycle(state: ArenaWorldState): number {
  state.gameMode = 'boss_rush';
  state.bossRushCycle += 1;
  state.stageLevel = Math.min(MAX_STAGE_LEVEL, 5 + state.bossRushCycle);
  state.outcome = 'none';
  state.phase = 'playing';
  state.snapshot = null;
  state.rooms = generateBossRushGauntlet(state.bossRushCycle);
  state.currentRoomIndex = 0;
  state.wave = 1;
  state.totalWaves = state.rooms.length;
  state.pillars = [...state.rooms[0].pillars];
  state.hazards = state.rooms[0].hazards;
  state.enemies = [];
  state.projectiles = [];
  state.emberZones = [];
  state.vortexVisuals = [];
  state.reactionVisuals = [];
  state.lightningArcs = [];
  state.totalEclipseActive = false;
  state.eclipseTransitionProgress = 0;
  state.eclipseBannerTimer = 0;
  state.bossVulnerabilityTimer = 0;
  state.enemiesRemainingToSpawn = [...state.rooms[0].roster];
  state.spawnTimer = 1.0;
  state.waveBannerTimer = 2.4;
  state.player.hp = state.player.maxHp;
  state.player.ghostHp = state.player.maxHp;
  state.player.essence = state.player.maxEssence;
  state.player.invulnTimer = 2.0;
  state.player.burnTimer = 0;
  state.player.burnStacks = 0;
  state.player.slowTimer = 0;
  spawnNextWaveEnemy(state, 0);
  spawnNextWaveEnemy(state, 1);
  return state.bossRushCycle;
}

export function applyEnemyDebuff(
  enemy: EnemyEntity,
  debuffId: ElementalDebuffId,
  duration?: number,
  events?: SimulationEvents,
  state?: ArenaWorldState,
  stacksToAdd = 1
): void {
  if (enemy.aiState === 'ko' || enemy.hp <= 0) return;
  const spec = ELEMENTAL_DEBUFF_CATALOG[debuffId];
  const resolvedDuration = duration ?? spec.defaultDuration;

  if (debuffId === 'burned') {
    const wasActive = enemy.burnTimer > 0;
    enemy.burnTimer = Math.max(enemy.burnTimer, resolvedDuration);
    enemy.burnMaxTimer = Math.max(enemy.burnMaxTimer, enemy.burnTimer);
    enemy.burnStacks = Math.min(3, (wasActive ? enemy.burnStacks : 0) + Math.max(1, stacksToAdd));
    if (!wasActive || enemy.burnTickTimer <= 0) {
      enemy.burnTickTimer = spec.tickInterval;
    }
  } else if (debuffId === 'slowed') {
    enemy.slowTimer = Math.max(enemy.slowTimer, resolvedDuration);
    enemy.slowMaxTimer = Math.max(enemy.slowMaxTimer, enemy.slowTimer);
  } else if (debuffId === 'sundered') {
    enemy.sunderTimer = Math.max(enemy.sunderTimer, resolvedDuration);
    enemy.sunderMaxTimer = Math.max(enemy.sunderMaxTimer, enemy.sunderTimer);
  }

  if (events) {
    events.enemyDebuffApplied = debuffId;
  }

  // Automatic Elemental Reaction check: Thermal Shock (Burned + Slowed)
  if (
    state &&
    (debuffId === 'burned' || debuffId === 'slowed') &&
    enemy.burnTimer > 0.05 &&
    enemy.slowTimer > 0.05 &&
    enemy.thermalShockCooldown <= 0
  ) {
    triggerThermalShock(state, enemy, events);
  }
}

export function applyPlayerDebuff(
  state: ArenaWorldState,
  debuffId: ElementalDebuffId,
  duration?: number,
  events?: SimulationEvents
): void {
  const p = state.player;
  if (p.hp <= 0) return;
  const spec = ELEMENTAL_DEBUFF_CATALOG[debuffId];
  const resolvedDuration = duration ?? spec.defaultDuration;

  if (debuffId === 'burned') {
    const wasActive = p.burnTimer > 0;
    p.burnTimer = Math.max(p.burnTimer, resolvedDuration);
    p.burnMaxTimer = Math.max(p.burnMaxTimer, p.burnTimer);
    p.burnStacks = Math.min(3, (wasActive ? p.burnStacks : 0) + 1);
    if (!wasActive || p.burnTickTimer <= 0) {
      p.burnTickTimer = spec.tickInterval;
    }
  } else if (debuffId === 'slowed') {
    p.slowTimer = Math.max(p.slowTimer, resolvedDuration);
    p.slowMaxTimer = Math.max(p.slowMaxTimer, p.slowTimer);
  }

  if (events) {
    events.playerDebuffApplied = debuffId;
  }
}

export function cleansePlayerDebuffs(state: ArenaWorldState): void {
  const p = state.player;
  p.burnTimer = 0;
  p.burnStacks = 0;
  p.burnTickTimer = ELEMENTAL_DEBUFF_CATALOG.burned.tickInterval;
  p.slowTimer = 0;
}

export function getPlayerActiveDebuffs(player: PlayerState): ActiveDebuffView[] {
  const active: ActiveDebuffView[] = [];
  if (player.burnTimer > 0.04) {
    const spec = ELEMENTAL_DEBUFF_CATALOG.burned;
    active.push({
      id: 'burned',
      name: spec.name,
      shortLabel: spec.shortLabel,
      effectTag: spec.effectTag,
      remainingSeconds: Number(player.burnTimer.toFixed(1)),
      maxSeconds: Math.max(player.burnMaxTimer, spec.defaultDuration),
      accentColor: spec.accentColor,
      borderColor: spec.borderColor,
      bgColor: spec.bgColor,
      stacks: Math.max(1, player.burnStacks),
    });
  }
  if (player.slowTimer > 0.04) {
    const spec = ELEMENTAL_DEBUFF_CATALOG.slowed;
    active.push({
      id: 'slowed',
      name: spec.name,
      shortLabel: spec.shortLabel,
      effectTag: spec.effectTag,
      remainingSeconds: Number(player.slowTimer.toFixed(1)),
      maxSeconds: Math.max(player.slowMaxTimer, spec.defaultDuration),
      accentColor: spec.accentColor,
      borderColor: spec.borderColor,
      bgColor: spec.bgColor,
      stacks: 1,
    });
  }
  return active;
}

export function getEnemyActiveDebuffs(enemy: EnemyEntity): ActiveDebuffView[] {
  if (enemy.aiState === 'ko' || enemy.hp <= 0) return [];
  const active: ActiveDebuffView[] = [];
  if (enemy.burnTimer > 0.04) {
    const spec = ELEMENTAL_DEBUFF_CATALOG.burned;
    active.push({
      id: 'burned',
      name: spec.name,
      shortLabel: spec.shortLabel,
      effectTag: spec.effectTag,
      remainingSeconds: Number(enemy.burnTimer.toFixed(1)),
      maxSeconds: Math.max(enemy.burnMaxTimer, spec.defaultDuration),
      accentColor: spec.accentColor,
      borderColor: spec.borderColor,
      bgColor: spec.bgColor,
      stacks: Math.max(1, enemy.burnStacks),
    });
  }
  if (enemy.slowTimer > 0.04) {
    const spec = ELEMENTAL_DEBUFF_CATALOG.slowed;
    active.push({
      id: 'slowed',
      name: spec.name,
      shortLabel: spec.shortLabel,
      effectTag: spec.effectTag,
      remainingSeconds: Number(enemy.slowTimer.toFixed(1)),
      maxSeconds: Math.max(enemy.slowMaxTimer, spec.defaultDuration),
      accentColor: spec.accentColor,
      borderColor: spec.borderColor,
      bgColor: spec.bgColor,
      stacks: 1,
    });
  }
  if (enemy.sunderTimer > 0.04) {
    const spec = ELEMENTAL_DEBUFF_CATALOG.sundered;
    active.push({
      id: 'sundered',
      name: spec.name,
      shortLabel: spec.shortLabel,
      effectTag: spec.effectTag,
      remainingSeconds: Number(enemy.sunderTimer.toFixed(1)),
      maxSeconds: Math.max(enemy.sunderMaxTimer, spec.defaultDuration),
      accentColor: spec.accentColor,
      borderColor: spec.borderColor,
      bgColor: spec.bgColor,
      stacks: 1,
    });
  }
  return active;
}

export function getRoomEnemyDebuffSummary(state: ArenaWorldState): {
  burnedCount: number;
  slowedCount: number;
  sunderedCount: number;
} {
  let burnedCount = 0;
  let slowedCount = 0;
  let sunderedCount = 0;
  for (const enemy of state.enemies) {
    if (enemy.aiState === 'ko' || enemy.hp <= 0) continue;
    if (enemy.burnTimer > 0.04) burnedCount += 1;
    if (enemy.slowTimer > 0.04 || state.enemyFreezeTimer > 0.04) slowedCount += 1;
    if (enemy.sunderTimer > 0.04) sunderedCount += 1;
  }
  return { burnedCount, slowedCount, sunderedCount };
}

export function triggerThermalShock(
  state: ArenaWorldState,
  primaryEnemy: EnemyEntity,
  events?: SimulationEvents
): number {
  if (primaryEnemy.aiState === 'ko' || primaryEnemy.thermalShockCooldown > 0) {
    return 0;
  }

  const spec = ELEMENTAL_REACTION_CATALOG.thermal_shock;
  primaryEnemy.thermalShockCooldown = 1.4;

  const stacks = Math.max(1, primaryEnemy.burnStacks);
  const trueDmg = Math.round(
    (spec.baseTrueDamage + state.stageLevel * 5 + stacks * 8) * state.player.damageMultiplier
  );

  primaryEnemy.hp = Math.max(0, primaryEnemy.hp - trueDmg);
  primaryEnemy.hitFlashTimer = Math.max(primaryEnemy.hitFlashTimer, 0.1);
  primaryEnemy.scaleX = 1.28;
  primaryEnemy.scaleY = 0.74;

  state.reactionVisuals.push({
    id: state.nextEntityId++,
    kind: 'thermal_shock',
    x: primaryEnemy.x,
    y: primaryEnemy.y,
    radius: spec.blastRadius,
    life: 0,
    maxLife: 0.48,
    damageDealt: trueDmg,
  });

  state.thermalShockCount += 1;
  state.lastReactionTriggered = 'thermal_shock';
  state.score += Math.round(85 * state.scoreMultiplier);
  state.bestScore = Math.max(state.bestScore, state.score);
  triggerScreenShake(state, 'brazier_detonated', state.player.facingAngle, events, 9.5);

  pushCombatLog(
    state,
    'thermal_shock',
    'Elemental Reaction: Thermal Shock!',
    `Astral Steam Blast (-${trueDmg} True DMG · Spreads Debuffs)`
  );

  if (events) {
    events.elementalReaction = 'thermal_shock';
    events.particlesToSpawn.push(
      {
        x: primaryEnemy.x,
        y: primaryEnemy.y,
        color: '#67e8f9',
        count: 16,
        speed: 240,
        size: 4,
      },
      {
        x: primaryEnemy.x,
        y: primaryEnemy.y,
        color: '#fb923c',
        count: 14,
        speed: 210,
        size: 4,
      }
    );
  }

  // Spread Burned & Slowed debuffs and deal astral steam splash damage to nearby enemies
  const splashDmg = Math.round(trueDmg * 0.65);
  for (const other of state.enemies) {
    if (other.id === primaryEnemy.id || other.aiState === 'ko' || other.hp <= 0) continue;
    const dist = Math.hypot(other.x - primaryEnemy.x, other.y - primaryEnemy.y);
    if (dist <= spec.blastRadius + other.radius) {
      other.thermalShockCooldown = Math.max(other.thermalShockCooldown, 1.0);
      applyEnemyDebuff(other, 'burned', 2.8, events);
      applyEnemyDebuff(other, 'slowed', 2.4, events);
      other.hp = Math.max(0, other.hp - splashDmg);
      other.hitFlashTimer = Math.max(other.hitFlashTimer, 0.08);
      const pushAng = Math.atan2(other.y - primaryEnemy.y, other.x - primaryEnemy.x);
      other.vx += Math.cos(pushAng) * 145;
      other.vy += Math.sin(pushAng) * 145;
    }
  }

  return trueDmg;
}

export function triggerSolarMeltdown(
  state: ArenaWorldState,
  primaryEnemy: EnemyEntity,
  events?: SimulationEvents
): number {
  if (primaryEnemy.aiState === 'ko') {
    return 0;
  }

  const spec = ELEMENTAL_REACTION_CATALOG.solar_meltdown;
  const stacksConsumed = Math.max(3, primaryEnemy.burnStacks);
  primaryEnemy.burnStacks = 0;
  primaryEnemy.burnTimer = 0;

  // Sunder armor on primary target (+35% damage taken for 6.0s)
  applyEnemyDebuff(primaryEnemy, 'sundered', 6.0, events);

  const flareDmg = Math.round(
    (spec.baseTrueDamage + state.stageLevel * 6 + stacksConsumed * 12) *
      state.player.damageMultiplier
  );

  primaryEnemy.hp = Math.max(0, primaryEnemy.hp - flareDmg);
  primaryEnemy.hitFlashTimer = Math.max(primaryEnemy.hitFlashTimer, 0.12);
  primaryEnemy.scaleX = 1.36;
  primaryEnemy.scaleY = 0.66;

  state.reactionVisuals.push({
    id: state.nextEntityId++,
    kind: 'solar_meltdown',
    x: primaryEnemy.x,
    y: primaryEnemy.y,
    radius: spec.blastRadius,
    life: 0,
    maxLife: 0.55,
    damageDealt: flareDmg,
  });

  state.solarMeltdownCount += 1;
  state.lastReactionTriggered = 'solar_meltdown';
  state.score += Math.round(120 * state.scoreMultiplier);
  state.bestScore = Math.max(state.bestScore, state.score);
  triggerScreenShake(state, 'brazier_detonated', state.player.facingAngle, events, 12.0);

  pushCombatLog(
    state,
    'solar_meltdown',
    'Elemental Reaction: Solar Meltdown!',
    `3x Burn Flare (-${flareDmg} DMG · Armor Sundered +35%)`
  );

  if (events) {
    events.elementalReaction = 'solar_meltdown';
    events.particlesToSpawn.push(
      {
        x: primaryEnemy.x,
        y: primaryEnemy.y,
        color: '#fde047',
        count: 20,
        speed: 270,
        size: 5,
      },
      {
        x: primaryEnemy.x,
        y: primaryEnemy.y,
        color: '#f43f5e',
        count: 16,
        speed: 230,
        size: 4,
      }
    );
  }

  // Solar flare wave sunders armor and scorches nearby enemies
  const waveDmg = Math.round(flareDmg * 0.75);
  for (const other of state.enemies) {
    if (other.id === primaryEnemy.id || other.aiState === 'ko' || other.hp <= 0) continue;
    const dist = Math.hypot(other.x - primaryEnemy.x, other.y - primaryEnemy.y);
    if (dist <= spec.blastRadius + other.radius) {
      applyEnemyDebuff(other, 'sundered', 6.0, events);
      other.hp = Math.max(0, other.hp - waveDmg);
      other.hitFlashTimer = Math.max(other.hitFlashTimer, 0.09);
      const pushAng = Math.atan2(other.y - primaryEnemy.y, other.x - primaryEnemy.x);
      other.vx += Math.cos(pushAng) * 185;
      other.vy += Math.sin(pushAng) * 185;
    }
  }

  return flareDmg;
}

export function isBossOrEclipseCandidate(state: ArenaWorldState, enemy: EnemyEntity): boolean {
  if (enemy.archetype === 'archon') return true;
  if (state.gameMode === 'boss_rush' && enemy.archetype === 'eclipse_inquisitor') return true;
  return false;
}

export function triggerTotalEclipseEvent(
  state: ArenaWorldState,
  bossEnemy?: EnemyEntity,
  events?: SimulationEvents
): boolean {
  const targetBoss =
    bossEnemy ??
    state.enemies.find((e) => e.aiState !== 'ko' && isBossOrEclipseCandidate(state, e));
  if (targetBoss) {
    targetBoss.phase = Math.max(2, targetBoss.phase);
  }
  if (state.totalEclipseActive) return false;

  state.totalEclipseActive = true;
  state.eclipseTransitionProgress = 1.0;
  state.eclipseBannerTimer = 3.6;
  state.bossVulnerabilityTimer = 0;
  state.hitstopTimer = Math.max(state.hitstopTimer, 0.07);
  state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.55);

  // Ready all Solar Braziers in the chamber so the player can ignite them to pierce the Total Eclipse
  for (const hazard of state.hazards) {
    if (hazard.kind === 'solar_brazier') {
      hazard.cooldown = 0;
      hazard.pulseTimer = 0.65;
    }
  }

  triggerScreenShake(state, 'brazier_detonated', 0, events, 13.0);
  pushCombatLog(
    state,
    'total_eclipse',
    'Total Eclipse Unleashed!',
    'Visibility Narrowed · Ignite Solar Brazier to Weaken Boss!'
  );

  if (events) {
    events.totalEclipseTriggered = true;
    if (targetBoss) {
      events.particlesToSpawn.push({
        x: targetBoss.x,
        y: targetBoss.y,
        color: '#c084fc',
        count: 26,
        speed: 260,
        size: 5,
      });
    }
  }

  return true;
}

export function triggerBossVulnerabilityWindow(
  state: ArenaWorldState,
  brazier?: ArenaHazard,
  events?: SimulationEvents,
  duration = 7.0
): boolean {
  if (!state.totalEclipseActive) return false;

  state.bossVulnerabilityTimer = Math.max(state.bossVulnerabilityTimer, duration);
  state.bossVulnerabilityMaxTimer = Math.max(state.bossVulnerabilityMaxTimer, duration);

  const flareOriginX = brazier ? brazier.x : state.player.x;
  const flareOriginY = brazier ? brazier.y : state.player.y;
  const purifyDmg = Math.round((45 + state.stageLevel * 8) * state.player.damageMultiplier);

  for (const enemy of state.enemies) {
    if (enemy.aiState === 'ko' || enemy.hp <= 0) continue;
    if (isBossOrEclipseCandidate(state, enemy) || state.gameMode === 'boss_rush') {
      applyEnemyDebuff(enemy, 'sundered', duration, events);
      applyEnemyDebuff(enemy, 'burned', 5.0, events, undefined, 2);
      enemy.hp = Math.max(1, enemy.hp - purifyDmg);
      enemy.hitFlashTimer = 0.14;
      enemy.scaleX = 1.32;
      enemy.scaleY = 0.7;

      // Interrupt any active boss windup telegraph and stagger into recovery
      if (enemy.aiState === 'windup' || enemy.aiState === 'active') {
        enemy.aiState = 'recovery';
        enemy.stateTimer = 0;
        enemy.stateDuration = 0.95;
        if (enemy.hasAttackToken) {
          enemy.hasAttackToken = false;
          state.activeAttackTokens = Math.max(0, state.activeAttackTokens - 1);
        }
      }

      state.lightningArcs.push({
        x1: flareOriginX,
        y1: flareOriginY,
        x2: enemy.x,
        y2: enemy.y,
        life: 0,
        maxLife: 0.42,
        color: '#fde047',
      });
    }
  }

  pushCombatLog(
    state,
    'eclipse_vulnerability',
    'Boss Vulnerability Window!',
    `Solar Brazier Ignited · Boss Defense Broken (+50% DMG · ${duration.toFixed(0)}s)`
  );

  if (events) {
    events.bossVulnerabilityTriggered = true;
    events.particlesToSpawn.push({
      x: flareOriginX,
      y: flareOriginY,
      color: '#fde047',
      count: 24,
      speed: 280,
      size: 5,
    });
  }

  return true;
}

export function getEclipseLightSources(state: ArenaWorldState): EclipseLightSource[] {
  const sources: EclipseLightSource[] = [];
  const p = state.player;
  const playerRadius = state.novaPulseTimer > 0 ? 225 : state.bossVulnerabilityTimer > 0 ? 185 : 148;
  sources.push({
    x: p.x,
    y: p.y,
    radius: playerRadius,
    kind: 'player',
    intensity: 1.0,
  });

  for (const hazard of state.hazards) {
    if (hazard.kind !== 'solar_brazier') continue;
    const isRecentlyIgnited = hazard.cooldown > 0 || hazard.pulseTimer > 0;
    sources.push({
      x: hazard.x,
      y: hazard.y,
      radius: isRecentlyIgnited ? 265 : 175,
      kind: isRecentlyIgnited ? 'brazier_ignited' : 'brazier_lit',
      intensity: isRecentlyIgnited ? 1.0 : 0.88,
    });
  }

  return sources;
}

export function pushCombatLog(
  state: ArenaWorldState,
  kind: CombatLogKind,
  title: string,
  detail: string,
  duration?: number
): CombatLogEntry {
  const style = COMBAT_LOG_STYLES[kind];
  const resolvedDuration = duration ?? style.defaultDuration;

  // Deduplicate rapid identical combat log entries within 0.35s so multi-hit swings stay clean
  const latest = state.combatLog[state.combatLog.length - 1];
  if (latest && latest.kind === kind && latest.title === title && latest.age < 0.35) {
    latest.detail = detail;
    latest.age = 0;
    latest.duration = resolvedDuration;
    return latest;
  }

  const entry: CombatLogEntry = {
    id: state.nextEntityId++,
    kind,
    title,
    detail,
    accentColor: style.accentColor,
    borderColor: style.borderColor,
    bgColor: style.bgColor,
    age: 0,
    duration: resolvedDuration,
  };
  state.combatLog.push(entry);
  if (state.combatLog.length > 4) {
    state.combatLog.splice(0, state.combatLog.length - 4);
  }
  return entry;
}

export function tickCombatLog(state: ArenaWorldState, dt: number): void {
  if (dt <= 0 || state.combatLog.length === 0) return;
  for (let i = state.combatLog.length - 1; i >= 0; i--) {
    state.combatLog[i].age += dt;
    if (state.combatLog[i].age >= state.combatLog[i].duration) {
      state.combatLog.splice(i, 1);
    }
  }
}

export function getActiveCombatLogEntries(state: ArenaWorldState): CombatLogEntry[] {
  return state.combatLog
    .filter((entry) => entry.age < entry.duration)
    .map((entry) => ({ ...entry }));
}

export function isStanceAwakened(state: ArenaWorldState, stanceId: WeaponStanceId): boolean {
  return Boolean(state.player.awakenedStances[stanceId]);
}

export function awakenStance(
  state: ArenaWorldState,
  stanceId: WeaponStanceId,
  events?: SimulationEvents
): boolean {
  if (state.player.awakenedStances[stanceId]) return false;
  state.player.awakenedStances[stanceId] = true;
  state.lastAwakenedStance = stanceId;
  state.awakeningBannerTimer = 3.2;
  const evo = WEAPON_EVOLUTIONS[stanceId];
  pushCombatLog(
    state,
    'relic_synergy',
    'Relic Synergy Triggered!',
    `${evo.evolvedName} Awakened`
  );
  if (events) {
    events.stanceAwakened = stanceId;
    events.relicSynergyTriggered = true;
    events.particlesToSpawn.push({
      x: state.player.x,
      y: state.player.y,
      color: evo.accentColor,
      count: 24,
      speed: 250,
      size: 5,
    });
  }
  return true;
}

export function syncAwakenedStances(
  state: ArenaWorldState,
  events?: SimulationEvents
): WeaponStanceId[] {
  const newlyAwakened: WeaponStanceId[] = [];
  const stances: WeaponStanceId[] = ['dawnblade', 'astral_bow', 'chrono_scythe'];
  for (const stanceId of stances) {
    if (state.player.awakenedStances[stanceId]) continue;
    const spec = WEAPON_EVOLUTIONS[stanceId];
    const hasLevel = state.player.level >= spec.unlockLevel;
    const hasRelicSynergy = spec.synergyRelics.every((rel) =>
      state.collectedRelics.includes(rel)
    );
    if (hasLevel || hasRelicSynergy) {
      awakenStance(state, stanceId, events);
      newlyAwakened.push(stanceId);
    }
  }
  return newlyAwakened;
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
    cleansePlayerDebuffs(state);
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
    cleansePlayerDebuffs(state);
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
      if (enemy.aiState !== 'ko') {
        applyEnemyDebuff(enemy, 'slowed', 5.0, events, state);
      }
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
      stanceAwakened: null,
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
      applyEnemyDebuff(enemy, 'burned', 4.5, dummyEvents, state, 2);
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

export function hireOrEquipFamiliar(
  state: ArenaWorldState,
  familiarId: FamiliarId,
  forceFree = false
): boolean {
  const spec = FAMILIAR_CATALOG[familiarId];
  if (!spec) return false;
  const p = state.player;
  const alreadyUnlocked = Boolean(p.unlockedFamiliars[familiarId]);

  if (!alreadyUnlocked && !forceFree) {
    if (p.coins < spec.hireCost) return false;
    p.coins -= spec.hireCost;
  }

  p.unlockedFamiliars[familiarId] = true;
  p.activeFamiliar = familiarId;

  if (familiarId === 'aegis_cherub') {
    // When hiring Aegis Cherub for the first time, grant immediate shield
    if (!alreadyUnlocked) {
      p.cherubShieldActive = true;
      p.cherubShieldTimer = 0;
    }
  } else if (familiarId === 'ember_wisp') {
    p.familiarFireTimer = Math.min(p.familiarFireTimer, 0.35);
  }
  return true;
}

export function cycleActiveFamiliar(state: ArenaWorldState): FamiliarId | null {
  const p = state.player;
  const unlocked = FAMILIAR_KEYS.filter((k) => Boolean(p.unlockedFamiliars[k]));
  if (unlocked.length === 0) return null;
  if (!p.activeFamiliar) {
    p.activeFamiliar = unlocked[0];
    return p.activeFamiliar;
  }
  const idx = unlocked.indexOf(p.activeFamiliar);
  const next = unlocked[(idx + 1) % unlocked.length];
  p.activeFamiliar = next;
  return next;
}

export function findInteractableShrine(
  state: ArenaWorldState,
  maxRange = 90
): ArenaHazard | null {
  const p = state.player;
  let closest: ArenaHazard | null = null;
  let bestDist = maxRange;
  for (const h of state.hazards) {
    if ((h.kind === 'cursed_altar' || h.kind === 'healing_fountain') && !h.used) {
      const d = Math.hypot(h.x - p.x, h.y - p.y);
      if (d <= bestDist) {
        bestDist = d;
        closest = h;
      }
    }
  }
  return closest;
}

export function activateSanctumShrine(
  state: ArenaWorldState,
  hazardId?: number,
  events?: SimulationEvents
): { activated: boolean; kind?: HazardKind; rewardLabel?: string } {
  const p = state.player;
  if (p.hp <= 0) return { activated: false };

  let target: ArenaHazard | null = null;
  if (typeof hazardId === 'number') {
    target =
      state.hazards.find(
        (h) =>
          h.id === hazardId &&
          (h.kind === 'cursed_altar' || h.kind === 'healing_fountain') &&
          !h.used
      ) ?? null;
  } else {
    target = findInteractableShrine(state, 95);
  }

  if (!target || target.used) return { activated: false };

  if (target.kind === 'cursed_altar') {
    // High-Risk High-Reward: sacrifice 25% of Max HP (always leaving at least 1 HP)
    const sacrificeHp = Math.min(p.hp - 1, Math.max(1, Math.round(p.maxHp * 0.25)));
    if (p.hp > 1) {
      p.hp = Math.max(1, p.hp - sacrificeHp);
      state.damageTaken += sacrificeHp;
    }
    p.hitFlashTimer = 0.14;
    applyPlayerDebuff(state, 'burned', 3.6, events);
    applyPlayerDebuff(state, 'slowed', 2.8, events);
    triggerScreenShake(
      state,
      'player_hurt',
      Math.atan2(p.y - target.y, p.x - target.x),
      events,
      11.5
    );

    // Grant permanent +22% Attack Damage multiplier
    p.damageMultiplier = Number((p.damageMultiplier + 0.22).toFixed(2));

    // Also grant an uncollected Rare Relic blessing (prefer offensive/utility relics so blood sacrifice stays high-risk)
    const uncollected = RELIC_CATALOG.filter(
      (r) => !state.collectedRelics.includes(r.id) && r.id !== 'solar_vessel'
    );
    const fallbackUncollected = RELIC_CATALOG.filter(
      (r) => !state.collectedRelics.includes(r.id)
    );
    const pool = uncollected.length > 0 ? uncollected : fallbackUncollected;
    let grantedRelicName = 'Blood Awakening';
    if (pool.length > 0) {
      const picked = pool[(state.stageLevel + state.currentRoomIndex) % pool.length];
      const savedChoices = [...state.relicChoices];
      applyRelicChoice(state, picked.id);
      state.relicChoices = savedChoices;
      grantedRelicName = picked.name;
    } else {
      p.damageMultiplier = Number((p.damageMultiplier + 0.12).toFixed(2));
    }

    target.used = true;
    target.pulseTimer = 0.6;
    target.rewardLabel = `-25% HP → +22% DMG & ${grantedRelicName.toUpperCase()}`;
    state.score += Math.round(180 * state.scoreMultiplier);
    pushCombatLog(
      state,
      'relic_synergy',
      'Relic Synergy Triggered!',
      `Cursed Blood Pact · +22% DMG & ${grantedRelicName}`
    );

    if (events) {
      events.shrineActivated = 'cursed_altar';
      events.relicSynergyTriggered = true;
      events.particlesToSpawn.push({
        x: target.x,
        y: target.y,
        color: '#e11d48',
        count: 22,
        speed: 220,
        size: 5,
      });
    }
    return {
      activated: true,
      kind: 'cursed_altar',
      rewardLabel: target.rewardLabel,
    };
  }

  if (target.kind === 'healing_fountain') {
    const healAmount = Math.max(25, Math.round(p.maxHp * 0.4));
    p.hp = Math.min(p.maxHp, p.hp + healAmount);
    p.ghostHp = Math.max(p.ghostHp, p.hp);
    p.essence = Math.min(p.maxEssence, p.essence + 45);
    p.dashCooldown = 0;
    cleansePlayerDebuffs(state);

    target.used = true;
    target.pulseTimer = 0.6;
    target.rewardLabel = `+${healAmount} HP & +45 ESSENCE`;
    state.score += Math.round(100 * state.scoreMultiplier);
    pushCombatLog(
      state,
      'sanctum_blessing',
      'Sanctum Blessing!',
      `+${healAmount} HP · +45 ESS & Debuffs Cleansed`
    );

    if (events) {
      events.shrineActivated = 'healing_fountain';
      events.particlesToSpawn.push({
        x: target.x,
        y: target.y,
        color: '#10b981',
        count: 20,
        speed: 190,
        size: 4,
      });
    }
    return {
      activated: true,
      kind: 'healing_fountain',
      rewardLabel: target.rewardLabel,
    };
  }

  return { activated: false };
}

export function detonateSolarBrazier(
  state: ArenaWorldState,
  brazier: ArenaHazard,
  events?: SimulationEvents
): number {
  if (brazier.kind !== 'solar_brazier' || brazier.cooldown > 0) return 0;

  brazier.cooldown = brazier.cooldownMax;
  brazier.pulseTimer = 0.48;

  const p = state.player;
  const blastDamage = Math.round(brazier.blastDamage * p.damageMultiplier);
  let enemiesHit = 0;

  const targetEvents: SimulationEvents = events ?? {
    playerSwung: null,
    playerDashed: false,
    playerNova: false,
    playerLeveledUp: false,
    stanceAwakened: null,
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

  targetEvents.brazierDetonated = true;
  const shakeAngle = Math.atan2(p.y - brazier.y, p.x - brazier.x);
  triggerScreenShake(state, 'brazier_detonated', shakeAngle, targetEvents);
  pushCombatLog(
    state,
    'brazier_blast',
    'Solar Brazier Detonated!',
    `Fiery Shockwave (${blastDamage} AoE DMG)`
  );
  targetEvents.particlesToSpawn.push({
    x: brazier.x,
    y: brazier.y,
    color: '#fb923c',
    count: 24,
    speed: 260,
    size: 5,
  });

  // If the player stands close to the detonating brazier, the solar thermal wave applies a non-lethal BURNED status
  if (Math.hypot(p.x - brazier.x, p.y - brazier.y) <= brazier.blastRadius + 24) {
    applyPlayerDebuff(state, 'burned', 3.0, targetEvents);
  }

  for (const enemy of state.enemies) {
    if (enemy.aiState === 'ko') continue;
    const dist = Math.hypot(enemy.x - brazier.x, enemy.y - brazier.y);
    if (dist <= brazier.blastRadius + enemy.radius) {
      enemiesHit += 1;
      const blastAng = Math.atan2(enemy.y - brazier.y, enemy.x - brazier.x);
      applyEnemyDebuff(enemy, 'burned', 4.5, targetEvents, state, 2);
      damageEnemy(
        state,
        enemy,
        blastDamage,
        blastAng,
        320,
        0.035,
        targetEvents,
        false
      );
    }
  }

  // Spawn a burning Solar Ember field around the detonated brazier
  state.emberZones.push({
    id: state.nextEntityId++,
    kind: 'ember',
    x: brazier.x,
    y: brazier.y,
    radius: 74,
    life: 2.8,
    maxLife: 2.8,
    damage: Math.round(20 * p.damageMultiplier),
    tickTimer: 0.25,
  });

  // Vaporize enemy projectiles caught in the brazier shockwave
  state.projectiles = state.projectiles.filter(
    (proj) =>
      proj.fromPlayer ||
      Math.hypot(proj.x - brazier.x, proj.y - brazier.y) > brazier.blastRadius
  );

  // If Total Eclipse is active in a Boss / Boss Rush chamber, igniting a Solar Brazier shatters the Boss's Umbral Ward!
  if (state.totalEclipseActive) {
    triggerBossVulnerabilityWindow(state, brazier, targetEvents, 7.0);
  }

  return enemiesHit;
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
  state.hazards = targetRoom.hazards;
  state.projectiles = [];
  state.emberZones = [];
  state.lightningArcs = [];
  state.vortexVisuals = [];
  state.reactionVisuals = [];
  state.totalEclipseActive = false;
  state.eclipseTransitionProgress = 0;
  state.eclipseBannerTimer = 0;
  state.bossVulnerabilityTimer = 0;
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
  p.familiarX = p.x - 36;
  p.familiarY = p.y - 22;
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
  if (p.level >= MAX_PLAYER_LEVEL) {
    p.xp = Math.min(p.xpToNextLevel, p.xp + amount);
    return false;
  }
  p.xp += amount;
  let leveledUp = false;

  while (p.xp >= p.xpToNextLevel && p.level < MAX_PLAYER_LEVEL) {
    p.xp -= p.xpToNextLevel;
    p.level += 1;
    p.xpToNextLevel = calculateXpForLevel(p.level);
    p.hp = Math.min(p.maxHp, p.hp + 15);
    p.ghostHp = Math.max(p.ghostHp, p.hp);
    p.essence = Math.min(p.maxEssence, p.essence + 25);
    state.pendingLevelUps += 1;
    state.levelUpBannerTimer = 2.0;
    leveledUp = true;
  }

  if (p.level >= MAX_PLAYER_LEVEL) {
    p.xp = Math.min(p.xp, p.xpToNextLevel);
  }

  if (leveledUp) {
    syncAwakenedStances(state, events);
    if (state.skillChoices.length === 0 && state.pendingLevelUps > 0) {
      const choices = rollSkillChoices(state);
      if (choices.length > 0) {
        state.skillChoices = choices;
        state.pendingLevelUps -= 1;
      } else {
        // When all skill ranks are maxed on the road to Level 30, grant Ascension stat empowerment
        p.damageMultiplier = Number((p.damageMultiplier + 0.06 * state.pendingLevelUps).toFixed(2));
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
  pushCombatLog(
    state,
    'relic_synergy',
    'Relic Synergy Triggered!',
    `${relic.name} · ${relic.statTag}`
  );
  syncAwakenedStances(state);
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
  const awakenedStances = (['dawnblade', 'astral_bow', 'chrono_scythe'] as WeaponStanceId[]).filter(
    (st) => Boolean(state.player.awakenedStances[st])
  );

  return {
    outcome,
    gameMode: state.gameMode,
    dailySeed: state.dailySeed,
    bossRushWavesCleared: state.bossRushWavesCleared,
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
    awakenedStances,
    activeFamiliar: state.player.activeFamiliar,
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
    stanceAwakened: null,
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
  state.screenShakeTimer = Math.max(0, state.screenShakeTimer - dt);
  state.critCalloutTimer = Math.max(0, state.critCalloutTimer - dt);
  state.waveBannerTimer = Math.max(0, state.waveBannerTimer - dt);
  state.levelUpBannerTimer = Math.max(0, state.levelUpBannerTimer - dt);
  state.awakeningBannerTimer = Math.max(0, state.awakeningBannerTimer - dt);
  state.novaPulseTimer = Math.max(0, state.novaPulseTimer - dt);
  state.roomTransitionCooldown = Math.max(0, state.roomTransitionCooldown - dt);
  state.enemyFreezeTimer = Math.max(0, state.enemyFreezeTimer - dt);
  state.eclipseBannerTimer = Math.max(0, state.eclipseBannerTimer - dt);
  if (state.totalEclipseActive) {
    state.eclipseTransitionProgress = Math.min(1, state.eclipseTransitionProgress + dt * 2.5);
  } else {
    state.eclipseTransitionProgress = Math.max(0, state.eclipseTransitionProgress - dt * 2.5);
  }
  tickCombatLog(state, dt);

  for (let i = state.lightningArcs.length - 1; i >= 0; i--) {
    state.lightningArcs[i].life += dt;
    if (state.lightningArcs[i].life >= state.lightningArcs[i].maxLife) {
      state.lightningArcs.splice(i, 1);
    }
  }

  for (let i = state.vortexVisuals.length - 1; i >= 0; i--) {
    state.vortexVisuals[i].life += dt;
    if (state.vortexVisuals[i].life >= state.vortexVisuals[i].maxLife) {
      state.vortexVisuals.splice(i, 1);
    }
  }

  for (let i = state.reactionVisuals.length - 1; i >= 0; i--) {
    state.reactionVisuals[i].life += dt;
    if (state.reactionVisuals[i].life >= state.reactionVisuals[i].maxLife) {
      state.reactionVisuals.splice(i, 1);
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

  // Cycle unlocked Astral Familiar Companion if [F] pressed
  if (input.cycleFamiliarJustPressed) {
    cycleActiveFamiliar(state);
  }

  // Interact with nearby Sanctum Shrine (Cursed Altar / Healing Fountain) if [G] pressed
  if (input.interactJustPressed) {
    activateSanctumShrine(state, undefined, events);
  }

  // Sim-level hitstop pauses simulation physics while rendering & flashes continue
  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return events;
  }

  const simDt = dt;
  state.elapsedSeconds += simDt;
  if (state.bossVulnerabilityTimer > 0) {
    state.bossVulnerabilityTimer = Math.max(0, state.bossVulnerabilityTimer - simDt);
  }

  // =========================================================================
  // ELEMENTAL DEBUFF UPDATE (PLAYER BURNED & SLOWED)
  // =========================================================================
  if (p.burnTimer > 0) {
    p.burnTimer = Math.max(0, p.burnTimer - simDt);
    p.burnTickTimer -= simDt;
    if (p.burnTickTimer <= 0 && p.hp > 1) {
      p.burnTickTimer = ELEMENTAL_DEBUFF_CATALOG.burned.tickInterval;
      const burnTickDmg = Math.min(p.hp - 1, 2 + Math.min(3, Math.max(1, p.burnStacks)));
      if (burnTickDmg > 0) {
        p.hp = Math.max(1, p.hp - burnTickDmg);
        state.damageTaken += burnTickDmg;
        p.hitFlashTimer = Math.max(p.hitFlashTimer, 0.045);
        events.particlesToSpawn.push({
          x: p.x,
          y: p.y - 8,
          color: '#fb923c',
          count: 5,
          speed: 95,
          size: 3,
        });
      }
    }
    if (p.burnTimer === 0) {
      p.burnStacks = 0;
    }
  }
  if (p.slowTimer > 0) {
    p.slowTimer = Math.max(0, p.slowTimer - simDt);
  }

  // =========================================================================
  // SANCTUM TRAPS & INTERACTIVE ARENA HAZARDS UPDATE
  // =========================================================================
  for (const hazard of state.hazards) {
    if (hazard.pulseTimer > 0) {
      hazard.pulseTimer = Math.max(0, hazard.pulseTimer - simDt);
    }

    if (hazard.kind === 'solar_brazier') {
      if (hazard.cooldown > 0) {
        hazard.cooldown = Math.max(0, hazard.cooldown - simDt);
      }
    } else if (hazard.kind === 'spike_rune') {
      hazard.cycleTimer += simDt;
      if (hazard.spikePhase === 'dormant') {
        if (hazard.cycleTimer >= 2.0) {
          hazard.spikePhase = 'warning';
          hazard.cycleTimer = 0;
        }
      } else if (hazard.spikePhase === 'warning') {
        if (hazard.cycleTimer >= 0.85) {
          hazard.spikePhase = 'active';
          hazard.cycleTimer = 0;
          hazard.tickTimer = 0;
        }
      } else if (hazard.spikePhase === 'active') {
        hazard.tickTimer -= simDt;
        if (hazard.tickTimer <= 0) {
          hazard.tickTimer = 0.35;
          const baseSpikeDmg = hazard.blastDamage || 36 + state.stageLevel * 6;

          // Impale enemies standing on or knocked onto active Spike Runes
          for (const enemy of state.enemies) {
            if (enemy.aiState === 'ko') continue;
            const d = Math.hypot(enemy.x - hazard.x, enemy.y - hazard.y);
            if (d <= hazard.radius + enemy.radius * 0.65) {
              const enemyVel = Math.hypot(enemy.vx, enemy.vy);
              const knockbackBonus = enemyVel > 90 ? 1.25 : 1.0;
              const spikeDmg = Math.round(
                baseSpikeDmg * p.damageMultiplier * knockbackBonus
              );
              const pushAng = Math.atan2(enemy.y - hazard.y, enemy.x - hazard.x);
              events.spikeTrapTriggered = true;
              applyEnemyDebuff(enemy, 'slowed', 3.0, events, state);
              damageEnemy(state, enemy, spikeDmg, pushAng, 135, 0.015, events, false);
            }
          }

          // Also damage careless player if standing on active spikes without Dash or Invulnerability
          if (p.dashTimer <= 0 && p.invulnTimer <= 0) {
            const playerDist = Math.hypot(p.x - hazard.x, p.y - hazard.y);
            if (playerDist <= hazard.radius + p.radius * 0.5) {
              const hurtAng = Math.atan2(p.y - hazard.y, p.x - hazard.x);
              events.spikeTrapTriggered = true;
              applyPlayerDebuff(state, 'slowed', 3.0, events);
              damagePlayer(state, 14 + state.stageLevel * 2, hurtAng, events);
            }
          }
        }

        if (hazard.cycleTimer >= 1.25) {
          hazard.spikePhase = 'dormant';
          hazard.cycleTimer = 0;
        }
      }
    }
  }

  // =========================================================================
  // MERCENARY / FAMILIAR COMPANION (PENDAMPING ROH ASTRAL) UPDATE
  // =========================================================================
  p.familiarOrbitAngle = (p.familiarOrbitAngle + simDt * 2.2) % (Math.PI * 2);
  const targetFamX = p.x + Math.cos(p.familiarOrbitAngle) * 42;
  const targetFamY = p.y - 16 + Math.sin(p.familiarOrbitAngle * 1.5) * 24;
  const famLerp = Math.min(1, simDt * 9.5);
  p.familiarX += (targetFamX - p.familiarX) * famLerp;
  p.familiarY += (targetFamY - p.familiarY) * famLerp;

  // Aegis Cherub 20-second shield recharge timer ticks continuously
  if (!p.cherubShieldActive) {
    p.cherubShieldTimer += simDt;
    if (p.cherubShieldTimer >= 20.0) {
      p.cherubShieldActive = true;
      p.cherubShieldTimer = 0;
      if (p.activeFamiliar === 'aegis_cherub') {
        events.particlesToSpawn.push({
          x: p.x,
          y: p.y,
          color: '#38bdf8',
          count: 14,
          speed: 170,
          size: 4,
        });
      }
    }
  }

  // Ember Wisp auto-fires solar firebolts at the nearest living enemy
  if (p.activeFamiliar === 'ember_wisp') {
    p.familiarFireTimer = Math.max(0, p.familiarFireTimer - simDt);
    if (p.familiarFireTimer <= 0) {
      let nearestEnemy: EnemyEntity | null = null;
      let nearestDist = 560;
      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko') continue;
        const d = Math.hypot(enemy.x - p.familiarX, enemy.y - p.familiarY);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = enemy;
        }
      }
      if (nearestEnemy) {
        p.familiarFireTimer = 0.88;
        const fireAng = Math.atan2(
          nearestEnemy.y - p.familiarY,
          nearestEnemy.x - p.familiarX
        );
        const boltSpeed = 540;
        const boltDamage = Math.round((20 + p.level * 3) * p.damageMultiplier);
        state.projectiles.push({
          id: state.nextEntityId++,
          fromPlayer: true,
          kind: 'ember_bolt',
          x: p.familiarX + Math.cos(fireAng) * 10,
          y: p.familiarY + Math.sin(fireAng) * 10,
          vx: Math.cos(fireAng) * boltSpeed,
          vy: Math.sin(fireAng) * boltSpeed,
          radius: 6.5,
          damage: boltDamage,
          color: '#fb7185',
          life: 0,
          maxLife: 1.2,
          pierceLeft: 1,
          hitEnemyIds: [],
          angle: fireAng,
        });
        events.familiarFired = true;
        events.particlesToSpawn.push({
          x: p.familiarX,
          y: p.familiarY,
          color: '#fde047',
          count: 6,
          speed: 130,
          size: 3,
        });
      }
    }
  }

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
          applyEnemyDebuff(enemy, 'burned', 2.8, events, state);
          damageEnemy(state, enemy, bladeDamage, ang, 110, 0.015, events, false);
        }
      }
    }
  }

  // Update Ignis Dash Trail Ember Zones & Constellation Star Mines
  for (let i = state.emberZones.length - 1; i >= 0; i--) {
    const zone = state.emberZones[i];
    zone.life -= simDt;
    zone.tickTimer -= simDt;
    if (zone.life <= 0) {
      if (zone.kind === 'star_mine') {
        // Exploding Constellation Star burst when fuse expires
        events.particlesToSpawn.push({
          x: zone.x,
          y: zone.y,
          color: '#fde047',
          count: 14,
          speed: 210,
          size: 4,
        });
        for (const enemy of state.enemies) {
          if (enemy.aiState === 'ko') continue;
          if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.radius + enemy.radius) {
            const pushAng = Math.atan2(enemy.y - zone.y, enemy.x - zone.x);
            applyEnemyDebuff(enemy, 'slowed', 2.8, events, state);
            damageEnemy(state, enemy, zone.damage, pushAng, 140, 0.02, events, false);
          }
        }
      }
      state.emberZones.splice(i, 1);
      continue;
    }
    if (zone.tickTimer <= 0) {
      zone.tickTimer = zone.kind === 'star_mine' ? 0.28 : 0.35;
      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko') continue;
        if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.radius + enemy.radius) {
          const pushAng = Math.atan2(enemy.y - zone.y, enemy.x - zone.x);
          applyEnemyDebuff(
            enemy,
            zone.kind === 'star_mine' ? 'slowed' : 'burned',
            zone.kind === 'star_mine' ? 2.6 : 3.4,
            events,
            state
          );
          damageEnemy(
            state,
            enemy,
            zone.kind === 'star_mine' ? Math.round(zone.damage * 0.65) : zone.damage,
            pushAng,
            60,
            0.01,
            events,
            false
          );
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
  p.perfectDodgeCooldown = Math.max(0, p.perfectDodgeCooldown - simDt);
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
        applyEnemyDebuff(enemy, 'burned', 4.0, events, state, 2);
        damageEnemy(state, enemy, novaDamage, angle, 310, 0.05, events, true);
      }
    }
    if (novaSurgeRank > 0 && hitsCount >= 2) {
      p.essence = Math.min(p.maxEssence, p.essence + 12);
    }
    state.projectiles = state.projectiles.filter(
      (proj) => proj.fromPlayer || Math.hypot(proj.x - p.x, proj.y - p.y) > novaRadius
    );
    for (const hazard of state.hazards) {
      if (
        hazard.kind === 'solar_brazier' &&
        hazard.cooldown <= 0 &&
        Math.hypot(hazard.x - p.x, hazard.y - p.y) <= novaRadius + hazard.radius
      ) {
        detonateSolarBrazier(state, hazard, events);
      }
    }
  }

  // Check and synchronize any newly unlocked Weapon Evolutions
  syncAwakenedStances(state, events);

  // Execute buffered Attack
  const stanceSpec = WEAPON_STANCES[p.stance];
  const evolutionSpec = WEAPON_EVOLUTIONS[p.stance];
  const stanceAwakened = isStanceAwakened(state, p.stance);
  const echoRank = p.skills.phantom_echo ?? 0;
  const evoRangeMult = stanceAwakened ? evolutionSpec.bonusRangeMultiplier : 1.0;
  const evoDmgMult = stanceAwakened ? evolutionSpec.bonusDamageMultiplier : 1.0;
  const effectiveRange = Math.round(stanceSpec.range * (1 + echoRank * 0.18) * evoRangeMult);

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

    // [3] Singularity Harvester (Evolved Chrono Scythe): Continuous gravitational vortex pull during windup & active frames
    if (
      p.stance === 'chrono_scythe' &&
      stanceAwakened &&
      (p.attackPhase === 'windup' || p.attackPhase === 'active')
    ) {
      const vortexX = p.x + Math.cos(p.attackAngle) * 68;
      const vortexY = p.y + Math.sin(p.attackAngle) * 68;
      const pullRadius = 235;
      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko') continue;
        const dx = vortexX - enemy.x;
        const dy = vortexY - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist <= pullRadius && dist > 14) {
          const pullStep = 360 * simDt;
          enemy.x += (dx / dist) * pullStep;
          enemy.y += (dy / dist) * pullStep;
        }
      }
    }

    if (p.attackPhase === 'windup' && p.attackTimer >= p.attackDuration) {
      p.attackPhase = 'active';
      p.attackTimer = 0;
      p.attackDuration = stanceSpec.activeDuration;
      p.scaleX = 1.18;
      p.scaleY = 0.84;

      // [1] Solar Greatsword (Evolved Dawnblade): Every 3rd slash launches a piercing crescent flame wave
      if (p.stance === 'dawnblade') {
        p.dawnbladeSwingCount = (p.dawnbladeSwingCount ?? 0) + 1;
        if (stanceAwakened && p.dawnbladeSwingCount % 3 === 0) {
          const waveSpeed = 540;
          const waveDmg = Math.round(
            (stanceSpec.damage + echoRank * 10) * p.damageMultiplier * evoDmgMult * 1.15
          );
          state.projectiles.push({
            id: state.nextEntityId++,
            fromPlayer: true,
            kind: 'solar_crescent',
            x: p.x + Math.cos(p.attackAngle) * 28,
            y: p.y + Math.sin(p.attackAngle) * 28,
            vx: Math.cos(p.attackAngle) * waveSpeed,
            vy: Math.sin(p.attackAngle) * waveSpeed,
            radius: 36,
            damage: waveDmg,
            color: '#fbbf24',
            life: 0,
            maxLife: 0.95,
            pierceLeft: 99,
            hitEnemyIds: [],
            angle: p.attackAngle,
          });
          state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.25);
          events.relicSynergyTriggered = true;
          pushCombatLog(
            state,
            'relic_synergy',
            'Relic Synergy Triggered!',
            'Solar Greatsword Crescent Wave'
          );
          events.particlesToSpawn.push({
            x: p.x + Math.cos(p.attackAngle) * 32,
            y: p.y + Math.sin(p.attackAngle) * 32,
            color: '#f43f5e',
            count: 16,
            speed: 240,
            size: 5,
          });
        }
      }

      // [2] Astral Bow / Constellation Repeater
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
            kind: stanceAwakened ? 'astral_arrow' : 'standard',
            x: p.x + Math.cos(ang) * 20,
            y: p.y + Math.sin(ang) * 20,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            radius: i === 0 ? 7 : 5,
            damage: Math.round(
              (stanceSpec.damage + echoRank * 6) *
                p.damageMultiplier *
                evoDmgMult *
                (i === 0 ? 1 : 0.75)
            ),
            color: stanceAwakened ? '#7dd3fc' : '#38bdf8',
            life: 0,
            maxLife: stanceAwakened ? 1.15 : 0.85,
            pierceLeft: i === 0 ? 2 + echoRank : 1,
            hitEnemyIds: [],
            ricochetLeft: stanceAwakened ? (i === 0 ? 2 + echoRank : 1) : 0,
            starTrailTimer: stanceAwakened ? 0.11 : 0,
            angle: ang,
          });
        }
      }

      // [3] Singularity Harvester (Evolved Chrono Scythe): Spawn visual singularity vortex at reap focal point
      if (p.stance === 'chrono_scythe' && stanceAwakened) {
        const vortexX = p.x + Math.cos(p.attackAngle) * 68;
        const vortexY = p.y + Math.sin(p.attackAngle) * 68;
        state.vortexVisuals.push({
          x: vortexX,
          y: vortexY,
          radius: 95,
          life: 0,
          maxLife: 0.42,
        });
        events.relicSynergyTriggered = true;
        pushCombatLog(
          state,
          'relic_synergy',
          'Relic Synergy Triggered!',
          'Singularity Harvester Vortex Pull'
        );
      }
    } else if (p.attackPhase === 'active') {
      if (p.stance !== 'astral_bow') {
        const vortexX = p.x + Math.cos(p.attackAngle) * 68;
        const vortexY = p.y + Math.sin(p.attackAngle) * 68;

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
              const weaknessMult =
                ENEMY_ARCHETYPE_CATALOG[enemy.archetype]?.weaknessStance === p.stance ? 1.2 : 1.0;
              const dmg = Math.round(
                (stanceSpec.damage + echoRank * 10) *
                  p.damageMultiplier *
                  evoDmgMult *
                  weaknessMult
              );
              if (p.stance === 'dawnblade') {
                p.essence = Math.min(p.maxEssence, p.essence + (stanceAwakened ? 12 : 8));
                applyEnemyDebuff(
                  enemy,
                  'burned',
                  stanceAwakened ? 4.2 : 3.6,
                  events,
                  state,
                  stanceAwakened ? 2 : 1
                );
              } else if (p.stance === 'chrono_scythe') {
                applyEnemyDebuff(enemy, 'slowed', stanceAwakened ? 4.4 : 3.8, events, state);
              }

              // Singularity Harvester pulls enemies inward toward the vortex center and inflicts brief Time-Stop
              let knockbackAngle = angleToEnemy;
              let knockbackForce = stanceSpec.knockback;
              if (p.stance === 'chrono_scythe' && stanceAwakened) {
                knockbackAngle = Math.atan2(vortexY - enemy.y, vortexX - enemy.x);
                knockbackForce = 260;
                state.enemyFreezeTimer = Math.max(state.enemyFreezeTimer, 1.2);
                if (enemy.aiState === 'windup') {
                  enemy.aiState = 'move';
                  enemy.stateTimer = 0;
                  if (enemy.hasAttackToken) {
                    enemy.hasAttackToken = false;
                    state.activeAttackTokens = Math.max(0, state.activeAttackTokens - 1);
                  }
                }
                events.particlesToSpawn.push({
                  x: enemy.x,
                  y: enemy.y,
                  color: '#e879f9',
                  count: 12,
                  speed: 180,
                  size: 4,
                });
              }

              const isThirdSwingComboFinisher = p.comboStep === 0;
              damageEnemy(
                state,
                enemy,
                dmg,
                knockbackAngle,
                knockbackForce,
                stanceSpec.hitstop,
                events,
                true,
                isThirdSwingComboFinisher
              );
            }
          }
        }

        // Melee swings also strike and detonate nearby ready Solar Braziers
        for (const hazard of state.hazards) {
          if (hazard.kind !== 'solar_brazier' || hazard.cooldown > 0) continue;
          const hdx = hazard.x - p.x;
          const hdy = hazard.y - p.y;
          const hdist = Math.hypot(hdx, hdy);
          if (hdist <= effectiveRange + hazard.radius) {
            const angleToHazard = Math.atan2(hdy, hdx);
            const diff = Math.abs(normalizeAngleDiff(angleToHazard, p.attackAngle));
            if (diff <= stanceSpec.arcRadians * 0.55 || hdist < p.radius + hazard.radius + 14) {
              detonateSolarBrazier(state, hazard, events);
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
    const slowMovePenalty =
      p.slowTimer > 0 ? ELEMENTAL_DEBUFF_CATALOG.slowed.playerSpeedMultiplier : 1.0;
    const targetVx = normX * p.speed * attackMovePenalty * slowMovePenalty;
    const targetVy = normY * p.speed * attackMovePenalty * slowMovePenalty;
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

  // Detect Perfect Dodge when dashing through or narrowly past an enemy lunge or projectile
  if (p.dashTimer > 0 && p.perfectDodgeCooldown <= 0) {
    let closeCallDetected = false;
    for (const proj of state.projectiles) {
      if (proj.fromPlayer) continue;
      if (Math.hypot(proj.x - p.x, proj.y - p.y) <= p.radius + proj.radius + 32) {
        closeCallDetected = true;
        break;
      }
    }
    if (!closeCallDetected) {
      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko') continue;
        const isThreatening =
          enemy.aiState === 'active' ||
          (enemy.aiState === 'windup' && enemy.stateTimer >= enemy.stateDuration * 0.35);
        if (
          isThreatening &&
          Math.hypot(enemy.x - p.x, enemy.y - p.y) <= p.radius + enemy.radius + 38
        ) {
          closeCallDetected = true;
          break;
        }
      }
    }
    if (closeCallDetected) {
      p.perfectDodgeCooldown = 0.85;
      p.essence = Math.min(p.maxEssence, p.essence + 15);
      state.score += Math.round(60 * state.scoreMultiplier);
      events.perfectDodge = true;
      pushCombatLog(state, 'perfect_dodge', 'Perfect Dodge', 'Evaded Strike · +15 Essence');
      events.particlesToSpawn.push({
        x: p.x,
        y: p.y,
        color: '#38bdf8',
        count: 14,
        speed: 200,
        size: 4,
      });
    }
  }

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

  const globalFreezeMult = state.enemyFreezeTimer > 0 ? 0.25 : 1.0;

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

    // Tick enemy elemental debuffs (Burned DoT & Slowed movement penalty)
    if (enemy.burnTimer > 0) {
      enemy.burnTimer = Math.max(0, enemy.burnTimer - simDt);
      enemy.burnTickTimer -= simDt;
      if (enemy.burnTickTimer <= 0) {
        enemy.burnTickTimer = ELEMENTAL_DEBUFF_CATALOG.burned.tickInterval;
        const stacks = Math.max(1, Math.min(3, enemy.burnStacks));
        const burnDmg = Math.round(
          (6 + state.stageLevel * 1.5 + stacks * 3) * p.damageMultiplier
        );
        if (enemy.hp - burnDmg <= 0) {
          damageEnemy(state, enemy, burnDmg, enemy.aimAngle + Math.PI, 40, 0.015, events, false);
          continue;
        } else {
          enemy.hp = Math.max(1, enemy.hp - burnDmg);
          enemy.hitFlashTimer = Math.max(enemy.hitFlashTimer, 0.04);
          events.particlesToSpawn.push({
            x: enemy.x,
            y: enemy.y - enemy.radius * 0.4,
            color: '#fb923c',
            count: 4,
            speed: 90,
            size: 3,
          });
        }
      }
      if (enemy.burnTimer === 0) {
        enemy.burnStacks = 0;
      }
    }
    if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - simDt);
    }
    if (enemy.sunderTimer > 0) {
      enemy.sunderTimer = Math.max(0, enemy.sunderTimer - simDt);
    }
    if (enemy.thermalShockCooldown > 0) {
      enemy.thermalShockCooldown = Math.max(0, enemy.thermalShockCooldown - simDt);
    }
    if (
      enemy.burnTimer > 0.05 &&
      enemy.slowTimer > 0.05 &&
      enemy.thermalShockCooldown <= 0
    ) {
      triggerThermalShock(state, enemy, events);
    }
    if (enemy.hp <= 0) {
      damageEnemy(state, enemy, 0, enemy.aimAngle + Math.PI, 40, 0.015, events, false);
      continue;
    }

    if (
      isBossOrEclipseCandidate(state, enemy) &&
      enemy.hp <= enemy.maxHp * 0.5 &&
      (enemy.phase === 1 || !state.totalEclipseActive)
    ) {
      triggerTotalEclipseEvent(state, enemy, events);
    }

    const indivSlowMult =
      enemy.slowTimer > 0 ? ELEMENTAL_DEBUFF_CATALOG.slowed.enemySpeedMultiplier : 1.0;
    const enemySpeedMult = globalFreezeMult * indivSlowMult;
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

        if (enemy.hp <= enemy.maxHp * 0.5 && (enemy.phase === 1 || !state.totalEclipseActive)) {
          triggerTotalEclipseEvent(state, enemy, events);
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
          applyPlayerDebuff(state, 'slowed', 1.6, events);
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
          if (p.invulnTimer <= 0) {
            applyPlayerDebuff(
              state,
              enemy.archetype === 'solar_zealot' ? 'burned' : 'slowed',
              3.2,
              events
            );
          }
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      } else if (enemy.archetype === 'juggernaut') {
        const rushSpeed = 440;
        enemy.x += Math.cos(enemy.aimAngle) * rushSpeed * enemyDt;
        enemy.y += Math.sin(enemy.aimAngle) * rushSpeed * enemyDt;
        if (Math.hypot(p.x - enemy.x, p.y - enemy.y) <= p.radius + enemy.radius + 8) {
          if (p.invulnTimer <= 0) {
            applyPlayerDebuff(state, 'slowed', 3.4, events);
          }
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      } else if (enemy.archetype === 'void_singularity') {
        const distToWell = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (distToWell <= 68 && enemy.stateTimer < 0.08) {
          if (p.invulnTimer <= 0) {
            applyPlayerDebuff(state, 'slowed', 3.6, events);
          }
          damagePlayer(state, enemy.damage, enemy.aimAngle, events);
        }
      } else if (enemy.archetype === 'archon') {
        const distToBlast = Math.hypot(p.x - enemy.targetX, p.y - enemy.targetY);
        if (distToBlast <= 92 && enemy.stateTimer < 0.1) {
          if (p.invulnTimer <= 0) {
            applyPlayerDebuff(state, 'burned', 4.0, events);
          }
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

    // [2] Constellation Repeater: leave exploding star trail nodes along flight path
    if (proj.fromPlayer && proj.kind === 'astral_arrow' && typeof proj.starTrailTimer === 'number') {
      proj.starTrailTimer -= simDt;
      if (proj.starTrailTimer <= 0) {
        proj.starTrailTimer = 0.16;
        state.emberZones.push({
          id: state.nextEntityId++,
          kind: 'star_mine',
          x: proj.x,
          y: proj.y,
          radius: 42,
          life: 0.48,
          maxLife: 0.48,
          damage: Math.round(18 * p.damageMultiplier),
          tickTimer: 0.24,
        });
      }
    }

    let hitWall =
      proj.x < 36 ||
      proj.x > state.arenaWidth - 36 ||
      proj.y < 36 ||
      proj.y > state.arenaHeight - 36;
    if (!hitWall && proj.kind !== 'solar_crescent') {
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
      // Check if player projectile strikes a ready Solar Brazier
      let detonatedBrazier = false;
      for (const hazard of state.hazards) {
        if (
          hazard.kind === 'solar_brazier' &&
          hazard.cooldown <= 0 &&
          Math.hypot(hazard.x - proj.x, hazard.y - proj.y) <= hazard.radius + proj.radius
        ) {
          detonateSolarBrazier(state, hazard, events);
          if (proj.kind !== 'solar_crescent') {
            proj.pierceLeft--;
            if (proj.pierceLeft <= 0) {
              state.projectiles.splice(i, 1);
              detonatedBrazier = true;
              break;
            }
          }
        }
      }
      if (detonatedBrazier) {
        continue;
      }

      for (const enemy of state.enemies) {
        if (enemy.aiState === 'ko' || proj.hitEnemyIds.includes(enemy.id)) continue;
        if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) <= enemy.radius + proj.radius) {
          proj.hitEnemyIds.push(enemy.id);
          proj.pierceLeft--;
          const hitAng = Math.atan2(proj.vy, proj.vx);
          const weaknessTarget: WeaponStanceId =
            proj.kind === 'solar_crescent' ? 'dawnblade' : 'astral_bow';
          const projWeaknessMult =
            ENEMY_ARCHETYPE_CATALOG[enemy.archetype]?.weaknessStance === weaknessTarget ? 1.2 : 1.0;
          if (proj.kind === 'solar_crescent' || proj.kind === 'ember_bolt') {
            applyEnemyDebuff(
              enemy,
              'burned',
              proj.kind === 'solar_crescent' ? 4.2 : 3.4,
              events,
              state,
              proj.kind === 'solar_crescent' ? 2 : 1
            );
          } else {
            applyEnemyDebuff(
              enemy,
              'slowed',
              proj.kind === 'astral_arrow' ? 3.4 : 2.8,
              events,
              state
            );
          }
          damageEnemy(
            state,
            enemy,
            Math.round(proj.damage * projWeaknessMult),
            hitAng,
            proj.kind === 'solar_crescent' ? 240 : 130,
            proj.kind === 'solar_crescent' ? 0.04 : 0.025,
            events,
            true,
            proj.kind === 'solar_crescent'
          );

          // [2] Constellation Repeater: Spawn exploding star at impact & ricochet to nearest unhit enemy
          if (proj.kind === 'astral_arrow') {
            state.emberZones.push({
              id: state.nextEntityId++,
              kind: 'star_mine',
              x: enemy.x,
              y: enemy.y,
              radius: 48,
              life: 0.42,
              maxLife: 0.42,
              damage: Math.round(22 * p.damageMultiplier),
              tickTimer: 0.22,
            });

            if ((proj.ricochetLeft ?? 0) > 0) {
              let nextTarget: EnemyEntity | null = null;
              let bestDist = 290;
              for (const candidate of state.enemies) {
                if (candidate.aiState === 'ko' || proj.hitEnemyIds.includes(candidate.id)) continue;
                const d = Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y);
                if (d < bestDist) {
                  bestDist = d;
                  nextTarget = candidate;
                }
              }
              if (nextTarget) {
                proj.ricochetLeft = (proj.ricochetLeft ?? 1) - 1;
                proj.pierceLeft = Math.max(1, proj.pierceLeft);
                const bounceAng = Math.atan2(nextTarget.y - enemy.y, nextTarget.x - enemy.x);
                const spd = Math.hypot(proj.vx, proj.vy) || 620;
                proj.x = enemy.x;
                proj.y = enemy.y;
                proj.vx = Math.cos(bounceAng) * spd;
                proj.vy = Math.sin(bounceAng) * spd;
                proj.angle = bounceAng;
                proj.life = Math.min(proj.life, proj.maxLife - 0.45);
                state.lightningArcs.push({
                  x1: enemy.x,
                  y1: enemy.y,
                  x2: nextTarget.x,
                  y2: nextTarget.y,
                  life: 0,
                  maxLife: 0.26,
                  color: '#fde047',
                });
                events.relicSynergyTriggered = true;
                pushCombatLog(
                  state,
                  'relic_synergy',
                  'Relic Synergy Triggered!',
                  'Constellation Repeater Ricochet'
                );
              }
            }
          }

          if (proj.pierceLeft <= 0) {
            state.projectiles.splice(i, 1);
            break;
          }
        }
      }
    } else {
      if (Math.hypot(p.x - proj.x, p.y - proj.y) <= p.radius + proj.radius) {
        const hitAng = Math.atan2(proj.vy, proj.vx);
        if (p.invulnTimer <= 0) {
          const isFireProjectile =
            proj.color === '#f97316' ||
            proj.color === '#facc15' ||
            proj.color === '#fb7185' ||
            proj.color === '#f43f5e';
          applyPlayerDebuff(
            state,
            isFireProjectile ? 'burned' : 'slowed',
            isFireProjectile ? 3.6 : 3.2,
            events
          );
        }
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
    const hasGreedImp = p.activeFamiliar === 'greed_imp';
    const magnetRange = hasGreedImp ? 2000 : 155;
    const magnetSpeed = hasGreedImp ? 460 : 290;
    if (dist < magnetRange && dist > 1) {
      item.x += (dx / dist) * magnetSpeed * simDt;
      item.y += (dy / dist) * magnetSpeed * simDt;
    }
    if (dist <= p.radius + 16) {
      if (item.kind === 'gold_coin') {
        const coinGain = hasGreedImp ? Math.max(1, Math.round(item.value * 1.2)) : item.value;
        p.coins += coinGain;
        state.score += coinGain * 5;
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
    state.totalEclipseActive = false;
    state.bossVulnerabilityTimer = 0;
    events.waveCleared = true;
    if (state.gameMode === 'boss_rush') {
      state.bossRushWavesCleared += 1;
    }

    const allRoomsCleared = state.rooms.every((r) => r.cleared);
    if (allRoomsCleared || currentRoom.kind === 'boss') {
      state.outcome = 'victory';
      state.phase = 'gameover';
      state.score += Math.round((400 + state.stageLevel * 100) * state.scoreMultiplier);
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

export function damageEnemy(
  state: ArenaWorldState,
  enemy: EnemyEntity,
  damage: number,
  knockbackAngle: number,
  knockbackForce: number,
  hitstop: number,
  events: SimulationEvents,
  allowChainArc = false,
  forceCritical = false
): void {
  const isCritical = forceCritical || (allowChainArc && (state.comboCount + 1) % 3 === 0);
  const shouldTriggerMeltdown = isCritical && enemy.burnTimer > 0.04 && enemy.burnStacks >= 3;
  const shouldTriggerThermalShock =
    !shouldTriggerMeltdown &&
    enemy.burnTimer > 0.05 &&
    enemy.slowTimer > 0.05 &&
    enemy.thermalShockCooldown <= 0;

  if (shouldTriggerMeltdown) {
    applyEnemyDebuff(enemy, 'sundered', 6.0, events);
  }

  const sunderMult =
    enemy.sunderTimer > 0.04 ? (ELEMENTAL_DEBUFF_CATALOG.sundered.damageTakenMultiplier ?? 1.35) : 1.0;
  const eclipseMult =
    state.totalEclipseActive && isBossOrEclipseCandidate(state, enemy)
      ? state.bossVulnerabilityTimer > 0
        ? 1.5
        : 0.75
      : 1.0;
  const sunderedDamage = Math.round(damage * sunderMult * eclipseMult);
  const appliedDamage = isCritical ? Math.round(sunderedDamage * 1.5) : sunderedDamage;

  enemy.hp = Math.max(0, enemy.hp - appliedDamage);
  if (
    enemy.hp > 0 &&
    enemy.hp <= enemy.maxHp * 0.5 &&
    isBossOrEclipseCandidate(state, enemy) &&
    (enemy.phase === 1 || !state.totalEclipseActive)
  ) {
    triggerTotalEclipseEvent(state, enemy, events);
  }
  enemy.hitFlashTimer = isCritical ? 0.095 : 0.06;
  enemy.vx += Math.cos(knockbackAngle) * (isCritical ? knockbackForce * 1.25 : knockbackForce);
  enemy.vy += Math.sin(knockbackAngle) * (isCritical ? knockbackForce * 1.25 : knockbackForce);
  enemy.scaleX = isCritical ? 1.34 : 1.25;
  enemy.scaleY = isCritical ? 0.68 : 0.76;

  state.hitstopTimer = Math.max(state.hitstopTimer, isCritical ? Math.max(hitstop, 0.055) : hitstop);
  state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.18);
  state.comboCount += 1;
  state.comboTimer = 3.2;
  events.enemiesHit += 1;

  if (isCritical) {
    state.criticalStrikesCount += 1;
    state.critCalloutTimer = 0.55;
    state.lastCritX = enemy.x;
    state.lastCritY = enemy.y;
    state.lastCritDamage = appliedDamage;
    events.criticalStrike = true;
    events.criticalHits = (events.criticalHits ?? 0) + 1;
    triggerScreenShake(state, 'critical_strike', knockbackAngle, events);
    pushCombatLog(
      state,
      'critical_strike',
      'Critical Strike!',
      `1.5x Solar Finisher (-${appliedDamage} HP)`
    );
    events.particlesToSpawn.push({
      x: enemy.x,
      y: enemy.y,
      color: '#fde047',
      count: 18,
      speed: 250,
      size: 5,
    });
  } else {
    events.particlesToSpawn.push({
      x: enemy.x,
      y: enemy.y,
      color: '#fef08a',
      count: 10,
      speed: 190,
      size: 4,
    });
  }

  if (shouldTriggerMeltdown) {
    triggerSolarMeltdown(state, enemy, events);
  } else if (shouldTriggerThermalShock) {
    triggerThermalShock(state, enemy, events);
  }

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
    if (
      state.totalEclipseActive &&
      !state.enemies.some((e) => e.aiState !== 'ko' && isBossOrEclipseCandidate(state, e))
    ) {
      state.totalEclipseActive = false;
      state.bossVulnerabilityTimer = 0;
    }
    state.enemiesDefeated += 1;
    state.defeatedByArchetype[enemy.archetype] =
      (state.defeatedByArchetype[enemy.archetype] ?? 0) + 1;
    const comboMult = (1 + Math.min(2.0, state.comboCount * 0.1)) * state.scoreMultiplier;
    state.score += Math.round(enemy.scoreValue * comboMult);
    state.bestScore = Math.max(state.bestScore, state.score);
    state.hitstopTimer = Math.max(state.hitstopTimer, 0.055);
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.3);
    events.enemiesKilled += 1;

    if (state.player.vampiricHeal > 0) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.vampiricHeal);
      state.player.essence = Math.min(state.player.maxEssence, state.player.essence + 8);
      events.relicSynergyTriggered = true;
      pushCombatLog(
        state,
        'relic_synergy',
        'Relic Synergy Triggered!',
        `Umbral Siphon · +${state.player.vampiricHeal} HP & +8 ESS`
      );
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

export function damagePlayer(
  state: ArenaWorldState,
  damage: number,
  knockbackAngle: number,
  events: SimulationEvents
): void {
  const p = state.player;
  if (p.invulnTimer > 0 || p.hp <= 0) return;

  if (p.activeFamiliar === 'aegis_cherub' && p.cherubShieldActive) {
    p.cherubShieldActive = false;
    p.cherubShieldTimer = 0;
    p.invulnTimer = 0.65;
    state.hitstopTimer = Math.max(state.hitstopTimer, 0.045);
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.25);
    events.cherubShieldBlocked = true;
    pushCombatLog(
      state,
      'aegis_parry',
      'Aegis Ward Parried!',
      'Cherub Halo Negated Attack'
    );
    events.particlesToSpawn.push({
      x: p.x,
      y: p.y,
      color: '#38bdf8',
      count: 20,
      speed: 250,
      size: 4,
    });
    for (const enemy of state.enemies) {
      if (enemy.aiState === 'ko') continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 145) {
        const pushAng = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        damageEnemy(state, enemy, 24, pushAng, 300, 0.02, events, false);
      }
    }
    return;
  }

  if (p.aegisActive) {
    p.aegisActive = false;
    p.aegisTimer = 0;
    p.invulnTimer = 0.65;
    state.hitstopTimer = Math.max(state.hitstopTimer, 0.045);
    state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.25);
    pushCombatLog(
      state,
      'aegis_parry',
      'Aegis Ward Parried!',
      'Dawn Aegis Negated Attack'
    );
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
  events.playerHurt = true;
  triggerScreenShake(state, 'player_hurt', knockbackAngle, events);

  events.particlesToSpawn.push({
    x: p.x,
    y: p.y,
    color: '#ef4444',
    count: 16,
    speed: 220,
    size: 4,
  });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activateSanctumShrine,
  addUsableItemToInventory,
  advanceBossRushAbyssCycle,
  applyEnemyDebuff,
  applyPlayerDebuff,
  applyRelicChoice,
  applySkillChoice,
  awakenStance,
  buildRankedLeaderboard,
  buyMerchantItem,
  clampDt,
  cleansePlayerDebuffs,
  computeScreenShakeOffset,
  createEnemy,
  createInitialWorldState,
  cycleActiveFamiliar,
  damageEnemy,
  damagePlayer,
  detonateSolarBrazier,
  ELEMENTAL_DEBUFF_CATALOG,
  ELEMENTAL_REACTION_CATALOG,
  ENEMY_ARCHETYPE_CATALOG,
  ENEMY_ARCHETYPE_KEYS,
  FAMILIAR_CATALOG,
  FAMILIAR_KEYS,
  formatSpeedrunTime,
  FrameInput,
  generateDungeonMap,
  getActiveCombatLogEntries,
  getBestiaryEntry,
  getDailyChallengeConfig,
  getEnemyActiveDebuffs,
  getHealthPipStates,
  getPlayerActiveDebuffs,
  getRoomEnemyDebuffSummary,
  getStageDifficultyProfile,
  grantPlayerXp,
  hireOrEquipFamiliar,
  isStanceAwakened,
  MAX_STAGE_LEVEL,
  pushCombatLog,
  SANCTUM_HAZARD_CATALOG,
  SCREEN_SHAKE_PROFILES,
  STAGE_CATALOG,
  stepArenaWorld,
  tickCombatLog,
  transitionToRoom,
  triggerScreenShake,
  triggerSolarMeltdown,
  triggerThermalShock,
  useInventorySlot,
  WEAPON_EVOLUTIONS,
} from './rules';

function emptyInput(overrides: Partial<FrameInput> = {}): FrameInput {
  return {
    moveX: 0,
    moveY: 0,
    aimWorldX: 600,
    aimWorldY: 200,
    attackHeld: false,
    attackJustPressed: false,
    dashJustPressed: false,
    novaJustPressed: false,
    stanceSelect: null,
    useItemSlot: null,
    ...overrides,
  };
}

test('clampDt caps large frame deltas at 0.05s and rejects negative values', () => {
  assert.equal(clampDt(0.25), 0.05);
  assert.equal(clampDt(0.016), 0.016);
  assert.equal(clampDt(-1), 0);
  assert.equal(clampDt(Number.NaN), 0);
});

test('getHealthPipStates returns full, cracked, and empty states accurately', () => {
  assert.deepEqual(getHealthPipStates(100, 100, 5), ['full', 'full', 'full', 'full', 'full']);
  assert.deepEqual(getHealthPipStates(50, 100, 5), ['full', 'full', 'cracked', 'empty', 'empty']);
  assert.deepEqual(getHealthPipStates(0, 100, 5), ['empty', 'empty', 'empty', 'empty', 'empty']);
});

test('player survives initial seconds without input and switches stances cleanly', () => {
  const world = createInitialWorldState('playing', 0);
  for (let i = 0; i < 60; i++) {
    stepArenaWorld(world, emptyInput(), 1 / 60);
  }
  assert.equal(world.player.hp, 100);
  assert.equal(world.phase, 'playing');

  stepArenaWorld(world, emptyInput({ stanceSelect: 'chrono_scythe' }), 0.016);
  assert.equal(world.player.stance, 'chrono_scythe');
});

test('edge-triggered attack progresses through windup -> active -> recovery and hits nearby enemy', () => {
  const world = createInitialWorldState('playing', 0);
  world.enemies = [createEnemy(99, 'stalker', world.player.x, world.player.y - 48, 1)];
  const target = world.enemies[0];
  const initialHp = target.hp;

  const ev1 = stepArenaWorld(
    world,
    emptyInput({
      aimWorldX: target.x,
      aimWorldY: target.y,
      attackJustPressed: true,
    }),
    0.016
  );
  assert.equal(ev1.playerSwung, 'dawnblade');
  assert.equal(world.player.attackPhase, 'windup');

  for (let i = 0; i < 25; i++) {
    stepArenaWorld(world, emptyInput({ aimWorldX: target.x, aimWorldY: target.y }), 0.02);
  }

  assert.equal(target.hp < initialHp, true);
});

test('distinct enemy policies: arcanist retreats when player is close while stalker closes in', () => {
  const world = createInitialWorldState('playing', 0);
  const stalker = createEnemy(10, 'stalker', world.player.x + 120, world.player.y, 1);
  const arcanist = createEnemy(11, 'arcanist', world.player.x - 120, world.player.y, 1);
  world.enemies = [stalker, arcanist];

  const initialStalkerDist = Math.hypot(stalker.x - world.player.x, stalker.y - world.player.y);
  const initialArcanistDist = Math.hypot(arcanist.x - world.player.x, arcanist.y - world.player.y);

  for (let i = 0; i < 10; i++) {
    stepArenaWorld(world, emptyInput(), 0.02);
  }

  const nextStalkerDist = Math.hypot(stalker.x - world.player.x, stalker.y - world.player.y);
  const nextArcanistDist = Math.hypot(arcanist.x - world.player.x, arcanist.y - world.player.y);

  assert.equal(nextStalkerDist < initialStalkerDist, true, 'Stalker should close distance');
  assert.equal(
    nextArcanistDist > initialArcanistDist,
    true,
    'Arcanist should kite away when too close'
  );
});

test('relic upgrade modifies player stats and clears pending choices', () => {
  const world = createInitialWorldState('playing', 0);
  world.player.hp = 60;
  const applied = applyRelicChoice(world, 'solar_vessel');
  assert.equal(applied, true);
  assert.equal(world.player.maxHp, 120);
  assert.equal(world.player.hp, 90);
});

test('level up triggers 3 skill choices and selecting a skill activates its combat effect', () => {
  const world = createInitialWorldState('playing', 0);
  assert.equal(world.player.level, 1);
  assert.equal(world.skillChoices.length, 0);

  const leveled = grantPlayerXp(world, 65);
  assert.equal(leveled, true);
  assert.equal(world.player.level, 2);
  assert.equal(world.skillChoices.length, 3);

  const chosenId = world.skillChoices[0].id;
  const applied = applySkillChoice(world, chosenId);
  assert.equal(applied, true);
  assert.equal(world.player.skills[chosenId], 1);
  assert.equal(world.skillChoices.length, 0);

  // Also verify Orbiting Solar Blades skill damages an enemy at orbit radius (64px)
  applySkillChoice(world, 'solar_orbit');
  const enemy = createEnemy(77, 'stalker', world.player.x + 64, world.player.y, 1);
  world.enemies = [enemy];
  const initialHp = enemy.hp;

  for (let i = 0; i < 30; i++) {
    stepArenaWorld(world, emptyInput(), 0.02);
  }
  assert.equal(enemy.hp < initialHp, true, 'Orbiting Solar Blades should slice nearby enemy');
});

test('stages 1 to 10 generate 4 to 10 connected rooms with escalating room & monster counts', () => {
  assert.equal(STAGE_CATALOG.length, MAX_STAGE_LEVEL);
  let previousRoomCount = 4;
  for (let stage = 1; stage <= MAX_STAGE_LEVEL; stage++) {
    const rooms = generateDungeonMap(stage);
    assert.equal(rooms.length >= 4 && rooms.length <= 10, true, `Stage ${stage} must have 4-10 rooms`);
    assert.equal(rooms.length >= previousRoomCount, true, 'Room count should never decrease on later stages');
    previousRoomCount = rooms.length;
    assert.equal(rooms[rooms.length - 1].kind, 'boss');
    assert.equal(rooms[rooms.length - 1].formation, 'sovereign_throne');
    // Every room must have at least one connected door and a valid difficulty rating
    for (const r of rooms) {
      assert.equal(r.doors.length >= 1, true);
      assert.equal((r.difficultyRating ?? 0) >= 1, true);
    }
  }

  const stage1Profile = getStageDifficultyProfile(1, 0, 4);
  const stage9Profile = getStageDifficultyProfile(9, 6, 9);
  assert.equal(stage9Profile.hpMultiplier > stage1Profile.hpMultiplier, true);
  assert.equal(stage9Profile.damageMultiplier > stage1Profile.damageMultiplier, true);
  assert.equal(stage9Profile.cooldownMultiplier < stage1Profile.cooldownMultiplier, true);
  assert.equal(stage9Profile.unlockedArchetypes.length > stage1Profile.unlockedArchetypes.length, true);
  assert.equal(stage9Profile.unlockedArchetypes.includes('eclipse_inquisitor'), true);

  const stage1World = createInitialWorldState('playing', 0, 1);
  const stage8World = createInitialWorldState('playing', 0, 8);
  assert.equal(
    stage8World.rooms[0].roster.length > stage1World.rooms[0].roster.length,
    true,
    'Higher stages should spawn more monsters per room'
  );

  const world = createInitialWorldState('playing', 0, 4);
  assert.equal(world.stageLevel, 4);
  assert.equal(world.currentRoomIndex, 0);
  world.rooms[0].cleared = true;
  const moved = transitionToRoom(world, 1, 'E');
  assert.equal(moved, true);
  assert.equal(world.currentRoomIndex, 1);
  assert.equal(world.rooms[1].visited, true);
  assert.equal(world.enemies.length > 0, true);
});

test('12 monster archetypes scale with stage and execute unique movement & attack behaviors', () => {
  assert.equal(Object.keys(ENEMY_ARCHETYPE_CATALOG).length, 12);

  const world = createInitialWorldState('playing', 0, 7);
  world.maxAttackTokens = 6;
  const frost = createEnemy(301, 'frost_revenant', world.player.x + 210, world.player.y, 7, 2, 8);
  const singularity = createEnemy(302, 'void_singularity', world.player.x - 190, world.player.y, 7, 2, 8);
  const zealot = createEnemy(303, 'solar_zealot', world.player.x, world.player.y - 150, 7, 2, 8);
  const inquisitor = createEnemy(304, 'eclipse_inquisitor', world.player.x + 360, world.player.y + 80, 7, 2, 8);
  world.enemies = [frost, singularity, zealot, inquisitor];

  // Verify stage 7 scaling produces higher stats than stage 1
  const stage1Frost = createEnemy(305, 'frost_revenant', 0, 0, 1, 0, 4);
  assert.equal(frost.maxHp > stage1Frost.maxHp, true, 'Stage 7 Frost Revenant should have more HP than Stage 1');
  assert.equal(frost.damage > stage1Frost.damage, true, 'Stage 7 Frost Revenant should deal more damage than Stage 1');

  for (let i = 0; i < 85; i++) {
    stepArenaWorld(world, emptyInput(), 0.025);
  }

  // Projectiles should have been fired by the ranged/controller/elite archetypes
  assert.equal(world.projectiles.length > 0, true, 'New archetypes should fire stage-scaled projectiles');
  assert.equal(
    frost.maxHp > 0 && singularity.maxHp > 0 && zealot.maxHp > 0 && inquisitor.maxHp > 0,
    true
  );
});

test('enemy deaths drop coins and usable roguelike items that can be collected and activated', () => {
  const world = createInitialWorldState('playing', 0, 1);
  // Spawn a low-HP enemy right next to player and use Sunfire Bomb item to kill it
  const weakEnemy = createEnemy(501, 'stalker', world.player.x + 25, world.player.y, 1);
  weakEnemy.hp = 20;
  world.enemies = [weakEnemy];

  // Add Sunfire Bomb to inventory and use it
  addUsableItemToInventory(world, 'sunfire_bomb', 1);
  const bombSlotIdx = world.player.inventory.findIndex((s) => s.itemId === 'sunfire_bomb');
  assert.equal(bombSlotIdx >= 0, true);

  const used = useInventorySlot(world, bombSlotIdx);
  assert.equal(used, true);
  assert.equal(weakEnemy.aiState, 'ko');

  // Verify the killed enemy dropped a gold_coin pickup and another pickup
  const coinDrop = world.pickups.find((pk) => pk.kind === 'gold_coin');
  assert.notEqual(coinDrop, undefined, 'Defeated enemy must drop a gold_coin pickup');

  // Test buying an item with coins when room is cleared
  world.rooms[world.currentRoomIndex].cleared = true;
  world.player.coins = 50;
  const bought = buyMerchantItem(world, 'chrono_hourglass');
  assert.equal(bought, true);
  assert.equal(world.player.coins, 15);
  const freezeSlot = world.player.inventory.findIndex((s) => s.itemId === 'chrono_hourglass');
  assert.equal(freezeSlot >= 0, true);

  // Activate Chrono Hourglass via FrameInput useItemSlot
  stepArenaWorld(world, emptyInput({ useItemSlot: freezeSlot }), 0.016);
  assert.equal(world.enemyFreezeTimer > 3, true);
});

test('reachable defeat transitions to gameover and freezes run snapshot after defeat beat', () => {
  const world = createInitialWorldState('playing', 500, 2);
  world.score = 840;
  world.player.hp = 0;

  for (let i = 0; i < 30; i++) {
    stepArenaWorld(world, emptyInput(), 0.02);
  }

  assert.equal(world.phase, 'gameover');
  assert.equal(world.outcome, 'defeat');
  assert.notEqual(world.snapshot, null);
  assert.equal(world.snapshot?.score, 840);
  assert.equal(world.snapshot?.bestScore, 840);
  assert.equal(world.snapshot?.stageLevel, 2);
});

test('bestiary entries compute stage-scaled stats, track defeated archetypes, and apply +20% weakness stance bonus damage', () => {
  // Verify all 12 archetypes produce valid Bestiary entries and scale up with stage level
  for (const arch of ENEMY_ARCHETYPE_KEYS) {
    const entryStage1 = getBestiaryEntry(arch, 1, 0, 4, 0);
    const entryStage6 = getBestiaryEntry(arch, 6, 3, 7, 2);
    assert.equal(entryStage1.unlocked, false);
    assert.equal(entryStage6.unlocked, true);
    assert.equal(entryStage6.defeatedCount, 2);
    assert.equal(entryStage6.scaledHp > entryStage1.scaledHp, true);
    assert.equal(entryStage6.scaledDamage > entryStage1.scaledDamage, true);
    assert.equal(entryStage6.weaknessSummary.includes('+20% DMG'), true);
    assert.equal(entryStage6.counterTip.length > 10, true);
    assert.equal(entryStage6.attackPattern.length > 5, true);
  }

  // Verify striking an enemy with its weaknessStance deals +20% bonus damage and records defeatedByArchetype on kill
  const world = createInitialWorldState('playing', 0, 1);
  const stalkerMeta = ENEMY_ARCHETYPE_CATALOG.stalker;
  assert.equal(stalkerMeta.weaknessStance, 'dawnblade');

  const targetWeak = createEnemy(701, 'stalker', world.player.x + 48, world.player.y, 1, 0, 4);
  targetWeak.hp = 200;
  targetWeak.maxHp = 200;
  world.enemies = [targetWeak];
  world.player.stance = 'dawnblade'; // Weakness stance for stalker (base damage 28 -> * 1.2 = 34)

  stepArenaWorld(
    world,
    emptyInput({
      aimWorldX: targetWeak.x,
      aimWorldY: targetWeak.y,
      attackJustPressed: true,
      attackHeld: true,
    }),
    0.02
  );
  for (let i = 0; i < 6; i++) {
    stepArenaWorld(world, emptyInput({ aimWorldX: targetWeak.x, aimWorldY: targetWeak.y }), 0.02);
  }

  const damageDealt = 200 - targetWeak.hp;
  assert.equal(damageDealt, Math.round(28 * 1.2), 'Weakness stance should deal +20% bonus damage');

  // Now reduce HP and finish off the stalker to verify defeatedByArchetype increments
  targetWeak.hp = 10;
  world.player.attackPhase = 'idle';
  world.player.attackTimer = 0;
  stepArenaWorld(
    world,
    emptyInput({
      aimWorldX: targetWeak.x,
      aimWorldY: targetWeak.y,
      attackJustPressed: true,
      attackHeld: true,
    }),
    0.02
  );
  for (let i = 0; i < 6; i++) {
    stepArenaWorld(world, emptyInput({ aimWorldX: targetWeak.x, aimWorldY: targetWeak.y }), 0.02);
  }

  assert.equal(targetWeak.aiState, 'ko');
  assert.equal(world.defeatedByArchetype.stalker, 1);
});

test('weapon evolution awakens via relic synergy or Level 5+ and executes Solar Greatsword, Constellation Repeater, and Singularity Harvester mechanics', () => {
  assert.equal(WEAPON_EVOLUTIONS.dawnblade.evolvedName, 'Solar Greatsword');
  assert.equal(WEAPON_EVOLUTIONS.astral_bow.evolvedName, 'Constellation Repeater');
  assert.equal(WEAPON_EVOLUTIONS.chrono_scythe.evolvedName, 'Singularity Harvester');

  // 1. Test Relic Synergy awakening for Dawnblade (corona_edge + solar_vessel)
  const synergyWorld = createInitialWorldState('playing', 0, 1);
  assert.equal(isStanceAwakened(synergyWorld, 'dawnblade'), false);
  applyRelicChoice(synergyWorld, 'corona_edge');
  assert.equal(isStanceAwakened(synergyWorld, 'dawnblade'), false);
  applyRelicChoice(synergyWorld, 'solar_vessel');
  assert.equal(isStanceAwakened(synergyWorld, 'dawnblade'), true, 'Dawnblade should awaken with corona_edge + solar_vessel');

  // 2. Test Level 5+ awakening all 3 stances via XP grant
  const world = createInitialWorldState('playing', 0, 1);
  grantPlayerXp(world, 600); // Enough XP to reach Level 5+
  world.skillChoices = []; // Clear level-up skill selection modal so simulation steps normally
  assert.equal(world.player.level >= 5, true);
  assert.equal(isStanceAwakened(world, 'dawnblade'), true);
  assert.equal(isStanceAwakened(world, 'astral_bow'), true);
  assert.equal(isStanceAwakened(world, 'chrono_scythe'), true);

  // [1] Dawnblade -> Solar Greatsword: Every 3rd slash launches a piercing solar_crescent projectile
  world.player.stance = 'dawnblade';
  const lineEnemy = createEnemy(801, 'stalker', world.player.x + 210, world.player.y, 1, 0, 4);
  lineEnemy.hp = 400;
  lineEnemy.maxHp = 400;
  world.enemies = [lineEnemy];
  world.projectiles = [];

  for (let swing = 1; swing <= 3; swing++) {
    world.player.attackPhase = 'idle';
    world.player.attackTimer = 0;
    stepArenaWorld(
      world,
      emptyInput({
        aimWorldX: lineEnemy.x,
        aimWorldY: lineEnemy.y,
        attackJustPressed: true,
        attackHeld: true,
      }),
      0.016
    );
    // Advance past windup into active phase
    for (let f = 0; f < 6; f++) {
      stepArenaWorld(world, emptyInput({ aimWorldX: lineEnemy.x, aimWorldY: lineEnemy.y }), 0.02);
    }
  }

  assert.equal(world.player.dawnbladeSwingCount, 3);
  const crescentWave = world.projectiles.find((p) => p.kind === 'solar_crescent');
  assert.notEqual(crescentWave, undefined, '3rd Solar Greatsword swing must spawn a solar_crescent wave');
  assert.equal((crescentWave?.pierceLeft ?? 0) >= 50, true, 'Solar crescent wave must pierce enemy ranks');

  // Let crescent travel to hit the distant enemy
  for (let f = 0; f < 15; f++) {
    stepArenaWorld(world, emptyInput({ aimWorldX: lineEnemy.x, aimWorldY: lineEnemy.y }), 0.02);
  }
  assert.equal(lineEnemy.hp < 400, true, 'Solar crescent wave should damage distant enemy in rank');

  // [2] Astral Bow -> Constellation Repeater: Ricochet arrows & exploding star trail mines
  const bowWorld = createInitialWorldState('playing', 0, 1);
  awakenStance(bowWorld, 'astral_bow');
  bowWorld.player.stance = 'astral_bow';
  const targetA = createEnemy(802, 'stalker', bowWorld.player.x + 140, bowWorld.player.y, 1, 0, 4);
  const targetB = createEnemy(803, 'stalker', bowWorld.player.x + 190, bowWorld.player.y + 60, 1, 0, 4);
  targetA.hp = 300;
  targetA.maxHp = 300;
  targetB.hp = 300;
  targetB.maxHp = 300;
  bowWorld.enemies = [targetA, targetB];

  stepArenaWorld(
    bowWorld,
    emptyInput({
      aimWorldX: targetA.x,
      aimWorldY: targetA.y,
      attackJustPressed: true,
      attackHeld: true,
    }),
    0.016
  );

  for (let f = 0; f < 22; f++) {
    stepArenaWorld(bowWorld, emptyInput({ aimWorldX: targetA.x, aimWorldY: targetA.y }), 0.02);
  }

  const starMines = bowWorld.emberZones.filter((z) => z.kind === 'star_mine');
  assert.equal(starMines.length > 0, true, 'Constellation Repeater arrows must leave star_mine zones');
  assert.equal(targetA.hp < 300, true, 'Primary target should be hit by astral arrow');
  assert.equal(targetB.hp < 300, true, 'Second target should be hit by ricocheting astral arrow');

  // [3] Chrono Scythe -> Singularity Harvester: Vortex pull & 1.2s Time-Stop
  const scytheWorld = createInitialWorldState('playing', 0, 1);
  awakenStance(scytheWorld, 'chrono_scythe');
  scytheWorld.player.stance = 'chrono_scythe';
  const pulledEnemy = createEnemy(804, 'sentinel', scytheWorld.player.x + 185, scytheWorld.player.y + 40, 1, 0, 4);
  pulledEnemy.hp = 400;
  pulledEnemy.maxHp = 400;
  scytheWorld.enemies = [pulledEnemy];
  const vortexX = scytheWorld.player.x + 68;
  const vortexY = scytheWorld.player.y;
  const initialDistToVortex = Math.hypot(pulledEnemy.x - vortexX, pulledEnemy.y - vortexY);

  stepArenaWorld(
    scytheWorld,
    emptyInput({
      aimWorldX: scytheWorld.player.x + 200,
      aimWorldY: scytheWorld.player.y,
      attackJustPressed: true,
      attackHeld: true,
    }),
    0.016
  );
  // Step just enough frames to enter active phase and trigger vortex pull + Time-Stop
  for (let f = 0; f < 9; f++) {
    stepArenaWorld(
      scytheWorld,
      emptyInput({
        aimWorldX: scytheWorld.player.x + 200,
        aimWorldY: scytheWorld.player.y,
      }),
      0.02
    );
  }

  const afterDistToVortex = Math.hypot(pulledEnemy.x - vortexX, pulledEnemy.y - vortexY);
  assert.equal(afterDistToVortex < initialDistToVortex, true, 'Singularity Harvester must pull enemy toward vortex center');
  assert.equal(scytheWorld.enemyFreezeTimer > 0.8, true, 'Singularity Harvester must apply brief Time-Stop');
  assert.equal(scytheWorld.vortexVisuals.length > 0, true, 'Singularity Harvester must spawn a gravitational vortex visual');
});

test('daily challenge seed determinism, boss rush / endless abyss gauntlet, and top 10 global sanctum leaderboard ranking', () => {
  // 1. Daily Challenge Seed determinism
  const dailyA = getDailyChallengeConfig('2026-10-29');
  const dailyB = getDailyChallengeConfig('2026-10-29');
  assert.equal(dailyA.seedCode, 'SOLAR-20261029');
  assert.deepEqual(dailyA, dailyB, 'Same date must produce identical Daily Challenge Seed config');

  const dailyWorld1 = createInitialWorldState('playing', 0, 1, 'daily_challenge', '2026-10-29');
  const dailyWorld2 = createInitialWorldState('playing', 0, 1, 'daily_challenge', '2026-10-29');
  assert.equal(dailyWorld1.gameMode, 'daily_challenge');
  assert.equal(dailyWorld1.dailySeed, 'SOLAR-20261029');
  assert.equal(isStanceAwakened(dailyWorld1, dailyA.awakenedStance), true, 'Daily challenge must start with daily awakened stance');
  assert.equal(dailyWorld1.collectedRelics.includes(dailyA.startingRelicId), true, 'Daily challenge must grant starting relic');
  assert.deepEqual(
    dailyWorld1.rooms.map((r) => r.roster),
    dailyWorld2.rooms.map((r) => r.roster),
    'Daily challenge room rosters must be 100% deterministic for the same seed'
  );

  // 2. Boss Rush / Endless Abyss mode
  const bossRushWorld = createInitialWorldState('playing', 0, 6, 'boss_rush');
  assert.equal(bossRushWorld.gameMode, 'boss_rush');
  assert.equal(bossRushWorld.player.level, 3);
  assert.equal(bossRushWorld.player.maxHp, 180);
  assert.equal(isStanceAwakened(bossRushWorld, 'dawnblade'), true);
  assert.equal(bossRushWorld.rooms.length, 5);
  assert.equal(bossRushWorld.rooms[4].roster.filter((a) => a === 'archon').length, 2, 'Crucible V must feature Twin Archon Bosses');

  const nextCycle = advanceBossRushAbyssCycle(bossRushWorld);
  assert.equal(nextCycle, 2);
  assert.equal(bossRushWorld.bossRushCycle, 2);
  assert.equal(bossRushWorld.currentRoomIndex, 0);

  // 3. Speedrun time formatting & Top 10 Global Sanctum Leaderboard ranking
  assert.equal(formatSpeedrunTime(94.5), '01:34.5');
  const topScoreList = buildRankedLeaderboard(
    [],
    {
      uid: 'player_hero',
      displayName: 'Champion Warden',
      bestScore: 25000,
      highestStage: 10,
      fastestClearTimeSec: 88,
      dailySeed: 'SOLAR-20261029',
      dailyScore: 19500,
      bossRushWaves: 18,
      bossRushScore: 31000,
      favoriteStance: 'chrono_scythe',
      isCurrentUser: true,
    },
    'high_score',
    'SOLAR-20261029'
  );
  assert.equal(topScoreList.length, 10);
  assert.equal(topScoreList[0].uid, 'player_hero');
  assert.equal(topScoreList[0].bestScore, 25000);

  const speedrunList = buildRankedLeaderboard(
    [],
    topScoreList[0],
    'speedrun',
    'SOLAR-20261029'
  );
  assert.equal(speedrunList[0].uid, 'player_hero');
  assert.equal(speedrunList[0].fastestClearTimeSec, 88);
});

test('Mercenary / Familiar Companions: Ember Wisp auto-fires, Aegis Cherub blocks 1 hit every 20s, and Greed Imp magnetizes room pickups', () => {
  assert.equal(FAMILIAR_KEYS.length, 3);
  assert.equal(FAMILIAR_CATALOG.ember_wisp.name, 'Ember Wisp');
  assert.equal(FAMILIAR_CATALOG.aegis_cherub.name, 'Aegis Cherub');
  assert.equal(FAMILIAR_CATALOG.greed_imp.name, 'Greed Imp');

  // 1. Ember Wisp: automatically fires ember_bolt projectiles at nearest living enemy
  const world = createInitialWorldState('playing', 0, 1);
  assert.equal(world.player.activeFamiliar, 'ember_wisp');
  const target = createEnemy(901, 'stalker', world.player.x + 180, world.player.y, 1);
  target.hp = 200;
  target.maxHp = 200;
  world.enemies = [target];

  let wispFired = false;
  for (let i = 0; i < 45; i++) {
    const ev = stepArenaWorld(world, emptyInput(), 0.03);
    if (ev.familiarFired) wispFired = true;
  }
  assert.equal(wispFired, true, 'Ember Wisp should automatically fire solar projectiles');
  assert.equal(target.hp < 200, true, 'Ember Wisp projectiles should damage the nearest enemy');

  // 2. Aegis Cherub: hire/equip, blocks 1 attack completely, and recharges after 20 seconds
  world.player.coins = 100;
  const hiredCherub = hireOrEquipFamiliar(world, 'aegis_cherub');
  assert.equal(hiredCherub, true);
  assert.equal(world.player.activeFamiliar, 'aegis_cherub');
  assert.equal(world.player.cherubShieldActive, true);
  assert.equal(world.player.coins, 100 - FAMILIAR_CATALOG.aegis_cherub.hireCost);

  const hpBeforeHit = world.player.hp;
  world.hitstopTimer = 0;
  world.player.invulnTimer = 0;
  world.projectiles.push({
    id: 9901,
    x: world.player.x,
    y: world.player.y,
    vx: 0,
    vy: 0,
    radius: 12,
    damage: 25,
    color: '#f43f5e',
    life: 0,
    maxLife: 1.0,
    pierceLeft: 0,
    hitEnemyIds: [],
    fromPlayer: false,
    kind: 'standard',
  });
  const blockEv = stepArenaWorld(world, emptyInput(), 0.02);
  assert.equal(blockEv.cherubShieldBlocked, true, 'Aegis Cherub shield must block 1 incoming attack');
  assert.equal(world.player.hp, hpBeforeHit, 'Player HP must remain unchanged when Aegis Cherub shield blocks hit');
  assert.equal(world.player.cherubShieldActive, false, 'Shield becomes inactive after blocking 1 attack');

  // Advance 20 seconds of simulation (410 steps * 0.05s) with dummy enemy parked far away so room doesn't clear
  world.hitstopTimer = 0;
  target.x = 1150;
  target.y = 650;
  target.speed = 0;
  world.enemies = [target];
  world.projectiles = [];
  for (let i = 0; i < 410; i++) {
    world.projectiles = [];
    stepArenaWorld(world, emptyInput(), 0.05);
  }
  assert.equal(world.player.cherubShieldActive, true, 'Aegis Cherub shield must recharge after 20 seconds');

  // 3. Greed Imp: magnetizes distant coins, XP crystals, and items across the entire room + bonus coin value
  const hiredImp = hireOrEquipFamiliar(world, 'greed_imp');
  assert.equal(hiredImp, true);
  assert.equal(world.player.activeFamiliar, 'greed_imp');

  const startCoins = world.player.coins;
  const startXp = world.player.xp;
  world.pickups.push(
    {
      id: 9951,
      x: world.player.x + 650,
      y: world.player.y - 220,
      vx: 0,
      vy: 0,
      kind: 'gold_coin',
      value: 10,
      life: 20,
    },
    {
      id: 9952,
      x: world.player.x - 580,
      y: world.player.y + 240,
      vx: 0,
      vy: 0,
      kind: 'astral_shard',
      value: 20,
      life: 20,
    }
  );

  for (let i = 0; i < 60; i++) {
    stepArenaWorld(world, emptyInput(), 0.04);
  }
  assert.equal(world.pickups.length, 0, 'Greed Imp must magnetize and collect room-wide pickups');
  assert.equal(world.player.coins > startCoins + 10, true, 'Greed Imp must grant +20% bonus coin value');
  assert.equal(world.player.xp >= startXp + 20, true, 'Greed Imp must pull and collect distant XP shards');

  // Cycling familiars with [F] cycles through unlocked familiars
  const cycled = cycleActiveFamiliar(world);
  assert.equal(cycled, 'ember_wisp');
});

test('Sanctum Traps & Interactive Arena Hazards: Solar Brazier blast, Spike Runes impale, Cursed Altar blood sacrifice, and Healing Fountain', () => {
  assert.equal(SANCTUM_HAZARD_CATALOG.solar_brazier.name, 'Solar Brazier');
  assert.equal(SANCTUM_HAZARD_CATALOG.spike_rune.name, 'Spike Runes');
  assert.equal(SANCTUM_HAZARD_CATALOG.cursed_altar.name, 'Cursed Blood Altar');
  assert.equal(SANCTUM_HAZARD_CATALOG.healing_fountain.name, 'Sanctum Healing Fountain');

  const world = createInitialWorldState('playing', 0, 1);
  assert.equal(world.hazards.length >= 6, true, 'Each room must generate Solar Braziers, Spike Runes, Cursed Altar, and Healing Fountain');

  // 1. Solar Brazier: striking a ready brazier detonates a fiery shockwave onto nearby enemies
  const brazier = world.hazards.find((h) => h.kind === 'solar_brazier')!;
  assert.ok(brazier);
  assert.equal(brazier.cooldown, 0);

  const nearbyMonster = createEnemy(9801, 'stalker', brazier.x + 60, brazier.y, 1);
  nearbyMonster.hp = 200;
  nearbyMonster.maxHp = 200;
  world.enemies = [nearbyMonster];

  // Position player next to the Solar Brazier and swing Dawnblade
  world.player.x = brazier.x - 36;
  world.player.y = brazier.y;
  world.player.stance = 'dawnblade';
  world.hitstopTimer = 0;

  let brazierDetonated = false;
  for (let i = 0; i < 12; i++) {
    world.hitstopTimer = 0;
    const ev = stepArenaWorld(
      world,
      emptyInput({
        attackJustPressed: i === 0,
        aimWorldX: brazier.x,
        aimWorldY: brazier.y,
      }),
      0.03
    );
    if (ev.brazierDetonated) brazierDetonated = true;
  }
  assert.equal(brazierDetonated, true, 'Striking a Solar Brazier with a melee attack must detonate it');
  assert.equal(brazier.cooldown > 0, true, 'Detonated Solar Brazier must enter re-ignition cooldown');
  assert.equal(nearbyMonster.hp < 200, true, 'Solar Brazier shockwave must deal AoE fire damage to nearby enemies');
  assert.equal(world.emberZones.length > 0, true, 'Solar Brazier detonation must spawn a burning ember zone');

  // 2. Spike Runes: knocking/positioning an enemy onto an active Spike Rune deals impale damage
  const spikeRune = world.hazards.find((h) => h.kind === 'spike_rune')!;
  assert.ok(spikeRune);
  spikeRune.spikePhase = 'active';
  spikeRune.cycleTimer = 0;
  spikeRune.tickTimer = 0;

  const impaledMonster = createEnemy(9802, 'juggernaut', spikeRune.x, spikeRune.y, 1);
  impaledMonster.hp = 300;
  impaledMonster.maxHp = 300;
  impaledMonster.vx = 180; // Knocked onto spikes with Chrono Scythe velocity
  world.enemies = [impaledMonster];
  world.emberZones = [];
  world.hitstopTimer = 0;

  const spikeEv = stepArenaWorld(world, emptyInput(), 0.03);
  assert.equal(spikeEv.spikeTrapTriggered, true, 'Active Spike Rune must trigger when an enemy is on it');
  assert.equal(impaledMonster.hp < 300, true, 'Active Spike Rune must impale and damage enemies standing/knocked onto it');

  // 3. Cursed Blood Altar: sacrifices 25% Max HP for permanent +22% Damage buff + Relic blessing
  const cursedAltar = world.hazards.find((h) => h.kind === 'cursed_altar')!;
  assert.ok(cursedAltar);
  world.player.hp = 100;
  world.player.maxHp = 100;
  world.player.essence = 40;
  const dmgBefore = world.player.damageMultiplier;
  const relicsBefore = world.collectedRelics.length;

  world.player.x = cursedAltar.x;
  world.player.y = cursedAltar.y + 20;
  world.hitstopTimer = 0;
  const altarEv = stepArenaWorld(world, emptyInput({ interactJustPressed: true }), 0.02);
  assert.equal(altarEv.shrineActivated, 'cursed_altar');
  assert.equal(cursedAltar.used, true, 'Cursed Altar must be marked used after activation');
  assert.equal(world.player.hp, 75, 'Cursed Altar must sacrifice 25% of 100 HP');
  assert.equal(world.player.damageMultiplier >= dmgBefore + 0.22, true, 'Cursed Altar must grant permanent +22% damage buff');
  assert.equal(world.collectedRelics.length, relicsBefore + 1, 'Cursed Altar must grant a Relic blessing');

  // 4. Sanctum Healing Fountain: restores 40% Max HP and +45 Essence
  const healingFountain = world.hazards.find((h) => h.kind === 'healing_fountain')!;
  assert.ok(healingFountain);
  const res = activateSanctumShrine(world, healingFountain.id);
  assert.equal(res.activated, true);
  assert.equal(res.kind, 'healing_fountain');
  assert.equal(healingFountain.used, true);
  assert.equal(world.player.hp, 100, 'Healing Fountain must restore +40% Max HP');
  assert.equal(world.player.essence >= 85, true, 'Healing Fountain must restore +45 Essence');
});

test('ArenaCanvas Screen-Shake triggers on player damage, critical strike, and Solar Brazier detonation', () => {
  const world = createInitialWorldState('playing', 0, 1);
  assert.equal(world.lastScreenShakeReason, 'none');
  assert.equal(world.screenShakeTimer, 0);

  // 1. Solar Brazier detonation triggers 'brazier_detonated' screen shake
  const brazier = world.hazards.find((h) => h.kind === 'solar_brazier')!;
  assert.ok(brazier);
  detonateSolarBrazier(world, brazier);
  assert.equal(world.lastScreenShakeReason, 'brazier_detonated');
  assert.equal(world.screenShakeTimer, SCREEN_SHAKE_PROFILES.brazier_detonated.duration);
  assert.equal(world.screenShakeIntensity, SCREEN_SHAKE_PROFILES.brazier_detonated.intensity);

  const brazierShakeSample = computeScreenShakeOffset(world, 0.05);
  assert.equal(brazierShakeSample.active, true, 'Screen shake sample must be active after brazier detonation');
  assert.equal(brazierShakeSample.reason, 'brazier_detonated');
  assert.equal(
    Math.hypot(brazierShakeSample.offsetX, brazierShakeSample.offsetY) > 1,
    true,
    'Screen shake offset must displace the camera'
  );

  // Decay shake timer
  world.screenShakeTimer = 0;
  world.cameraTrauma = 0;

  // 2. Critical Strike (3rd combo hit / finisher) triggers 'critical_strike' screen shake & 1.5x crit damage
  const target = createEnemy(9901, 'stalker', world.player.x + 48, world.player.y, 1);
  target.hp = 300;
  target.maxHp = 300;
  world.enemies = [target];
  world.comboCount = 2; // Next hit is the 3rd combo hit -> Critical Strike!

  const critEvents = stepArenaWorld(world, emptyInput(), 0.016);
  damageEnemy(world, target, 40, 0, 200, 0.04, critEvents, true);
  assert.equal(critEvents.criticalStrike, true, '3rd combo hit must register a critical strike');
  assert.equal(critEvents.screenShakeReason, 'critical_strike');
  assert.equal(world.lastScreenShakeReason, 'critical_strike');
  assert.equal(world.criticalStrikesCount, 1);
  assert.equal(world.lastCritDamage, 60, 'Critical strike must deal 1.5x damage (40 -> 60)');
  assert.equal(world.screenShakeTimer, SCREEN_SHAKE_PROFILES.critical_strike.duration);

  const critShakeSample = computeScreenShakeOffset(world, 0.08);
  assert.equal(critShakeSample.active, true);
  assert.equal(critShakeSample.reason, 'critical_strike');

  // 3. Player taking damage triggers 'player_hurt' screen shake with highest intensity
  world.player.invulnTimer = 0;
  world.player.cherubShieldActive = false;
  world.player.aegisActive = false;
  const hurtEvents = stepArenaWorld(world, emptyInput(), 0.016);
  damagePlayer(world, 18, Math.PI * 0.25, hurtEvents);

  assert.equal(hurtEvents.playerHurt, true);
  assert.equal(hurtEvents.screenShakeReason, 'player_hurt');
  assert.equal(world.lastScreenShakeReason, 'player_hurt');
  assert.equal(world.screenShakeIntensity, SCREEN_SHAKE_PROFILES.player_hurt.intensity);
  assert.equal(world.screenShakeTimer, SCREEN_SHAKE_PROFILES.player_hurt.duration);

  const hurtShakeSample = computeScreenShakeOffset(world, 0.11);
  assert.equal(hurtShakeSample.active, true);
  assert.equal(hurtShakeSample.reason, 'player_hurt');
  assert.equal(Math.abs(hurtShakeSample.rotationRad) > 0, true, 'Screen shake must include subtle rotational impact');

  // Direct helper test
  triggerScreenShake(world, 'critical_strike', 0, undefined, 12);
  assert.equal(world.lastScreenShakeReason, 'critical_strike');
});

test('Elemental Debuffs (Burned & Slowed) apply to enemies and player, tick damage/movement penalties, and sync HUD views', () => {
  assert.equal(ELEMENTAL_DEBUFF_CATALOG.burned.shortLabel, 'BURN');
  assert.equal(ELEMENTAL_DEBUFF_CATALOG.slowed.shortLabel, 'SLOW');

  const world = createInitialWorldState('playing', 0, 1);
  const enemy = createEnemy(9910, 'juggernaut', world.player.x + 80, world.player.y, 1);
  enemy.hp = 250;
  enemy.maxHp = 250;
  world.enemies = [enemy];

  // 1. Apply BURNED and SLOWED to enemy & verify overhead debuff views + room summary
  applyEnemyDebuff(enemy, 'burned', 3.6);
  applyEnemyDebuff(enemy, 'burned', 3.6); // 2nd stack
  applyEnemyDebuff(enemy, 'slowed', 3.2);

  const enemyDebuffs = getEnemyActiveDebuffs(enemy);
  assert.equal(enemyDebuffs.length, 2);
  assert.equal(enemyDebuffs[0].id, 'burned');
  assert.equal(enemyDebuffs[0].stacks, 2);
  assert.equal(enemyDebuffs[1].id, 'slowed');

  const summary = getRoomEnemyDebuffSummary(world);
  assert.equal(summary.burnedCount, 1);
  assert.equal(summary.slowedCount, 1);

  // Step simulation so enemy burn tick fires and reduces enemy HP
  const hpBeforeTick = enemy.hp;
  for (let i = 0; i < 16; i++) {
    world.hitstopTimer = 0;
    stepArenaWorld(world, emptyInput(), 0.05);
  }
  assert.equal(enemy.hp < hpBeforeTick, true, 'Burned enemy must take periodic fire damage over time');

  // 2. Apply BURNED and SLOWED to player & verify player status bar debuff views + cleanse
  world.player.hp = 100;
  applyPlayerDebuff(world, 'burned', 3.6);
  applyPlayerDebuff(world, 'slowed', 3.2);

  const playerDebuffs = getPlayerActiveDebuffs(world.player);
  assert.equal(playerDebuffs.length, 2);
  assert.equal(playerDebuffs[0].id, 'burned');
  assert.equal(playerDebuffs[1].id, 'slowed');

  // Step simulation with movement input while slowed vs normal
  const pHpBefore = world.player.hp;
  for (let i = 0; i < 15; i++) {
    world.hitstopTimer = 0;
    stepArenaWorld(world, emptyInput({ moveX: 1 }), 0.05);
  }
  assert.equal(world.player.hp < pHpBefore, true, 'Burned player must take periodic burn tick damage');
  assert.equal(
    Math.abs(world.player.vx) <= world.player.speed * ELEMENTAL_DEBUFF_CATALOG.slowed.playerSpeedMultiplier + 2,
    true,
    'Slowed player movement speed must be reduced by playerSpeedMultiplier'
  );

  // Cleansing debuffs via Crimson Elixir / cleansePlayerDebuffs clears active player debuffs
  cleansePlayerDebuffs(world);
  assert.equal(getPlayerActiveDebuffs(world.player).length, 0);
});

test('Combat Log Overlay records Critical Strike!, Relic Synergy Triggered!, and Perfect Dodge with fading lifetime expiration', () => {
  const world = createInitialWorldState('playing', 0, 1);
  assert.equal(getActiveCombatLogEntries(world).length, 0);

  // 1. Relic Synergy Triggered! on stance awakening or Relic selection
  awakenStance(world, 'dawnblade');
  let logs = getActiveCombatLogEntries(world);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].kind, 'relic_synergy');
  assert.equal(logs[0].title, 'Relic Synergy Triggered!');
  assert.equal(logs[0].detail.includes('Solar Greatsword'), true);

  // 2. Critical Strike! on 3rd combo hit / finisher
  const dummyEnemy = createEnemy(9950, 'stalker', world.player.x + 42, world.player.y, 1);
  dummyEnemy.hp = 250;
  dummyEnemy.maxHp = 250;
  world.enemies = [dummyEnemy];
  world.comboCount = 2;
  const simEv = stepArenaWorld(world, emptyInput(), 0.016);
  damageEnemy(world, dummyEnemy, 36, 0, 180, 0.04, simEv, true);

  logs = getActiveCombatLogEntries(world);
  assert.equal(logs.some((e) => e.kind === 'critical_strike' && e.title === 'Critical Strike!'), true);

  // 3. Perfect Dodge when dashing past an enemy projectile or threatening lunge
  world.hitstopTimer = 0;
  world.player.dashCooldown = 0;
  world.player.perfectDodgeCooldown = 0;
  world.player.essence = 50;
  world.projectiles.push({
    id: 9988,
    fromPlayer: false,
    x: world.player.x + 22,
    y: world.player.y + 8,
    vx: -120,
    vy: 0,
    radius: 8,
    damage: 14,
    color: '#f43f5e',
    life: 0,
    maxLife: 2.0,
    pierceLeft: 1,
    hitEnemyIds: [],
  });

  const dodgeEv = stepArenaWorld(
    world,
    emptyInput({ dashJustPressed: true, moveX: 0, moveY: -1 }),
    0.02
  );
  assert.equal(dodgeEv.perfectDodge, true, 'Dashing near an enemy projectile must trigger Perfect Dodge');
  assert.equal(world.player.essence > 50, true, 'Perfect Dodge must reward +15 Essence');

  logs = getActiveCombatLogEntries(world);
  assert.equal(logs.some((e) => e.kind === 'perfect_dodge' && e.title === 'Perfect Dodge'), true);

  // 4. Advance combat log timer and verify entries age and expire cleanly
  pushCombatLog(world, 'brazier_blast', 'Solar Brazier Detonated!', 'Shockwave', 2.0);
  assert.equal(getActiveCombatLogEntries(world).length, 4);

  tickCombatLog(world, 1.5);
  assert.equal(getActiveCombatLogEntries(world).every((e) => e.age >= 1.5), true);

  tickCombatLog(world, 3.0);
  assert.equal(getActiveCombatLogEntries(world).length, 0, 'Expired combat log entries must be removed');
});

test('Elemental Reaction & Combo System triggers Thermal Shock (Burned + Slowed) and Solar Meltdown (3x Burn + Crit)', () => {
  assert.equal(ELEMENTAL_REACTION_CATALOG.thermal_shock.name, 'Thermal Shock');
  assert.equal(ELEMENTAL_REACTION_CATALOG.solar_meltdown.name, 'Solar Meltdown');

  const world = createInitialWorldState('playing', 0, 1);
  const primary = createEnemy(9960, 'juggernaut', 450, 340, 1);
  primary.hp = 500;
  primary.maxHp = 500;
  const nearby = createEnemy(9961, 'stalker', 520, 340, 1);
  nearby.hp = 260;
  nearby.maxHp = 260;
  world.enemies = [primary, nearby];

  // 1. Thermal Shock: when Burned + Slowed meet on primary enemy, triggers instant True Damage, spreads debuffs to nearby enemy, and logs 'Elemental Reaction: Thermal Shock!'
  applyEnemyDebuff(primary, 'burned', 4.0, undefined, world, 1);
  assert.equal(world.thermalShockCount, 0);

  applyEnemyDebuff(primary, 'slowed', 3.5, undefined, world);
  assert.equal(world.thermalShockCount, 1, 'Thermal Shock must trigger when Burned and Slowed meet');
  assert.equal(primary.hp < 500, true, 'Thermal Shock must deal instant bonus True Damage');
  assert.equal(nearby.burnTimer > 0 && nearby.slowTimer > 0, true, 'Thermal Shock must spread Burned and Slowed to nearby enemies');
  assert.equal(nearby.hp < 260, true, 'Thermal Shock splash must damage nearby enemies');
  assert.equal(
    getActiveCombatLogEntries(world).some(
      (e) => e.kind === 'thermal_shock' && e.title === 'Elemental Reaction: Thermal Shock!'
    ),
    true,
    'Combat log must record Elemental Reaction: Thermal Shock!'
  );

  // 2. Solar Meltdown: when an enemy with 3x Burn Stacks is hit by a Critical Strike, detonates all fire stacks and sunders Elite/Boss armor (+35% DMG taken)
  const boss = createEnemy(9962, 'archon', 600, 280, 1);
  boss.hp = 900;
  boss.maxHp = 900;
  world.enemies = [boss];

  applyEnemyDebuff(boss, 'burned', 4.5, undefined, world, 3);
  assert.equal(boss.burnStacks, 3);

  const simEv = stepArenaWorld(world, emptyInput(), 0.016);
  damageEnemy(world, boss, 40, 0, 180, 0.04, simEv, true, true);

  assert.equal(world.solarMeltdownCount, 1, 'Solar Meltdown must trigger on 3x Burn Stacks + Critical Strike');
  assert.equal(boss.burnStacks, 0, 'Solar Meltdown must consume all 3 burn stacks');
  assert.equal(boss.sunderTimer > 0, true, 'Solar Meltdown must inflict Armor Sundered debuff on Elite/Boss');
  assert.equal(
    getEnemyActiveDebuffs(boss).some((d) => d.id === 'sundered'),
    true,
    'Enemy overhead debuff list must include sundered'
  );
  assert.equal(getRoomEnemyDebuffSummary(world).sunderedCount, 1);
  assert.equal(
    getActiveCombatLogEntries(world).some(
      (e) => e.kind === 'solar_meltdown' && e.title === 'Elemental Reaction: Solar Meltdown!'
    ),
    true,
    'Combat log must record Elemental Reaction: Solar Meltdown!'
  );

  // Verify sundered enemy takes +35% amplified damage on subsequent hits
  const hpBeforeSunderedHit = boss.hp;
  damageEnemy(world, boss, 100, 0, 80, 0.02, simEv, false, false);
  const dmgDealt = hpBeforeSunderedHit - boss.hp;
  assert.equal(dmgDealt, 135, 'Armor Sundered enemy must take +35% damage (135 instead of 100)');
});




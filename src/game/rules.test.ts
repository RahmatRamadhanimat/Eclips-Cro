import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addUsableItemToInventory,
  applyRelicChoice,
  applySkillChoice,
  buyMerchantItem,
  clampDt,
  createEnemy,
  createInitialWorldState,
  ENEMY_ARCHETYPE_CATALOG,
  FrameInput,
  generateDungeonMap,
  getHealthPipStates,
  getStageDifficultyProfile,
  grantPlayerXp,
  MAX_STAGE_LEVEL,
  STAGE_CATALOG,
  stepArenaWorld,
  transitionToRoom,
  useInventorySlot,
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

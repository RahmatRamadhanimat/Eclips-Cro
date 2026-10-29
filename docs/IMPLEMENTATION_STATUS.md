# Eclipse Chronicle: Pixel Arena — Implementation Status

## 1. Ringkasan Fitur yang Telah Selesai
- **Inti Pertarungan & Audio Prosedural**:
  - 3 *Weapon Stances* (`Dawnblade`, `Astral Bow`, `Chrono Scythe`), *Dash* (`[Space]`), *Solar Nova* (`[E]`), dan Web Audio API synthesizer prosedural.
- **Sistem Level-Up & Pemilihan Skill (`Choose a Combat Skill`)**:
  - Setiap musuh yang dikalahkan memberikan XP; saat naik level, muncul modal interaktif berisi 3 pilihan *Combat Skill* (`Orbiting Solar Blades`, `Astral Chain Lightning`, `Ignis Dash Trail`, `Phantom Strike Echo`, `Eclipse Supernova`, `Dawn Aegis Ward`) yang dapat ditingkatkan hingga Rank 3.
- **Fitur Login Akun & Cloud Save Progress (Firebase Auth + Firestore)**:
  - **Google Sign-In & Cloud Sync (`src/firebase.ts`)**: Pemain dapat login menggunakan akun Google (`Login with Google`) di pojok kanan atas maupun pada *Title Screen*.
  - **Penyimpanan Progres Otomatis**: Data progres pemain (`bestScore`, `highestUnlockedStage`, `totalCoins`, `runsPlayed`, `displayName`) otomatis disinkronkan secara *real-time* ke koleksi Firestore `playerProgress/{userId}` dengan aturan keamanan `firestore.rules`.
  - **Mode Lokal Tetap Aktif (Offline Fallback)**: Tanpa login sekalipun, seluruh progres tetap tersimpan di `localStorage`.
- **Generasi Ruangan Taktis & Scaling Kesulitan Berbasis Stage (`getStageDifficultyProfile`, `selectRoomFormation`, `buildRoomRoster`)**:
  - Setiap stage memiliki **4 hingga 10 ruangan** (`Stage 1: 4 Rooms` s/d `Stage 10: 10 Rooms`) dengan **5 variasi tata letak pilar** (`createRoomPillars(roomIndex, stageLevel)`).
  - **Formasi Skuad Taktis per Ruangan (`RoomFormationType`)**: Setiap ruangan memilih komposisi taktis (`vanguard_patrol`, `crossfire_battery`, `shadow_ambush`, `siege_phalanx`, `arcane_convergence`, `inquisitor_sanctum`, hingga `sovereign_throne`).
  - **Kurva Kesulitan Multi-Dimensi (`getStageDifficultyProfile`)**: Seiring naiknya nomor stage dan kedalaman ruangan, monster memperoleh peningkatan HP (`hpMultiplier`), *damage* (`damageMultiplier`), kecepatan gerak (`speedMultiplier`), percepatan *cooldown* serangan (`cooldownMultiplier`), kecepatan proyektil (`projectileSpeedMultiplier`), serta jumlah penyerang simultan (`maxConcurrentAttackers` hingga 6).
- **12 Arketipe Monster Beragam dengan Pola Gerak & Serangan Unik (`ENEMY_ARCHETYPE_CATALOG`)**:
  1. `Void Stalker` (*Stage 1+* — *Curved flank pursuit* & *short-range crimson lunge* · Kelemahan: `Dawnblade`)
  2. `Blink Wraith` (*Stage 1+* — *Diagonal sinusoidal weave* & *high-velocity phantom blink-slash* · Kelemahan: `Chrono Scythe`)
  3. `Rift Arcanist` (*Stage 1+* — *Standoff kiting* & *stage-scaled 1/2/3 rift orb volley* · Kelemahan: `Astral Bow`)
  4. `Frost Revenant` (*Stage 2+* — *Figure-eight glacial glide* & *piercing cryo-lance + 3/5 crescent ice shard fan* · Kelemahan: `Dawnblade`)
  5. `Cinder Pyromancer` (*Stage 2+* — *Mid-range thermal orbit* & *3/5 spreading magma mortar fan* · Kelemahan: `Astral Bow`)
  6. `Solaris Sentinel` (*Stage 3+* — *Relentless armored advance* & *4-way / 8-way cardinal laser pulse* · Kelemahan: `Chrono Scythe`)
  7. `Obsidian Juggernaut` (*Stage 3+* — *Heavy unstoppable march* & *long-distance bull charge* · Kelemahan: `Chrono Scythe`)
  8. `Necro Weaver` (*Stage 4+* — *Wide ritual circle orbit*, *tri-bolt curse fan*, & *shadow minion summon* · Kelemahan: `Astral Bow`)
  9. `Void Singularity` (*Stage 4+* — *Harmonic anchor drift*, *gravitational pull windup*, & *6/8 spiral void orb burst* · Kelemahan: `Astral Bow`)
  10. `Solar Zealot` (*Stage 5+* — *Frenzied zig-zag rush* yang *enrage* di bawah 60% HP & *cleaving dash + twin lateral solar chakrams* · Kelemahan: `Dawnblade`)
  11. `Eclipse Inquisitor` (*Stage 6+* — *Tactical shadow-step teleportation* & *8-way judgment star + aimed triple lance burst* · Kelemahan: `Chrono Scythe`)
  12. `Archon of the Corona` (*Boss* — *Multi-phase radial corona barrage + targeted annihilation blast* · Kelemahan: `Dawnblade`)
- **Fitur Bestiary Hover saat Game Dijeda (`Sanctum Bestiary Codex · Hover Inspector`)**:
  - **Pelacakan Monster yang Dikalahkan (`defeatedByArchetype` & `localStorage`)**: Setiap arketipe monster yang dikalahkan dalam pertarungan dicatat secara otomatis ke dalam status run dan disimpan secara persisten di `localStorage` (`eclipse_chronicle_bestiary_v1`).
  - **Inspeksi Hover Ganda saat Pause (`phase === 'paused'`)**: Hover langsung pada monster di kanvas arena maupun pada grid 12 arketipe di panel *Sanctum Bestiary Codex*.
  - **Sistem Kelemahan Senjata Nyata (`+20% Bonus DMG`)**: Menyerang monster menggunakan *Weapon Stance* yang menjadi kelemahannya (`weaknessStance`) memberikan **+20% Bonus Damage**.
- **Sistem Weapon Evolution / Stance Awakening (`WEAPON_EVOLUTIONS`, `syncAwakenedStances`, `awakenStance`)**:
  - **[1] Dawnblade → Solar Greatsword** (*Level 5+* atau `Corona Edge` + `Solar Vessel`): Setiap tebasan ke-3 melepaskan gelombang api bulan sabit (`solar_crescent`) yang menembus barisan musuh.
  - **[2] Astral Bow → Constellation Repeater** (*Level 5+* atau `Astral Conduit` + `Quicksilver Step`): Anak panah memantul (*ricochet*) antar musuh dan meninggalkan jejak ranjau bintang (`star_mine`) yang meledak.
  - **[3] Chrono Scythe → Singularity Harvester** (*Level 5+* atau `Siphon Sigil` + `Corona Edge`): Tebasan sabit menarik musuh ke titik tengah pusaran gravitasi (*vortex pull*) dan memberi efek *Time-Stop* singkat (`1.2s`).
- **Global Sanctum Leaderboard, Daily Challenge Seed, & Boss Rush / Endless Abyss Mode**:
  - **Global Sanctum Leaderboard (`leaderboardEntries/{userId}` di Firestore + `buildRankedLeaderboard`)**:
    - Menampilkan **Top 10 Pemain** dengan 4 tab kategori peringkat: **Top 10 High Score**, **Stage & Speedrun (Waktu Tercepat)**, **Daily Seed (`SOLAR-YYYYMMDD`)**, dan **Boss Rush / Endless Abyss**.
    - Menyinkronkan rekor pemain secara *real-time* ke Firestore saat login, sekaligus mendukung penyimpanan lokal di `localStorage` agar selalu dapat dimainkan dan diuji.
  - **Daily Challenge Seed (`getDailyChallengeConfig`)**:
    - Menghasilkan seed harian deterministik berbasis tanggal UTC (`SOLAR-YYYYMMDD`) dengan tata letak ruangan dan komposisi monster yang 100% identik bagi seluruh pemain, dilengkapi 1 *Awakened Stance* awal, 1 *Starting Relic*, dan *Daily Mutator* pengali skor.
  - **Boss Rush / Endless Abyss Mode (`generateBossRushGauntlet`, `advanceBossRushAbyssCycle`)**:
    - Mode khusus 5 ruangan beruntun melawan kombinasi seluruh **Boss (`Archon of the Corona`) & Elite (`Eclipse Inquisitor`, `Solar Zealot`, `Void Singularity`, `Obsidian Juggernaut`, `Necro Weaver`)**.
    - Dimulai pada **Level 3** dengan **180 HP**, **50 Coins**, serta **Solar Greatsword Awakened**, dan dapat dilanjutkan tanpa batas ke siklus **Endless Abyss Cycle berikutnya** setelah menyelesaikan Crucible V.

## 2. Hasil Pengujian & Verifikasi
- **Unit Tests (`npx --yes tsx --test src/game/rules.test.ts`)**: Lulus **14/14 pengujian deterministik**, mencakup `getStageDifficultyProfile`, formasi ruangan 4–10 di Stage 1–10, 12 arketipe monster, `getBestiaryEntry`, **Weapon Evolution**, determinisme **Daily Challenge Seed**, **Boss Rush / Endless Abyss**, serta pengurutan **Top 10 Global Sanctum Leaderboard**.
- **Firestore Security Rules (`firestore.rules` & `DeployRules`)**: Berhasil di-deploy ke Firestore untuk koleksi `/playerProgress/{userId}` dan `/leaderboardEntries/{userId}`.
- **Type Checking (`lint_applet` / `tsc --noEmit`)**: Lulus bersih tanpa error.
- **Production Build (`compile_applet` / `vite build`)**: Berhasil dikompilasi tanpa error.
- **Verifikasi Browser Nyata (`playwright-cli`)**: Diverifikasi untuk interaksi *Global Sanctum Leaderboard*, *Daily Challenge Seed*, dan *Boss Rush / Endless Abyss* tanpa console error maupun page error.

## 3. Masalah yang Tersisa & Langkah Berikutnya
- **Masalah yang Tersisa**: Tidak ada error build, tipe, maupun bug runtime.
- **Langkah Berikutnya**:
  1. Menambahkan *Elemental Hazard & Interactive Sanctum Altars* di dalam ruangan arena.
  2. Menambahkan *Replay Ghost / Build Loadout Inspector* pada baris pemain di *Global Sanctum Leaderboard*.

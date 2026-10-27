# Eclipse Chronicle: Pixel Arena — Implementation Status

## 1. Ringkasan Fitur yang Telah Selesai
- **Inti Pertarungan & Audio Prosedural**:
  - 3 *Weapon Stances* (`Dawnblade`, `Astral Bow`, `Chrono Scythe`), *Dash* (`[Space]`), *Solar Nova* (`[E]`), dan Web Audio API synthesizer prosedural.
- **Sistem Level-Up & Pemilihan Skill (`Choose a Combat Skill`)**:
  - Setiap musuh yang dikalahkan memberikan XP; saat naik level, muncul modal interaktif berisi 3 pilihan *Combat Skill* (`Orbiting Solar Blades`, `Astral Chain Lightning`, `Ignis Dash Trail`, `Phantom Strike Echo`, `Eclipse Supernova`, `Dawn Aegis Ward`) yang dapat ditingkatkan hingga Rank 3.
- **Fitur Login Akun & Cloud Save Progress (Firebase Auth + Firestore)**:
  - **Google Sign-In & Cloud Sync (`src/firebase.ts`)**: Pemain dapat login menggunakan akun Google (`Sign In to Save Progress`) di pojok kanan atas maupun pada *Title Screen*.
  - **Penyimpanan Progres Otomatis**: Data progres pemain (`bestScore`, `highestUnlockedStage`, `totalCoins`, `runsPlayed`, `displayName`) otomatis disinkronkan secara *real-time* ke koleksi Firestore `playerProgress/{userId}` dengan aturan keamanan `firestore.rules`.
  - **Mode Lokal Tetap Aktif (Offline Fallback)**: Tanpa login sekalipun, seluruh progres tetap tersimpan di `localStorage`.
- **Generasi Ruangan Taktis & Scaling Kesulitan Berbasis Stage (`getStageDifficultyProfile`, `selectRoomFormation`, `buildRoomRoster`)**:
  - Setiap stage memiliki **4 hingga 10 ruangan** (`Stage 1: 4 Rooms` s/d `Stage 10: 10 Rooms`) dengan **5 variasi tata letak pilar** (`createRoomPillars(roomIndex, stageLevel)`).
  - **Formasi Skuad Taktis per Ruangan (`RoomFormationType`)**: Setiap ruangan memilih komposisi taktis (`vanguard_patrol`, `crossfire_battery`, `shadow_ambush`, `siege_phalanx`, `arcane_convergence`, `inquisitor_sanctum`, hingga `sovereign_throne`).
  - **Kurva Kesulitan Multi-Dimensi (`getStageDifficultyProfile`)**: Seiring naiknya nomor stage dan kedalaman ruangan, monster memperoleh peningkatan HP (`hpMultiplier`), *damage* (`damageMultiplier`), kecepatan gerak (`speedMultiplier`), percepatan *cooldown* serangan (`cooldownMultiplier`), kecepatan proyektil (`projectileSpeedMultiplier`), serta jumlah penyerang simultan (`maxConcurrentAttackers` hingga 6).
- **12 Arketipe Monster Beragam dengan Pola Gerak & Serangan Unik (`ENEMY_ARCHETYPE_CATALOG`)**:
  1. `Void Stalker` (*Stage 1+* — *Curved flank pursuit* & *short-range crimson lunge*)
  2. `Blink Wraith` (*Stage 1+* — *Diagonal sinusoidal weave* & *high-velocity phantom blink-slash*)
  3. `Rift Arcanist` (*Stage 1+* — *Standoff kiting* & *stage-scaled 1/2/3 rift orb volley*)
  4. `Frost Revenant` (*Stage 2+* — *Figure-eight glacial glide* & *piercing cryo-lance + 3/5 crescent ice shard fan*)
  5. `Cinder Pyromancer` (*Stage 2+* — *Mid-range thermal orbit* & *3/5 spreading magma mortar fan*)
  6. `Solaris Sentinel` (*Stage 3+* — *Relentless armored advance* & *4-way / 8-way cardinal laser pulse*)
  7. `Obsidian Juggernaut` (*Stage 3+* — *Heavy unstoppable march* & *long-distance bull charge*)
  8. `Necro Weaver` (*Stage 4+* — *Wide ritual circle orbit*, *tri-bolt curse fan*, & *shadow minion summon*)
  9. `Void Singularity` (*Stage 4+* — *Harmonic anchor drift*, *gravitational pull windup*, & *6/8 spiral void orb burst*)
  10. `Solar Zealot` (*Stage 5+* — *Frenzied zig-zag rush* yang *enrage* di bawah 60% HP & *cleaving dash + twin lateral solar chakrams*)
  11. `Eclipse Inquisitor` (*Stage 6+* — *Tactical shadow-step teleportation* & *8-way judgment star + aimed triple lance burst*)
  12. `Archon of the Corona` (*Boss* — *Multi-phase radial corona barrage + targeted annihilation blast*)

## 2. Hasil Pengujian & Verifikasi
- **Unit Tests (`npx --yes tsx --test src/game/rules.test.ts`)**: Lulus **11/11 pengujian deterministik**, mencakup `getStageDifficultyProfile`, formasi ruangan 4–10 di Stage 1–10, dan simulasi perilaku AI untuk ke-12 arketipe monster.
- **Type Checking (`lint_applet` / `tsc --noEmit`)**: Lulus bersih tanpa error.
- **Production Build (`compile_applet` / `vite build`)**: Berhasil dikompilasi tanpa error.
- **Verifikasi Browser Nyata (`playwright-cli`)**: Diverifikasi tanpa console error maupun page error.

## 3. Masalah yang Tersisa & Langkah Berikutnya
- **Masalah yang Tersisa**: Tidak ada error build, tipe, maupun bug runtime.
- **Langkah Berikutnya**:
  1. Menambahkan *Bestiary Codex* di layar utama untuk melihat daftar 12 monster yang telah ditemui pemain.
  2. Menambahkan papan peringkat global (*Leaderboard*) berbasis Firestore.

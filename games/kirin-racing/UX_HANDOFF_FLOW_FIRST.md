# Kirin Racing UX Handoff - Flow First Pass

## Current Direction

The garage is being reshaped from a dense configuration screen into a guided game loop:

`押假設 -> 改車 -> 可選支援 -> 出車測試 -> 證據打臉 -> 再戰`

The player should always know exactly one next action. Avoid adding parallel navigation entrances unless they clearly support this loop.

Core rule: modification is never for decoration or arbitrary upgrading. Every modification must answer a problem:

`problem -> cause hypothesis -> chosen modification -> test evidence -> new tradeoff`

If a part does not clearly solve a terrain, stability, power, waterproofing, cargo, or rescue problem, it should not be presented as a meaningful choice.

## What Changed

- Hidden the large garage tabs and preset row in the main garage view.
- Added a stage panel that explains the current step.
- Kept the flow rail as the primary navigation signal.
- Rebuilt the garage into a professional game-workshop layout:
  - left: vehicle preview and performance status
  - right: one focused part category at a time
  - bottom: main action button
- Changed modification categories to a focused rail:
  - tire, wheelbase, drive, power, gear, shell, chassis
- Added progressive garage unlock:
  - K-01 starts as `木板四輪認證`: one board plus four wheels only.
  - K-01 must not surface flooding, waterproofing, motor water damage, floaters, or deep-water rescue yet.
  - The only unlocked decision is vehicle proportion / wheelbase.
  - Square board = turns easily but poor straight-line stability.
  - Rectangular board = straighter and more stable but larger turning radius.
  - K-01 wheelbase swaps are free prototype tests, so players can compare evidence without being blocked by economy.
  - K-02 unlocks tires, chassis, and gear for city flooding.
  - K-03 unlocks drive type and power system for mountain transmission and range.
  - K-04 unlocks shell system and preset builds for full-vehicle strategy.
  - First-time players now stop in the garage instead of auto-launching, so they must choose a baseline before testing.
  - K-01 hypothesis options are mission-scoped: straight-line drift / turning radius only, with vehicle proportion as the only solution family.
  - The old oval flood-scene visuals are disabled for K-01; water hazards belong to K-02+.
- Reworked the supply station into three clear panels:
  - card draw
  - radio hint
  - wallet/material exchange
- Pit stop now opens the same vehicle panel and uses the same stage UI.
- Rematch resets the active part category to the current mission's first unlocked part.
- Results page now emphasizes score, evidence, and next target instead of reading like a plain report.
- Added Mission 02: `嘉義市水淹 Beta-02`.
  - Student can select it from the war-room mission cards.
  - Mission copy, chips, route strip, task checklist, sector banners, HUD progress, and finish messages now switch to city-road rescue language.
  - Mission 02 must include both underpass and overpass:
    - `秀泰地下道深水`: water depth, motor waterproofing, chassis height, tire grip, drive type.
    - `民生南路天橋`: slope, gear ratio, torque, AWD, weight distribution.
  - Do not collapse underpass and overpass into the same challenge. They should feel like different terrain problems requiring different reasoning.
  - Mission 02 route also includes:
    - `北門平交道`: rail bump, chassis clearance, stop-start torque, tire stability.
    - `蘭潭環湖道路`: lakeside curves, wet pavement, steering stability, tire grip, battery drain.
    - `火車站高樓商圈`: high-rise urban density, visibility occlusion, pedestrians, stop-start control.
    - `透天住宅巷弄`: lower townhouse lanes, narrow turns, low-speed steering, vehicle width, cargo height.
    - `水上偏遠聚落`: sparse support, broken roads, battery range, durability, chassis clearance.
    - `農村四合院`: rural courtyard entry, uneven ground, low-speed torque, chassis clearance, water puddles.
    - `高鐵大道荒涼段`: long exposed road, high-speed temptation, range anxiety, stability if stranded.
  - Current Mission 02 route has 13 nodes: high-rise station district, railroad crossing, narrow street, townhouse lanes, fountain roundabout, low-lying road, underpass, overpass, Lantan lakeside road, Shuishang remote settlement, rural courtyard, HSR avenue wasteland, shelter entrance.
- Added Mission 03: `竹崎山區 Gamma-03`.
  - Terrain theme: remote mountain rescue.
  - Problems: hairpin climbs, gravel roads, rockfall, tea-field slopes, foggy narrow bridge, long-distance reliability.
  - Main modification questions: low gear vs speed, AWD vs battery drain, chassis clearance vs center of gravity, tire grip on gravel.
- Added Mission 04: `全域救援 Omega-04`.
  - Terrain theme: final mixed challenge.
  - Combines city, flood, underpass, overpass, Lantan curves, Zhuci mountain road, and exposed long roads.
  - Main rule: no single perfect build. The player must choose a limited-budget compromise.
- Mission routes are now partially abstracted:
  - Mission 02 keeps the Chiayi city single-route path.
  - Mission 03 now has its own one-way Zhuci mountain road nodes, road mesh, finish line, minimap path, route-based checkpoints, and simple mountain landmarks.
  - Mission 04 now has its own one-way mixed final route nodes, road mesh, finish line, minimap path, route-based checkpoints, and mixed city/water/mountain landmarks.
  - Car reset, power-up spawning, oil slicks, sector detection, route progress, and finish checks now read the active mission route instead of assuming the oval track.
  - Bird-view camera now follows the active car position, so far-away route maps stay visible.
- Real-map simplification pass:
  - Route coordinates use Chiayi railway station as the mental origin: east is +X and south is +Z.
  - The map is intentionally compressed for playability, but the landmark directions are now closer to reality.
  - Beimen is northeast of Chiayi station, Lantan is southeast, Shuishang is south/southwest, HSR Chiayi is west-southwest in Taibao, and Zhuqi mountain content sits northeast of Chiayi.
  - Do not chase exact GPS scale inside the 3D course; preserve relative direction, route readability, and gameplay pacing.
- Upgrade economy now exists:
  - Core part changes cost RC.
  - Materials still cost RC.
  - Preset builds cost a discounted bundle price.
  - RC persists across rematches instead of resetting every round.
  - Players can earn RC by mission rewards and one optional work order per round.
  - Work orders are good deeds / construction jobs, not free money. They give RC but may cost honor score or time pressure.
  - Mission 01 is now `木板四輪認證 K-01`: a closed certification course, not a rescue mission.
  - Do not reuse Mission 01 certification modules as Mission 02 story beats. Mission 01 proves the vehicle baseline; Mission 02 applies it in the flooded city.
  - Mission 01 content pillars: straight-line stability, turning radius, S-curve compromise, narrow-lane turnability, and vehicle proportion.
  - Mission 01 should not ask students to solve tires, gears, motor waterproofing, chassis height, or power systems yet.
  - Complexity must arrive as earned garage access, not as a giant initial setup screen.
  - Terrain can repeat, differ, or deliberately mislead.
  - A surface clue should never be a guaranteed answer. Example: a grip corner may look like a tire problem but actually punish weight balance or narrow body ratio.
  - Misleading design is allowed only when the race evidence can reveal the real cause.
  - Every terrain segment should force a modification question with possible hidden variables:
    - grip corner -> tires / camber / width / weight balance
    - gear straight -> gear ratio / motor load / later hill penalty
    - chassis gate -> ground clearance / center of gravity / stability
    - weight S-turn -> load placement / vehicle proportion / turning radius
    - battery corridor -> power system / weight / drive type / tire resistance
    - waterproof tray -> motor mount / tire grip / chassis height / drive type
    - torque slope -> low gear / AWD / weight distribution / total weight
  - The old oval/path physics core still powers Mission 01.
  - Mission 02~04 now use one-way route paths, but the road art is still built from simple Three.js geometry.
  - Next engineering pass should make the mission route system data-driven enough to spawn hazards, rescue targets, water zones, and clue cards per node.

## Keep Student-Facing Copy Cool

Do not expose internal education structure labels in the student-facing UI.
Avoid naming the hidden pedagogy, AI-answer workflows, or teacher-facing framework terms.

Use game language:

- 押判斷
- 選解法
- 解決問題
- 出車測試
- 證據回收
- 再戰
- 破解榮譽

## Next Best Improvements

1. Add real thumbnail art for each modification category.
2. Add animated evidence cards after race failures.
3. Add a mission map thumbnail for Alpha-03.
4. Add part rarity / risk labels, but keep them simple.
5. Verify browser layout at desktop and mobile sizes before deployment.
6. Add route-authored events:
   - per-node water depth, slope, gravel, narrow-road, and long-distance modifiers
   - visible hazard thumbnails before launch
   - evidence cards that quote the exact node where the build failed
   - rescue targets and optional work orders tied to each mission route
7. Improve route visuals:
   - replace temporary primitive landmarks with consistent low-poly assets
   - add route-specific ground materials, rain/fog, and water surface animation
   - add mission map thumbnails for all four mission cards

## Verification Already Run

- JavaScript syntax extraction with `new Function(...)`
- Student-facing banned-term grep

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
- Reworked the supply station into three clear panels:
  - card draw
  - radio hint
  - wallet/material exchange
- Pit stop now opens the same vehicle panel and uses the same stage UI.
- Rematch resets the active part category to tires.
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
  - Mission 01 is now `原型車認證 K-01`: a closed certification course, not a rescue mission.
  - Do not reuse Mission 01 certification modules as Mission 02 story beats. Mission 01 proves the vehicle baseline; Mission 02 applies it in the flooded city.
  - Mission 01 content pillars: grip, gear ratio, chassis clearance, weight balance, battery drain, waterproofing, hill torque.
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
  - The current implementation still reuses the existing oval/path physics core; the visible loop is reframed as six city road nodes.
  - Next engineering pass should replace the hardcoded oval track with a route/path abstraction for real city roads.

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
6. For Beta-02, implement a real road route:
   - introduce per-mission path data
   - make `getTrackPoint`, checkpoints, minimap, AI, water zones, and road mesh read from the active mission
   - use city road intersections instead of a closed oval lap

## Verification Already Run

- JavaScript syntax extraction with `new Function(...)`
- Student-facing banned-term grep

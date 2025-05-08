# Development Plan for "Twisted Realms: A Dystopian Adventure"

This document outlines the development plan for implementing the "Twisted Realms: A Dystopian Adventure" point-and-click adventure game, as specified in the revised Product Requirements Document (PRD, Game PRD 4). The plan is designed to build the game incrementally over a single day (8 hours) using AI tools and Phaser.js, delivering a functional demo with core features first and progressively adding complexity. The development is divided into four phases, each introducing new features, tasks, and demo content (JSON files and placeholder assets) to test the implemented functionalities. The plan incorporates mechanics such as A* pathfinding, grid-based scenes, layered rendering (background, cover, movement matrix), drag-and-drop inventory, and multiple `click` responses per interaction.

## Overview
- **Objective**: Create a 2D point-and-click adventure game with 3 scenes, 10-20 interactions, and 10-15 minutes of gameplay.
- **Constraints**: Built in one day using AI-generated assets and JSON-based content creation.
- **Engine**: HTML5/JavaScript with Phaser.js.
- **Demo Content**: Sample JSON files and minimal assets to test features incrementally.

## Development Phases

### Phase 1: Core Game Setup and Single Scene Rendering
**Objective**: Set up the Phaser.js project and render a single scene with layered rendering, A* pathfinding, player movement, and one interaction with Aseprite spritesheet animations.

**Features**:
- Initialize Phaser.js with a 1280x720 canvas, loading scene dimensions from `config.json` and `scene.json`.
- Render a scene with `background.png`, `cover.png`, and `movementMatrix.png` for walkable areas.
- Implement A* pathfinding for player movement to clicked non-interaction areas or interaction `player_location`, using directional animations (`system_right`, `system_left`, `system_up`, `system_down`).
- Display a player sprite with looping `system_idle` animation when stationary.
- Implement one interaction with looping `hover` animation, non-looping `click` animation, and dialog, triggered by clicking.

**Tasks**:
1. Create an `index.html` file with Phaser.js (via CDN) and a 1280x720 canvas.
2. Set up a Phaser scene to load `/content/config.json` and `/content/scenes/village/scene.json`.
3. Implement JSON parsing to render `background.png`, `cover.png`, and parse `movementMatrix.png` (opacity 0 = walkable, else blocked).
4. Load player animations from `config.json` and render the player at `player_position` with `system_idle`.
5. Implement A* pathfinding for player movement:
   - Click non-interaction area: Move to nearest walkable pixel, playing directional animations.
   - Click interaction: Move to `player_location`, then trigger interaction.
   - Use movement speed from `config.json` (200 pixels/second).
6. Create an interaction system to:
   - Load interaction data (position, sprite, animations) and Aseprite JSON (e.g., `statue.json`).
   - Play looping `hover` animation on hover with `hover_sound`.
   - On click, move player to `player_location`, play non-looping `click` animation with `sound`, then show dialog.
7. Add dialog UI with a semi-transparent overlay and a button, pausing progression until clicked.

**Demo Content**:
- **`/content/config.json`**:
  ```json
  {
    "character_movement_speed": 200,
    "screen_width": 1280,
    "screen_height": 720,
    "player_animations": [
      {
        "spritesheet": "content/assets/player.png",
        "name": "idle",
        "type": "system_idle"
      },
      {
        "spritesheet": "content/assets/player.png",
        "name": "walk_right",
        "type": "system_right"
      },
      {
        "spritesheet": "content/assets/player.png",
        "name": "walk_left",
        "type": "system_left"
      },
      {
        "spritesheet": "content/assets/player.png",
        "name": "walk_up",
        "type": "system_up"
      },
      {
        "spritesheet": "content/assets/player.png",
        "name": "walk_down",
        "type": "system_down"
      }
    ]
  }
  ```
- **`/content/scenes/village/scene.json`**:
  ```json
  {
    "scene_id": "village",
    "width": 1280,
    "height": 720,
    "soundtrack": "scenes/village/assets/village_ambience.mp3",
    "background": "scenes/village/assets/background.png",
    "cover": "scenes/village/assets/cover.png",
    "movement_matrix": "scenes/village/assets/movementMatrix.png",
    "player_position": { "x": 200, "y": 500 },
    "interactions": [
      {
        "id": "statue",
        "position": { "x": 300, "y": 450 },
        "sprite": "scenes/village/assets/statue.png",
        "hover_animation": [
          {
            "spritesheet": "scenes/village/assets/statue.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "scenes/village/assets/statue.png",
                "name": "crumble"
              }
            ],
            "sound": "scenes/village/assets/thud.mp3",
            "condition": {
              "game_state": "village_start"
            },
            "player_location": { "x": 280, "y": 460 },
            "dialog": "A rusty key lies among the rubble.",
            "dialog_button": "Take",
            "update_state": {
              "game_state": "key_found",
              "inventory": { "0": true }
            }
          }
        ]
      }
    ]
  }
  ```
- **`/content/scenes/village/assets/statue.json`**:
  ```json
  {
    "frames": {
      "Statue #glow 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      },
      "Statue #crumble 0.aseprite": {
        "frame": { "x": 100, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 100
      },
      "Statue #crumble 1.aseprite": {
        "frame": { "x": 200, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 100
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "statue.png",
      "format": "RGBA8888",
      "size": { "w": 300, "h": 100 },
      "scale": "1",
      "frameTags": [
        { "name": "glow", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" },
        { "name": "crumble", "from": 1, "to": 2, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/assets/player.json`**:
  ```json
  {
    "frames": {
      "Player #idle 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 100
      },
      "Player #walk_right 0.aseprite": {
        "frame": { "x": 64, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_right 1.aseprite": {
        "frame": { "x": 128, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_left 0.aseprite": {
        "frame": { "x": 192, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_left 1.aseprite": {
        "frame": { "x": 256, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_up 0.aseprite": {
        "frame": { "x": 320, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_up 1.aseprite": {
        "frame": { "x": 384, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_down 0.aseprite": {
        "frame": { "x": 448, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      },
      "Player #walk_down 1.aseprite": {
        "frame": { "x": 512, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "player.png",
      "format": "RGBA8888",
      "size": { "w": 576, "h": 64 },
      "scale": "1",
      "frameTags": [
        { "name": "idle", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" },
        { "name": "walk_right", "from": 1, "to": 2, "direction": "forward", "color": "#000000ff" },
        { "name": "walk_left", "from": 3, "to": 4, "direction": "forward", "color": "#000000ff" },
        { "name": "walk_up", "from": 5, "to": 6, "direction": "forward", "color": "#000000ff" },
        { "name": "walk_down", "from": 7, "to": 8, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **Placeholder Assets** (in `/content/scenes/village/assets` and `/content/assets`):
  - `background.png`: 1280x720 village background (AI-generated).
  - `cover.png`: 1280x720 cover layer (transparent except for walls/objects).
  - `movementMatrix.png`: 1280x720 walkable area map (opacity 0 for walkable).
  - `village_ambience.mp3`: Looping eerie track (royalty-free).
  - `player.png`: 576x64 player spritesheet (idle, walk animations).
  - `statue.png`: 300x100 statue spritesheet (glow, crumble frames).
  - `thud.mp3`: Short sound effect.

**Estimated Time**: 2.5 hours (Morning: 9:00 AM - 11:30 AM)

---

### Phase 2: State Machine and Drag-and-Drop Inventory
**Objective**: Add the dynamic state machine and drag-and-drop inventory system, enabling state changes and item-based interactions with multiple `click` responses.

**Features**:
- Implement a state machine with `game_state` string and inventory flags (boolean array for indices 0-255).
- Create a semi-transparent inventory sidebar, visible when items are present, with drag-and-drop and click-to-select functionality.
- Support multiple `click` responses per interaction, matching `game_state`, `inventory`, and `used_item`.
- Update game state and inventory via interaction clicks, post `click` animation.

**Tasks**:
1. Create a state manager to track `game_state` and inventory flags in-memory.
2. Implement inventory UI:
   - Load `/content/inventory.json` for item data (icons, tooltips).
   - Render a right-aligned, semi-transparent sidebar, visible when inventory has items, with scrollable icons.
   - Enable click-to-select and drag-and-drop to interactions.
3. Extend interaction system to:
   - Check `click` array, selecting the last matching response based on `condition` (`game_state`, `inventory`, `used_item`).
   - Play looping `idle` animation (if specified) with `idle_sound`.
   - On click or drag, move player to `player_location`, play non-looping `animation`, apply `update_state`.
4. Update demo scene to include a state transition (add Key) and an interaction with multiple `click` responses (e.g., gate with/without key).

**Demo Content**:
- **`/content/scenes/village/scene.json`** (updated):
  ```json
  {
    "scene_id": "village",
    "width": 1280,
    "height": 720,
    "soundtrack": "scenes/village/assets/village_ambience.mp3",
    "background": "scenes/village/assets/background.png",
    "cover": "scenes/village/assets/cover.png",
    "movement_matrix": "scenes/village/assets/movementMatrix.png",
    "player_position": { "x": 200, "y": 500 },
    "interactions": [
      {
        "id": "statue",
        "position": { "x": 300, "y": 450 },
        "sprite": "scenes/village/assets/statue.png",
        "idle_animation": [
          {
            "spritesheet": "scenes/village/assets/statue.png",
            "name": "idle"
          }
        ],
        "hover_animation": [
          {
            "spritesheet": "scenes/village/assets/statue.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "scenes/village/assets/statue.png",
                "name": "crumble"
              }
            ],
            "sound": "scenes/village/assets/thud.mp3",
            "condition": {
              "game_state": "village_start"
            },
            "player_location": { "x": 280, "y": 460 },
            "dialog": "A rusty key lies among the rubble.",
            "dialog_button": "Take",
            "update_state": {
              "game_state": "key_found",
              "inventory": { "0": true }
            }
          }
        ]
      },
      {
        "id": "gate",
        "position": { "x": 600, "y": 400 },
        "sprite": "scenes/village/assets/gate.png",
        "idle_animation": [
          {
            "spritesheet": "scenes/village/assets/gate.png",
            "name": "idle"
          }
        ],
        "hover_animation": [
          {
            "spritesheet": "scenes/village/assets/gate.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "scenes/village/assets/gate.png",
                "name": "open"
              }
            ],
            "sound": "scenes/village/assets/creak.mp3",
            "condition": {
              "game_state": "key_found",
              "inventory": { "0": true },
              "used_item": 0
            },
            "player_location": { "x": 550, "y": 420 },
            "dialog": "The gate creaks open with the key.",
            "dialog_button": "Continue",
            "update_state": {
              "game_state": "forest_entered"
            }
          },
          {
            "animation": [
              {
                "spritesheet": "scenes/village/assets/gate.png",
                "name": "locked"
              }
            ],
            "sound": "scenes/village/assets/rattle.mp3",
            "condition": {
              "game_state": "key_found"
            },
            "player_location": { "x": 550, "y": 420 },
            "dialog": "The gate is locked."
          }
        ]
      }
    ]
  }
  ```
- **`/content/scenes/village/assets/statue.json`** (updated):
  ```json
  {
    "frames": {
      "Statue #idle 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 100
      },
      "Statue #glow 0.aseprite": {
        "frame": { "x": 100, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      },
      "Statue #crumble 0.aseprite": {
        "frame": { "x": 200, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 100
      },
      "Statue #crumble 1.aseprite": {
        "frame": { "x": 300, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 100
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "statue.png",
      "format": "RGBA8888",
      "size": { "w": 400, "h": 100 },
      "scale": "1",
      "frameTags": [
        { "name": "idle", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" },
        { "name": "glow", "from": 1, "to": 1, "direction": "forward", "color": "#000000ff" },
        { "name": "crumble", "from": 2, "to": 3, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/scenes/village/assets/gate.json`**:
  ```json
  {
    "frames": {
      "Gate #idle 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 100
      },
      "Gate #glow 0.aseprite": {
        "frame": { "x": 100, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      },
      "Gate #open 0.aseprite": {
        "frame": { "x": 200, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 250
      },
      "Gate #open 1.aseprite": {
        "frame": { "x": 300, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 250
      },
      "Gate #locked 0.aseprite": {
        "frame": { "x": 400, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "gate.png",
      "format": "RGBA8888",
      "size": { "w": 500, "h": 100 },
      "scale": "1",
      "frameTags": [
        { "name": "idle", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" },
        { "name": "glow", "from": 1, "to": 1, "direction": "forward", "color": "#000000ff" },
        { "name": "open", "from": 2, "to": 3, "direction": "forward", "color": "#000000ff" },
        { "name": "locked", "from": 4, "to": 4, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/inventory.json`**:
  ```json
  [
    {
      "item_id": "key",
      "index": 0,
      "name": "Rusty Key",
      "icon": "content/assets/key_icon.png",
      "tooltip": "Opens old locks"
    }
  ]
  ```
- **Placeholder Assets** (add to `/content/scenes/village/assets` and `/content/assets`):
  - `gate.png`: 500x100 gate spritesheet (idle, glow, open, locked frames).
  - `creak.mp3`: Gate open sound.
  - `rattle.mp3`: Gate locked sound.
  - `key_icon.png`: 32x32 key icon.

**Estimated Time**: 2 hours (Morning: 11:30 AM - 1:30 PM)

---

### Phase 3: Map and Scene Navigation
**Objective**: Add the map screen for navigation between scenes, supporting scene transitions with player movement and animations.

**Features**:
- Implement a map screen with a background and interactions linked to scenes, using Aseprite spritesheets.
- Render a player sprite on the map, moving to `player_location` with non-looping `click` animation and directional animations from `config.json`.
- Support scene navigation via map interactions (click to move player, then transition).
- Add a second scene (forest) to test navigation and pathfinding.

**Tasks**:
1. Create a Phaser scene for the map, loading `/content/map.json`.
2. Render the map background and interactions (sprites, looping `hover` animations from Aseprite JSON).
3. Display the player sprite at the interaction corresponding to the current scene, using `system_idle` animation.
4. Implement map interaction clicks:
   - Move player to `player_location` using A* pathfinding (simplified grid for map), playing directional animations and non-looping `click` animation with `sound`.
   - Transition to `target_scene` after animation completes.
5. Update the state manager to track the current scene and check `map_accessible`.
6. Create a forest scene with layered rendering, pathfinding, and one interaction.

**Demo Content**:
- **`/content/map.json`**:
  ```json
  {
    "background": "content/assets/map.png",
    "player_sprite": "content/assets/player_small.png",
    "interactions": [
      {
        "id": "village",
        "position": { "x": 100, "y": 200 },
        "sprite": "content/assets/village_icon.png",
        "hover_animation": [
          {
            "spritesheet": "content/assets/village_icon.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "content/assets/player_small.png",
                "name": "walk"
              }
            ],
            "sound": "content/assets/footsteps.mp3",
            "player_location": { "x": 100, "y": 200 },
            "target_scene": "village"
          }
        ]
      },
      {
        "id": "forest",
        "position": { "x": 300, "y": 250 },
        "sprite": "content/assets/forest_icon.png",
        "hover_animation": [
          {
            "spritesheet": "content/assets/forest_icon.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "content/assets/player_small.png",
                "name": "walk"
              }
            ],
            "sound": "content/assets/footsteps.mp3",
            "player_location": { "x": 300, "y": 250 },
            "target_scene": "forest"
          }
        ]
      }
    ]
  }
  ```
- **`/content/scenes/forest/scene.json`**:
  ```json
  {
    "scene_id": "forest",
    "width": 1280,
    "height": 720,
    "soundtrack": "scenes/forest/assets/forest_ambience.mp3",
    "background": "scenes/forest/assets/background.png",
    "cover": "scenes/forest/assets/cover.png",
    "movement_matrix": "scenes/forest/assets/movementMatrix.png",
    "player_position": { "x": 250, "y": 500 },
    "interactions": [
      {
        "id": "tree",
        "position": { "x": 400, "y": 400 },
        "sprite": "scenes/forest/assets/tree.png",
        "hover_animation": [
          {
            "spritesheet": "scenes/forest/assets/tree.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "scenes/forest/assets/tree.png",
                "name": "shake"
              }
            ],
            "sound": "scenes/forest/assets/rustle.mp3",
            "condition": {
              "game_state": "forest_entered"
            },
            "player_location": { "x": 380, "y": 420 },
            "dialog": "The tree whispers faintly.",
            "dialog_button": "Listen"
          }
        ]
      }
    ]
  }
  ```
- **`/content/scenes/forest/assets/tree.json`**:
  ```json
  {
    "frames": {
      "Tree #glow 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      },
      "Tree #shake 0.aseprite": {
        "frame": { "x": 100, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 250
      },
      "Tree #shake 1.aseprite": {
        "frame": { "x": 200, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 250
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "tree.png",
      "format": "RGBA8888",
      "size": { "w": 300, "h": 100 },
      "scale": "1",
      "frameTags": [
        { "name": "glow", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" },
        { "name": "shake", "from": 1, "to": 2, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/assets/village_icon.json`**:
  ```json
  {
    "frames": {
      "VillageIcon #glow 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "village_icon.png",
      "format": "RGBA8888",
      "size": { "w": 64, "h": 64 },
      "scale": "1",
      "frameTags": [
        { "name": "glow", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/assets/forest_icon.json`**:
  ```json
  {
    "frames": {
      "ForestIcon #glow 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "forest_icon.png",
      "format": "RGBA8888",
      "size": { "w": 64, "h": 64 },
      "scale": "1",
      "frameTags": [
        { "name": "glow", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/assets/player_small.json`**:
  ```json
  {
    "frames": {
      "PlayerSmall #walk 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 32, "h": 32 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
        "sourceSize": { "w": 32, "h": 32 },
        "duration": 200
      },
      "PlayerSmall #walk 1.aseprite": {
        "frame": { "x": 32, "y": 0, "w": 32, "h": 32 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
        "sourceSize": { "w": 32, "h": 32 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "player_small.png",
      "format": "RGBA8888",
      "size": { "w": 64, "h": 32 },
      "scale": "1",
      "frameTags": [
        { "name": "walk", "from": 0, "to": 1, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **Placeholder Assets**:
  - `/content/assets`:
    - `map.png`: 1280x720 distorted map background.
    - `player_small.png`: 64x32 player spritesheet (walk frames).
    - `village_icon.png`: 64x64 village icon spritesheet.
    - `forest_icon.png`: 64x64 forest icon spritesheet.
    - `footsteps.mp3`: Footstep sound effect.
  - `/content/scenes/forest/assets`:
    - `background.png`: 1280x720 forest background.
    - `cover.png`: 1280x720 cover layer.
    - `movementMatrix.png`: 1280x720 walkable area map.
    - `forest_ambience.mp3`: Looping track.
    - `tree.png`: 300x100 tree spritesheet (glow, shake frames).
    - `rustle.mp3`: Rustling sound effect.

**Estimated Time**: 1.5 hours (Afternoon: 2:30 PM - 4:00 PM)

---

### Phase 4: Full Narrative and Final Scene
**Objective**: Complete the game with a third scene, full narrative progression, and a win condition, incorporating layered rendering and drag-and-drop interactions.

**Features**:
- Add a third scene (ruins) with layered rendering, A* pathfinding, and state-dependent interactions requiring drag-and-drop.
- Implement `map_accessible` to disable the map in the final scene.
- Add dialog-driven narrative for 5-10 interactions across all scenes.
- Ensure 10-15 minutes of gameplay with a clear win condition.

**Tasks**:
1. Create `/content/scenes/ruins/scene.json` with layered rendering, pathfinding, and interactions, including a final interaction for the win condition using drag-and-drop.
2. Update the state machine to handle `map_accessible` (disable map in ruins).
3. Add narrative dialog to 5-10 interactions across all scenes, ensuring a cohesive story.
4. Update `map.json` to include the ruins interaction with Aseprite animations.
5. Test the full game flow (village → forest → ruins) for 10-15 minutes of gameplay.
6. Verify all JSON files (including Aseprite JSONs), pathfinding, and layered rendering work correctly.

**Demo Content**:
- **`/content/scenes/ruins/scene.json`**:
  ```json
  {
    "scene_id": "ruins",
    "width": 1280,
    "height": 720,
    "soundtrack": "scenes/ruins/assets/ruins_ambience.mp3",
    "background": "scenes/ruins/assets/background.png",
    "cover": "scenes/ruins/assets/cover.png",
    "movement_matrix": "scenes/ruins/assets/movementMatrix.png",
    "map_accessible": false,
    "player_position": { "x": 300, "y": 500 },
    "interactions": [
      {
        "id": "altar",
        "position": { "x": 500, "y": 400 },
        "sprite": "scenes/ruins/assets/altar.png",
        "hover_animation": [
          {
            "spritesheet": "scenes/ruins/assets/altar.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "scenes/ruins/assets/altar.png",
                "name": "pulse"
              }
            ],
            "sound": "scenes/ruins/assets/hum.mp3",
            "condition": {
              "game_state": "ruins_entered",
              "inventory": { "1": true },
              "used_item": 1
            },
            "player_location": { "x": 480, "y": 420 },
            "dialog": "The altar pulses with dark energy. The horror fades.",
            "dialog_button": "End",
            "update_state": {
              "game_state": "game_complete",
              "inventory": { "1": false }
            }
          },
          {
            "animation": [
              {
                "spritesheet": "scenes/ruins/assets/altar.png",
                "name": "inactive"
              }
            ],
            "sound": "scenes/ruins/assets/fizzle.mp3",
            "condition": {
              "game_state": "ruins_entered"
            },
            "player_location": { "x": 480, "y": 420 },
            "dialog": "The altar remains silent."
          }
        ]
      }
    ]
  }
  ```
- **`/content/scenes/ruins/assets/altar.json`**:
  ```json
  {
    "frames": {
      "Altar #glow 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      },
      "Altar #pulse 0.aseprite": {
        "frame": { "x": 100, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 300
      },
      "Altar #pulse 1.aseprite": {
        "frame": { "x": 200, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 300
      },
      "Altar #inactive 0.aseprite": {
        "frame": { "x": 300, "y": 0, "w": 100, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 100, "h": 100 },
        "sourceSize": { "w": 100, "h": 100 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "altar.png",
      "format": "RGBA8888",
      "size": { "w": 400, "h": 100 },
      "scale": "1",
      "frameTags": [
        { "name": "glow", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" },
        { "name": "pulse", "from": 1, "to": 2, "direction": "forward", "color": "#000000ff" },
        { "name": "inactive", "from": 3, "to": 3, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **`/content/inventory.json`** (updated):
  ```json
  [
    {
      "item_id": "key",
      "index": 0,
      "name": "Rusty Key",
      "icon": "content/assets/key_icon.png",
      "tooltip": "Opens old locks"
    },
    {
      "item_id": "gem",
      "index": 1,
      "name": "Strange Gem",
      "icon": "content/assets/gem_icon.png",
      "tooltip": "Glows faintly"
    }
  ]
  ```
- **`/content/map.json`** (updated):
  ```json
  {
    "background": "content/assets/map.png",
    "player_sprite": "content/assets/player_small.png",
    "interactions": [
      {
        "id": "village",
        "position": { "x": 100, "y": 200 },
        "sprite": "content/assets/village_icon.png",
        "hover_animation": [
          {
            "spritesheet": "content/assets/village_icon.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "content/assets/player_small.png",
                "name": "walk"
              }
            ],
            "sound": "content/assets/footsteps.mp3",
            "player_location": { "x": 100, "y": 200 },
            "target_scene": "village"
          }
        ]
      },
      {
        "id": "forest",
        "position": { "x": 300, "y": 250 },
        "sprite": "content/assets/forest_icon.png",
        "hover_animation": [
          {
            "spritesheet": "content/assets/forest_icon.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "content/assets/player_small.png",
                "name": "walk"
              }
            ],
            "sound": "content/assets/footsteps.mp3",
            "player_location": { "x": 300, "y": 250 },
            "target_scene": "forest"
          }
        ]
      },
      {
        "id": "ruins",
        "position": { "x": 500, "y": 300 },
        "sprite": "content/assets/ruins_icon.png",
        "hover_animation": [
          {
            "spritesheet": "content/assets/ruins_icon.png",
            "name": "glow"
          }
        ],
        "click": [
          {
            "animation": [
              {
                "spritesheet": "content/assets/player_small.png",
                "name": "walk"
              }
            ],
            "sound": "content/assets/footsteps.mp3",
            "player_location": { "x": 500, "y": 300 },
            "target_scene": "ruins"
          }
        ]
      }
    ]
  }
  ```
- **`/content/assets/ruins_icon.json`**:
  ```json
  {
    "frames": {
      "RuinsIcon #glow 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
        "sourceSize": { "w": 64, "h": 64 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "ruins_icon.png",
      "format": "RGBA8888",
      "size": { "w": 64, "h": 64 },
      "scale": "1",
      "frameTags": [
        { "name": "glow", "from": 0, "to": 0, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [
        { "name": "Layer 2", "opacity": 255, "blendMode": "normal" }
      ],
      "slices": []
    }
  }
  ```
- **Placeholder Assets**:
  - `/content/assets`:
    - `ruins_icon.png`: 64x64 ruins icon spritesheet.
    - `gem_icon.png`: 32x32 gem icon.
  - `/content/scenes/ruins/assets`:
    - `background.png`: 1280x720 ruins background.
    - `cover.png`: 1280x720 cover layer.
    - `movementMatrix.png`: 1280x720 walkable area map.
    - `ruins_ambience.mp3`: Looping track.
    - `altar.png`: 400x100 altar spritesheet (glow, pulse, inactive frames).
    - `hum.mp3`: Humming sound effect.
    - `fizzle.mp3`: Inactive altar sound.

**Estimated Time**: 2 hours (Evening: 5:00 PM - 7:00 PM)

---

## Notes
- **Asset Sourcing**: Use AI tools (e.g., Midjourney, DALL-E) for backgrounds, cover layers, movement matrices, and Aseprite spritesheets, and royalty-free libraries (e.g., FreeSound) for audio. Fallback to simple placeholders if AI generation is delayed.
- **Testing**: Test each phase’s demo content immediately to catch JSON parsing (including Aseprite JSONs), pathfinding, or layered rendering issues.
- **Scalability**: The JSON structure supports adding more scenes or interactions by duplicating the folder structure and updating `map.json`.
- **Risk Mitigation**: If time runs short, prioritize Phases 1-3 for a functional two-scene demo, adding ruins later. Simplify A* pathfinding to basic grid movement if performance is an issue.
- **Pathfinding**: Use Phaser’s built-in pathfinding or a lightweight A* library, optimized for pixel-based grids (1280x720). Cache movement matrix data to reduce processing.
- **Layered Rendering**: Ensure `background.png` renders below player, `cover.png` above, with `movementMatrix.png` processed only for pathfinding.

This plan ensures a structured, incremental build of "Twisted Realms," delivering a playable demo within the one-day constraint while adhering to the revised PRD’s requirements for A* pathfinding, layered rendering, and drag-and-drop inventory.
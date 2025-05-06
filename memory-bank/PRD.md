# Product Requirements Document (PRD) for "Twisted Realms: A Dystopian Adventure"

## 1. Overview

### 1.1 Game Concept

"Twisted Realms" is a free, 2D point-and-click adventure game built as a hobby project in a single day using AI tools. Set in a fantasy landscape warped by dystopian horror, players explore eerie scenes, interact with objects, and navigate a map to experience a haunting narrative. The game operates as a state machine, with content defined in JSON files for easy creation without coding. Game states are defined dynamically using boolean flags for inventory items and a `game_state` string, avoiding exponential state growth.

### 1.2 Genre

- 2D Point-and-Click Adventure
- Fantasy with Dystopian Horror Elements

### 1.3 Target Platform

- Web (HTML5, JavaScript)

### 1.4 Target Audience

- Fans of short, atmospheric adventure games
- Creators interested in modding or building content via JSON

## 2. Gameplay Mechanics

### 2.1 Core Loop

- **Explore Scenes**: Interact with objects in single-screen scenes to trigger events, animations, or state changes.
- **Navigate Map**: Access a map screen to travel between scenes, with interactions tied to specific locations.
- **Manage Inventory**: Drag and drop items from a sidebar to interactions or click interactions directly to unlock actions or progress through states.
- **Progress Through States**: Trigger interactions to transition between game states, altering scenes, inventory, and map accessibility.

### 2.2 Scenes

- **Structure**: Each of the 3 scenes is a single screen with defined dimensions (width, height) in `scene.json`, functioning as a grid (e.g., 1280x720 pixels).
- **Player Character**:
  - Appears at an initial `player_position` (x, y) defined in `scene.json`.
  - Moves to clicked locations (non-interaction areas) or interaction-specific `player_location` using A\* pathfinding on the scene’s grid, respecting allowed areas in `movementMatrix.png`.
  - Movement speed defined in `config.json` (tiles per second).
  - Animations defined in `config.json` for specific actions:
    - `system_idle`: Played when the character is not moving or interacting.
    - `system_right`: Played when moving right.
    - `system_left`: Played when moving left.
    - `system_up`: Played when moving up.
    - `system_down`: Played when moving down.
- **Layers** (all same dimensions as scene):
  - `background.png`: Single base layer, below player character, not conditional on game state.
  - `cover.png`: Layer above player character, hiding them when overlapping (e.g., behind walls).
  - `movementMatrix.png`: Defines walkable areas (opacity 0 = allowed, any other value = blocked).
- **Soundtrack**:
  - Each scene defines a looping soundtrack (MP3) in `scene.json`.
- **Interactions (Intractable Objects)**:
  - 10-20 total across all scenes, defined in JSON.
  - Highlight on mouse hover via looping animation sequence.
  - Trigger behaviors via click or item drag-and-drop, including non-looping animation sequences, dialogs, state changes, or scene navigation.
  - Each interaction specifies a `player_location` where the character moves before the interaction triggers.
- **Map Accessibility**:
  - Default: `true` (map accessible).
  - Specify `"map_accessible": false` in JSON to disable.
- **State-Dependent Content**:
  - Interactions may change or disappear based on the current game state, as specified in JSON.

### 2.3 Map

- **Structure**: A single screen with a background image, defined in `map.json`.
- **Player Character**:
  - Appears as a small sprite at the interaction corresponding to the current scene.
  - Moves to the interaction’s `player_location` when triggered, then transitions to that scene, using animations from `config.json` (e.g., `system_right`, `system_left`).
- **Interactions**:
  - Highlight on mouse hover via looping animation sequence.
  - Trigger behaviors on click, including non-looping animation sequences, sounds, or scene navigation.
  - Each interaction is tied to one of the 3 scenes, with locations and behaviors defined in JSON.
- **Accessibility**:
  - Always accessible unless the current scene’s state disables it (via `"map_accessible": false`).
  - No inventory access on the map screen.

### 2.4 Inventory

- **State-Driven**:
  - Contents determined by the current game state, defined by boolean flags (true/false) for each item’s unique index (0-255).
  - Displayed as a semi-transparent sidebar on the right of the screen, visible only when at least one item is present.
  - Supports scrolling if items exceed visible space.
- **Usage**:
  - Items can be clicked to select or dragged and dropped onto interactions to trigger specific responses.
  - Drag-and-drop interactions check the `used_item` condition in the interaction’s `click` array.
- **Visuals**:
  - Items shown as icons with tooltips on hover (e.g., “Rusty Key: Opens old locks”), defined in `inventory.json`.

### 2.5 State Machine

- **Definition**: Game states are dynamically defined by:
  - A string identifier (`game_state`) to distinguish states with identical inventory configurations.
  - Boolean flags for inventory items, each with a unique index (0-255).
  - Example: `{ "game_state": "village_cleared", "inventory": { "0": true, "1": false } }`, indicating Item 0 (Key) is present, Item 1 (Gem) is not.
- **Matching**:
  - Interactions specify required inventory flags, an optional `game_state`, and an optional `used_item` (item index) in the `click` array. If an item’s flag is not specified, the interaction is valid for both true and false states of that item.
  - The last `click` definition in the array that matches the current state and used item (if any) is chosen.
- **Transitions**:
  - Triggered by interactions, updating `game_state` and inventory flags (e.g., adding/removing items).
  - Example: Clicking a statue adds a Key (`inventory[0] = true`) and sets `game_state: "key_found"`.
- **Persistence**:
  - State changes are tracked in-memory (no save system due to single-day scope).

## 3. Content Creation Model

### 3.1 JSON-Based Content System

- All game content is defined in JSON files in a `/content` folder, enabling creators to build the game by editing JSON and adding assets (images, audio) without coding.
- **Project Structure**:
  - `/content`
    - `config.json`: Defines constants (character movement speed, screen width/height, player animations).
    - `inventory.json`: Defines all inventory items in an array, indexed 0-255.
    - `map.json`: Defines map background, interaction locations, and linked scenes.
    - `/scenes`
      - `/village`
        - `scene.json`: Defines scene dimensions, background, cover, movement matrix, soundtrack, player position, and interactions.
        - `/assets`: Contains scene-specific assets (PNG for spritesheets/images, JSON for animation data, MP3 for audio).
      - `/forest`
        - `scene.json`
        - `/assets`
      - `/ruins`
        - `scene.json`
        - `/assets`
- **Asset Integration**:
  - Assets are placed in each scene’s `/assets` folder or shared in `/content/assets` for common assets (e.g., player sprite).
  - JSON files reference asset file paths relative to the project root (e.g., `"spritesheet": "scenes/village/assets/statue.png"`).
- **Modularity**:
  - Adding a new scene requires creating a new folder under `/scenes` with a `scene.json` and `/assets`, updating `map.json`, and adding assets.
  - Interactions are defined with screen coordinates (x, y) and multiple `click` responses for different conditions or used items.

### 3.2 Animation Sequences

- **Definition**: Interactions may have animation sequences for `idle`, `hover`, and `click` states, all using spritesheet animations from Aseprite. Player character animations are defined in `config.json`.
- **Structure**: An array of animation descriptors, played sequentially.
  - `idle` and `hover` animations loop continuously.
  - `click` animations (within a `click` object) play once, pausing game progression (dialog, state changes, scene navigation) until complete.
  - Player animations:
    - `system_idle`: Loops when idle.
    - `system_right`, `system_left`, `system_up`, `system_down`: Played during movement in respective directions.
- **Descriptor Fields**:
  - `spritesheet`: Path to the PNG spritesheet file (e.g., `scenes/village/assets/statue.png`).
  - `name`: Name of the specific animation in the spritesheet (e.g., `crumble`).
  - `type` (optional, in `config.json`): Specifies `system_idle`, `system_right`, `system_left`, `system_up`, or `system_down` for player animations.
- **Spritesheet JSON**:
  - For each spritesheet (e.g., `statue.png`), a corresponding `statue.json` file in the same folder defines frame data and durations.
  - Example:
    ```json
    {
      "frames": {
        "Statue #crumble 0.aseprite": {
          "frame": { "x": 0, "y": 0, "w": 50, "h": 100 },
          "rotated": false,
          "trimmed": false,
          "spriteSourceSize": { "x": 0, "y": 0, "w": 50, "h": 100 },
          "sourceSize": { "w": 50, "h": 100 },
          "duration": 100
        },
        "Statue #crumble 1.aseprite": {
          "frame": { "x": 50, "y": 0, "w": 50, "h": 100 },
          "rotated": false,
          "trimmed": false,
          "spriteSourceSize": { "x": 0, "y": 0, "w": 50, "h": 100 },
          "sourceSize": { "w": 50, "h": 100 },
          "duration": 100
        },
        "Statue #glow 0.aseprite": {
          "frame": { "x": 100, "y": 0, "w": 50, "h": 100 },
          "rotated": false,
          "trimmed": false,
          "spriteSourceSize": { "x": 0, "y": 0, "w": 50, "h": 100 },
          "sourceSize": { "w": 50, "h": 100 },
          "duration": 200
        }
      },
      "meta": {
        "app": "https://www.aseprite.org/",
        "version": "1.3.13-arm64",
        "image": "statue.png",
        "format": "RGBA8888",
        "size": { "w": 150, "h": 100 },
        "scale": "1",
        "frameTags": [
          { "name": "crumble", "from": 0, "to": 1, "direction": "forward", "color": "#000000ff" },
          { "name": "glow", "from": 2, "to": 2, "direction": "forward", "color": "#000000ff" }
        ],
        "layers": [{ "name": "Layer 2", "opacity": 255, "blendMode": "normal" }],
        "slices": []
      }
    }
    ```
  - The engine uses this JSON to extract frame coordinates and durations for the named animation.
- **Audio**:
  - Defined outside animation sequences as `idle_sound`, `hover_sound`, or `sound` (in `click` object) with MP3 paths.
  - Played concurrently with the corresponding animation sequence.

### 3.3 Movement

- **Scene Grid**: Each scene defines a grid matching its dimensions (e.g., 1280x720 pixels), where each pixel is a potential character position.
- **Pathfinding**:
  - Clicking a non-interaction area moves the character to the nearest walkable position (opacity 0 in `movementMatrix.png`) using A\* pathfinding.
  - Clicking an interaction moves the character to the interaction’s `player_location` using A\* pathfinding.
  - Movement occurs at a constant speed (tiles per second) defined in `config.json`.
  - During movement, the appropriate animation (`system_right`, `system_left`, `system_up`, or `system_down`) is played based on the direction of travel.
- **Walkable Areas**:
  - Defined by `movementMatrix.png`, where opacity 0 indicates walkable areas and any other value indicates blocked areas.
- **Rendering**:
  - The player character is rendered between `background.png` and `cover.png`, appearing behind cover elements (e.g., walls) when overlapping.

### 3.4 JSON Structure Examples

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
              "game_state": "village_cleared",
              "inventory": { "0": true },
              "used_item": 0
            },
            "player_location": { "x": 550, "y": 420 },
            "dialog": "The gate creaks open with the key, revealing a twisted forest.",
            "dialog_button": "Continue",
            "update_state": {
              "game_state": "forest_entered",
              "inventory": { "0": true, "1": true }
            },
            "target_scene": "forest"
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
              "game_state": "village_cleared"
            },
            "player_location": { "x": 550, "y": 420 },
            "dialog": "The gate is locked."
          }
        ]
      },
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
      "Statue #crumble 0.aseprite": {
        "frame": { "x": 0, "y": 0, "w": 50, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 50, "h": 100 },
        "sourceSize": { "w": 50, "h": 100 },
        "duration": 100
      },
      "Statue #crumble 1.aseprite": {
        "frame": { "x": 50, "y": 0, "w": 50, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 50, "h": 100 },
        "sourceSize": { "w": 50, "h": 100 },
        "duration": 100
      },
      "Statue #glow 0.aseprite": {
        "frame": { "x": 100, "y": 0, "w": 50, "h": 100 },
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": { "x": 0, "y": 0, "w": 50, "h": 100 },
        "sourceSize": { "w": 50, "h": 100 },
        "duration": 200
      }
    },
    "meta": {
      "app": "https://www.aseprite.org/",
      "version": "1.3.13-arm64",
      "image": "statue.png",
      "format": "RGBA8888",
      "size": { "w": 150, "h": 100 },
      "scale": "1",
      "frameTags": [
        { "name": "crumble", "from": 0, "to": 1, "direction": "forward", "color": "#000000ff" },
        { "name": "glow", "from": 2, "to": 2, "direction": "forward", "color": "#000000ff" }
      ],
      "layers": [{ "name": "Layer 2", "opacity": 255, "blendMode": "normal" }],
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

### 3.5 Interaction Click Behavior

- **Sequence**:
  1. Move player to `player_location` using A\* pathfinding and the appropriate directional animation (`system_right`, `system_left`, `system_up`, or `system_down`).
  2. Play the `animation` sequence (non-looping, from the selected `click` object) and `sound` (if specified).
  3. Display `dialog` (if specified) with optional `dialog_button` text; pause game progression until user clicks.
  4. Apply `update_state` (if specified) to change `game_state` and inventory flags.
  5. Navigate to `target_scene` (if specified).
- **Click Selection**:
  - When clicking or dragging an item onto an interaction, evaluate the `click` array in order.
  - Select the last `click` object where the `condition` matches the current `game_state`, `inventory`, and `used_item` (item index, or omitted for no item).
- **Constraints**:
  - Game progression (dialog, state changes, scene navigation) is paused during `animation`.
  - Dialog requires user click to proceed, appearing after the animation completes.
  - `idle` and `hover` animations loop continuously, with optional `idle_sound` or `hover_sound` looping concurrently.
  - Player `system_idle` animation loops when not moving or interacting.

### 3.6 Screen and Scene Dimensions

- **Screen**:
  - Defined in `config.json` as `screen_width` and `screen_height` (e.g., 1280x720).
- **Scene**:
  - Defined in `scene.json` as `width` and `height`.
  - If scene dimensions match screen, the scene fits perfectly.
  - If scene is smaller, it extends beyond the screen (scrolling not implemented due to scope).
  - If scene is larger, unused screen areas remain black.
- **Rendering**:
  - Scene layers (`background.png`, `cover.png`, `movementMatrix.png`) must match scene dimensions.
  - Player character and interactions are positioned relative to the scene grid.

## 4. Art and Audio

### 4.1 Art Style

- **Visuals**: AI-generated 2D art with a dark, surreal aesthetic (e.g., warped landscapes, grotesque creatures).
- **Scenes**: Single background (`background.png`), cover layer (`cover.png`), and movement matrix (`movementMatrix.png`).
- **Characters**: Animated player sprite with animations defined in `config.json` (e.g., idle, directional movement via Aseprite spritesheets).
- **Interactions**: Animation sequences for idle, hover, and click states, using Aseprite spritesheets.
- **Map**: A simplified, top-down view with distorted features (e.g., jagged mountains).

### 4.2 Audio

- **Soundtrack**: Each scene has a looping, eerie track (MP3) defined in `scene.json`, from royalty-free or AI-generated sources.
- **Sound Effects**:
  - Interaction-specific (e.g., creak, thud) from free libraries, defined as `idle_sound`, `hover_sound`, or `sound` (in `click`).
  - Map navigation (e.g., footsteps).
- **Voice**: None, to keep scope minimal.

## 5. Technical Requirements

### 5.1 Engine

- HTML5/JavaScript using Phaser.js, with a custom JSON parser to load game content and Aseprite spritesheet data dynamically.

### 5.2 State Management

- **Implementation**: Dynamic state machine driven by `game_state` and inventory flags (boolean array for indices 0-255).
- **Storage**:
  - JSON files in `/content` folder, loaded at runtime.
  - In-memory state tracking (no persistent storage).

### 5.3 Input

- **Mouse**:
  - Hover: Trigger looping `hover_animation` and `hover_sound` (if specified).
  - Click (non-interaction): Move player to nearest walkable position using A\* pathfinding with directional animations.
  - Click (interaction): Trigger interaction’s `player_location` movement with directional animations, then selected `click` response.
  - Drag-and-Drop: Drag inventory item onto interaction to trigger `click` response with matching `used_item`.

### 5.4 Performance

- **Resolution**: Defined in `config.json` (e.g., 1280x720).
- **Frame Rate**: Target 30 FPS for animations and movement.
- **Asset Optimization**:
  - Use AI-generated or free assets (PNG for spritesheets/images, JSON for animation data, MP3 for audio).
  - Limit to 10-15 spritesheets and 5-10 sounds per scene.

## 6. Narrative and Progression

### 6.1 Story Overview

- **Setting**: A fractured fantasy world corrupted by an unseen horror, with twisted landscapes and cryptic remnants.
- **Player Role**: A lone wanderer exploring the decay.
- **Tone**: Dark, mysterious, and unsettling.

### 6.2 Progression

- **Linear**:
  - Progress through 3 scenes via state changes, driven by interactions in JSON.
  - Interactions drive the narrative (e.g., unlocking a gate, activating a ritual).
- **Puzzles**:
  - Interaction-based (e.g., use Item A on Object B or click directly), configured in JSON.
  - Example: Find a Key in Scene 1 to unlock a Gate with drag-and-drop, leading to Scene 2.
- **Gameplay Duration**: 10-15 minutes.

### 6.3 Win Condition

- Reach the final state in Scene 3, revealing a narrative conclusion (e.g., confronting a shadowy entity), defined in JSON.
- No loss state; players can retry interactions.

## 7. User Interface

### 7.1 Scene UI

- **Main View**: Full-screen scene with background, player character, interactions, and cover layer (loaded from JSON).
- **Inventory Sidebar**:
  - Semi-transparent, right-aligned, visible only when inventory has at least one item.
  - Displays item icons with tooltips; supports scrolling for overflow.
  - Items can be clicked to select or dragged onto interactions.
- **Dialog**:
  - Semi-transparent overlay with text and optional button (e.g., “Continue”) after `click` animation completes.
  - Requires user click to dismiss, pausing game progression.
- **Animations**:
  - `idle` and `hover` animations loop continuously; `click` animations play once, pausing progression until complete.
  - Player animations (`system_idle`, directional) play based on state and movement.

### 7.2 Map UI

- **Main View**: Full-screen map with 3 interaction hotspots (from `map.json`).
- **Player Marker**: Small sprite indicating current scene, using animations from `config.json`.
- **Navigation**: Click interactions to move player (with non-looping animation) and transition scenes.

### 7.3 Accessibility

- Minimal due to scope; ensure clear visual contrast for interactions, dialogs, and inventory (configurable in JSON).

## 8. Scope

- **Core Game**:
  - 3 scenes.
  - 10-20 interactions total.
  - 10-15 minutes of gameplay.
- **Constraints**:
  - Built in one day using AI tools (e.g., AI art generation, code assistance).
  - No testing or polishing phase.
  - Content creation via JSON files and assets only.

## 9. Development Milestones (Single Day)

### 9.1 Morning (3 Hours)

- **Setup**: Initialize Phaser.js project, create HTML5 canvas, and implement JSON parser for content and Aseprite spritesheet data.
- **Core Mechanics**: Build dynamic state machine (`game_state` and inventory flags), scene rendering, A\* pathfinding, interaction system with looping/non-looping animations, drag-and-drop inventory, player animation system, and dialog support.
- **Bootstrap Content**: Create `/content/config.json` with player animations, `/content/scenes/village/scene.json`, `/content/scenes/village/assets/statue.json`, `inventory.json`, and `map.json` for 1 scene with 2 interactions, including animations and dialogs.

### 9.2 Afternoon (3 Hours)

- **Content System**: Finalize JSON-based rendering for scenes, map, inventory, interactions, single background, cover, movement matrix, scene soundtracks, Aseprite animation handling, and player animations.
- **Scenes**: Add `/content/scenes/[scene]/scene.json` and spritesheet JSONs for 3 scenes with 10-20 interactions total, including coordinates, animation sequences, dialogs, and multiple `click` responses.
- **Assets**: Source or generate 3 scene sets (background, cover, movement matrix), 3 soundtracks, 1 map background, 10-15 spritesheets with JSONs (including player spritesheet), and 5-10 audio files per scene using AI tools or free libraries.

### 9.3 Evening (2 Hours)

- **Narrative**: Add dialog text in `scene.json` files for 5-10 interactions to convey story.
- **Finalize**: Complete JSON files for 3 scenes and 10-15 minutes of gameplay, ensuring animations, soundtracks, movement, and dialogs work.
- **Polish**: Add sound effects, verify JSON and spritesheet files load correctly, ensure player animations function.

## 10. Risks and Mitigations

### 10.1 Risks

- **JSON Complexity**: Dynamic state matching, Aseprite spritesheet parsing, multiple `click` responses, A\* pathfinding, and player animation system may be error-prone.
- **Asset Issues**: AI-generated art/audio, movement matrices, or player spritesheets may not align with vision.
- **Time Overrun**: JSON parsing, animation handling, pathfinding, or content creation takes too long.

### 10.2 Mitigations

- Simplify state conditions, click responses, player animations, and animation descriptors with clear JSON examples.
- Use fallback free assets and simple movement matrices if AI generation fails.
- Prioritize core JSON loading, pathfinding, player animations, and 1 scene, scale to 3 if time allows.

## 11. Appendix

### 11.1 Example State Flow

- **State: village_start, Inventory: {}**:
  - Scene: Decayed Village.
  - Map: Accessible.
  - Interactions: Locked Gate (no key), Broken Statue (adds Key, sets game_state: key_found).
- **State: key_found, Inventory: {0: true}**:
  - Scene: Decayed Village.
  - Map: Accessible.
  - Interactions: Locked Gate (drag Key to unlock, changes to forest, sets game_state: forest_entered, adds Gem).
- **State: forest_entered, Inventory: {0: true, 1: true}**:
  - Scene: Twisted Forest.
  - Map: Accessible.
  - Interactions: Cursed Tree, Hidden Path (drag Gem to change to ruins, sets game_state: ruins_entered).
- **State: ruins_entered, Inventory: {1: true}**:
  - Scene: Haunted Ruins.
  - Map: Disabled.
  - Interactions: Shadowy Altar, Final Glyph (drag Gem to show ending dialog).

### 11.2 Inspirations

- **Games**: "Samorost," "Machinarium."
- **Media**: "Dark Souls" (tone), "Pan’s Labyrinth" (visuals).

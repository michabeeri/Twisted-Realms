import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useInventoryStore } from '../stores/inventoryStore';
import { useGameStateStore } from '../stores/gameStateStore';

const SCENE_JSON_PATH = '/content/scenes/village/scene.json';
const CONFIG_JSON_PATH = '/content/config.json';

interface AnimationDescriptor {
  spritesheet: string; // path to PNG
  name: string; // animation name in aseprite JSON
  sound?: string;
}

interface VillageInteraction {
  id: string;
  position: { x: number; y: number };
  sprite: string;
  hover_animation: AnimationDescriptor[];
  click_animation: AnimationDescriptor[];
  condition: { game_state?: string; inventory?: Record<string, boolean> };
  dialog: string;
  dialog_button: string;
  idle_animation?: AnimationDescriptor[];
  idle_sound?: string;
  hover_sound?: string;
  click_sound?: string;
  update_state?: { inventory: Record<string, boolean>; game_state?: string };
  player_location?: { x: number; y: number };
  click?: Array<{
    animation?: AnimationDescriptor[];
    sound?: string;
    dialog?: string;
    dialog_button?: string;
    update_state?: { inventory?: Record<string, boolean>; game_state?: string };
  }>;
}

interface VillageSceneData {
  scene_id: string;
  soundtrack: string;
  backgrounds: { image: string; condition?: { game_state: string } }[];
  player_position: { x: number; y: number };
  movement_matrix?: string;
  cover?: string;
  interactions: VillageInteraction[];
  width?: number;
  height?: number;
}

interface AsepriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  duration: number;
}
interface AsepriteFrameTag {
  name: string;
  from: number;
  to: number;
  direction: string;
}
interface AsepriteMeta {
  frameTags: AsepriteFrameTag[];
}
interface AsepriteJSON {
  frames: Record<string, AsepriteFrame>;
  meta: AsepriteMeta;
}

class VillageScene extends Phaser.Scene {
  private sceneData: VillageSceneData | undefined;
  private background?: Phaser.GameObjects.Image;
  private player?: Phaser.GameObjects.Sprite;
  private soundtrack?: Phaser.Sound.BaseSound;
  private interactionSprites: Record<string, Phaser.GameObjects.Sprite> = {};
  private dialogContainer?: Phaser.GameObjects.Container;
  private soundtrackStarted = false;
  private asepriteData: Record<string, AsepriteJSON> = {};
  private idleSound?: Phaser.Sound.BaseSound;
  private hoverSound?: Phaser.Sound.BaseSound;
  private currentInteractionSound?: Phaser.Sound.BaseSound;
  private currentState: { game_state: string; inventory: boolean[] } = {
    game_state: 'village_start',
    inventory: Array(256).fill(false),
  };
  private initialState?: { game_state: string; inventory: boolean[] };
  public onInventoryUpdate?: (updates: Record<string, boolean>) => void;
  public onGameStateUpdate?: (gameState: string) => void;
  private movementMatrixData?: ImageData;
  private playerTarget?: { x: number; y: number; onArrive?: () => void };
  private playerSpeed: number = 200; // pixels per second, can be loaded from config
  private playerMoving: boolean = false;
  // TODO: Strongly type configData
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configData: any;
  private playerAnimations: Record<string, AnimationDescriptor> = {};
  private currentPlayerAnimType: string = 'system_idle';
  private cover?: Phaser.GameObjects.Image;
  private walkabilityGrid: boolean[][] | undefined;
  private path: { x: number; y: number }[] = [];
  private static readonly GRID_RES = 20;
  private coarseWalkabilityGrid: boolean[][] | undefined;
  private gridWidth = 0;
  private gridHeight = 0;
  private pendingInteraction: {
    sprite: Phaser.GameObjects.Sprite;
    interaction: VillageInteraction;
  } | null = null;

  constructor() {
    super('VillageScene');
  }

  preload() {
    console.log('Phaser preload() called');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.load.on('loaderror', (file: any) => {
      console.error('Asset load error:', file.key, file.src);
    });
    this.load.json('scene', SCENE_JSON_PATH);
    this.load.json('config', CONFIG_JSON_PATH);
    this.load.audio('soundtrack', '/content/scenes/village/assets/village_ambience.mp3');
    this.load.image('background', '/content/scenes/village/assets/village.png');
    this.load.image('cover', '/content/scenes/village/assets/village-cover.png');
    this.load.audio('thud', '/content/scenes/village/assets/thud.mp3');
    this.load.image(
      'movement_matrix',
      '/content/scenes/village/assets/village-movement-matrix.png'
    );
    // Do NOT load player spritesheets or JSONs here
  }

  public setInitialState(state: { game_state: string; inventory: boolean[] }) {
    this.initialState = state;
  }

  public updateSceneState(newState: { game_state: string; inventory: boolean[] }) {
    this.currentState = newState;
    this.renderInteractions();
  }

  private matchesCondition(
    condition: { game_state?: string; inventory?: Record<string, boolean> } | undefined,
    currentState: { game_state: string; inventory: boolean[] }
  ): boolean {
    if (!condition) return true;
    if (condition.game_state && condition.game_state !== currentState.game_state) {
      return false;
    }
    if (condition.inventory) {
      for (const [index, value] of Object.entries(condition.inventory)) {
        const idx = Number(index);
        if (currentState.inventory[idx] !== value) {
          return false;
        }
      }
    }
    return true;
  }

  private renderInteractions() {
    if (!this.sceneData) return;
    const interactions = this.sceneData.interactions || [];
    // Remove old interaction sprites
    Object.values(this.interactionSprites).forEach((sprite) => sprite.destroy());
    this.interactionSprites = {};
    interactions.forEach((interaction) => {
      if (!this.matchesCondition(interaction.condition, this.currentState)) return;
      const x = interaction.position?.x ?? 0;
      const y = interaction.position?.y ?? 0;
      let spriteKey: string;
      if (interaction.sprite && interaction.sprite.endsWith('.png')) {
        // Use static image
        spriteKey = (interaction.sprite.split('/').pop() || '').replace('.png', '');
        if (!this.textures.exists(spriteKey)) {
          this.load.image(spriteKey, interaction.sprite);
          this.load.once('complete', () => {
            const sprite = this.add
              .sprite(x, y, spriteKey, 0)
              .setOrigin(0.5, 1)
              .setInteractive({ useHandCursor: true })
              .setDepth(1);
            this.setupInteractionSprite(sprite, interaction);
            this.interactionSprites[interaction.id] = sprite;
          });
          this.load.start();
          return;
        }
      } else {
        // Use spritesheet (default to player spritesheet if needed)
        spriteKey = '';
      }
      if (!spriteKey) return; // Do not create sprite if no valid key
      const sprite = this.add
        .sprite(x, y, spriteKey, 0)
        .setOrigin(0.5, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);
      this.setupInteractionSprite(sprite, interaction);
      this.interactionSprites[interaction.id] = sprite;
    });
  }

  private setupInteractionSprite(
    sprite: Phaser.GameObjects.Sprite,
    interaction: VillageInteraction
  ) {
    // Idle animation and sound
    if (interaction.idle_animation && interaction.idle_animation.length > 0) {
      this.playAsepriteAnimation(sprite, interaction.idle_animation[0]);
      this.playInteractionSound('idle');
    }
    // Hover animation
    sprite.on('pointerover', () => {
      if (interaction.hover_animation && interaction.hover_animation.length > 0) {
        this.playAsepriteAnimation(sprite, interaction.hover_animation[0]);
        this.playInteractionSound('hover');
      }
    });
    sprite.on('pointerout', () => {
      if (interaction.idle_animation && interaction.idle_animation.length > 0) {
        this.playAsepriteAnimation(sprite, interaction.idle_animation[0]);
        this.playInteractionSound('idle');
      } else {
        sprite.anims.stop();
        sprite.setFrame(0);
        this.stopInteractionSound();
      }
    });
    // Click: use new click array format
    sprite.on('pointerdown', () => {
      console.log('Interaction clicked:', interaction.id);
      // If player_location is defined, move player there first
      if (interaction.player_location) {
        const start = this.worldToGrid({
          x: Math.round(this.player!.x),
          y: Math.round(this.player!.y),
        });
        const end = this.worldToGrid({
          x: Math.round(interaction.player_location.x),
          y: Math.round(interaction.player_location.y),
        });
        this.path = this.findPathCoarse(start, end).map((pt) => this.gridToWorld(pt));
        if (this.path.length > 0) {
          this.playerTarget = this.path.shift();
          this.playerMoving = true;
          this.pendingInteraction = { sprite, interaction };
        } else {
          // If no path, do not trigger interaction
          console.log('No path to player_location for interaction:', interaction.id);
        }
        return;
      }
      // Otherwise, trigger interaction immediately
      this.triggerInteraction(sprite, interaction);
    });
  }

  private triggerInteraction(sprite: Phaser.GameObjects.Sprite, interaction: VillageInteraction) {
    sprite.disableInteractive();
    sprite.anims.stop();
    this.stopInteractionSound();
    const clickDef = interaction.click && interaction.click[0];
    if (clickDef) {
      if (clickDef.sound) {
        this.sound.play('thud');
      }
      if (clickDef.animation && clickDef.animation.length > 0) {
        this.playAsepriteAnimation(sprite, clickDef.animation[0]);
      }
      this.showDialog(clickDef.dialog || '', clickDef.dialog_button || '', () => {
        if (clickDef.update_state) {
          if (clickDef.update_state.inventory && this.onInventoryUpdate) {
            this.onInventoryUpdate(clickDef.update_state.inventory);
          }
          if (clickDef.update_state.game_state && this.onGameStateUpdate) {
            this.onGameStateUpdate(clickDef.update_state.game_state);
          }
        }
        if (interaction.idle_animation && interaction.idle_animation.length > 0) {
          this.playAsepriteAnimation(sprite, interaction.idle_animation[0]);
          this.playInteractionSound('idle');
        } else {
          sprite.setFrame(0);
          this.stopInteractionSound();
        }
        sprite.setInteractive({ useHandCursor: true });
      });
    }
  }

  private playPlayerAnimation(type: string) {
    if (!this.player || !this.player.anims) return;
    const animDesc = this.playerAnimations[type];
    if (!animDesc) {
      console.warn('No animDesc for type', type);
      return;
    }
    const sheetPath = animDesc.spritesheet.startsWith('/')
      ? animDesc.spritesheet
      : '/content/' + animDesc.spritesheet;
    const sheetKey = (sheetPath.split('/').pop() || '').replace('.png', '');
    const animKey = `${sheetKey}_${animDesc.name}`;
    console.log('Attempting to play animation:', animKey, 'exists:', this.anims.exists(animKey));
    if (this.anims.exists(animKey)) {
      this.player.anims.play(animKey, true);
    } else {
      console.warn('Animation key does not exist:', animKey);
    }
  }

  private playAsepriteAnimation(
    _sprite: Phaser.GameObjects.Sprite, // eslint-disable-line @typescript-eslint/no-unused-vars
    _anim: AnimationDescriptor, // eslint-disable-line @typescript-eslint/no-unused-vars
    _onComplete?: () => void // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    // TODO: Implement actual animation logic
  }

  private playInteractionSound(
    _type: 'idle' | 'hover' // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    // TODO: Implement actual sound logic
  }

  private stopInteractionSound() {
    // TODO: Implement actual sound stop logic
  }

  private showDialog(text: string, buttonText: string, onClose: () => void) {
    // Remove any existing dialog
    if (this.dialogContainer) {
      this.dialogContainer.destroy();
      this.dialogContainer = undefined;
    }
    const width = this.sys.game.config.width as number;
    const height = this.sys.game.config.height as number;
    const dialogWidth = 400;
    const dialogHeight = 180;
    const container = this.add.container(0, 0);
    // Background
    const bg = this.add.rectangle(width / 2, height / 2, dialogWidth, dialogHeight, 0x222222, 0.9);
    bg.setStrokeStyle(2, 0xffffff, 1);
    bg.setDepth(1000);
    // Text
    const dialogText = this.add
      .text(width / 2, height / 2 - 30, text, {
        color: '#fff',
        fontSize: '20px',
        wordWrap: { width: dialogWidth - 40 },
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    dialogText.setDepth(1000);
    // Button
    const button = this.add
      .rectangle(width / 2, height / 2 + 40, 120, 40, 0x4444aa, 1)
      .setInteractive({ useHandCursor: true });
    button.setDepth(1000);
    const buttonTextObj = this.add
      .text(width / 2, height / 2 + 40, buttonText || 'OK', { color: '#fff', fontSize: '18px' })
      .setOrigin(0.5, 0.5);
    buttonTextObj.setDepth(1000);
    button.on('pointerdown', () => {
      container.destroy();
      this.dialogContainer = undefined;
      onClose();
    });
    container.add([bg, dialogText, button, buttonTextObj]);
    container.setDepth(1000);
    this.dialogContainer = container;
  }

  async create() {
    console.log('Phaser create() called');
    // Log all JSON cache keys
    console.log('Cache keys:', this.cache.json.getKeys());
    let sceneData;
    try {
      sceneData = this.cache.json.get('scene');
      console.log('sceneData from cache:', sceneData);
    } catch (err) {
      console.error('Error accessing sceneData from cache:', err);
    }
    this.sceneData = sceneData;
    console.log('sceneData (assigned):', this.sceneData);
    if (!this.sceneData) return;
    this.add.text(10, 10, 'Scene loaded', { color: '#fff', fontSize: '24px' });
    console.log('Adding background and player');
    // Use scene dimensions for positioning
    const width = this.sceneData.width || 1280;
    const height = this.sceneData.height || 720;
    // Select background: first that matches or has no condition
    const backgrounds = this.sceneData.backgrounds || [];
    const bg = backgrounds.find((bg) => this.matchesCondition(bg.condition, this.currentState));
    if (bg) {
      this.background = this.add
        .image(width / 2, height / 2, 'background')
        .setOrigin(0.5, 0.5)
        .setDepth(0);
    }
    // Dynamically load player spritesheets and JSONs
    const config = this.cache.json.get('config');
    if (config && config.player_animations) {
      for (const anim of config.player_animations) {
        const sheetPath = anim.spritesheet.startsWith('/')
          ? anim.spritesheet
          : '/content/' + anim.spritesheet;
        const sheetKey = (sheetPath.split('/').pop() || '').replace('.png', '');
        this.load.spritesheet(sheetKey, sheetPath, { frameWidth: 50, frameHeight: 100 });
        const jsonPath = sheetPath.replace('.png', '.json');
        this.load.json(sheetKey + '_json', jsonPath);
      }
      // Await loading
      await new Promise<void>((resolve) => {
        this.load.once('complete', () => resolve());
        this.load.start();
      });
      // Now create animations
      for (const anim of config.player_animations) {
        const sheetPath = anim.spritesheet.startsWith('/')
          ? anim.spritesheet
          : '/content/' + anim.spritesheet;
        const sheetKey = (sheetPath.split('/').pop() || '').replace('.png', '');
        const asepriteJson = this.cache.json.get(sheetKey + '_json');
        if (asepriteJson) {
          this.createAsepriteAnimations(sheetKey, asepriteJson);
        }
        this.playerAnimations[anim.type] = anim;
      }
    }
    // Player
    const { x: px, y: py } = this.sceneData.player_position;
    let playerSheetKey = 'statue_spritesheet';
    if (config && config.player_animations && config.player_animations.length > 0) {
      const firstAnim = config.player_animations[0];
      const firstSheetPath = firstAnim.spritesheet.startsWith('/')
        ? firstAnim.spritesheet
        : '/content/' + firstAnim.spritesheet;
      playerSheetKey = (firstSheetPath.split('/').pop() || '').replace('.png', '');
    }
    this.player = this.add.sprite(px, py, playerSheetKey, 0).setOrigin(0.5, 1).setDepth(1);
    console.log('Player created:', { x: px, y: py, key: playerSheetKey });
    if (this.player) {
      this.playPlayerAnimation('system_idle');
    }
    // Cover layer
    if (this.sceneData.cover) {
      this.cover = this.add
        .image(width / 2, height / 2, 'cover')
        .setOrigin(0.5, 0.5)
        .setDepth(2);
    }
    if (bg && this.background) {
      this.background.setInteractive();
      this.background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const start = this.worldToGrid({
          x: Math.round(this.player!.x),
          y: Math.round(this.player!.y),
        });
        const end = this.worldToGrid({
          x: Math.round(pointer.worldX),
          y: Math.round(pointer.worldY),
        });
        this.path = this.findPathCoarse(start, end).map((pt) => this.gridToWorld(pt));
        if (this.path.length > 0) {
          this.playerTarget = this.path.shift();
          this.playerMoving = true;
        } else {
          this.playerTarget = undefined;
          this.playerMoving = false;
        }
      });
    }
    // Load movement matrix into ImageData
    if (this.sceneData.movement_matrix) {
      const img = new window.Image();
      img.src = this.sceneData.movement_matrix.startsWith('/')
        ? this.sceneData.movement_matrix
        : '/content/' + this.sceneData.movement_matrix;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        this.movementMatrixData = ctx.getImageData(0, 0, img.width, img.height);
        // Build coarse walkability grid
        this.gridWidth = Math.ceil(img.width / VillageScene.GRID_RES);
        this.gridHeight = Math.ceil(img.height / VillageScene.GRID_RES);
        this.coarseWalkabilityGrid = [];
        for (let gy = 0; gy < this.gridHeight; gy++) {
          this.coarseWalkabilityGrid[gy] = [];
          for (let gx = 0; gx < this.gridWidth; gx++) {
            let transparent = 0;
            let total = 0;
            for (
              let y = gy * VillageScene.GRID_RES;
              y < Math.min((gy + 1) * VillageScene.GRID_RES, img.height);
              y++
            ) {
              for (
                let x = gx * VillageScene.GRID_RES;
                x < Math.min((gx + 1) * VillageScene.GRID_RES, img.width);
                x++
              ) {
                const idx = (y * img.width + x) * 4;
                const alpha = this.movementMatrixData.data[idx + 3];
                if (alpha === 0) transparent++;
                total++;
              }
            }
            this.coarseWalkabilityGrid[gy][gx] = transparent > total / 2;
          }
        }
      }
    }
    // Render interactions after everything is loaded
    this.renderInteractions();
  }

  private createAsepriteAnimations(sheetKey: string, asepriteJson: AsepriteJSON) {
    if (!asepriteJson) return;
    const frameTags = asepriteJson.meta.frameTags;
    const frameNames = Object.keys(asepriteJson.frames);
    for (const tag of frameTags) {
      const animKey = `${sheetKey}_${tag.name}`;
      const frames = [];
      const durations: number[] = [];
      const tagFrameNames = frameNames.slice(tag.from, tag.to + 1);
      for (let i = 0; i < tagFrameNames.length; i++) {
        frames.push({ key: sheetKey, frame: tag.from + i });
        durations.push(asepriteJson.frames[tagFrameNames[i]].duration);
      }
      this.anims.create({
        key: animKey,
        frames: frames.map((f, idx) => ({ key: f.key, frame: f.frame, duration: durations[idx] })),
        frameRate: 1000 / (durations.reduce((a, b) => a + b, 0) / durations.length),
        repeat: -1,
      });
      console.log('Created animation:', animKey, 'frames:', frames.length);
    }
  }

  private isWalkable(x: number, y: number): boolean {
    if (!this.movementMatrixData) return true;
    const px = Math.round(x);
    const py = Math.round(y);
    if (
      px < 0 ||
      py < 0 ||
      px >= this.movementMatrixData.width ||
      py >= this.movementMatrixData.height
    ) {
      return false;
    }
    const idx = (py * this.movementMatrixData.width + px) * 4;
    const alpha = this.movementMatrixData.data[idx + 3];
    return alpha === 0;
  }

  private worldToGrid(pos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: Math.floor(pos.x / VillageScene.GRID_RES),
      y: Math.floor(pos.y / VillageScene.GRID_RES),
    };
  }
  private gridToWorld(pos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: pos.x * VillageScene.GRID_RES + VillageScene.GRID_RES / 2,
      y: pos.y * VillageScene.GRID_RES + VillageScene.GRID_RES / 2,
    };
  }

  private findPathCoarse(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): { x: number; y: number }[] {
    if (!this.coarseWalkabilityGrid) return [];
    const width = this.gridWidth;
    const height = this.gridHeight;
    const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;
    const isWalkable = (x: number, y: number) =>
      inBounds(x, y) && this.coarseWalkabilityGrid![y][x];
    const nodeKey = (x: number, y: number) => `${x},${y}`;
    const startKey = nodeKey(start.x, start.y);
    const endKey = nodeKey(end.x, end.y);
    const openSet = new Set([startKey]);
    const cameFrom: Record<string, string | undefined> = {};
    const gScore: Record<string, number> = { [startKey]: 0 };
    const fScore: Record<string, number> = { [startKey]: this.heuristic(start, end) };
    let explored = 0;
    const SEARCH_LIMIT = 2000;
    while (openSet.size > 0) {
      if (++explored > SEARCH_LIMIT) {
        break;
      }
      let currentKey = '';
      let lowestF = Infinity;
      for (const key of openSet) {
        if (fScore[key] < lowestF) {
          lowestF = fScore[key];
          currentKey = key;
        }
      }
      const [cx, cy] = currentKey.split(',').map(Number);
      if (currentKey === endKey) {
        // Reconstruct path
        const path: { x: number; y: number }[] = [];
        let k: string | undefined = currentKey;
        while (k && k !== startKey) {
          const [px, py] = k.split(',').map(Number);
          path.push({ x: px, y: py });
          k = cameFrom[k];
        }
        path.reverse();
        return path;
      }
      openSet.delete(currentKey);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!isWalkable(nx, ny)) continue;
        const neighborKey = nodeKey(nx, ny);
        const tentativeG = gScore[currentKey] + (dx === 0 || dy === 0 ? 1 : Math.SQRT2);
        if (tentativeG < (gScore[neighborKey] ?? Infinity)) {
          cameFrom[neighborKey] = currentKey;
          gScore[neighborKey] = tentativeG;
          fScore[neighborKey] = tentativeG + this.heuristic({ x: nx, y: ny }, end);
          openSet.add(neighborKey);
        }
      }
    }
    // If no path, find closest reachable point
    let minDist = Infinity;
    let closest: string | undefined;
    for (const key in gScore) {
      const [x, y] = key.split(',').map(Number);
      const dist = this.heuristic({ x, y }, end);
      if (dist < minDist) {
        minDist = dist;
        closest = key;
      }
    }
    if (closest && closest !== startKey) {
      // Reconstruct path to closest
      const path: { x: number; y: number }[] = [];
      let k: string | undefined = closest;
      while (k && k !== startKey) {
        const [px, py] = k.split(',').map(Number);
        path.push({ x: px, y: py });
        k = cameFrom[k];
      }
      path.reverse();
      return path;
    }
    return [];
  }

  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }) {
    // Euclidean distance
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  update(time: number, delta: number) {
    if (!this.player || !this.playerTarget) return;
    const dx = this.playerTarget.x - this.player.x;
    const dy = this.playerTarget.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 2) {
      this.player.x = this.playerTarget.x;
      this.player.y = this.playerTarget.y;
      if (this.path.length > 0) {
        this.playerTarget = this.path.shift();
        this.playerMoving = true;
        return;
      } else {
        this.playerMoving = false;
        // Play idle animation for last direction
        this.playPlayerAnimation(
          this.currentPlayerAnimType.startsWith('system_walk_')
            ? this.currentPlayerAnimType.replace('system_walk_', 'system_')
            : this.currentPlayerAnimType
        );
        this.playerTarget = undefined;
        // If there is a pending interaction, trigger it now
        if (this.pendingInteraction) {
          this.triggerInteraction(
            this.pendingInteraction.sprite,
            this.pendingInteraction.interaction
          );
          this.pendingInteraction = null;
        }
        return;
      }
    }
    // Move player
    const speed = this.playerSpeed * (delta / 1000);
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;
    const nextX = this.player.x + moveX;
    const nextY = this.player.y + moveY;
    if (!this.isWalkable(nextX, nextY)) {
      this.playerMoving = false;
      this.playPlayerAnimation(
        this.currentPlayerAnimType.startsWith('system_walk_')
          ? this.currentPlayerAnimType.replace('system_walk_', 'system_')
          : this.currentPlayerAnimType
      );
      this.playerTarget = undefined;
      this.path = [];
      return;
    }
    this.player.x = nextX;
    this.player.y = nextY;
    // Determine direction
    let direction = '';
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle >= -22.5 && angle < 22.5) direction = 'system_right';
    else if (angle >= 22.5 && angle < 67.5) direction = 'system_down_right';
    else if (angle >= 67.5 && angle < 112.5) direction = 'system_down';
    else if (angle >= 112.5 && angle < 157.5) direction = 'system_down_left';
    else if (angle >= 157.5 || angle < -157.5) direction = 'system_left';
    else if (angle >= -157.5 && angle < -112.5) direction = 'system_up_left';
    else if (angle >= -112.5 && angle < -67.5) direction = 'system_up';
    else if (angle >= -67.5 && angle < -22.5) direction = 'system_up_right';
    // Play walk animation if available, else fallback to idle
    if (this.currentPlayerAnimType !== direction) {
      this.currentPlayerAnimType = direction;
      this.playPlayerAnimation(direction);
    }
  }
}

export function Scene() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserSceneRef = useRef<VillageScene | null>(null);
  const inventory = useInventoryStore((s) => s.inventory);
  const addItem = useInventoryStore((s) => s.addItem);
  const removeItem = useInventoryStore((s) => s.removeItem);
  const game_state = useGameStateStore((s) => s.game_state);
  const setGameState = useGameStateStore((s) => s.setGameState);

  // Store the initial state in a ref to pass to Phaser
  const initialStateRef = useRef({
    game_state,
    inventory,
  });
  initialStateRef.current = { game_state, inventory };

  // Inventory update handler
  const handleInventoryUpdate = (updates: Record<string, boolean>) => {
    Object.entries(updates).forEach(([index, value]) => {
      if (value) {
        addItem(Number(index));
      } else {
        removeItem(Number(index));
      }
    });
  };

  // Game state update handler
  const handleGameStateUpdate = (newState: string) => {
    setGameState(newState);
  };

  useEffect(() => {
    let game: Phaser.Game | null = null;
    if (gameRef.current) {
      // Custom scene class instance
      const villageScene = new VillageScene();
      // Set initial state before Phaser calls create()
      villageScene.setInitialState(initialStateRef.current);
      // Pass inventory and game state update callbacks
      villageScene.onInventoryUpdate = handleInventoryUpdate;
      villageScene.onGameStateUpdate = handleGameStateUpdate;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: gameRef.current,
        backgroundColor: '#222',
        scene: villageScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
      phaserSceneRef.current = villageScene;
    }
    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  // Update interactions when inventory or game state changes
  useEffect(() => {
    if (phaserSceneRef.current) {
      phaserSceneRef.current.updateSceneState({
        game_state,
        inventory,
      });
    }
  }, [inventory, game_state]);

  return (
    <div
      ref={gameRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
}

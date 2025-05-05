import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useInventoryStore } from '../stores/inventoryStore';
import { useGameStateStore } from '../stores/gameStateStore';

const SCENE_JSON_PATH = '/content/scenes/village/scene.json';

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
}

interface VillageSceneData {
  scene_id: string;
  soundtrack: string;
  backgrounds: { image: string; condition?: { game_state: string } }[];
  player_position: { x: number; y: number };
  interactions: VillageInteraction[];
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
  private player?: Phaser.GameObjects.Image;
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

  constructor() {
    super('VillageScene');
  }

  preload() {
    this.load.json('scene', SCENE_JSON_PATH);
    this.load.audio('soundtrack', '/content/scenes/village/assets/village_ambience.mp3');
    // Preload all interaction assets (spritesheet and aseprite JSON)
    this.load.image('player', '/content/scenes/village/assets/player.png');
    this.load.image('background', '/content/scenes/village/assets/village.png');
    // For demo, hardcode statue_spritesheet
    this.load.spritesheet(
      'statue_spritesheet',
      '/content/scenes/village/assets/statue_spritesheet.png',
      { frameWidth: 50, frameHeight: 100 }
    );
    this.load.json(
      'statue_spritesheet_json',
      '/content/scenes/village/assets/statue_spritesheet.json'
    );
    this.load.audio('thud', '/content/scenes/village/assets/thud.mp3');
  }

  private matchesCondition(
    condition: Record<string, unknown> | undefined,
    currentState: { game_state: string; inventory: boolean[] }
  ) {
    if (!condition) return true;
    if (condition.game_state && condition.game_state !== currentState.game_state) return false;
    if (condition.inventory && typeof condition.inventory === 'object') {
      const invCond = condition.inventory as Record<string, boolean>;
      for (const [index, value] of Object.entries(invCond)) {
        if (currentState.inventory[Number(index)] !== value) return false;
      }
    }
    return true;
  }

  public setInitialState(state: { game_state: string; inventory: boolean[] }) {
    this.initialState = state;
  }

  create() {
    this.sceneData = this.cache.json.get('scene');
    if (!this.sceneData) {
      this.add.text(10, 10, 'Failed to load scene.json', { color: '#fff' });
      return;
    }
    // Use initial state if provided, otherwise fallback
    this.currentState = this.initialState || {
      game_state: 'village_start',
      inventory: Array(256).fill(false),
    };
    // Select background: first that matches or has no condition
    const backgrounds = this.sceneData.backgrounds || [];
    const bg = backgrounds.find((bg) => this.matchesCondition(bg.condition, this.currentState));
    if (bg) {
      this.background = this.add.image(640, 360, 'background').setOrigin(0.5, 0.5);
    }
    // Player
    const { x: px, y: py } = this.sceneData.player_position;
    this.player = this.add.image(px, py, 'player').setOrigin(0.5, 1);
    // Load aseprite data
    this.asepriteData['statue_spritesheet'] = this.cache.json.get('statue_spritesheet_json');
    // Create animations from aseprite JSON
    this.createAsepriteAnimations('statue_spritesheet', this.asepriteData['statue_spritesheet']);
    // Preload and assign sounds if present
    if (this.sceneData.interactions && this.sceneData.interactions.length > 0) {
      const interaction = this.sceneData.interactions[0];
      if (interaction.idle_sound) {
        this.idleSound = this.sound.add('idle_sound', { loop: true, volume: 1 });
      }
      if (interaction.hover_sound) {
        this.hoverSound = this.sound.add('hover_sound', { loop: true, volume: 1 });
      }
    }
    // Render interactions
    this.renderInteractions();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  public updateSceneState(newState: { game_state: string; inventory: boolean[] }) {
    this.currentState = newState;
    this.renderInteractions();
  }

  private renderInteractions() {
    // Remove old sprites
    Object.values(this.interactionSprites).forEach((sprite) => sprite.destroy());
    this.interactionSprites = {};
    if (!this.sceneData) return;
    const interactions = (this.sceneData.interactions || []).filter((interaction) =>
      this.matchesCondition(interaction.condition, this.currentState)
    );
    interactions.forEach((interaction) => {
      const x = interaction.position?.x ?? 0;
      const y = interaction.position?.y ?? 0;
      const sprite = this.add
        .sprite(x, y, 'statue_spritesheet', 0)
        .setOrigin(0.5, 1)
        .setInteractive({ useHandCursor: true });
      this.interactionSprites[interaction.id] = sprite;
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
      // Click: show dialog immediately, then return to idle
      sprite.on('pointerdown', () => {
        sprite.disableInteractive();
        sprite.anims.stop();
        this.stopInteractionSound();
        if (interaction.click_sound) {
          this.sound.play('thud');
        }
        this.showDialog(interaction.dialog, interaction.dialog_button, () => {
          // Apply update_state if present
          if (interaction.update_state) {
            if (interaction.update_state.inventory && this.onInventoryUpdate) {
              this.onInventoryUpdate(interaction.update_state.inventory);
            }
            if (interaction.update_state.game_state && this.onGameStateUpdate) {
              this.onGameStateUpdate(interaction.update_state.game_state);
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
      });
    });
  }

  private createAsepriteAnimations(key: string, asepriteJson: AsepriteJSON) {
    if (!asepriteJson) return;
    const frameTags = asepriteJson.meta.frameTags;
    const frameNames = Object.keys(asepriteJson.frames);

    const createdKeys: string[] = [];
    for (const tag of frameTags) {
      const animKey = `${key}_${tag.name}`;
      const frames = [];
      const durations: number[] = [];
      // Get the frame names for this tag's range
      const tagFrameNames = frameNames.slice(tag.from, tag.to + 1);
      for (let i = 0; i < tagFrameNames.length; i++) {
        frames.push({ key, frame: tag.from + i });
        durations.push(asepriteJson.frames[tagFrameNames[i]].duration);
      }
      // Always loop idle/hover
      const repeat = -1;
      this.anims.create({
        key: animKey,
        frames: frames.map((f, idx) => ({ key: f.key, frame: f.frame, duration: durations[idx] })),
        frameRate: 1000 / (durations.reduce((a, b) => a + b, 0) / durations.length),
        repeat,
      });
      createdKeys.push(animKey);
      console.log('[Phaser] Animation created:', animKey);
    }
    console.log('[Phaser] All animation keys:', createdKeys);
  }

  private playAsepriteAnimation(
    sprite: Phaser.GameObjects.Sprite,
    anim: AnimationDescriptor,
    onComplete?: () => void
  ) {
    const animKey = `statue_spritesheet_${anim.name}`;
    const exists = this.anims.exists(animKey);
    console.log('[Phaser] playAsepriteAnimation:', animKey, 'exists:', exists);
    if (!exists) return;
    sprite.anims.play(animKey);
    if (onComplete) {
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
    }
  }

  private showDialog(text: string, buttonText: string, onClose: () => void) {
    if (this.dialogContainer) {
      this.dialogContainer.destroy();
    }
    const width = 500;
    const height = 180;
    const x = 640;
    const y = 360;
    const bg = this.add.rectangle(x, y, width, height, 0x111111, 0.85).setOrigin(0.5);
    const dialogText = this.add
      .text(x, y - 30, text, {
        color: '#fff',
        fontSize: '22px',
        wordWrap: { width: width - 40 },
        align: 'center',
      })
      .setOrigin(0.5);
    const button = this.add
      .rectangle(x, y + 40, 120, 40, 0x333333, 1)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const buttonLabel = this.add
      .text(x, y + 40, buttonText, {
        color: '#fff',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    button.on('pointerdown', () => {
      this.dialogContainer?.destroy();
      onClose();
    });
    this.dialogContainer = this.add.container(0, 0, [bg, dialogText, button, buttonLabel]);
    this.dialogContainer.setDepth(1000);
  }

  private tryPlaySoundtrack() {
    if (this.soundtrack && !this.soundtrack.isPlaying && !this.soundtrackStarted) {
      this.soundtrack.play();
      this.soundtrackStarted = true;
    }
  }

  private playInteractionSound(type: 'idle' | 'hover') {
    this.stopInteractionSound();
    if (type === 'idle' && this.idleSound) {
      this.idleSound.play();
      this.currentInteractionSound = this.idleSound;
    } else if (type === 'hover' && this.hoverSound) {
      this.hoverSound.play();
      this.currentInteractionSound = this.hoverSound;
    }
  }

  private stopInteractionSound() {
    if (this.currentInteractionSound && this.currentInteractionSound.isPlaying) {
      this.currentInteractionSound.stop();
    }
    this.currentInteractionSound = undefined;
  }

  shutdown() {
    if (this.soundtrack) {
      this.soundtrack.stop();
      this.soundtrack.destroy();
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

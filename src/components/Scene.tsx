import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const SCENE_JSON_PATH = '/content/scenes/village/scene.json';

interface VillageSceneData {
  scene_id: string;
  soundtrack: string;
  backgrounds: { image: string; condition: { game_state: string } }[];
  player_position: { x: number; y: number };
  interactions: unknown[];
}

class VillageScene extends Phaser.Scene {
  private sceneData: VillageSceneData | undefined;
  private background?: Phaser.GameObjects.Image;
  private player?: Phaser.GameObjects.Image;
  private soundtrack?: Phaser.Sound.BaseSound;

  constructor() {
    super('VillageScene');
  }

  preload() {
    this.load.json('scene', SCENE_JSON_PATH);
    this.load.audio('soundtrack', '/content/scenes/village/assets/village_ambience.mp3');
  }

  create() {
    this.sceneData = this.cache.json.get('scene');
    if (!this.sceneData) {
      this.add.text(10, 10, 'Failed to load scene.json', { color: '#fff' });
      return;
    }
    // Play soundtrack
    this.soundtrack = this.sound.add('soundtrack', { loop: true, volume: 1 });
    this.soundtrack.play();
    // Load background
    const bg = this.sceneData.backgrounds[0]?.image;
    if (bg) {
      this.load.image('background', `/content/scenes/village/assets/village.png`);
      this.load.once('complete', () => {
        this.background = this.add.image(640, 360, 'background');
        this.background.setOrigin(0.5, 0.5);
      });
      this.load.start();
    }
    // Load player
    this.load.image('player', `/content/scenes/village/assets/player.png`);
    this.load.once('complete', () => {
      if (this.sceneData) {
        const { x, y } = this.sceneData.player_position;
        this.player = this.add.image(x, y, 'player');
        this.player.setOrigin(0.5, 1);
      }
    });
    this.load.start();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
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
  useEffect(() => {
    let game: Phaser.Game | null = null;
    if (gameRef.current) {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: gameRef.current,
        backgroundColor: '#222',
        scene: VillageScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });
    }
    return () => {
      if (game) {
        game.destroy(true);
      }
    };
  }, []);
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

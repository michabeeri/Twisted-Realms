import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useGameStateStore } from '../stores/gameStateStore';

interface MapInteraction {
  id: string;
  position: { x: number; y: number };
  sprite: string;
  hover_animation?: Array<{ spritesheet: string; name: string }>;
  click?: Array<unknown>; // To be refined
}

interface MapData {
  background: string;
  width: number;
  height: number;
  interactions: MapInteraction[];
}

interface MapScreenProps {
  currentSceneId: string;
  onTravel: (sceneId: string) => void;
}

const PLAYER_SPRITE_PATH = 'assets/pig_spritesheet.png';
const PLAYER_SPRITE_JSON = 'assets/pig_spritesheet.json';
const PLAYER_MARKER_WIDTH = 50 / 3; // original frame width divided by 3
const PLAYER_MARKER_HEIGHT = 100 / 3; // original frame height divided by 3
const MARKER_SPEED = (400 + 200 / 3) / 2; // middle between previous (400) and 3x slower (67)
const FADE_DURATION = 500; // ms

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function PlayerMarkerPhaser({ x, y, direction }: { x: number; y: number; direction: string }) {
  const phaserRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!phaserRef.current) return;
    let markerSprite: Phaser.GameObjects.Sprite | null = null;
    let animKey = '';
    class MarkerScene extends Phaser.Scene {
      preload() {
        this.load.spritesheet('player', `/content/${PLAYER_SPRITE_PATH}`, {
          frameWidth: 50,
          frameHeight: 100,
        });
        this.load.json('player_json', `/content/${PLAYER_SPRITE_JSON}`);
      }
      create() {
        const asepriteJson = this.cache.json.get('player_json');
        if (asepriteJson) {
          const frameTags = asepriteJson.meta.frameTags;
          for (const tag of frameTags) {
            const key = `player_${tag.name}`;
            const frames = [];
            const durations: number[] = [];
            const frameNames = Object.keys(asepriteJson.frames).slice(tag.from, tag.to + 1);
            for (let i = 0; i < frameNames.length; i++) {
              frames.push({ key: 'player', frame: tag.from + i });
              durations.push(asepriteJson.frames[frameNames[i]].duration);
            }
            this.anims.create({
              key,
              frames: frames.map((f, idx) => ({
                key: f.key,
                frame: f.frame,
                duration: durations[idx],
              })),
              frameRate: 1000 / (durations.reduce((a, b) => a + b, 0) / durations.length),
              repeat: -1,
            });
          }
        }
        markerSprite = this.add
          .sprite(PLAYER_MARKER_WIDTH / 2, PLAYER_MARKER_HEIGHT, 'player', 0)
          .setOrigin(0.5, 1)
          .setScale(1 / 3)
          .setDepth(1);
        animKey = `player_${direction}`;
        if (this.anims.exists(animKey)) {
          markerSprite.anims.play(animKey, true);
        }
      }
      update() {
        if (
          markerSprite &&
          markerSprite.anims.currentAnim &&
          markerSprite.anims.currentAnim.key !== animKey
        ) {
          if (this.anims.exists(animKey)) {
            markerSprite.anims.play(animKey, true);
          }
        }
      }
    }
    gameRef.current = new Phaser.Game({
      type: Phaser.CANVAS,
      width: PLAYER_MARKER_WIDTH,
      height: PLAYER_MARKER_HEIGHT,
      parent: phaserRef.current,
      transparent: true,
      scene: MarkerScene,
      scale: {
        mode: Phaser.Scale.NONE,
      },
    });
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [direction]);

  return (
    <div
      ref={phaserRef}
      style={{
        position: 'absolute',
        left: x + 8,
        top: y - PLAYER_MARKER_HEIGHT * 0.8,
        width: PLAYER_MARKER_WIDTH,
        height: PLAYER_MARKER_HEIGHT,
        zIndex: 2010,
        pointerEvents: 'none',
      }}
    />
  );
}

export function MapScreen({ currentSceneId, onTravel }: MapScreenProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [fade, setFade] = useState(0); // 0 = no fade, 1 = fully faded
  const [pendingScene, setPendingScene] = useState<string | null>(null);
  const markerMoveRef = useRef<number | null>(null);

  const direction = useGameStateStore((s) => s.playerDirection);
  const markerAnim = isMoving ? direction : 'system_idle';

  useEffect(() => {
    fetch('/content/map/map.json')
      .then((res) => res.json())
      .then((data) => setMapData(data));
  }, []);

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set initial marker position to current scene
  useEffect(() => {
    if (!mapData) return;
    const current = mapData.interactions.find((i) => i.id === currentSceneId);
    if (current) setMarkerPos({ x: current.position.x, y: current.position.y });
  }, [mapData, currentSceneId]);

  const scale = mapData
    ? Math.min(windowSize.width / mapData.width, windowSize.height / mapData.height, 1)
    : 1;

  // Disable interaction while moving or fading
  const interactionDisabled = isMoving || fade > 0;

  // Animate marker movement (with null checks)
  useEffect(() => {
    if (!targetPos || !markerPos) {
      setIsMoving(false);
      return;
    }
    if (markerPos.x === targetPos.x && markerPos.y === targetPos.y) {
      setIsMoving(false);
      if (pendingScene) {
        setFade(1);
        setTimeout(() => {
          setFade(0);
          setPendingScene(null);
          onTravel(pendingScene);
        }, FADE_DURATION);
      }
      return;
    }
    setIsMoving(true);
    let lastTime = performance.now();
    function step(now: number) {
      if (!markerPos || !targetPos) return;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const dx = targetPos.x - markerPos.x;
      const dy = targetPos.y - markerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MARKER_SPEED * dt) {
        setMarkerPos(targetPos);
      } else {
        const t = (MARKER_SPEED * dt) / dist;
        setMarkerPos({
          x: lerp(markerPos.x, targetPos.x, t),
          y: lerp(markerPos.y, targetPos.y, t),
        });
        markerMoveRef.current = requestAnimationFrame(step);
      }
    }
    markerMoveRef.current = requestAnimationFrame(step);
    return () => {
      if (markerMoveRef.current) cancelAnimationFrame(markerMoveRef.current);
    };
  }, [targetPos, markerPos, pendingScene, onTravel]);

  if (!mapData || !markerPos) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/90"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: mapData.width,
          height: mapData.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {/* Map background */}
        <img
          src={`/content/${mapData.background}`}
          alt="Map background"
          className="absolute top-0 left-0 h-full w-full object-cover"
          draggable={false}
          style={{ width: mapData.width, height: mapData.height }}
        />
        {/* Map interactions */}
        {mapData.interactions.map((interaction) => (
          <div
            key={interaction.id}
            className={`group absolute cursor-pointer${interactionDisabled ? 'pointer-events-none opacity-60' : ''}`}
            style={{ left: interaction.position.x, top: interaction.position.y }}
            onClick={() => {
              if (interactionDisabled) return;
              setTargetPos(interaction.position);
              setPendingScene(interaction.id);
            }}
          >
            <img
              src={`/content/${interaction.sprite}`}
              alt={interaction.id}
              className="h-12 w-12 object-contain drop-shadow-lg transition-transform group-hover:scale-110"
              draggable={false}
            />
          </div>
        ))}
        {/* Player marker (animated, 8-directional idle/walk) */}
        <PlayerMarkerPhaser x={markerPos.x} y={markerPos.y} direction={markerAnim} />
        {/* Fade overlay */}
        {fade > 0 && (
          <div
            className="absolute top-0 left-0 h-full w-full bg-black"
            style={{
              opacity: fade,
              transition: `opacity ${FADE_DURATION}ms linear`,
              pointerEvents: 'none',
              zIndex: 3000,
            }}
          />
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { InventoryBar } from './ui/InventoryBar';
import { MapScreen } from './ui/MapScreen';
import { useGameStateStore } from './stores/gameStateStore';
import { useInventoryStore } from './stores/inventoryStore';

function canAccessMap(
  mapAccessCondition: { game_state?: string; inventory?: Record<string, boolean> } | undefined,
  gameState: string,
  inventory: boolean[]
): boolean {
  if (!mapAccessCondition) return true; // Default: accessible
  if (mapAccessCondition.game_state && mapAccessCondition.game_state !== gameState) return false;
  if (mapAccessCondition.inventory) {
    for (const [index, value] of Object.entries(mapAccessCondition.inventory)) {
      if (inventory[Number(index)] !== value) return false;
    }
  }
  return true;
}

function App() {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const mapVisible = useGameStateStore((s) => s.mapVisible);
  const setMapVisible = useGameStateStore((s) => s.setMapVisible);
  const currentSceneId = useGameStateStore((s) => s.currentSceneId);
  const setCurrentSceneId = useGameStateStore((s) => s.setCurrentSceneId);
  const gameState = useGameStateStore((s) => s.game_state);
  const inventory = useInventoryStore((s) => s.inventory);
  const [sceneData, setSceneData] = useState<any>(null);
  const [mapButtonAnim, setMapButtonAnim] = useState(false);
  const prevMapAccessible = useRef(false);

  useEffect(() => {
    fetch(`/content/scenes/${currentSceneId}/scene.json`)
      .then((res) => res.json())
      .then((data) => setSceneData(data));
  }, [currentSceneId]);

  const mapAccessCondition = sceneData?.map_access_condition;
  const mapAccessible = canAccessMap(mapAccessCondition, gameState, inventory);

  // Animate map button when it becomes available
  useEffect(() => {
    if (!prevMapAccessible.current && mapAccessible) {
      setMapButtonAnim(true);
      setTimeout(() => setMapButtonAnim(false), 1200);
    }
    prevMapAccessible.current = mapAccessible;
  }, [mapAccessible]);

  return (
    <>
      {/* Map button: top left, only if accessible */}
      {mapAccessible && (
        <button
          className={`fixed top-4 left-4 z-[3000] rounded-xl border-4 border-yellow-400 bg-gray-800 px-7 py-4 text-lg font-bold text-white shadow-lg transition-transform duration-300 ${mapButtonAnim ? 'animate-map-pop' : ''}`}
          style={{ fontSize: '1.35rem', minWidth: 90, minHeight: 56 }}
          onClick={() => setMapVisible(true)}
        >
          Map
        </button>
      )}
      {mapVisible && (
        <MapScreen
          currentSceneId={currentSceneId}
          onTravel={(sceneId) => {
            setCurrentSceneId(sceneId);
            setMapVisible(false);
          }}
        />
      )}
      <Scene sceneId={currentSceneId} draggedItem={draggedItem} />
      <InventoryBar
        onSelect={() => {}}
        onDragStart={setDraggedItem}
        onDragEnd={() => setDraggedItem(null)}
      />
      {/* Map pop animation style */}
      <style>{`
        .animate-map-pop {
          animation: map-pop-glow 1.2s cubic-bezier(.22,1.5,.36,1) 1;
        }
        @keyframes map-pop-glow {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 221, 51, 0.7);
          }
          20% {
            transform: scale(1.18);
            box-shadow: 0 0 16px 8px rgba(255, 221, 51, 0.7);
          }
          40% {
            transform: scale(1.12);
            box-shadow: 0 0 8px 4px rgba(255, 221, 51, 0.5);
          }
          60% {
            transform: scale(1.08);
            box-shadow: 0 0 4px 2px rgba(255, 221, 51, 0.3);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 221, 51, 0);
          }
        }
      `}</style>
    </>
  );
}

export default App;

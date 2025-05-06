import { Scene } from './components/Scene';
import { InventoryBar } from './ui/InventoryBar';
import { MapScreen } from './ui/MapScreen';
import { useGameStateStore } from './stores/gameStateStore';

function App() {
  const mapVisible = useGameStateStore((s) => s.mapVisible);
  const setMapVisible = useGameStateStore((s) => s.setMapVisible);
  const currentSceneId = useGameStateStore((s) => s.currentSceneId);
  const setCurrentSceneId = useGameStateStore((s) => s.setCurrentSceneId);
  const mapEnabled = useGameStateStore((s) => s.mapEnabled);

  return (
    <>
      {/* Map button: top left, only if mapEnabled */}
      {mapEnabled && (
        <button
          className="fixed top-4 left-4 z-[3000] rounded bg-gray-800 px-4 py-2 text-white shadow"
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
      <Scene sceneId={currentSceneId} />
      <InventoryBar onSelect={() => {}} />
    </>
  );
}

export default App;

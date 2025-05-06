import { create } from 'zustand';

interface GameStateStore {
  game_state: string;
  setGameState: (state: string) => void;
  currentSceneId: string;
  setCurrentSceneId: (sceneId: string) => void;
  mapVisible: boolean;
  setMapVisible: (visible: boolean) => void;
  playerDirection: string;
  setPlayerDirection: (dir: string) => void;
  playerMoving: boolean;
  setPlayerMoving: (moving: boolean) => void;
  mapEnabled: boolean;
  setMapEnabled: (enabled: boolean) => void;
}

export const useGameStateStore = create<GameStateStore>((set) => ({
  game_state: 'village_start',
  setGameState: (state) => set({ game_state: state }),
  currentSceneId: 'village',
  setCurrentSceneId: (sceneId) => set({ currentSceneId: sceneId }),
  mapVisible: false,
  setMapVisible: (visible) => set({ mapVisible: visible }),
  playerDirection: 'system_idle',
  setPlayerDirection: (dir) => set({ playerDirection: dir }),
  playerMoving: false,
  setPlayerMoving: (moving) => set({ playerMoving: moving }),
  mapEnabled: true,
  setMapEnabled: (enabled) => set({ mapEnabled: enabled }),
}));

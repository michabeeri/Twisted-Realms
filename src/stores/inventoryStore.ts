import { create } from 'zustand';

interface InventoryState {
  inventory: boolean[];
  setInventory: (flags: boolean[]) => void;
  addItem: (index: number) => void;
  removeItem: (index: number) => void;
  hasItem: (index: number) => boolean;
}

export const useInventoryStore = create<InventoryState>(
  (
    set: (fn: (state: InventoryState) => Partial<InventoryState> | InventoryState) => void,
    get: () => InventoryState
  ) => ({
    inventory: Array(256).fill(false),
    setInventory: (flags: boolean[]) => set(() => ({ inventory: flags })),
    addItem: (index: number) =>
      set((state: InventoryState) => {
        const updated = [...state.inventory];
        updated[index] = true;
        return { inventory: updated };
      }),
    removeItem: (index: number) =>
      set((state: InventoryState) => {
        const updated = [...state.inventory];
        updated[index] = false;
        return { inventory: updated };
      }),
    hasItem: (index: number) => get().inventory[index] === true,
  })
);

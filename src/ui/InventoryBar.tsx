import { useEffect, useState } from 'react';
import { useInventoryStore } from '../stores/inventoryStore';

interface InventoryItem {
  item_id: string;
  index: number;
  name: string;
  icon: string;
  tooltip: string;
}

interface InventoryBarProps {
  onSelect?: (index: number | null) => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
}

export function InventoryBar({ onSelect, onDragStart, onDragEnd }: InventoryBarProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const inventory = useInventoryStore((s) => s.inventory);

  useEffect(() => {
    fetch('/content/inventory.json')
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  const visibleItems = items.filter((item) => inventory[item.index]);
  if (visibleItems.length === 0) return null;

  const handleSelect = (index: number) => {
    setSelected((prev) => (prev === index ? null : index));
    if (onSelect) onSelect(selected === index ? null : index);
  };

  return (
    <div className="fixed bottom-0 left-0 z-[1001] flex w-full justify-center bg-black/70 py-2">
      <div className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent flex gap-4 overflow-x-auto px-4">
        {visibleItems.map((item) => (
          <div
            key={item.index}
            className={`relative flex cursor-pointer flex-col items-center ${selected === item.index ? 'ring-2 ring-yellow-400' : ''}`}
            onClick={() => handleSelect(item.index)}
            draggable
            onDragStart={() => onDragStart && onDragStart(item.index)}
            onDragEnd={() => onDragEnd && onDragEnd()}
            tabIndex={0}
            aria-label={item.tooltip}
          >
            <img
              src={`/${item.icon}`}
              alt={item.name}
              className="h-10 w-10 object-contain"
              title={item.tooltip}
            />
            <span className="mt-1 text-xs whitespace-nowrap text-white">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

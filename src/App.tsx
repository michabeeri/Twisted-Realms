import { Scene } from './components/Scene';
import { InventoryBar } from './ui/InventoryBar';

function App() {
  return (
    <>
      <Scene />
      <InventoryBar onSelect={() => {}} />
    </>
  );
}

export default App;

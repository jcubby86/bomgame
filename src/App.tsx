import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App() {
  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  const restart = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene;

      if (scene) {
        scene.scene.restart();
      }
    }
  };

  return (
    <div id="app">
      <PhaserGame ref={phaserRef} />
      <button
        onClick={restart}
        style={{ position: 'absolute', top: 5, right: 5, minHeight: '30px' }}
      >
        Restart Game
      </button>
    </div>
  );
}

export default App;

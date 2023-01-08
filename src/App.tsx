import { Canvas } from "@react-three/fiber";
import Player from "./Player";
import Lighting from "./Lighting";
import World from "./World";
import { Menu } from "./Menu";
import { useState } from "react";
import { Interface } from "./Interface";
import { PointerLockControls } from "./PointerLockControls";
import { Hud } from "./Hud";

const GAME_MODES = ["1v1"];

export default function App() {
  const day = true;
  const [gameMode, setGameMode] = useState("");

  return (
    <>
      {GAME_MODES.includes(gameMode) ? (
        <>
          <Menu />
          <Hud />
          <Canvas gl={{ alpha: false }}>
            {/* <PerspectiveCamera makeDefault position={[3, 2, -5]} fov={90} /> */}
            <Lighting day={day} />
            <Player />
            <World />
          </Canvas>
        </>
      ) : (
        <Interface setGameMode={setGameMode} />
      )}
    </>
  );
}

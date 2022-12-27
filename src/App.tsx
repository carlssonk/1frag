import { Canvas } from "@react-three/fiber";
import Interface from "./Interface";
import { KeyboardControls } from "@react-three/drei";

import { Stats } from "./player/hud/Stats";
import Player from "./Player";
// import Terrain from "./terrain/Terrain";
import Lighting from "./lighting/Lighting";
import Terrain from "./terrain/Terrain";
import { Level } from "./Level";
import { DoubleSide } from "three";
import World from "./World";

export default function App() {
  const day = true;

  return (
    <>
      <Canvas gl={{ alpha: false }} camera={{ fov: 90 }}>
        <Lighting day={day} />

        {/* <Physics> */}
        {/* {day ? null : <fog attach="fog" args={["black", 10, 100]} />} */}
        {/* <Stats className={undefined} parent={undefined} /> */}
        {/* <Physics gravity={[0, -10, 0]}> */}
        <Player />
        {/* <Terrain /> */}
        {/* <Level /> */}
        <World />
        {/* </Physics> */}
        {/* </Physics> */}
      </Canvas>
      {/* <Interface /> */}
    </>
  );
}

import { Canvas } from "@react-three/fiber";
import Player from "./Player";
import Lighting from "./Lighting";
import World from "./World";

export default function App() {
  const day = true;

  return (
    <>
      <Canvas gl={{ alpha: false }} camera={{ fov: 90 }}>
        <Lighting day={day} />
        <Player />
        <World />
      </Canvas>
    </>
  );
}

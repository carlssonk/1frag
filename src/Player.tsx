import { PerspectiveCamera } from "@react-three/drei";
import { PointerLockControls } from "./PointerLockControls";
import { Movement } from "./Movement";
import { Viewmodel } from "./Viewmodel";

export default function Player() {
  return (
    <group>
      <PerspectiveCamera makeDefault fov={90} near={0.001}>
        <Viewmodel />
      </PerspectiveCamera>
      <PointerLockControls />
      <Movement />
    </group>
  );
}

import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import Player from "./Player";
import Lighting from "./Lighting";
import World from "./World";
import { useMemo } from "react";
import * as THREE from "three";
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  PointerLockControls,
  FirstPersonControls,
} from "@react-three/drei";

export default function App() {
  const day = true;

  return (
    <>
      <Canvas gl={{ alpha: false }}>
        {/* <PerspectiveCamera makeDefault position={[3, 2, -5]} fov={90} /> */}
        <Lighting day={day} />
        <Player />
        {/* <Hud /> */}
        <World />
        <Lol></Lol>

        {/* <OrthographicCamera makeDefault position={[0, 0, 0]} /> */}
        {/* <OrbitControls /> */}
      </Canvas>
    </>
  );
}

const Lol = () => {
  console.log("ONCE ONCE?");

  return null;
};

// function Camera(props) {
//   const camera = useRef()
//   const { defa } = useThree()
//   useEffect(() => void setDefaultCamera(camera.current), [])
//   return <customCamera ref={camera} {...props} />
// }

// function Hud() {
//   const { gl, scene, camera } = useThree();
//   const virtualScene = useMemo(() => new THREE.Scene(), []);

//   useFrame(() => {
//     gl.autoClear = true;
//     gl.render(scene, camera);
//     gl.autoClear = false;
//     gl.clearDepth();
//     gl.render(virtualScene, camera);
//   }, 1);

//   return createPortal(
//     <mesh>
//       <boxBufferGeometry />
//       <meshBasicMaterial color="hotpink" />
//     </mesh>,
//     virtualScene
//   );
// }

// function Viewcube() {
//   const { gl, scene, camera, size } = useThree();
//   const virtualScene = useMemo(() => new Scene(), []);
//   const virtualCam: any = useRef();
//   const ref: any = useRef();
//   const [hover, set]: any = useState(null);
//   const matrix = new Matrix4();

//   useFrame(() => {
//     matrix.getInverse(camera.matrix);
//     ref.current.quaternion.setFromRotationMatrix(matrix);
//     gl.autoClear = true;
//     gl.render(scene, camera);
//     gl.autoClear = false;
//     gl.clearDepth();
//     gl.render(virtualScene, virtualCam.current);
//   }, 1);

//   return createPortal(
//     <>
//       <OrthographicCamera ref={virtualCam} makeDefault={false} position={[0, 0, 100]} />
//       <mesh
//         ref={ref}
//         raycast={useCamera(virtualCam)}
//         position={[size.width / 2 - 80, size.height / 2 - 80, 0]}
//         onPointerOut={(e) => set(null)}
//         onPointerMove={(e: any) => set(Math.floor(e.faceIndex / 2))}
//       >
//         {[...Array(6)].map((_, index) => (
//           <meshLambertMaterial attachArray="material" key={index} color={hover === index ? "hotpink" : "white"} />
//         ))}
//         <boxBufferGeometry attach="geometry" args={[60, 60, 60]} />
//       </mesh>
//       <ambientLight intensity={0.5} />
//       <pointLight position={[10, 10, 10]} intensity={0.5} />
//     </>,
//     virtualScene
//   );
// }

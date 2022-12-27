// This is the thing we are interested in
// The GreenSquare component renders a mesh.
// Meshes are objects that can have a shape and

import { forwardRef, useEffect, useRef } from "react";

import { Octree } from "three/examples/jsm/math/Octree.js";
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper.js";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export const worldOctree = new Octree();

export default function World() {
  const world = useRef<any>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (world?.current?.isObject3D) {
      worldOctree.fromGraphNode(world.current);
      console.log(worldOctree);
      console.log(world.current);
      const octreeHelper = new OctreeHelper(worldOctree, 0xffff00);
      octreeHelper.visible = true;
      scene.add(octreeHelper);
    }
  }, [world.current]);

  // loader.load(model, (gltf) => {
  //   const opts = { ...defaultOptions, ...options };

  //   if (!opts.viewmodel) scene.add(gltf.scene);
  //   if (opts.isWorld) {
  //     worldOctree.fromGraphNode(gltf.scene);
  //     // Octree Helper
  //     octreeHelper = new OctreeHelper(worldOctree);
  //     octreeHelper.visible = false;
  //     scene.add(octreeHelper);
  //   }

  //   gltf.scene.traverse((child) => {
  //     if ((child as Mesh).isMesh) {
  //       child.castShadow = true;
  //       child.receiveShadow = true;
  //       // @ts-ignore
  //       if (child.material.map) {
  //         // @ts-ignore
  //         child.material.map.anisotropy = 4;
  //       }
  //     }
  //   });

  //   resolve(gltf);
  // });

  return (
    <AimMap ref={world} />
    // <mesh position={[2, -5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 9, 9]} ref={world}>
    //   {/*
    //       The thing that gives the mesh its shape
    //       In this case the shape is a flat plane
    //     */}
    //   <planeBufferGeometry />
    //   {/*
    //       The material gives a mesh its texture or look.
    //       In this case, it is just a uniform green
    //     */}
    //   <meshBasicMaterial color="gray" side={DoubleSide} />
    // </mesh>
  );
}

const AimMap = forwardRef((props, ref) => {
  const gltf = useLoader(GLTFLoader, "./aim-map-compressed.glb");

  return (
    <>
      <primitive ref={ref} object={gltf.scene} scale={1} position={[0, -2, 0]} />
    </>
  );
});

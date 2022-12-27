import React from "react";

import { PointerLockControls } from "@react-three/drei";
import { forwardRef } from "react";
import { useFrame } from "@react-three/fiber";

export const PlayerCamera = ({ camera }) => {
  // function moveCamera() {
  //   const pos = ref.current.position;

  //   props.camera.position.y = pos.y + props.STATS.player_height;

  //   props.camera.position.x = pos.x;

  //   props.camera.position.z = pos.z;

  //   console.log(pos.x);
  // }

  // useFrame(() => {
  //   moveCamera();
  // });

  return <PointerLockControls />;
};

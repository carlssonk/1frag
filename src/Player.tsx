import React, { forwardRef, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
// import _ from "lodash";

import { useSphere } from "@react-three/cannon";

import { PlayerMovement } from "./player/PlayerMovement";
import { PlayerCamera } from "./player/PlayerCamera";
import { PlayerModel } from "./player/PlayerModel";
import { usePlayerControls } from "./player/PlayerControls";

import { FlashLight } from "./player/tools/FlashLight";
import * as THREE from "three";
import { PointerLockControls } from "@react-three/drei";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { worldOctree } from "./World";

// let snapNextFrame = 0;

const settings = {
  speed: 5,
  player_height: 0.92,
  // run_speed: () => settings.speed * 2,
  // pan_speed: () => settings.speed * 0.6,
  jump_height: () => 6.2,
  // inertia: 5,
  damping: 15,
  // bunnyhop: false,
  gravity: 15,
};

// Velocity used to calculate position
const velocity = new THREE.Vector3();
// Direction used to calculate (partly) velocity
const direction = new THREE.Vector3();
// Collider and also the position of the player
const collider = new Capsule(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, settings.player_height, 0), 0.2);

const raycaster = new THREE.Raycaster(
  new THREE.Vector3().copy(collider.end), // starting point
  new THREE.Vector3(0, -1, 0), // direction
  0, // near
  10 // far
);

export default function Player() {
  const isGrounded = useRef(false); // if character is touching the ground
  const isJumping = useRef(false); // if movement was initiated by jump
  const shouldSnapToGround = useRef(0); // if character should stick to ground
  // const [canJump, setCanJump] = useState(false);
  // let offset = 0.01;

  // Returns boolean value if a key is currently pressed
  const { forward, backward, leftward, rightward, jump, walk } = usePlayerControls();

  const { camera } = useThree();

  // Update player
  useFrame((state, delta) => {
    const walkSpeed = 5 * settings.damping;
    const walkThrottle = walk ? 0.5 : 1;

    // Gives a bit of air control
    let speedDelta = delta * (walkSpeed * walkThrottle);
    // Air resistance
    if (!isGrounded.current) speedDelta *= 0.04;
    // Normalize speed
    if (isWalkingDiagonally()) speedDelta = speedDelta / 1.33;

    // TODO: Best practice is to have an accelerator function that handles velocity, its bad practice to update velocity multiple time here
    // when we actually only need to update it at one place

    if (forward) {
      velocity.add(getForwardVector().multiplyScalar(speedDelta));
    }
    if (backward) {
      velocity.add(getForwardVector().multiplyScalar(-speedDelta));
    }
    if (leftward) {
      velocity.add(getSideVector().multiplyScalar(-speedDelta));
    }
    if (rightward) {
      velocity.add(getSideVector().multiplyScalar(speedDelta));
    }

    if (isGrounded.current && jump) {
      isJumping.current = true;
      shouldSnapToGround.current = 0;
      velocity.y = settings.jump_height();
    }
    // --------------------------------------------------------------------------------------------------------------
    let damping = Math.exp(-settings.damping * delta) - 1;

    if (!isGrounded.current) {
      velocity.y -= settings.gravity * delta;

      // Air resistence
      damping *= 0.02;
    }

    velocity.addScaledVector(velocity, damping);

    const deltaPosition = velocity.clone().multiplyScalar(delta);

    collider.translate(deltaPosition);

    // console.log("COLLIDER");
    worldCollision(delta);

    // console.log(collider.end);
    camera.position.copy(collider.end);

    // console.log(camera.position);
  });

  function accelerate(accelDir: any, prevVelocity: any, wishSpeed: number, airAccel: number, dt: number) {
    let wishSpd = wishSpeed;
    const currentSpeed = prevVelocity.dot(accelDir);
    const addSpeed = wishSpd - currentSpeed;
    if (addSpeed <= 0) {
      return prevVelocity;
    }

    let accelSpeed = wishSpeed * airAccel * dt;
    if (accelSpeed > addSpeed) {
      accelSpeed = addSpeed;
    }
    const vel = prevVelocity.clone();
    vel.x += accelSpeed * accelDir.x;
    vel.y += accelSpeed * accelDir.y;
    vel.z += accelSpeed * accelDir.z;
    return vel;
  }

  // HELPER FUNCTIONS
  function worldCollision(delta: any) {
    let result = worldOctree.capsuleIntersect(collider);
    const isGroundedResult = result && result.normal.y > 0;

    // Handle snap to ground
    // result = handleSnapToGround(isGroundedResult) || result;

    isGrounded.current = false; // Reset variable

    // Normal collission detection
    const isTouchingWorld = !!result;
    if (isTouchingWorld) {
      // const isGroundedResult = result.normal.y > 0;

      if (isGroundedResult) {
        isGrounded.current = true;
        isJumping.current = false;
      }

      if (!isGroundedResult) {
        velocity.addScaledVector(result.normal, -result.normal.dot(velocity));
      }

      collider.translate(result.normal.multiplyScalar(result.depth));
    }
  }

  function handleSnapToGround(isGroundedResult: boolean) {
    const wasGrounded = isGrounded.current;
    // Add snap to ground when the following components are met:
    // * current frame character touches the ground
    // * The movement was not initiated by jump
    // * The vertical separation from the characters feet and ground is less than X units. Do this by "modding" our existing collision detection and softly offsetting character by X downwards
    raycaster.ray.origin.copy(collider.end);

    const getDistanceToGround = () => {
      const res = worldOctree.rayIntersect(raycaster.ray);
      return res.distance - 1.12;
    };

    if (shouldSnapToGround.current >= 3) {
      shouldSnapToGround.current = 0;
    }

    // IF SHOULD SNAP
    if ((wasGrounded && !isGroundedResult && !isJumping.current) || shouldSnapToGround.current) {
      shouldSnapToGround.current++;
      const distance = getDistanceToGround();
      const MIN = 0.001;
      const MAX = 0.2;

      // Improvement ideas:
      // Somehow set gravity/velocity/force downwards next frame to make us snap to ground
      // let downwardsForce = ? that we integrate in the velocity part of the roundtrip
      // OR improve existing logic by only snapping to ground if current frame character is walking on a flat surface
      // Or inside this block modify velocity to be the direction from current position to current -distance
      // OR ALSO MOVE CHARACTER FORWARDS A LITTLE BIT AND THEN CALCULATE DISTANCE TO GROUND

      if (distance >= MIN && distance <= MAX) {
        collider.translate(new THREE.Vector3(0, -distance, 0));
        return worldOctree.capsuleIntersect(collider);
      }
    }

    return false;
  }

  const isWalkingDiagonally = () =>
    (forward && rightward) || (rightward && backward) || (backward && leftward) || (leftward && forward);

  const getForwardVector = () => {
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    return direction;
  };

  const getSideVector = () => {
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    direction.cross(camera.up);

    return direction;
  };

  return (
    <group>
      {/* <PlayerCamera camera={camera} /> */}
      <PointerLockControls />
      {/* <PlayerCamera camera={camera} /> */}
    </group>
  );
}

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { usePlayerControls } from "./PlayerControls";

import * as THREE from "three";
import { PointerLockControls } from "@react-three/drei";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { worldOctree } from "./World";

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
// Move direction (direction we want to move in)
const direction = new THREE.Vector3();
// Previous frame's player position
const movingDirectionVector = new THREE.Vector3(); // Helper vector
const prevPosition = new THREE.Vector3();
// camera looking direction
const lookingDirectionVector = new THREE.Vector3(); // Helper vector

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
  // Direction we are currently moving in (-180 to 180)
  const movingDirection = useRef(0);
  // if key W,A,S or D was pressed previous frame
  const previousKeyPress = useRef(false);

  // Returns boolean value if a key is currently pressed
  const { forward, backward, leftward, rightward, jump, walk } = usePlayerControls();

  const { camera } = useThree();

  // Update player
  useFrame((state, delta) => {
    const walkSpeed = 5 * settings.damping;
    const walkThrottle = walk ? 0.5 : 1;

    // Walking speed
    let speedDelta = delta * (walkSpeed * walkThrottle);

    // Air resistance (x,z)
    if (!isGrounded.current) {
      speedDelta *= 0.04;
    }
    // Normalize speed
    if (isWalkingDiagonally()) speedDelta = speedDelta / 1.33;

    if (forward) {
      const moveDirection = getForwardVector().multiplyScalar(speedDelta);
      handleMove(moveDirection, "forward", speedDelta);
    }
    if (backward) {
      const moveDirection = getForwardVector().multiplyScalar(-speedDelta);
      handleMove(moveDirection, "backward", -speedDelta);
    }
    if (leftward) {
      const moveDirection = getSideVector().multiplyScalar(-speedDelta);
      handleMove(moveDirection, "leftward", -speedDelta);
    }
    if (rightward) {
      const moveDirection = getSideVector().multiplyScalar(speedDelta);
      handleMove(moveDirection, "rightward", speedDelta);
    }

    // JUMP VELOCITY
    if (isGrounded.current && jump) {
      isJumping.current = true;
      shouldSnapToGround.current = 0;
      velocity.y = settings.jump_height();
    }

    let damping = Math.exp(-settings.damping * delta) - 1;

    if (!isGrounded.current) {
      // Gravity
      velocity.y -= settings.gravity * delta;
      // Vertical air resistancee
      damping *= 0.02;
    }

    velocity.addScaledVector(velocity, damping);

    const deltaPosition = velocity.clone().multiplyScalar(delta);

    collider.translate(deltaPosition);

    worldCollision(delta);

    handleBeforeNextPosition();

    // Set new position
    camera.position.copy(collider.end);
    prevPosition.copy(collider.end);
    raycaster.ray.origin.copy(collider.end);

    // other state
    previousKeyPress.current = forward || backward || leftward || rightward;
  });

  function handleMove(moveDirection: any, key: string, speedDelta: any) {
    const moveDirectionDeg = THREE.MathUtils.radToDeg(Math.atan2(moveDirection.x, moveDirection.z));

    // diff: 180 = moveDirectionDeg is 180 degrees current moving direction, i.e if player is holding in W and then presses S. we get 180 degrees
    // 0 = moveDirection is same as movingDirection
    let rotationDiff = Math.abs(movingDirection.current - moveDirectionDeg);
    if (rotationDiff >= 180) rotationDiff = 360 - rotationDiff; // normalize diff to just the range 0-180

    // If diff is less or equal than 60 (180-140 = 40), and if we are in the air, and if no W,A,S,D was not pressed last frame, and the distance to ground is less than x
    if (rotationDiff >= 120 && !isGrounded.current && !previousKeyPress.current && getDistanceToGround() >= 0.1) {
      // Handle brake mid air
      const brake = THREE.MathUtils.clamp((1 - rotationDiff / 180) * 2, 0.2, 1);
      velocity.x = (velocity.x + moveDirection.x) * brake;
      velocity.z = (velocity.z + moveDirection.z) * brake;
    } else {
      // Add strafe if in air
      if (!isGrounded.current) {
        const lookingDirection = camera.getWorldDirection(lookingDirectionVector);
        lookingDirection.normalize();
        const lookingDirectionDeg = THREE.MathUtils.radToDeg(Math.atan2(lookingDirection.x, lookingDirection.z));
        let directionDiff = movingDirection.current - lookingDirectionDeg;

        if (key === "leftward" && directionDiff > -90 && directionDiff < 0) {
          // Add strafe
          const strafe = getSideVector().multiplyScalar(speedDelta * 20);
          velocity.add(strafe);
          return;
        }
        if (key === "rightward" && directionDiff > 0 && directionDiff < 90) {
          // Add strafe
          const strafe = getSideVector().multiplyScalar(speedDelta * 20);
          velocity.add(strafe);
          return;
        }
      }

      // Add movement
      velocity.add(moveDirection);
    }
  }

  function handleBeforeNextPosition() {
    // logic before we set next player position

    // set moving direction
    const vector = movingDirectionVector.subVectors(collider.end, prevPosition).normalize();
    movingDirection.current = THREE.MathUtils.radToDeg(Math.atan2(vector.x, vector.z));
  }

  function getLookingDirection(direction: any) {
    const vector = camera.getWorldDirection(direction);
    return THREE.MathUtils.radToDeg(Math.atan2(vector.x, vector.z));
  }

  // HELPER FUNCTIONS
  function worldCollision(delta: any) {
    let result = worldOctree.capsuleIntersect(collider);
    const isGroundedResult = result && result.normal.y > 0;

    // Handle snap to ground
    // result = handleSnapToGround(isGroundedResult) || result;

    isGrounded.current = false; // Reset variable

    // Normal collission detection
    const didCollide = !!result;
    if (didCollide) {
      if (isGroundedResult) {
        isGrounded.current = true;
        isJumping.current = false;
      }

      if (!isGroundedResult) {
        velocity.addScaledVector(result.normal, -result.normal.dot(velocity)); // add velocity
      }

      collider.translate(result.normal.multiplyScalar(result.depth)); // update player position
    }

    return didCollide;
  }

  function getDistanceToGround() {
    const res = worldOctree.rayIntersect(raycaster.ray);
    return res.distance - 1.12;
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

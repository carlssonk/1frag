import { useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { useMovementControls } from "./PlayerControls";

import * as THREE from "three";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { worldOctree } from "./World";
import { usePlayer } from "./player-store";

const settings = {
  speed: 5,
  player_height: 0.92,
  jump_height: () => 6.2,
  damping: 15,
  gravity: 15,
};

export const Movement = () => {
  const setVelocity = usePlayer((state) => state.setVelocity);
  const setIsGrounded = usePlayer((state) => state.setIsGrounded);

  const [store] = useState({
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    movingDirectionVector: new THREE.Vector3(),
    prevPosition: new THREE.Vector3(),
    lookingDirectionVector: new THREE.Vector3(),
    collider: new Capsule(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, settings.player_height, 0), 0.2),
    raycaster: new THREE.Raycaster(
      new THREE.Vector3(0, settings.player_height, 0), // starting point
      new THREE.Vector3(0, -1, 0), // direction
      0, // near
      10 // far
    ),
    isGrounded: false,
    isJumping: false,
    shouldSnapToGround: 0,
    movingDirection: 0,
    wasPreviousPressWASD: false,
  });

  // Returns boolean value if a key is currently pressed
  const { forward, backward, leftward, rightward, jump, walk } = useMovementControls();

  const { camera } = useThree();

  const isWalkingDiagonally = () =>
    (forward && rightward) || (rightward && backward) || (backward && leftward) || (leftward && forward);

  const getForwardVector = () => {
    camera.getWorldDirection(store.direction);
    store.direction.y = 0;
    store.direction.normalize();

    return store.direction;
  };

  const getSideVector = () => {
    camera.getWorldDirection(store.direction);
    store.direction.y = 0;
    store.direction.normalize();
    store.direction.cross(camera.up);

    return store.direction;
  };

  // Update player
  useFrame((state, delta) => {
    const walkSpeed = 5 * settings.damping;
    const walkThrottle = walk ? 0.5 : 1;
    // Walking speed
    let speedDelta = delta * (walkSpeed * walkThrottle);

    // Air resistance (x,z)
    if (!store.isGrounded) {
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
    if (store.isGrounded && jump) {
      store.isJumping = true;
      store.shouldSnapToGround = 0;
      store.velocity.y = settings.jump_height();
    }

    let damping = Math.exp(-settings.damping * delta) - 1;

    if (!store.isGrounded) {
      // Gravity
      store.velocity.y -= settings.gravity * delta;
      // Vertical air resistancee
      damping *= 0.02;
    }
    store.velocity.addScaledVector(store.velocity, damping);

    const deltaPosition = store.velocity.clone().multiplyScalar(delta);

    store.collider.translate(deltaPosition);
    worldCollision(delta);

    handleBeforeNextPosition();
    // Set new position
    camera.position.copy(store.collider.end);
    store.prevPosition.copy(store.collider.end);
    store.raycaster.ray.origin.copy(store.collider.end);
    // other state
    store.wasPreviousPressWASD = forward || backward || leftward || rightward;

    // update player store
    setVelocity(store.velocity);
    setIsGrounded(store.isGrounded);
  });

  function handleMove(moveDirection: any, key: string, speedDelta: any) {
    const moveDirectionDeg = THREE.MathUtils.radToDeg(Math.atan2(moveDirection.x, moveDirection.z));

    // diff: 180 = moveDirectionDeg is 180 degrees current moving direction, i.e if player is holding in W and then presses S. we get 180 degrees
    // 0 = moveDirection is same as movingDirection
    let rotationDiff = Math.abs(store.movingDirection - moveDirectionDeg);
    if (rotationDiff >= 180) rotationDiff = 360 - rotationDiff; // normalize diff to just the range 0-180

    // If diff is less or equal than 60 (180-140 = 40), and if we are in the air, and if no W,A,S,D was not pressed last frame, and the distance to ground is less than x
    if (rotationDiff >= 120 && !store.isGrounded && !store.wasPreviousPressWASD && getDistanceToGround() >= 0.1) {
      // Handle brake mid air
      const brake = THREE.MathUtils.clamp((1 - rotationDiff / 180) * 2, 0.2, 1);
      store.velocity.x = (store.velocity.x + moveDirection.x) * brake;
      store.velocity.z = (store.velocity.z + moveDirection.z) * brake;
    } else {
      // Add strafe if in air
      if (!store.isGrounded) {
        const lookingDirection = camera.getWorldDirection(store.lookingDirectionVector);
        lookingDirection.normalize();
        const lookingDirectionDeg = THREE.MathUtils.radToDeg(Math.atan2(lookingDirection.x, lookingDirection.z));
        let directionDiff = store.movingDirection - lookingDirectionDeg;

        if (key === "leftward" && directionDiff > -90 && directionDiff < 0) {
          // Add strafe
          const strafe = getSideVector().multiplyScalar(speedDelta * 20);
          store.velocity.add(strafe);
          return;
        }
        if (key === "rightward" && directionDiff > 0 && directionDiff < 90) {
          // Add strafe
          const strafe = getSideVector().multiplyScalar(speedDelta * 20);
          store.velocity.add(strafe);
          return;
        }
      }

      // Add movement
      store.velocity.add(moveDirection);
    }
  }

  function handleBeforeNextPosition() {
    // logic before we set next player position

    // set moving direction
    const vector = store.movingDirectionVector.subVectors(store.collider.end, store.prevPosition).normalize();
    store.movingDirection = THREE.MathUtils.radToDeg(Math.atan2(vector.x, vector.z));
  }

  function getLookingDirection(direction: any) {
    const vector = camera.getWorldDirection(direction);
    return THREE.MathUtils.radToDeg(Math.atan2(vector.x, vector.z));
  }

  // HELPER FUNCTIONS
  function worldCollision(delta: any) {
    let result = worldOctree.capsuleIntersect(store.collider);
    const isGroundedResult = result && result.normal.y > 0;

    // Handle snap to ground
    // result = handleSnapToGround(isGroundedResult) || result;

    store.isGrounded = false; // Reset variable

    // Normal collission detection
    const didCollide = !!result;
    if (didCollide) {
      if (isGroundedResult) {
        store.isGrounded = true;
        store.isJumping = false;
      }

      if (!isGroundedResult) {
        store.velocity.addScaledVector(result.normal, -result.normal.dot(store.velocity)); // add velocity
      }

      store.collider.translate(result.normal.multiplyScalar(result.depth)); // update player position
    }

    return didCollide;
  }

  function getDistanceToGround() {
    const res = worldOctree.rayIntersect(store.raycaster.ray);
    return res.distance - 1.12;
  }

  function handleSnapToGround(isGroundedResult: boolean) {
    const wasGrounded = store.isGrounded;
    // Add snap to ground when the following components are met:
    // * current frame character touches the ground
    // * The movement was not initiated by jump
    // * The vertical separation from the characters feet and ground is less than X units. Do this by "modding" our existing collision detection and softly offsetting character by X downwards
    store.raycaster.ray.origin.copy(store.collider.end);

    const getDistanceToGround = () => {
      const res = worldOctree.rayIntersect(store.raycaster.ray);
      return res.distance - 1.12;
    };

    if (store.shouldSnapToGround >= 3) {
      store.shouldSnapToGround = 0;
    }

    // IF SHOULD SNAP
    if ((wasGrounded && !isGroundedResult && !store.isJumping) || store.shouldSnapToGround) {
      store.shouldSnapToGround++;
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
        store.collider.translate(new THREE.Vector3(0, -distance, 0));
        return worldOctree.capsuleIntersect(store.collider);
      }
    }

    return false;
  }

  return null;
};

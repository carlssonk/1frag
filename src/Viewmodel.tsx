import { useFrame, useLoader } from "@react-three/fiber";
import { forwardRef, useEffect, useRef, useState } from "react";
// import THREE from "three";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { usePlayer } from "./player-store";
import { useMovementControls, useViewmodelControls } from "./PlayerControls";

const MOVE_BOBBING_HEIGHT_THROTTLE = 500;
const MOVE_BOBBING_SPEED = 15;

export const Viewmodel = () => {
  const velocity = usePlayer((state) => state.velocity);
  const isGrounded = usePlayer((state) => state.isGrounded);
  const isMouseMoving = usePlayer((state) => state.isMouseMoving);
  const mouseMovingDelta = usePlayer((state) => state.mouseMovingDelta);

  const viewmodelRef = useRef<any>(null!);

  const { scene: weapon, animations: weaponAnimations }: any = useLoader(GLTFLoader, "/ar15.glb");
  const { scene: arms, animations: armsAnimations }: any = useLoader(GLTFLoader, "/arms-512.glb");
  // Keep gun on top of everything else
  weapon.children[0].children[1].onBeforeRender = function (renderer: { clearDepth: () => void }) {
    renderer.clearDepth();
  };
  arms.children[0].children[1].onBeforeRender = function (renderer: { clearDepth: () => void }) {
    renderer.clearDepth();
  };

  const { forward, backward, leftward, rightward, walk } = useMovementControls();
  const isPlayerMoving = forward || backward || leftward || rightward;
  const walkThrottle = walk ? 0.5 : 1;

  const [store] = useState({
    weaponMixer: null as THREE.AnimationMixer | null,
    armsMixer: null as THREE.AnimationMixer | null,
    lastShootTimestamp: 0,
    fireRate: 80,
    weaponBobbingAcc: new THREE.Vector3(0, 0, 0), // rotation bobbing
    moveBobbing: 0, // Y bobbing
    weaponPositionZ: 0,
  });

  useEffect(() => {
    if (weaponAnimations) {
      store.weaponMixer = new THREE.AnimationMixer(weapon);
      weaponAnimations.forEach((clip: any) => {
        const action = store.weaponMixer!.clipAction(clip);
        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 0);
        action.play();
      });
    }
    if (armsAnimations) {
      store.armsMixer = new THREE.AnimationMixer(arms);
      armsAnimations.forEach((clip: any) => {
        // console.log(clip);
        const action = store.armsMixer!.clipAction(clip);
        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 0);
        action.play();
      });
    }
    // viewmodelRef.current.defaultPosition = {
    //   x: 0,
    //   y: 0,
    //   z: 0,
    // };
  }, []);

  const { mousePrimary } = useViewmodelControls();

  useFrame((state, delta) => {
    // console.log(velocity);
    const elapsedTime = state.clock.getElapsedTime();
    store.armsMixer?.update(delta);
    store.weaponMixer?.update(delta);
    // console.log(mousePrimary);
    if (mousePrimary) {
      // console.log(performance.now() - store.lastShootTimestamp());
      // console.log(performance.now() - store.lastShootTimestamp);
      // console.log("FIRE RATE");
      if (performance.now() - store.lastShootTimestamp > store.fireRate) {
        //Shoot
        // console.log("SHOOT");

        // store.shootCooldown = store.fireRate;
        store.lastShootTimestamp = performance.now();
        // console.log(performance.now());
      }

      // store.shootCooldown = Math.max(0.0, store.shootCooldown - delta);
    }

    bobbingNew(delta, elapsedTime);
    // bobbing(delta, elapsedTime);
  });

  // const bobbing = (delta: number, elapsedTime: number) => {
  //   // console.log(velocity);

  //   function easeOutExpo(x: number): number {
  //     return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  //   }

  //   const avgVelocity = Math.abs(velocity.x) + Math.abs(velocity.z);
  //   // console.log();
  //   const offset = avgVelocity / 1000;

  //   // const data = THREE.MathUtils.lerp(
  //   //   viewmodelRef.current.position.z + Math.max(-Math.PI / 128, offset),
  //   //   0,
  //   //   Math.min(1, 20 * delta)
  //   // );
  //   console.log(easeOutExpo(store.movingAccumulator));
  //   // console.log(data);
  //   // console.log(viewmodelRef.current);
  //   // View offset
  //   viewmodelRef.current.position.set(
  //     viewmodelRef.current.defaultPosition.x + offset,
  //     viewmodelRef.current.defaultPosition.y - offset,
  //     viewmodelRef.current.defaultPosition.z + offset
  //   );
  //   // View bobbing
  //   if (avgVelocity > 5) {
  //     viewmodelRef.current.position.z = viewmodelRef.current.position.z + Math.sin(elapsedTime / 75) / 500;
  //   } else if (avgVelocity > 1) {
  //     viewmodelRef.current.position.z = viewmodelRef.current.position.z + Math.sin(elapsedTime / 150) / 500;
  //   }
  // };
  const bobbingNew = (delta: number, elapsedTime: number) => {
    // Mouse move bobbing
    if (isMouseMoving) {
      const bobbingAmount = 0.0001;
      const mouseMoveBobbing = new THREE.Vector2(mouseMovingDelta.x, mouseMovingDelta.y).multiplyScalar(bobbingAmount);
      store.weaponBobbingAcc.add(new THREE.Vector3(mouseMoveBobbing.y, mouseMoveBobbing.x, 0));
    }

    // Jump bobbing
    const bobbingRestitutionSpeed = 20;
    const bobbingLerpAmount = Math.min(1, bobbingRestitutionSpeed * delta);
    let jumpBobbing = velocity.y / 1000;
    jumpBobbing = Math.max(-Math.PI / 128, jumpBobbing);
    store.weaponBobbingAcc.x = THREE.MathUtils.lerp(store.weaponBobbingAcc.x + jumpBobbing, 0, bobbingLerpAmount);
    store.weaponBobbingAcc.y = THREE.MathUtils.lerp(store.weaponBobbingAcc.y, 0, bobbingLerpAmount);

    // Update viewmodel rotation
    viewmodelRef.current.rotation.x = -store.weaponBobbingAcc.x;
    viewmodelRef.current.rotation.y = -store.weaponBobbingAcc.y;
    viewmodelRef.current.rotation.z = -store.weaponBobbingAcc.y;

    const isDrifting = (rightward && leftward) || (forward && backward);

    // Z Position
    if (isPlayerMoving && !isDrifting) {
      store.weaponPositionZ = Math.min(0.01, store.weaponPositionZ + 0.001);
    } else {
      store.weaponPositionZ = Math.max(0, store.weaponPositionZ - 0.001);
    }
    viewmodelRef.current.position.z = store.weaponPositionZ;

    // Run/walk bobbing
    const moveBobbingPos = () => Math.sin(store.moveBobbing) / MOVE_BOBBING_HEIGHT_THROTTLE;
    if (isPlayerMoving && !isDrifting) {
      store.moveBobbing = store.moveBobbing + MOVE_BOBBING_SPEED * walkThrottle * delta;
      viewmodelRef.current.position.y = moveBobbingPos();
    } else if (viewmodelRef.current.position.y !== 0) {
      store.moveBobbing = store.moveBobbing + MOVE_BOBBING_SPEED * walkThrottle * delta;

      if (viewmodelRef.current.position.y > 0) {
        if (moveBobbingPos() < 0) {
          viewmodelRef.current.position.y = 0;
        } else {
          viewmodelRef.current.position.y = moveBobbingPos();
        }
      }

      if (viewmodelRef.current.position.y < 0) {
        if (moveBobbingPos() > 0) {
          viewmodelRef.current.position.y = 0;
        } else {
          viewmodelRef.current.position.y = moveBobbingPos();
        }
      }
    }
  };

  return (
    <group ref={viewmodelRef}>
      <primitive object={weapon} position={[0, 0, 0.1]} rotation={[0, Math.PI, 0]} />;
      <primitive object={arms} position={[0, 0, 0.1]} rotation={[0, Math.PI, 0]} />;
    </group>
  );
};

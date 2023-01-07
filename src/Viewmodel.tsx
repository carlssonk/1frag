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

  const { scene: object, animations }: any = useLoader(GLTFLoader, "/ar15.glb");
  // Keep gun on top of everything else
  object.children[0].children[1].onBeforeRender = function (renderer: { clearDepth: () => void }) {
    renderer.clearDepth();
  };

  const { forward, backward, leftward, rightward, walk } = useMovementControls();
  const isPlayerMoving = forward || backward || leftward || rightward;
  const walkThrottle = walk ? 0.5 : 1;

  const [store] = useState({
    mixer: null as THREE.AnimationMixer | null,
    lastShootTimestamp: 0,
    fireRate: 80,
    weaponBobbingAcc: new THREE.Vector3(0, 0, 0), // rotation bobbing
    moveBobbing: 0, // Y bobbing
    weaponPositionZ: 0,
  });

  useEffect(() => {
    if (animations) {
      store.mixer = new THREE.AnimationMixer(object);
      animations.forEach((clip: any) => {
        const action = store.mixer!.clipAction(clip);
        action.clampWhenFinished = true;
        action.setLoop(THREE.LoopOnce, 0);
        action.play();
      });
    }
    viewmodelRef.current.defaultPosition = {
      x: 0,
      y: 0,
      z: 0,
    };
  }, []);

  const { mousePrimary } = useViewmodelControls();

  function easeOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function easeInExpo(x: number): number {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
  }

  function easeInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  useFrame((state, delta) => {
    const playerMovingVelocity = Math.abs(velocity.x) + Math.abs(velocity.z);
    // console.log(playerMovingVelocity / 5);
    // playerMovingVelocity / 5
    // store.weaponPositionZ = Math.min(1, playerMovingVelocity / 5);

    if (isPlayerMoving && !(rightward && leftward) && !(forward && backward)) {
      console.log(Math.abs(velocity.x) + Math.abs(velocity.z));
      store.weaponPositionZ = Math.min(0.01, store.weaponPositionZ + 0.001);
      console.log(easeInOutSine(store.weaponPositionZ));
    } else {
      store.weaponPositionZ = Math.max(0, store.weaponPositionZ - 0.001);
      console.log(easeInOutSine(store.weaponPositionZ));
    }

    // console.log(velocity);
    const elapsedTime = state.clock.getElapsedTime();
    store.mixer?.update(delta);
    // console.log(mousePrimary);
    if (mousePrimary) {
      // console.log(performance.now() - store.lastShootTimestamp());
      // console.log(performance.now() - store.lastShootTimestamp);
      // console.log("FIRE RATE");
      if (performance.now() - store.lastShootTimestamp > store.fireRate) {
        //Shoot
        console.log("SHOOT");

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

    // Z Position
    // viewmodelRef.current.position.z = easeInOutQuad(store.weaponPositionZ) / 50;
    viewmodelRef.current.position.z = store.weaponPositionZ;
    // console.log(elapsedTime);
    // console.log(elapsedTime);
    // console.log(easeOutExpo(elapsedTime));
    // viewmodelRef.current.position.z = viewmodelRef.current.position.z + easeOutExpo(viewmodelRef.current.position.z);
    // Update viewmodel run/walk bobbing
    const moveBobbingPos = () => Math.sin(store.moveBobbing) / MOVE_BOBBING_HEIGHT_THROTTLE;
    if (isPlayerMoving) {
      store.moveBobbing = store.moveBobbing + MOVE_BOBBING_SPEED * walkThrottle * delta;
      viewmodelRef.current.position.y = moveBobbingPos();

      // const avgVelocity = Math.abs(velocity.x) + Math.abs(velocity.z);
      // const offset = avgVelocity / 1000;

      // viewmodelRef.current.position.z = viewmodelRef.current.position.z + Math.sin(elapsedTime / 75) / 500;
      // viewmodelRef.current.position.z = -store.weaponBobbingAcc.y;
      // console.log(viewmodelRef.current);
      // View offset
      // viewmodelRef.current.position.z = offset;
      // if (avgVelocity > 5) {

      // } else if (avgVelocity > 1) {
      // viewmodelRef.current.position.z = viewmodelRef.current.position.z + Math.sin(elapsedTime / 150) / 500;
      // }
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
      <primitive object={object} position={[0, 0, 0.1]} rotation={[0, Math.PI, 0]} />;
    </group>
  );
};

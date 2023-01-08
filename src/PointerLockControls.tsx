// https://github.com/pmndrs/drei/blob/master/src/core/PointerLockControls.tsx
import { EventManager, ReactThreeFiber, RootState, useFrame, useThree } from "@react-three/fiber";
import { DomEvent } from "@react-three/fiber/dist/declarations/src/core/events";
import * as React from "react";
import * as THREE from "three";
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import _ from "lodash"; // Added this
import { usePlayer } from "./player-store";
import { useBindings } from "./bindings-store";

// var debounce_fun = _.debounce(function () {
//   console.log("Function debounced after 1000ms!");
// }, 1000);

// debounce_fun();

export type PointerLockControlsProps = ReactThreeFiber.Object3DNode<
  PointerLockControlsImpl,
  typeof PointerLockControlsImpl
> & {
  domElement?: HTMLElement;
  selector?: string;
  enabled?: boolean;
  camera?: THREE.Camera;
  onChange?: (e?: THREE.Event) => void;
  onLock?: (e?: THREE.Event) => void;
  onUnlock?: (e?: THREE.Event) => void;
  makeDefault?: boolean;
};

export const PointerLockControls = React.forwardRef<PointerLockControlsImpl, PointerLockControlsProps>(
  ({ domElement, selector, onChange, onLock, onUnlock, enabled = true, makeDefault, ...props }, ref) => {
    const { camera, ...rest } = props;
    const setEvents = useThree((state) => state.setEvents);
    const gl = useThree((state) => state.gl);
    const defaultCamera = useThree((state) => state.camera);
    const invalidate = useThree((state) => state.invalidate);
    const events = useThree((state) => state.events) as EventManager<HTMLElement>;
    const get = useThree((state) => state.get);
    const set = useThree((state) => state.set);
    const explCamera = camera || defaultCamera;
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement;

    // Added this
    const resumeButtonDom = useBindings((state) => state.resumeButtonDom);
    const setIsPointerLocked = useBindings((state) => state.setIsPointerLocked);
    // const isPointerLocked = useBindings((state) => state.isPointerLocked);
    const setMouseMoveDelta = usePlayer((state) => state.setMouseMovingDelta);
    const setIsMouseMoving = usePlayer((state) => state.setIsMouseMoving);
    const isMouseMoving = usePlayer((state) => state.isMouseMoving);
    const [store] = React.useState({
      movingAccumulator: 0,
      // isMouseMoving: false
    });

    const controls = React.useMemo(() => new PointerLockControlsImpl(explCamera), [explCamera]); // Changed here to useMemo so when camera changes the controls gets updated for the new camera

    // Added this
    useFrame((_, delta) => {
      if (isMouseMoving) {
        if (store.movingAccumulator >= 300) {
          setIsMouseMoving(false);
          store.movingAccumulator = 0;
        } else {
          store.movingAccumulator += delta * 1000;
        }
      }
      // console.log(isPointerLocked);
    });

    React.useEffect(() => {
      if (enabled) {
        controls.connect(explDomElement);
        controls.lock();
        // setRequestLock(controls.lock);
        // setRequestUnlock(controls.unlock);
        // Force events to be centered while PLC is active
        const oldComputeOffsets = get().events.compute;
        setEvents({
          compute(event: DomEvent, state: RootState) {
            const offsetX = state.size.width / 2;
            const offsetY = state.size.height / 2;
            state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1);
            state.raycaster.setFromCamera(state.pointer, state.camera);

            // Added this
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            setMouseMoveDelta(movementX, movementY);
            setIsMouseMoving(true);
          },
        });
        return () => {
          controls.disconnect();
          setEvents({ compute: oldComputeOffsets });
        };
      }
    }, [enabled, controls]);

    React.useEffect(() => {
      const changeCallback = (e: THREE.Event) => {
        invalidate();
        if (onChange) {
          onChange(e);
        }
      };

      controls.addEventListener("change", changeCallback);

      const onLockCallback = (e: THREE.Event) => {
        console.log("LOCKED");
        setIsPointerLocked(true);
        if (onLock) onLock(e);
      };

      const onUnlockCallback = (e: THREE.Event) => {
        console.log("UNLOCKED");
        setIsPointerLocked(false);
        if (onUnlock) onUnlock(e);
      };

      controls.addEventListener("lock", onLockCallback);
      controls.addEventListener("unlock", onUnlockCallback);

      // console.log("ONCE!!!!!!!!!!!!!!!");
      // Enforce previous interaction
      const handler = () => controls.lock();

      const elements = selector ? Array.from(document.querySelectorAll(selector)) : [gl.domElement, resumeButtonDom];
      elements.forEach((element) => element && element.addEventListener("click", handler));

      return () => {
        controls.removeEventListener("change", changeCallback);
        if (onLock) controls.addEventListener("lock", onLock);
        if (onUnlock) controls.addEventListener("unlock", onUnlock);
        elements.forEach((element) => (element ? element.removeEventListener("click", handler) : undefined));
      };
    }, [onChange, onLock, onUnlock, selector, controls, invalidate]);

    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls;
        set({ controls });
        return () => set({ controls: old });
      }
    }, [makeDefault, controls]);

    return <primitive ref={ref} object={controls} {...rest} />;
  }
);

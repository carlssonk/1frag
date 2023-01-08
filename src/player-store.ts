import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";
import create from "zustand";

type PlayerState = {
  velocity: THREE.Vector3;
  setVelocity: (v: THREE.Vector3) => unknown;
  isMouseMoving: boolean;
  setIsMouseMoving: (bool: boolean) => unknown;
  mouseMovingDelta: THREE.Vector2;
  setMouseMovingDelta: (x: number, y: number) => unknown;
  isGrounded: boolean;
  setIsGrounded: (bool: boolean) => unknown;
};

export const usePlayer = create<PlayerState>((set) => ({
  velocity: new THREE.Vector3(0, 0, 0),
  setVelocity: (v) => set((state) => ({ velocity: state.velocity.copy(v) })),
  isMouseMoving: false,
  setIsMouseMoving: (isMouseMoving) => set({ isMouseMoving }),
  mouseMovingDelta: new THREE.Vector2(0, 0),
  setMouseMovingDelta: (x, y) => set((state) => ({ mouseMovingDelta: state.mouseMovingDelta.set(x, y) })),
  isGrounded: false,
  setIsGrounded: (isGrounded) => set({ isGrounded }),
}));

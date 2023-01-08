import _ from "lodash";
import { useState, useEffect } from "react";
import { useBindings } from "./bindings-store";

export const useMovementControls = () => {
  const isPointerLocked = useBindings((state) => state.isPointerLocked);

  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    jump: false,
    walk: false,
  });

  const keys: { [key: string]: string } = {
    KeyW: "forward",
    KeyS: "backward",
    KeyA: "leftward",
    KeyD: "rightward",
    Space: "jump",
    ShiftLeft: "walk",
  };

  const moveFieldByKey = (key: string | number) => keys[key];

  useEffect(() => {
    if (!isPointerLocked) {
      setMovement(_.mapValues(movement, () => false));
    }

    const handleKeyDown = (e: { code: string | number }) => {
      if (!isPointerLocked) return;
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));
    };
    const handleKeyUp = (e: { code: string | number }) => {
      if (!isPointerLocked) return;
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPointerLocked]);

  return movement;
};

export const useViewmodelControls = () => {
  const isPointerLocked = useBindings((state) => state.isPointerLocked);

  const [viewmodel, setViewmodel] = useState({
    primary: false, // default: 1
    secondary: false, // default: 2
    knife: false, // default: 3
    mousePrimary: false, // default: mouse one
    mouseSecondary: false, // default: mouse two
  });

  // Bind keys to controllers
  const keys: { [key: string]: string } = {
    0: "mousePrimary",
  };

  const moveFieldByKey = (key: string | number) => keys[key];

  useEffect(() => {
    if (!isPointerLocked) {
      setViewmodel(_.mapValues(viewmodel, () => false));
    }

    const handleMouseDown = (e: { button: string | number }) => {
      if (!isPointerLocked) return;
      setViewmodel((v) => ({ ...v, [moveFieldByKey(e.button)]: true }));
    };
    const handleMouseUp = (e: { button: string | number }) => {
      if (!isPointerLocked) return;
      setViewmodel((v) => ({ ...v, [moveFieldByKey(e.button)]: false }));
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);
    };
  }, [isPointerLocked]);

  return viewmodel;
};

import { useState, useEffect } from "react";

export const useMovementControls = () => {
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
    const handleKeyDown = (e: { code: string | number }) => {
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));
    };
    const handleKeyUp = (e: { code: string | number }) => {
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movement;
};

export const useViewmodelControls = () => {
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
    // Mouse
    const handleMouseDown = (e: { button: string | number }) => {
      console.log(e.button);
      setViewmodel((v) => ({ ...v, [moveFieldByKey(e.button)]: true }));
    };
    const handleMouseUp = (e: { button: string | number }) => {
      setViewmodel((v) => ({ ...v, [moveFieldByKey(e.button)]: false }));
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return viewmodel;
};

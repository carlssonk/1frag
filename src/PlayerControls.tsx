import { useState, useEffect } from "react";

export const usePlayerControls = () => {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    leftward: false,
    rightward: false,
    jump: false,
    walk: false,
  });

  const keys = {
    KeyW: "forward",
    KeyS: "backward",
    KeyA: "leftward",
    KeyD: "rightward",
    Space: "jump",
    ShiftLeft: "walk",
  };

  const moveFieldByKey = (key) => keys[key];

  useEffect(() => {
    const handleKeyDown = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }));

    const handleKeyUp = (e) => setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }));

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movement;
};

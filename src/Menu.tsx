import React, { useEffect, useRef } from "react";
import { useBindings } from "./bindings-store";
import { usePlayer } from "./player-store";

export const Menu = () => {
  const resumeRef = useRef(null!);
  const isPointerLocked = useBindings((state) => state.isPointerLocked);
  const setResumeButtonDom = useBindings((state) => state.setResumeButtonDom);

  useEffect(() => {
    setResumeButtonDom(resumeRef.current);
  }, []);

  return (
    <div
      style={{
        display: isPointerLocked ? "none" : "block",
        position: "fixed",
        inset: 0,
        height: "100%",
        width: "100%",
        zIndex: 2,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <button ref={resumeRef}>Resume</button>
    </div>
  );
};

import React from "react";

export const Hud = () => {
  return (
    <div style={{ position: "fixed", zIndex: 1, inset: 0 }}>
      <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: "2px",
            height: "2px",
            backgroundColor: "green",
          }}
        ></div>
      </div>
    </div>
  );
};
